#!/usr/bin/env node

/**
 * CLI contract test: arguments, configuration validation, exit codes and the
 * suppression markers. The exit code has exactly one meaning each:
 *   0 clean, 1 findings, 2 incomplete scan.
 * A scan that could not finish must never report 0 or 1.
 */

import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const script = fileURLToPath(new URL('./ui-guard-review.mjs', import.meta.url))
const repoRoot = path.dirname(path.dirname(script))
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-guard-cli-'))
// Run from a neutral directory so reported paths are relative to the fixture, not
// to this repository.
const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', cwd: os.tmpdir() })
const write = (relative, content) => {
  const target = path.join(root, relative)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, content)
  return target
}

// Exit code 0: a clean tree.
const clean = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-guard-clean-'))
write2(clean, 'App.tsx', 'export const App = () => <button aria-label="Save"><svg /></button>\n')
const cleanRun = spawnSync(process.execPath, [script, clean], { encoding: 'utf8', cwd: os.tmpdir() })
assert.equal(cleanRun.status, 0, cleanRun.stdout + cleanRun.stderr)
assert.match(cleanRun.stdout, /no static findings/)

// Exit code 1: findings, and the text report carries severity, rule and remediation.
write('src/Run.tsx', "<button style={{ color: '#fff' }}>Run · 3 files</button>\n")
const findingRun = run(root)
assert.equal(findingRun.status, 1, findingRun.stdout + findingRun.stderr)
assert.match(findingRun.stdout, /Run\.tsx:\d+ P[012] QS-[A-Z0-9]+-\d{3} /m)
assert.match(findingRun.stdout, /^QS-[A-Z0-9]+-\d{3}(?: \(\d+ finding\(s\)\))? → /m, 'each rule repair is printed once, keyed by rule id')
assert.match(findingRun.stdout, /finding\(s\) \(\d+ P[012]/)

// Exit code 2: a root that does not exist makes the scan incomplete, not clean.
const missingRun = run(path.join(root, 'does-not-exist'))
assert.equal(missingRun.status, 2, missingRun.stdout + missingRun.stderr)

// Exit code 2 wins over 1: findings plus an unreadable root still reports 2.
const mixedRun = run(root, path.join(root, 'does-not-exist'))
assert.equal(mixedRun.status, 2, mixedRun.stdout + mixedRun.stderr)
assert.match(mixedRun.stdout, /scan incomplete/)

// An invalid config is a configuration error, never a silent default.
write('.quiet-systems.json', JSON.stringify({ severity: 'high' }))
const unknownKey = run(root)
assert.equal(unknownKey.status, 2, unknownKey.stdout + unknownKey.stderr)
assert.match(unknownKey.stderr, /invalid config/)
assert.match(unknownKey.stderr, /severity/)

write('.quiet-systems.json', JSON.stringify({ rules: { 'QS-NOPE-001': { ignore: ['src/**'] } } }))
const unknownRule = run(root)
assert.equal(unknownRule.status, 2, unknownRule.stdout + unknownRule.stderr)
assert.match(unknownRule.stderr, /invalid config/)
assert.match(unknownRule.stderr, /QS-NOPE-001/)
assert.match(unknownRule.stderr, /known rule id/)

write('.quiet-systems.json', 'not json')
const brokenJson = run(root)
assert.equal(brokenJson.status, 2, brokenJson.stdout + brokenJson.stderr)
assert.match(brokenJson.stderr, /invalid config/)

// A valid config keeps the scan usable.
write('.quiet-systems.json', JSON.stringify({ ignore: ['src/**'] }))
const ignoredRun = run(root)
assert.equal(ignoredRun.status, 0, ignoredRun.stdout + ignoredRun.stderr)

// `.ui-guard.json` wins over `.quiet-systems.json`, and the older name still works alone.
write('.ui-guard.json', JSON.stringify({ ignore: ['nothing/**'] }))
const preferNew = run(root)
assert.equal(preferNew.status, 1, preferNew.stdout + preferNew.stderr)
fs.rmSync(path.join(root, '.ui-guard.json'))
fs.rmSync(path.join(root, '.quiet-systems.json'))

// Markdown is out of scope unless asked for.
write('notes.md', '<p>已完成 · 刚刚</p>\n')
const skippedMarkdown = run('--json', root)
assert.equal(JSON.parse(skippedMarkdown.stdout).findings.some((item) => item.file.endsWith('.md')), false)
const includedMarkdown = run('--json', '--include-markdown', root)
assert.equal(JSON.parse(includedMarkdown.stdout).findings.some((item) => item.file.endsWith('notes.md')), true)

// Suppression is line-scoped and rule-scoped, and never hides a different rule.
// A marker on its own line says nothing about the next line: it must sit on the
// line that emits the finding.
write('src/Suppressed.tsx', [
  '// ui-guard: ignore QS-COPY-001',
  '<p>已完成 · 刚刚</p>',
  '<p>草稿 · 已发布</p> // quiet-systems: ignore QS-COPY-001',
  '<p>原始 · 未抑制</p>'
].join('\n'))
const suppressed = JSON.parse(run('--json', root).stdout)
const suppressedLines = suppressed.findings.filter((item) => item.rule === 'QS-COPY-001' && item.file.endsWith('Suppressed.tsx')).map((item) => item.line)
assert.deepEqual(suppressedLines, [2, 4])
assert.equal(suppressed.findings.some((item) => item.rule === 'QS-COPY-002' && item.file.endsWith('Suppressed.tsx')), false)

// A wildcard suppression covers every rule on its own line.
write('src/Wildcard.tsx', '/* ui-guard: ignore * */ <button style={{ color: "#fff" }}>Run · 3 files</button>\n')
const wildcard = JSON.parse(run('--json', root).stdout)
assert.equal(wildcard.findings.some((item) => item.file.endsWith('Wildcard.tsx')), false)

// Baseline: adopt the tool on a legacy tree, then catch only what is new.
const baselineFile = path.join(root, 'baseline.json')
const writeBaseline = run('--write-baseline', baselineFile, root)
assert.equal(writeBaseline.status, 0, writeBaseline.stdout + writeBaseline.stderr)
assert.match(writeBaseline.stdout, /wrote baseline/)
const baselined = run('--json', '--baseline', baselineFile, root)
assert.equal(baselined.status, 0, baselined.stdout + baselined.stderr)
const baselinedReport = JSON.parse(baselined.stdout)
assert.equal(baselinedReport.findings.length, 0)
assert(baselinedReport.summary.baselined > 0)

// A new finding on an unrelated line is still reported; the baseline is keyed on
// rule, path and message, so moving a finding must not resurrect or hide it.
write('src/NewRow.tsx', '<img src="new.png" />\n')
const fresh = run('--json', '--baseline', baselineFile, root)
assert.equal(fresh.status, 1, fresh.stdout + fresh.stderr)
const freshRules = new Set(JSON.parse(fresh.stdout).findings.map((item) => item.rule))
assert.deepEqual([...freshRules], ['QS-A11Y-001'])

// Two identical findings in one file are one baseline key with a count of two.
const twiceFile = path.join(root, 'src', 'Twice.tsx')
write('src/Twice.tsx', '<img src="a.png" />\n<img src="b.png" />\n')
const twiceBaseline = path.join(root, 'twice-baseline.json')
run('--write-baseline', twiceBaseline, twiceFile)
assert.equal(JSON.parse(fs.readFileSync(twiceBaseline, 'utf8')).entries.length, 2)
fs.writeFileSync(twiceFile, '<img src="a.png" />\n<img src="b.png" />\n<img src="c.png" />\n')
const third = JSON.parse(run('--json', '--baseline', twiceBaseline, twiceFile).stdout)
assert.equal(third.findings.length, 1)
assert.equal(third.summary.baselined, 2)
fs.rmSync(twiceBaseline)
fs.rmSync(twiceFile)

// A missing or malformed baseline is a configuration error, never a clean pass.
const missingBaseline = run('--baseline', path.join(root, 'nope.json'), root)
assert.equal(missingBaseline.status, 2, missingBaseline.stdout + missingBaseline.stderr)
write('broken-baseline.json', '{"entries": "nope"}')
const brokenBaseline = run('--baseline', path.join(root, 'broken-baseline.json'), root)
assert.equal(brokenBaseline.status, 2, brokenBaseline.stdout + brokenBaseline.stderr)
assert.match(brokenBaseline.stderr, /invalid baseline/)
fs.rmSync(baselineFile)
fs.rmSync(path.join(root, 'broken-baseline.json'))
fs.rmSync(path.join(root, 'src', 'NewRow.tsx'))

// treatAsProduction widens the fixture gate: the same file is invisible under
// examples/ and visible once a local config claims it.
const gate = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-guard-gate-'))
write3(gate, 'examples/demo/Card.tsx', '<p>一键洞察，智能治理全链路</p>\n')
const gated = spawnSync(process.execPath, [script, path.join(gate, 'examples', 'demo')], { encoding: 'utf8', cwd: os.tmpdir() })
assert.equal(gated.status, 0, gated.stdout + gated.stderr)
write3(gate, '.ui-guard.json', JSON.stringify({ treatAsProduction: ['**/*.tsx'] }))
const widened = spawnSync(process.execPath, [script, path.join(gate, 'examples', 'demo')], { encoding: 'utf8', cwd: os.tmpdir() })
assert.equal(widened.status, 1, widened.stdout + widened.stderr)
assert.match(widened.stdout, /QS-COPY-010/)

// A new key is only usable once it is type-checked; a scalar is a config error.
write3(gate, '.ui-guard.json', JSON.stringify({ treatAsProduction: 'nope' }))
const badGate = spawnSync(process.execPath, [script, path.join(gate, 'examples', 'demo')], { encoding: 'utf8', cwd: os.tmpdir() })
assert.equal(badGate.status, 2, badGate.stdout + badGate.stderr)
assert.match(badGate.stderr, /treatAsProduction` must be an array of strings/)

// The narrow viewport budget is the binding one; a flat number keeps the old behaviour.
write3(gate, '.ui-guard.json', JSON.stringify({ rules: { 'QS-COPY-003': { maxLength: { mobile: 20, desktop: 400 } } } }))
write3(gate, 'src/Long.tsx', '<p>把本周未回复的十二条询价抄进跟进表</p>\n')
const narrow = spawnSync(process.execPath, [script, path.join(gate, 'src'), '--json'], { encoding: 'utf8', cwd: os.tmpdir() })
assert.equal(narrow.status, 1, narrow.stdout + narrow.stderr)
assert.match(narrow.stdout, /窄屏 20，宽屏 400/)
write3(gate, '.ui-guard.json', JSON.stringify({ rules: { 'QS-COPY-003': { maxLength: 400 } } }))
const wide = spawnSync(process.execPath, [script, path.join(gate, 'src'), '--json'], { encoding: 'utf8', cwd: os.tmpdir() })
assert.equal(wide.status, 0, wide.stdout + wide.stderr)

// A reader that stops reading early must not produce a stack trace. `| head` is
// ordinary use on a 90-line report, and an unhandled EPIPE reads like the
// reviewed project crashed.
const piped = spawnSync('/bin/sh', ['-c', `"${process.execPath}" "${script}" "${path.join(repoRoot, 'examples', 'bad-sample')}" | head -2`], { encoding: 'utf8' })
assert.equal(piped.stderr, '', `expected no stderr when the pipe closes early, got: ${piped.stderr}`)
assert.match(piped.stdout, /QS-PROTOTYPE-001/)

// A symlinked directory is reported, not silently skipped: a workspace layout
// that links a package in would otherwise report clean on unseen content.
const linked = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-guard-symlink-'))
write3(linked, 'real/a.tsx', '<p>一键洞察，智能治理全链路</p>\n')
fs.symlinkSync(path.join(linked, 'real'), path.join(linked, 'link'), 'dir')
const linkedRun = spawnSync(process.execPath, [script, '--json', linked], { encoding: 'utf8', cwd: os.tmpdir() })
assert.equal(linkedRun.status, 1, linkedRun.stdout + linkedRun.stderr)
const linkedReport = JSON.parse(linkedRun.stdout)
assert.ok(linkedReport.skipped.some((item) => item.reason === 'symlink'), 'expected the symlink to be reported in skipped')
assert.equal(linkedReport.summary.skipped, 1, linkedReport.summary.skipped)
fs.rmSync(linked, { recursive: true, force: true })

// A value flag with no value is a usage error, not a crash and not a pass.
const emptyValue = spawnSync(process.execPath, [script, '--write-baseline', '', path.join(gate, 'src')], { encoding: 'utf8', cwd: os.tmpdir() })
assert.equal(emptyValue.status, 2, emptyValue.stdout + emptyValue.stderr)
assert.match(emptyValue.stderr, /--write-baseline needs a file path/)
const danglingValue = spawnSync(process.execPath, [script, '--baseline', '--json', path.join(gate, 'src')], { encoding: 'utf8', cwd: os.tmpdir() })
assert.equal(danglingValue.status, 2, danglingValue.stdout + danglingValue.stderr)
assert.match(danglingValue.stderr, /--baseline needs a file path/)
const unwritable = spawnSync(process.execPath, [script, '--write-baseline', path.join(gate, 'missing-dir', 'b.json'), path.join(gate, 'src')], { encoding: 'utf8', cwd: os.tmpdir() })
assert.equal(unwritable.status, 2, unwritable.stdout + unwritable.stderr)
assert.match(unwritable.stderr, /cannot write baseline/)

// `include` has to actually widen the scan. Accepting the key and then ignoring
// it reads as a clean run over files that were never opened.
const widen = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-guard-include-'))
write3(widen, 'src/view.tpl', '<p>一键洞察，智能治理全链路</p>\n')
const narrowRun = spawnSync(process.execPath, [script, path.join(widen, 'src')], { encoding: 'utf8', cwd: os.tmpdir() })
assert.equal(narrowRun.status, 0, narrowRun.stdout + narrowRun.stderr)
write3(widen, '.ui-guard.json', JSON.stringify({ include: ['**/*.tpl'] }))
const widenRun = spawnSync(process.execPath, [script, path.join(widen, 'src')], { encoding: 'utf8', cwd: os.tmpdir() })
assert.equal(widenRun.status, 1, widenRun.stdout + widenRun.stderr)
assert.match(widenRun.stdout, /view\.tpl:1 P1 QS-COPY-007/)
fs.rmSync(widen, { recursive: true, force: true })

// A misspelled flag must not silently pass: it is a usage error, not a clean run.
const helpRun = spawnSync(process.execPath, [script, '--help'], { encoding: 'utf8', cwd: os.tmpdir() })
assert.equal(helpRun.status, 0, helpRun.stdout + helpRun.stderr)
assert.match(helpRun.stdout, /usage: ui-guard-review/)
const typoRun = spawnSync(process.execPath, [script, '--basline', path.join(gate, 'src')], { encoding: 'utf8', cwd: os.tmpdir() })
assert.equal(typoRun.status, 2, typoRun.stdout + typoRun.stderr)
assert.match(typoRun.stderr, /unknown option --basline/)

// Per-glyph weights are the CJK lever: the same sentence fits or overflows
// depending on how much a CJK glyph costs.
write3(gate, 'src/Weight.tsx', '<p>把本周未回复的十二条询价抄进跟进表</p>\n')
write3(gate, '.ui-guard.json', JSON.stringify({ rules: { 'QS-COPY-003': { maxLength: 12 } } }))
const heavy = spawnSync(process.execPath, [script, path.join(gate, 'src'), '--json'], { encoding: 'utf8', cwd: os.tmpdir() })
assert.equal(heavy.status, 1, heavy.stdout + heavy.stderr)
write3(gate, '.ui-guard.json', JSON.stringify({ rules: { 'QS-COPY-003': { maxLength: 12, cjkWeight: 0.2 } } }))
const light = spawnSync(process.execPath, [script, path.join(gate, 'src'), '--json'], { encoding: 'utf8', cwd: os.tmpdir() })
assert.equal(light.status, 0, light.stdout + light.stderr)
write3(gate, '.ui-guard.json', JSON.stringify({ rules: { 'QS-COPY-003': { cjkWeight: 'heavy' } } }))
const badWeight = spawnSync(process.execPath, [script, path.join(gate, 'src')], { encoding: 'utf8', cwd: os.tmpdir() })
assert.equal(badWeight.status, 2, badWeight.stdout + badWeight.stderr)
assert.match(badWeight.stderr, /cjkWeight` must be a positive number/)
fs.rmSync(path.join(gate, 'src', 'Weight.tsx'))
// The invalid config above is still on disk; restore a valid one before the next case.
write3(gate, '.ui-guard.json', '{}\n')

// A value flag consumes its argument: the baseline path must never be scanned as a root.
const baselineInRoot = path.join(gate, 'ui-guard-baseline.json')
const writeRun = spawnSync(process.execPath, [script, '--write-baseline', baselineInRoot, path.join(gate, 'src')], { encoding: 'utf8', cwd: os.tmpdir() })
assert.equal(writeRun.status, 0, writeRun.stdout + writeRun.stderr)
assert.ok(fs.existsSync(baselineInRoot))
const consumeRun = spawnSync(process.execPath, [script, '--json', '--baseline', baselineInRoot, path.join(gate, 'src')], { encoding: 'utf8', cwd: os.tmpdir() })
assert.equal(consumeRun.status, 0, consumeRun.stdout + consumeRun.stderr)
const consumed = JSON.parse(consumeRun.stdout)
assert.ok(!consumed.findings.some((item) => item.file.endsWith('ui-guard-baseline.json')), consumeRun.stdout)
fs.rmSync(gate, { recursive: true, force: true })

// Both marker families are live code, not just documentation: the new name and the
// legacy name each clear the same rule.
const alias = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-guard-alias-'))
for (const [name, marker] of [
  ['Bare.tsx', ''],
  ['New.tsx', ' data-ui-guard-adapted'],
  ['Legacy.tsx', ' data-quiet-adapted'],
  ['NewMarked.tsx', ' /* ui-guard: allow-native */']
]) {
  write3(alias, path.join('src', name), `<select${marker}><option>全部</option></select>\n`)
}
const aliasRun = spawnSync(process.execPath, [script, path.join(alias, 'src')], { encoding: 'utf8', cwd: os.tmpdir() })
assert.equal(aliasRun.status, 1, aliasRun.stdout + aliasRun.stderr)
const nativeHits = aliasRun.stdout.split('\n').filter((row) => /:1 P[012] QS-COMPONENT-001 /.test(row))
assert.equal(nativeHits.length, 1, aliasRun.stdout)
assert.match(nativeHits[0], /Bare\.tsx/)
fs.rmSync(alias, { recursive: true, force: true })

// The JSON report is a stable, machine-readable contract.
// The interaction rules must not fire on labelled controls: a named destructive
// action and a control that names its object are exactly what the repair asks for.
const namedRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-guard-named-'))
fs.mkdirSync(path.join(namedRoot, 'src'), { recursive: true })
fs.writeFileSync(path.join(namedRoot, 'src', 'Named.tsx'), '<h2>房间</h2>\n<button><TrashIcon /> 删除房间</button>\n<button>打开房间</button>\n')
const namedRun = spawnSync(process.execPath, [script, namedRoot], { encoding: 'utf8', cwd: os.tmpdir() })
assert.notEqual(namedRun.status, 2, namedRun.stderr)
assert.doesNotMatch(namedRun.stdout, /QS-INTERACTION-00[12]/)
fs.rmSync(namedRoot, { recursive: true, force: true })

// "Clean" over zero files is not the same answer as a clean tree. The count is
// reported in both formats, and an empty scan says why it is empty.
const emptyRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-guard-empty-'))
const emptyRun = spawnSync(process.execPath, [script, emptyRoot], { encoding: 'utf8', cwd: os.tmpdir() })
assert.equal(emptyRun.status, 0, emptyRun.stdout + emptyRun.stderr)
assert.match(emptyRun.stdout, /0 file\(s\) reviewed/)
assert.match(emptyRun.stdout, /reviewed no files/)
const emptyJson = spawnSync(process.execPath, [script, emptyRoot, '--json'], { encoding: 'utf8', cwd: os.tmpdir() })
assert.equal(JSON.parse(emptyJson.stdout).reviewed, 0)
fs.rmSync(emptyRoot, { recursive: true, force: true })
assert.ok(wildcard.reviewed > 0, 'a scan that read files must say so')

assert.equal(wildcard.version, 2)
assert.deepEqual(Object.keys(wildcard.summary).sort(), ['baselined', 'byRule', 'bySeverity', 'skipped', 'total'])
assert.deepEqual(Object.keys(wildcard.summary.bySeverity), ['P0', 'P1', 'P2'])
for (const finding of wildcard.findings) {
  assert.deepEqual(Object.keys(finding).sort(), ['evidence', 'file', 'line', 'message', 'remediation', 'rule', 'severity'])
}

fs.rmSync(root, { recursive: true, force: true })
fs.rmSync(clean, { recursive: true, force: true })
process.stdout.write('ui-guard cli self-test passed\n')

function write2(base, name, content) {
  fs.mkdirSync(path.join(base, 'src'), { recursive: true })
  fs.writeFileSync(path.join(base, 'src', name), content)
}

function write3(base, name, content) {
  const target = path.join(base, name)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, content)
}
