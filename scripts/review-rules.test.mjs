#!/usr/bin/env node

/**
 * Per-rule contract test for scripts/ui-guard-review.mjs.
 *
 * Every rule id must satisfy four things at once:
 *   1. it is registered with a severity and a remediation string,
 *   2. a fixture in this file actually triggers it,
 *   3. references/review.md documents its detection contract,
 *   4. every emitted finding carries a machine-readable shape (rule, severity,
 *      file, line, message, remediation, evidence).
 *
 * A rule that loses its fixture, its documentation or its remediation fails here
 * instead of drifting silently.
 */

import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const script = fileURLToPath(new URL('./ui-guard-review.mjs', import.meta.url))
const source = fs.readFileSync(script, 'utf8')
const reviewDoc = fs.readFileSync(path.join(repoRoot, 'references', 'review.md'), 'utf8')

// Fixtures: one source file per rule, chosen so the rule fires for the reason the
// documentation states, not by accident.
const fixtures = {
  'QS-COMPONENT-001': { file: 'App.tsx', code: '<input type="text" placeholder="Name" />\n' },
  'QS-A11Y-001': { file: 'Picture.tsx', code: '<img src="photo.png" />\n' },
  'QS-A11Y-002': { file: 'Hidden.tsx', code: '<button aria-hidden="true">保存</button>\n' },
  'QS-A11Y-003': { file: 'IconButton.tsx', code: '<button><svg viewBox="0 0 24 24"></svg></button>\n' },
  'QS-COPY-001': { file: 'Meta.tsx', code: '<p>已完成 · 刚刚</p>\n' },
  'QS-COPY-002': { file: 'Meta2.tsx', code: '<p>草稿 | 已发布</p>\n' },
  'QS-COPY-003': { file: 'LongCopy.tsx', code: `<p>${'这句话很长'.repeat(40)}</p>\n` },
  'QS-COPY-004': { file: 'Polite.tsx', code: '<p>温馨提示：请检查网络</p>\n' },
  'QS-COPY-005': { file: 'Disclaimer.tsx', code: '<p>内容由 AI 生成</p>\n' },
  'QS-COPY-006': { file: 'Promise.tsx', code: '<p>敬请期待</p>\n' },
  'QS-COPY-007': { file: 'Jargon.tsx', code: '<p>这条流程必须打穿闭环</p>\n' },
  'QS-COPY-008': { file: 'Abbrev.tsx', code: '<p>QBR 结论已同步</p>\n' },
  'QS-COPY-009': { file: 'Aphorism.tsx', code: '<p>不止于工具</p>\n' },
  'QS-COPY-010': { file: 'Compressed.tsx', code: '<p>一键洞察，智能治理全链路</p>\n' },
  'QS-COMPOSITION-001': { file: 'TwoHeadings.tsx', code: '<h1>收藏</h1>\n<h2>最近</h2>\n' },
  'QS-HIERARCHY-001': { file: 'Caption.tsx', code: '<small>说明</small>\n' },
  'QS-ICON-001': { file: 'Icon.tsx', code: '<svg icon width="24" height="24"></svg>\n' },
  'QS-ICON-002': { file: 'TextAction.tsx', code: '<button>保存</button>\n' },
  'QS-MOTION-001': { file: 'motion.css', code: '.row { transition: opacity 200ms; }\n' },
  'QS-MOTION-002': { file: 'slow-motion.css', code: '.row { transition: opacity 600ms; }\n' },
  'QS-PROTOTYPE-001': { file: 'Draft.tsx', code: '<p>{demoData.title}</p>\n' },
  'QS-SLOP-001': { file: 'Glass.tsx', code: '<div className="backdrop-blur"></div>\n' },
  'QS-SLOP-002': { file: 'Sparkles.tsx', code: '<SparklesIcon />\n' },
  'QS-SLOP-003': { file: 'Marketing.tsx', code: '<span>无缝协作</span>\n' },
  'QS-VISUAL-001': { file: 'Inline.tsx', code: "<div style={{ color: 'red' }}></div>\n" },
  'QS-VISUAL-002': { file: 'Color.tsx', code: '<span className="a">#ff00aa</span>\n' },
  'QS-INTERACTION-001': { file: 'Trash.tsx', code: '<h2>房间</h2>\n<button aria-label="删除房间"><TrashIcon /></button>\n' },
  'QS-INTERACTION-002': { file: 'Echo.tsx', code: '<h2>房间</h2>\n<button>房间</button>\n<button>已连接</button>\n' }
}

// The single registry is the source of truth for which rules exist.
const registryBlock = source.slice(
  source.indexOf('const severityByRule = {'),
  source.indexOf('// Every rule must state the repair')
)
const registered = [...registryBlock.matchAll(/'(QS-[A-Z0-9]+-\d{3})':\s*'(P[012])'/g)].map((match) => [match[1], match[2]])
assert(registered.length > 0, 'severity registry not found')
const registeredRules = registered.map(([rule]) => rule)
assert.equal(new Set(registeredRules).size, registeredRules.length, 'duplicate rule id in severity registry')

const remediationBlock = source.slice(
  source.indexOf('const remediationByRule = {'),
  source.indexOf('\n}', source.indexOf('const remediationByRule = {'))
)
const remediatedRules = new Set([...remediationBlock.matchAll(/'(QS-[A-Z0-9]+-\d{3})':/g)].map((match) => match[1]))

// Prose that quotes the rule count drifts every time a rule is added, and a
// stale number is the first thing a reader checks. Keep the claims tied to the
// registry instead of to whoever last edited the paragraph.
for (const doc of ['README.md', path.join('docs', 'evaluation.md')]) {
  const text = fs.readFileSync(path.join(repoRoot, doc), 'utf8')
  for (const match of text.matchAll(/(\d+)\s*条规则/g)) {
    assert.equal(Number(match[1]), registeredRules.length, `${doc} claims ${match[1]} rules but the registry has ${registeredRules.length}`)
  }
}

// A relative link that points nowhere turns a cited screenshot into a dead end,
// and nothing in the suite noticed when the docs were moved under docs/.
const markdownFiles = []
const collect = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) collect(full)
    else if (entry.name.endsWith('.md')) markdownFiles.push(full)
  }
}
collect(repoRoot)
const deadLinks = []
for (const file of markdownFiles) {
  const body = fs.readFileSync(file, 'utf8')
  for (const match of body.matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
    const target = match[1]
    if (target.startsWith('http') || target.startsWith('mailto:')) continue
    if (!fs.existsSync(path.resolve(path.dirname(file), target))) {
      deadLinks.push(`${path.relative(repoRoot, file)} -> ${target}`)
    }
  }
}
assert.deepEqual(deadLinks, [], `markdown links point at files that do not exist: ${deadLinks.join(', ')}`)

// The allowed config keys are quoted in the docs, and a hand-maintained list
// silently loses a key the moment one is added — which is how `treatAsProduction`
// went missing. Read the list from configSchema instead of trusting the prose.
const schemaBlock = source.slice(
  source.indexOf('const configSchema = {'),
  source.indexOf('\n}', source.indexOf('const configSchema = {'))
)
const schemaKeys = [...schemaBlock.matchAll(/^\s{2}([A-Za-z_]+):/gm)].map((match) => match[1])
assert(schemaKeys.length > 0, 'configSchema not found')
const keyLists = [
  { file: path.join('docs', 'evaluation.md'), pattern: /顶层只允许([^；]+)；/ },
  { file: path.join('references', 'copy-constraints.md'), pattern: /顶层只允许([^；]+)；/ },
  { file: path.join('references', 'review.md'), pattern: /Six top-level keys exist:([^.]+)\./ }
]
for (const { file, pattern } of keyLists) {
  const prose = fs.readFileSync(path.join(repoRoot, file), 'utf8').match(pattern)
  assert(prose, `${file} no longer lists the allowed config keys`)
  const claimed = [...prose[1].matchAll(/`([A-Za-z_]+)`/g)].map((match) => match[1]).sort()
  assert.deepEqual(claimed, [...schemaKeys].sort(), `${file} config key list disagrees with configSchema`)
}

// The severity table in references/review.md is normative, so a registered
// severity that disagrees with the table is a documentation defect.
const severityTable = new Map(
  [...reviewDoc.matchAll(/^\|\s*`(QS-[A-Z0-9]+-\d{3})`\s*\|\s*(P[012])\s*\|\s*$/gm)].map((match) => [match[1], match[2]])
)
assert(severityTable.size > 0, 'references/review.md has no severity table')
for (const [rule, severity] of registered) {
  assert.equal(severityTable.get(rule), severity, `${rule} severity in references/review.md disagrees with severityByRule`)
}
for (const rule of severityTable.keys()) {
  assert(registeredRules.includes(rule), `${rule} is in the review.md severity table but not registered`)
}

for (const [rule, severity] of registered) {
  assert.match(severity, /^P[012]$/, `${rule} has an invalid severity`)
  assert(remediatedRules.has(rule), `${rule} is missing from remediationByRule`)
  assert(reviewDoc.includes(`\`${rule}\``), `${rule} is missing from references/review.md`)
  assert(fixtures[rule], `${rule} has no fixture in scripts/review-rules.test.mjs`)
}

for (const rule of Object.keys(fixtures)) {
  assert(registeredRules.includes(rule), `${rule} has a fixture but no severity registration`)
  assert(remediatedRules.has(rule), `${rule} has a fixture but no remediation`)
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-guard-rules-'))
const probeDir = path.join(root, 'src')
fs.mkdirSync(probeDir, { recursive: true })
const probeFile = path.join(probeDir, 'Probe.tsx')
fs.writeFileSync(probeFile, '')
const fixturePath = (name) => path.join(probeDir, name)

const reported = new Map()
for (const [rule, fixture] of Object.entries(fixtures)) {
  fs.writeFileSync(fixturePath(fixture.file), fixture.code)
  const run = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
  assert.notEqual(run.status, 2, `${rule} fixture produced an incomplete scan: ${run.stderr}`)
  const report = JSON.parse(run.stdout)
  for (const finding of report.findings) {
    if (!reported.has(finding.rule)) reported.set(finding.rule, finding)
  }
  assert(report.findings.some((finding) => finding.rule === rule), `${rule} did not fire for its own fixture: ${JSON.stringify(report.findings.map((finding) => finding.rule))}`)
  fs.rmSync(fixturePath(fixture.file), { force: true })
}

// Finding shape: an agent must be able to act from the report alone.
const severities = new Map(registered)
for (const [rule, finding] of reported) {
  assert.equal(finding.rule, rule)
  assert.equal(finding.severity, severities.get(rule), `${rule} reported a severity that disagrees with the registry`)
  assert.equal(typeof finding.message, 'string')
  assert(finding.message.length > 0, `${rule} reported an empty message`)
  assert.equal(typeof finding.evidence, 'string')
  assert(finding.evidence.length > 0, `${rule} reported an empty evidence string`)
  assert.equal(typeof finding.remediation, 'string')
  assert(remediatedRules.has(rule), `${rule} reported a remediation outside the registry`)
  assert(Number.isInteger(finding.line) && finding.line >= 1, `${rule} reported an invalid line`)
  assert(/\.(?:tsx|css)$/.test(finding.file), `${rule} reported an unusable path`)
}

// Severity must reach both output modes, not only JSON.
fs.writeFileSync(fixturePath(fixtures['QS-PROTOTYPE-001'].file), fixtures['QS-PROTOTYPE-001'].code)
const textRun = spawnSync(process.execPath, [script, root], { encoding: 'utf8' })
assert.match(textRun.stdout, /P0 QS-PROTOTYPE-001 /)
assert.match(textRun.stdout, /→ /)
assert.match(textRun.stdout, /finding\(s\)/)

fs.rmSync(root, { recursive: true, force: true })
process.stdout.write('ui-guard review rules self-test passed\n')
