#!/usr/bin/env node

import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-systems-review-'))
const source = path.join(root, 'src', 'Example.tsx')
fs.mkdirSync(path.dirname(source), { recursive: true })
fs.writeFileSync(source, `export function Example() {
  const demoData = { __source: 'demo' }
  return <button style={{ color: '#fff' }}>Run · 3 files</button>
}
type Value = string | null
// demonstrate and mocking are ordinary words, not demo data names.
// 2026/11/20, src/components/Button.tsx, and 3/4 are not metadata separators.
`)

const script = fileURLToPath(new URL('./ui-guard-review.mjs', import.meta.url))
const result = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
assert.equal(result.status, 1)
const report = JSON.parse(result.stdout)
const rules = new Set(report.findings.map((finding) => finding.rule))
assert(rules.has('QS-PROTOTYPE-001'))
assert(rules.has('QS-COPY-001'))
assert(rules.has('QS-VISUAL-001'))
assert(rules.has('QS-VISUAL-002'))
assert(!rules.has('QS-COPY-002'))
assert(report.findings.find((finding) => finding.rule === 'QS-PROTOTYPE-001').severity === 'P0')

const multilineImage = path.join(root, 'src', 'Image.tsx')
fs.writeFileSync(multilineImage, `<img\n  src="photo.png"\n  alt="Photo"\n/>`)
const multilineResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const multilineReport = JSON.parse(multilineResult.stdout)
assert(!multilineReport.findings.some((finding) => finding.rule === 'QS-A11Y-001'))

const accessible = path.join(root, 'src', 'Accessible.tsx')
fs.writeFileSync(accessible, `<><img src="decorative.svg" role="presentation" /><img src="photo.png" alt="Photo" /><input type="date" data-quiet-adapted /></>`)
const accessibleResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const accessibleReport = JSON.parse(accessibleResult.stdout)
const accessibleRules = new Set(accessibleReport.findings.map((finding) => finding.rule))
assert(!accessibleRules.has('QS-COMPONENT-001'))
assert(!accessibleRules.has('QS-A11Y-001'))

const rawControl = path.join(root, 'src', 'RawControl.tsx')
fs.writeFileSync(rawControl, '<input type="date" />')
const rawControlResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const rawControlReport = JSON.parse(rawControlResult.stdout)
assert(rawControlReport.findings.some((finding) => finding.rule === 'QS-COMPONENT-001'))

const rawTextControl = path.join(root, 'src', 'RawTextControl.tsx')
fs.writeFileSync(rawTextControl, '<input type="text" placeholder="Name" />\n<textarea />')
const rawTextResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const rawTextReport = JSON.parse(rawTextResult.stdout)
assert(rawTextReport.findings.some((finding) => finding.file.endsWith('/src/RawTextControl.tsx') && finding.rule === 'QS-COMPONENT-001'))

const adaptedTextControl = path.join(root, 'src', 'AdaptedTextControl.tsx')
fs.writeFileSync(adaptedTextControl, '<input type="search" data-quiet-adapted /><textarea data-quiet-adapted />')
const adaptedTextResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const adaptedTextReport = JSON.parse(adaptedTextResult.stdout)
assert(!adaptedTextReport.findings.some((finding) => finding.file.endsWith('/src/AdaptedTextControl.tsx') && finding.rule === 'QS-COMPONENT-001'))

const hiddenInput = path.join(root, 'src', 'HiddenInput.tsx')
fs.writeFileSync(hiddenInput, '<input type="hidden" name="csrf" />')
const hiddenInputResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const hiddenInputReport = JSON.parse(hiddenInputResult.stdout)
assert(!hiddenInputReport.findings.some((finding) => finding.file.endsWith('/src/HiddenInput.tsx') && finding.rule === 'QS-COMPONENT-001'))

const unnamedIconButton = path.join(root, 'src', 'UnnamedIconButton.tsx')
fs.writeFileSync(unnamedIconButton, '<button><CloseIcon /></button>\n<a href="/settings"><SettingsIcon /></a>')
const unnamedIconResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const unnamedIconReport = JSON.parse(unnamedIconResult.stdout)
assert.equal(unnamedIconReport.findings.filter((finding) => finding.file.endsWith('/src/UnnamedIconButton.tsx') && finding.rule === 'QS-A11Y-003').length, 2)

const hiddenLabelIcon = path.join(root, 'src', 'HiddenLabelIcon.tsx')
fs.writeFileSync(hiddenLabelIcon, '<button><CloseIcon /><span aria-hidden="true">关闭</span></button>')
const hiddenLabelResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const hiddenLabelReport = JSON.parse(hiddenLabelResult.stdout)
assert(hiddenLabelReport.findings.some((finding) => finding.file.endsWith('/src/HiddenLabelIcon.tsx') && finding.rule === 'QS-A11Y-003'))

const emptyIconName = path.join(root, 'src', 'EmptyIconName.tsx')
fs.writeFileSync(emptyIconName, '<button aria-label=""><CloseIcon /></button>\n<a href="/settings" title=""><SettingsIcon /></a>')
const emptyIconNameResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const emptyIconNameReport = JSON.parse(emptyIconNameResult.stdout)
assert.equal(emptyIconNameReport.findings.filter((finding) => finding.file.endsWith('/src/EmptyIconName.tsx') && finding.rule === 'QS-A11Y-003').length, 2)

const dynamicIconName = path.join(root, 'src', 'DynamicIconName.tsx')
fs.writeFileSync(dynamicIconName, '<button aria-label={closeLabel}><CloseIcon /></button>')
const dynamicIconNameResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const dynamicIconNameReport = JSON.parse(dynamicIconNameResult.stdout)
assert(!dynamicIconNameReport.findings.some((finding) => finding.file.endsWith('/src/DynamicIconName.tsx') && finding.rule === 'QS-A11Y-003'))

const namedIconButton = path.join(root, 'src', 'NamedIconButton.tsx')
fs.writeFileSync(namedIconButton, '<button aria-label="关闭"><CloseIcon /></button>\n<a href="/settings" title="设置"><SettingsIcon /></a>\n<button>保存</button>')
const namedIconResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const namedIconReport = JSON.parse(namedIconResult.stdout)
assert(!namedIconReport.findings.some((finding) => finding.file.endsWith('/src/NamedIconButton.tsx') && finding.rule === 'QS-A11Y-003'))

const multilineTextControl = path.join(root, 'src', 'MultilineTextControl.tsx')
fs.writeFileSync(multilineTextControl, '<input\n  type="text"\n  placeholder="Name"\n/>\n<textarea\n  rows="4"\n/>')
const multilineTextResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const multilineTextReport = JSON.parse(multilineTextResult.stdout)
assert(multilineTextReport.findings.some((finding) => finding.file.endsWith('/src/MultilineTextControl.tsx') && finding.rule === 'QS-COMPONENT-001'))

const plainTypeScript = path.join(root, 'src', 'data.ts')
fs.writeFileSync(plainTypeScript, `export const mockTasks = [{ id: '1' }]\nexport const color = '#fff'\n`)
const plainTypeScriptResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const plainTypeScriptReport = JSON.parse(plainTypeScriptResult.stdout)
assert(plainTypeScriptReport.findings.some((finding) => finding.rule === 'QS-PROTOTYPE-001'))
assert(plainTypeScriptReport.findings.some((finding) => finding.rule === 'QS-VISUAL-002'))

const ignoredRootFile = path.join(root, 'helper.test.ts')
fs.writeFileSync(ignoredRootFile, 'export const demoData = {}')
fs.writeFileSync(path.join(root, '.quiet-systems.json'), JSON.stringify({ ignore: ['**/*.test.*'] }))
const ignoredResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const ignoredReport = JSON.parse(ignoredResult.stdout)
assert(!ignoredReport.findings.some((finding) => finding.file === ignoredRootFile))

const separatorProbe = path.join(root, 'src', 'Separator.tsx')
fs.writeFileSync(separatorProbe, 'export const S = () => <div>状态 | 异常</div>')
const separatorResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const separatorReport = JSON.parse(separatorResult.stdout)
assert(separatorReport.findings.some((finding) => finding.rule === 'QS-COPY-002'))

const slashSeparator = path.join(root, 'src', 'SlashSeparator.tsx')
fs.writeFileSync(slashSeparator, 'export const S = () => <div>状态 / 异常</div>')
const slashResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const slashReport = JSON.parse(slashResult.stdout)
assert(slashReport.findings.some((finding) => finding.file.endsWith('/src/SlashSeparator.tsx') && finding.rule === 'QS-COPY-002'))

const multilineSeparator = path.join(root, 'src', 'MultilineSeparator.tsx')
fs.writeFileSync(multilineSeparator, `<span>状态</span>\n<span>·</span>\n<span>异常</span>`)
const multilineSeparatorResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const multilineSeparatorReport = JSON.parse(multilineSeparatorResult.stdout)
assert(multilineSeparatorReport.findings.some((finding) => finding.file.endsWith('/src/MultilineSeparator.tsx') && finding.rule === 'QS-COPY-001'))

const multilineSlashSeparator = path.join(root, 'src', 'MultilineSlashSeparator.tsx')
fs.writeFileSync(multilineSlashSeparator, `<span>状态</span>\n<span>/</span>\n<span>异常</span>`)
const multilineSlashResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const multilineSlashReport = JSON.parse(multilineSlashResult.stdout)
assert(multilineSlashReport.findings.some((finding) => finding.file.endsWith('/src/MultilineSlashSeparator.tsx') && finding.rule === 'QS-COPY-002'))

const semanticSlashSeparator = path.join(root, 'src', 'SemanticSlashSeparator.tsx')
fs.writeFileSync(semanticSlashSeparator, `<h1>状态</h1>\n<h1>/</h1>\n<h1>异常</h1>`)
const semanticSlashResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const semanticSlashReport = JSON.parse(semanticSlashResult.stdout)
assert(semanticSlashReport.findings.some((finding) => finding.file.endsWith('/src/SemanticSlashSeparator.tsx') && finding.rule === 'QS-COPY-002'))

const codeSlashSeparator = path.join(root, 'src', 'CodeSlashSeparator.tsx')
fs.writeFileSync(codeSlashSeparator, '<code>/</code>')
const codeSlashResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const codeSlashReport = JSON.parse(codeSlashResult.stdout)
assert(!codeSlashReport.findings.some((finding) => finding.file.endsWith('/src/CodeSlashSeparator.tsx') && finding.rule === 'QS-COPY-002'))

const slopProbe = path.join(root, 'src', 'Slop.tsx')
fs.writeFileSync(slopProbe, '<SparklesIcon width="24" style={{ boxShadow: "0 0 10px #000" }} />')
const slopResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const slopReport = JSON.parse(slopResult.stdout)
const slopRules = new Set(slopReport.findings.map((finding) => finding.rule))
assert(slopRules.has('QS-SLOP-001'))
assert(slopRules.has('QS-SLOP-002'))
assert(slopRules.has('QS-ICON-001'))

const copySlopProbe = path.join(root, 'src', 'CopySlop.tsx')
fs.writeFileSync(copySlopProbe, '<p>开启全新体验，轻松实现高效协作</p>')
const copySlopResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const copySlopReport = JSON.parse(copySlopResult.stdout)
assert(copySlopReport.findings.some((finding) => finding.file.endsWith('/src/CopySlop.tsx') && finding.rule === 'QS-SLOP-003'))

const disclaimerProbe = path.join(root, 'src', 'Disclaimer.tsx')
fs.writeFileSync(disclaimerProbe, '<p>内容由 AI 生成，请核实重要信息</p>')
const disclaimerResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const disclaimerReport = JSON.parse(disclaimerResult.stdout)
assert(disclaimerReport.findings.some((finding) => finding.file.endsWith('/src/Disclaimer.tsx') && finding.rule === 'QS-COPY-005'))

const metadataDisclaimerProbe = path.join(root, 'src', 'Metadata.tsx')
fs.writeFileSync(metadataDisclaimerProbe, "const copy = { description: 'generated by AI' }")
const metadataDisclaimerResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const metadataDisclaimerReport = JSON.parse(metadataDisclaimerResult.stdout)
assert(!metadataDisclaimerReport.findings.some((finding) => finding.file.endsWith('/src/Metadata.tsx') && finding.rule === 'QS-COPY-005'))

const ariaDisclaimerProbe = path.join(root, 'src', 'AriaDisclaimer.tsx')
fs.writeFileSync(ariaDisclaimerProbe, '<button aria-label="内容由 AI 生成，请核实重要信息"><InfoIcon /></button>')
const ariaDisclaimerResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const ariaDisclaimerReport = JSON.parse(ariaDisclaimerResult.stdout)
assert(ariaDisclaimerReport.findings.some((finding) => finding.file.endsWith('/src/AriaDisclaimer.tsx') && finding.rule === 'QS-COPY-005'))

const promiseProbe = path.join(root, 'src', 'PromiseCopy.tsx')
fs.writeFileSync(promiseProbe, '<p>敬请期待，持续优化中</p>')
const promiseResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const promiseReport = JSON.parse(promiseResult.stdout)
assert(promiseReport.findings.some((finding) => finding.file.endsWith('/src/PromiseCopy.tsx') && finding.rule === 'QS-COPY-006'))

const actionCta = path.join(root, 'src', 'ActionCta.tsx')
fs.writeFileSync(actionCta, '<button>Try it now</button>\n<p>Welcome</p>')
const actionCtaResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const actionCtaReport = JSON.parse(actionCtaResult.stdout)
assert(!actionCtaReport.findings.some((finding) => finding.file.endsWith('/src/ActionCta.tsx') && finding.rule === 'QS-COPY-006'))

const englishCopySlop = path.join(root, 'src', 'EnglishCopySlop.tsx')
fs.writeFileSync(englishCopySlop, '<p>Revolutionary workflow for every team</p>')
const englishCopyResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const englishCopyReport = JSON.parse(englishCopyResult.stdout)
assert(englishCopyReport.findings.some((finding) => finding.file.endsWith('/src/EnglishCopySlop.tsx') && finding.rule === 'QS-SLOP-003'))

const shortCopySlop = path.join(root, 'src', 'ShortCopySlop.tsx')
fs.writeFileSync(shortCopySlop, '<p>轻松开始</p><p>为你打造</p><p>随时准备</p>')
const shortCopyResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const shortCopyReport = JSON.parse(shortCopyResult.stdout)
assert(shortCopyReport.findings.some((finding) => finding.file.endsWith('/src/ShortCopySlop.tsx') && finding.rule === 'QS-SLOP-003'))

const defensiveVariant = path.join(root, 'src', 'DefensiveVariant.tsx')
fs.writeFileSync(defensiveVariant, '<p>请注意检查配置</p>\n<p>务必保证网络稳定</p>')
const defensiveVariantResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const defensiveVariantReport = JSON.parse(defensiveVariantResult.stdout)
assert.equal(defensiveVariantReport.findings.filter((finding) => finding.file.endsWith('/src/DefensiveVariant.tsx') && finding.rule === 'QS-COPY-004').length, 2)

const safetyCopy = path.join(root, 'src', 'SafetyCopy.tsx')
fs.writeFileSync(safetyCopy, '<p>务必在关闭电源后操作</p>\n<p>请注意使用规范</p>')
const safetyCopyResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const safetyCopyReport = JSON.parse(safetyCopyResult.stdout)
assert(!safetyCopyReport.findings.some((finding) => finding.file.endsWith('/src/SafetyCopy.tsx') && finding.rule === 'QS-COPY-004' && finding.line === 1))
assert(safetyCopyReport.findings.some((finding) => finding.file.endsWith('/src/SafetyCopy.tsx') && finding.rule === 'QS-COPY-004' && finding.line === 2))

const multilineCopySlop = path.join(root, 'src', 'MultilineCopySlop.tsx')
fs.writeFileSync(multilineCopySlop, `<p>\n  这是一段开启全新体验的说明\n</p>`)
const multilineCopyResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const multilineCopyReport = JSON.parse(multilineCopyResult.stdout)
assert(multilineCopyReport.findings.some((finding) => finding.file.endsWith('/src/MultilineCopySlop.tsx') && finding.rule === 'QS-SLOP-003'))

const sameLineCopySlop = path.join(root, 'src', 'SameLineCopySlop.tsx')
fs.writeFileSync(sameLineCopySlop, '<p>全新体验</p><p>重试上传</p>')
const sameLineCopyResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const sameLineCopyReport = JSON.parse(sameLineCopyResult.stdout)
assert.equal(sameLineCopyReport.findings.filter((finding) => finding.file.endsWith('/src/SameLineCopySlop.tsx') && finding.rule === 'QS-SLOP-003').length, 1)

const identifierCopySlop = path.join(root, 'src', 'IdentifierCopySlop.ts')
fs.writeFileSync(identifierCopySlop, 'const seamlessMode = true\nimport { revolutionaryFeature } from "./feature"')
const identifierCopyResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const identifierCopyReport = JSON.parse(identifierCopyResult.stdout)
assert(!identifierCopyReport.findings.some((finding) => finding.file.endsWith('/src/IdentifierCopySlop.ts') && finding.rule === 'QS-SLOP-003'))

const concreteCopy = path.join(root, 'src', 'ConcreteCopy.tsx')
fs.writeFileSync(concreteCopy, '<button>重试上传</button>')
const concreteCopyResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const concreteCopyReport = JSON.parse(concreteCopyResult.stdout)
assert(!concreteCopyReport.findings.some((finding) => finding.file.endsWith('/src/ConcreteCopy.tsx') && finding.rule === 'QS-SLOP-003'))

const expandedIconActions = path.join(root, 'src', 'ExpandedIconActions.tsx')
fs.writeFileSync(expandedIconActions, '<div>\n<button>保存</button>\n<button>确认</button>\n<button>展开</button>\n</div>')
const expandedIconResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const expandedIconReport = JSON.parse(expandedIconResult.stdout)
assert.equal(expandedIconReport.findings.filter((finding) => finding.file.endsWith('/src/ExpandedIconActions.tsx') && finding.rule === 'QS-ICON-002').length, 3)

const hierarchyProbe = path.join(root, 'src', 'HierarchyProbe.tsx')
fs.writeFileSync(hierarchyProbe, '<section><h2>最近运行</h2>\n<p className="subtitle">查看结果与处理需要关注的任务</p>\n<small>仅供参考</small></section>')
const hierarchyResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const hierarchyReport = JSON.parse(hierarchyResult.stdout)
assert.equal(hierarchyReport.findings.filter((finding) => finding.file.endsWith('/src/HierarchyProbe.tsx') && finding.rule === 'QS-HIERARCHY-001').length, 2)

const iconActionProbe = path.join(root, 'src', 'IconActionProbe.tsx')
fs.writeFileSync(iconActionProbe, '<div>\n<button>下载</button>\n<button>查看</button>\n<button aria-label="关闭"><CloseIcon /></button>\n</div>')
const iconActionResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const iconActionReport = JSON.parse(iconActionResult.stdout)
assert.equal(iconActionReport.findings.filter((finding) => finding.file.endsWith('/src/IconActionProbe.tsx') && finding.rule === 'QS-ICON-002').length, 2)

const defensiveCopyProbe = path.join(root, 'src', 'DefensiveCopyProbe.tsx')
fs.writeFileSync(defensiveCopyProbe, '<p>仅供参考</p>\n<p>为了更好地使用，请注意操作结果</p>\n<p>上传失败，请重试</p>')
const defensiveCopyResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const defensiveCopyReport = JSON.parse(defensiveCopyResult.stdout)
assert.equal(defensiveCopyReport.findings.filter((finding) => finding.file.endsWith('/src/DefensiveCopyProbe.tsx') && finding.rule === 'QS-COPY-004').length, 2)

const compositionProbe = path.join(root, 'src', 'CompositionProbe.tsx')
fs.writeFileSync(compositionProbe, `<main>\n<h1>一个标题</h1>\n<h1>另一个标题</h1>\n<div className="card" />\n<div className="card" />\n<div className="card" />\n<div className="card" />\n<div className="card" />\n<span className="pill" />\n<span className="pill" />\n<span className="pill" />\n<span className="pill" />\n<hr /><hr /><hr /><hr />\n<button>查看</button>\n<button>编辑</button>\n<button>下载</button>\n<button aria-label="关闭"><CloseIcon /></button>\n</main>`)
const compositionResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const compositionReport = JSON.parse(compositionResult.stdout)
assert(compositionReport.metrics.some((metric) => metric.file.endsWith('/src/CompositionProbe.tsx') && metric.headingCount === 2 && metric.surfaceCount === 5 && metric.pillCount === 4 && metric.dividerCount === 4 && metric.textActionCount === 3 && metric.iconOnlyActionCount === 1))
assert(compositionReport.findings.some((finding) => finding.file.endsWith('/src/CompositionProbe.tsx') && finding.rule === 'QS-COMPOSITION-001'))

const shortcutProbe = path.join(root, 'src', 'Shortcut.tsx')
fs.writeFileSync(shortcutProbe, '<KeyboardShortcut>Cmd | Ctrl + S</KeyboardShortcut>')
const shortcutResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const shortcutReport = JSON.parse(shortcutResult.stdout)
assert(!shortcutReport.findings.some((finding) => finding.file === shortcutProbe && finding.rule === 'QS-COPY-002'))

const nestedRoot = path.join(root, 'nested-app')
fs.mkdirSync(path.join(nestedRoot, 'src'), { recursive: true })
fs.writeFileSync(path.join(nestedRoot, '.quiet-systems.json'), JSON.stringify({ ignore: ['src/**'] }))
const nestedSource = path.join(nestedRoot, 'src', 'Ignored.tsx')
fs.writeFileSync(nestedSource, '<div>状态 | 异常</div>')
const nestedResult = spawnSync(process.execPath, [script, '--json', nestedRoot], { encoding: 'utf8', cwd: root })
const nestedReport = JSON.parse(nestedResult.stdout)
assert(!nestedReport.findings.some((finding) => finding.file === nestedSource))
assert.deepEqual(nestedReport.summary.bySeverity, { P0: 0, P1: 0, P2: 0 })

const largeFile = path.join(root, 'src', 'Large.tsx')
fs.writeFileSync(largeFile, 'x'.repeat(2_000_000))
const largeResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const largeReport = JSON.parse(largeResult.stdout)
assert.equal(largeReport.summary.skipped, 1)
assert(largeReport.skipped.some((item) => item.file.endsWith('/src/Large.tsx') && item.reason === 'maxFileBytes'))

const longCopy = path.join(root, 'src', 'LongCopy.tsx')
fs.writeFileSync(longCopy, `<p>\n  ${'这是一段需要收束的界面说明。'.repeat(30)}\n</p>`)
const longCopyResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const longCopyReport = JSON.parse(longCopyResult.stdout)
assert(longCopyReport.findings.some((finding) => finding.file.endsWith('/src/LongCopy.tsx') && finding.rule === 'QS-COPY-003'))

const hiddenButton = path.join(root, 'src', 'HiddenButton.tsx')
fs.writeFileSync(hiddenButton, `<button\n  aria-label="Hidden action"\n  aria-hidden="true"\n><SparklesIcon /></button>`)
const hiddenButtonResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const hiddenButtonReport = JSON.parse(hiddenButtonResult.stdout)
assert(hiddenButtonReport.findings.some((finding) => finding.file.endsWith('/src/HiddenButton.tsx') && finding.rule === 'QS-A11Y-002'))

const hiddenTab = path.join(root, 'src', 'HiddenTab.tsx')
fs.writeFileSync(hiddenTab, '<div role="tab" tabindex="0" aria-hidden="true">Tab</div>')
const hiddenTabResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const hiddenTabReport = JSON.parse(hiddenTabResult.stdout)
assert(hiddenTabReport.findings.some((finding) => finding.file.endsWith('/src/HiddenTab.tsx') && finding.rule === 'QS-A11Y-002'))

const hiddenEvent = path.join(root, 'src', 'HiddenEvent.tsx')
fs.writeFileSync(hiddenEvent, '<div onClick={runAction} aria-hidden="true">Action</div>')
const hiddenEventResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const hiddenEventReport = JSON.parse(hiddenEventResult.stdout)
assert(hiddenEventReport.findings.some((finding) => finding.file.endsWith('/src/HiddenEvent.tsx') && finding.rule === 'QS-A11Y-002'))

const hiddenSvelteEvent = path.join(root, 'src', 'HiddenSvelte.svelte')
fs.writeFileSync(hiddenSvelteEvent, '<div on:click={runAction} aria-hidden="true">Action</div>')
const hiddenSvelteResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const hiddenSvelteReport = JSON.parse(hiddenSvelteResult.stdout)
assert(hiddenSvelteReport.findings.some((finding) => finding.file.endsWith('/src/HiddenSvelte.svelte') && finding.rule === 'QS-A11Y-002'))

const customCopy = path.join(root, 'custom-copy-app', 'src', 'Copy.tsx')
fs.mkdirSync(path.dirname(customCopy), { recursive: true })
fs.writeFileSync(path.join(root, 'custom-copy-app', '.quiet-systems.json'), JSON.stringify({ rules: { 'QS-COPY-003': { maxLength: 20 } } }))
fs.writeFileSync(customCopy, '<p>This sentence is longer than twenty characters.</p>')
const customCopyResult = spawnSync(process.execPath, [script, '--json', path.join(root, 'custom-copy-app')], { encoding: 'utf8' })
const customCopyReport = JSON.parse(customCopyResult.stdout)
assert(customCopyReport.findings.some((finding) => finding.file.endsWith('/src/Copy.tsx') && finding.rule === 'QS-COPY-003'))

const motionCss = path.join(root, 'src', 'Motion.css')
fs.writeFileSync(motionCss, '.panel { transition: opacity 180ms ease; }')
const motionResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const motionReport = JSON.parse(motionResult.stdout)
assert(motionReport.findings.some((finding) => finding.file.endsWith('/src/Motion.css') && finding.rule === 'QS-MOTION-001'))

const reducedMotionCss = path.join(root, 'src', 'ReducedMotion.css')
fs.writeFileSync(reducedMotionCss, '.panel { transition: opacity 180ms ease; } @media (prefers-reduced-motion: reduce) { .panel { transition-duration: 1ms; } }')
const reducedMotionResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const reducedMotionReport = JSON.parse(reducedMotionResult.stdout)
assert(!reducedMotionReport.findings.some((finding) => finding.file.endsWith('/src/ReducedMotion.css') && finding.rule === 'QS-MOTION-001'))

const adaptedMotionCss = path.join(root, 'src', 'AdaptedMotion.css')
fs.writeFileSync(adaptedMotionCss, '/* quiet-systems: motion-adapted */\n.panel { animation: quiet-fade-in 180ms ease; }')
const adaptedMotionResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const adaptedMotionReport = JSON.parse(adaptedMotionResult.stdout)
assert(!adaptedMotionReport.findings.some((finding) => finding.file.endsWith('/src/AdaptedMotion.css') && finding.rule === 'QS-MOTION-001'))

const longMotionCss = path.join(root, 'src', 'LongMotion.css')
fs.writeFileSync(longMotionCss, '.panel { transition: opacity 700ms ease; }')
const longMotionResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const longMotionReport = JSON.parse(longMotionResult.stdout)
assert(longMotionReport.findings.some((finding) => finding.file.endsWith('/src/LongMotion.css') && finding.rule === 'QS-MOTION-002'))

const reviewedLongMotionCss = path.join(root, 'src', 'ReviewedLongMotion.css')
fs.writeFileSync(reviewedLongMotionCss, '/* quiet-systems: motion-duration-reviewed */\n.panel { animation: settle 1s ease; }')
const reviewedLongMotionResult = spawnSync(process.execPath, [script, '--json', root], { encoding: 'utf8' })
const reviewedLongMotionReport = JSON.parse(reviewedLongMotionResult.stdout)
assert(!reviewedLongMotionReport.findings.some((finding) => finding.file.endsWith('/src/ReviewedLongMotion.css') && finding.rule === 'QS-MOTION-002'))

const absent = path.join(root, 'absent.tsx')
const incomplete = spawnSync(process.execPath, [script, '--json', source, absent], { encoding: 'utf8' })
assert.equal(incomplete.status, 2)
const incompleteReport = JSON.parse(incomplete.stdout)
assert(incompleteReport.findings.length > 0)
assert(incompleteReport.skipped.some(item => item.reason === 'ENOENT' && item.file.endsWith('absent.tsx')))

const encodedFile = path.join(root, 'Encoded.html')
fs.writeFileSync(encodedFile, ['<p>作者 &middot; 昨天</p>', '<span>', '&#x00B7;', '</span>', '<div title="&middot;">正常字段</div>', '<p>未转义的示例 &amp;middot;</p>'].join('\n'))
const encoded = spawnSync(process.execPath, [script, '--json', encodedFile], { encoding: 'utf8' })
assert.equal(encoded.status, 1)
assert.deepEqual(JSON.parse(encoded.stdout).findings.filter(item => item.rule === 'QS-COPY-001').map(item => item.line), [1, 3])

const mixedMarkup = path.join(root, 'Mixed.tsx')
fs.writeFileSync(mixedMarkup, [
  "<span>{a<b?a+' · '+b:''}</span>",
  '<span>{a<b?a:b} &CenterDot; {date}</span>',
  '<code>&middot;</code>'
].join('\n'))
const mixedResult = spawnSync(process.execPath, [script, '--json', mixedMarkup], { encoding: 'utf8' })
assert.deepEqual(JSON.parse(mixedResult.stdout).findings.filter(item => item.rule === 'QS-COPY-001').map(item => item.line), [1, 2])

const projects = ['project-a', 'project-b'].map(name => path.join(root, name))
for (const [index, dir] of projects.entries()) {
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true })
  fs.writeFileSync(path.join(dir, '.quiet-systems.json'), JSON.stringify(index === 0 ? { ignore: ['src/**'] } : {}))
  fs.writeFileSync(path.join(dir, 'src', 'Row.html'), '<p>已完成 · 刚刚</p>')
}
for (const ordered of [projects, projects.slice().reverse()]) {
  const multi = spawnSync(process.execPath, [script, '--json', ...ordered], { encoding: 'utf8' })
  assert.equal(multi.status, 1)
  const copies = JSON.parse(multi.stdout).findings.filter(item => item.rule === 'QS-COPY-001')
  assert.deepEqual(copies.map(item => path.basename(path.dirname(path.dirname(item.file)))), ['project-b'])
}

// Expanded anti-pattern coverage: defensive hedging/sycophancy, negative parallelism,
// em-dash/triad rhythm, unverified vanity claims, Tailwind visual slop, and multiline JSX.
const antiPatternsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-guard-antipatterns-'))
fs.mkdirSync(path.join(antiPatternsDir, 'src'), { recursive: true })
fs.mkdirSync(path.join(antiPatternsDir, 'examples'), { recursive: true })
fs.writeFileSync(path.join(antiPatternsDir, 'src', 'AntiCopy.tsx'), [
  '<p>值得注意的是，我们很抱歉，oops</p>',
  '<p>懂你所想，告别繁琐，开启创作之旅</p>',
  '<p>并非简单的看板，而是日常工单列表</p>',
  '<p>不仅仅是编辑器，更是工作流</p>',
  '<p>极速同步——让协作更进一步</p>',
  '<p>高效、安全、稳定</p>',
  '<p>已被 50,000+ 团队信赖，效率提升了 300%</p>',
  '<p>已被 5 万+ 团队信赖</p>',
  '<p>Trusted by 10,000+ teams for 3x faster shipping</p>',
  '<p>AI-powered workspace to elevate your workflow</p>',
  '<p>\n  这条流程需要打穿闭环\n</p>',
  '<p>\n  一键洞察全部工单\n</p>',
  '<p>共 12 条记录，已上传 80%</p>',
  '<p>我们将在 3 个工作日内退款</p>',
  '<button>Unlock account</button>',
  '<p>营业时间 9:00—18:00，2024—2025</p>',
  '<p>Saved — 3 files</p>',
  '<p>99.95% 可用</p> // ui-guard: metric-sourced',
  'const title = "https://example.com 极速同步——更快"'
].join('\n'))
fs.writeFileSync(path.join(antiPatternsDir, 'src', 'AntiVisual.tsx'), [
  '<h1 className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">标题</h1>',
  '<div className="bg-linear-to-r from-indigo-500 border-s-4 rounded-xl p-4">提示</div>',
  '<span className="animate-pulse">在线</span>',
  '<div className="skeleton\n  animate-pulse">加载占位</div>',
  '<blockquote className="border-l-4 pl-3">引文</blockquote>',
  '<a aria-current="page" className="border-l-4 pl-2">当前页</a>',
  '<div className="border-l-[6px] pl-3">强调</div> // ui-guard: accent-reviewed',
  '<span role="status" className="animate-ping">录制中</span>',
  '<span className="rounded-full text-[11px] px-2">A</span>',
  '<span className="rounded-full text-xs px-2 py-0.5">B</span>',
  '<span className="rounded-full text-xs px-2 py-0.5">C</span>',
  '<span className="rounded-full text-xs px-2 py-0.5">D</span>',
  '<span className="w-8 h-8 rounded-full text-xs">林</span>'
].join('\n'))
fs.writeFileSync(path.join(antiPatternsDir, 'examples', 'DemoSlop.tsx'), '<p>全新体验，无缝协作</p>\n')
const apRun = spawnSync(process.execPath, [script, '--json', antiPatternsDir], { encoding: 'utf8' })
assert.equal(apRun.status, 1)
const apReport = JSON.parse(apRun.stdout)
const byFileRule = (name, rule) => apReport.findings.filter((item) => item.file.endsWith(name) && item.rule === rule)
assert.equal(byFileRule('AntiCopy.tsx', 'QS-COPY-004').length, 2)
assert.equal(byFileRule('AntiCopy.tsx', 'QS-COPY-009').length, 2)
assert.equal(byFileRule('AntiCopy.tsx', 'QS-COPY-011').length, 3)
assert.equal(byFileRule('AntiCopy.tsx', 'QS-COPY-012').length, 3)
assert.equal(byFileRule('AntiCopy.tsx', 'QS-SLOP-003').length, 1)
assert.equal(byFileRule('AntiCopy.tsx', 'QS-COPY-007').length, 1)
assert.equal(byFileRule('AntiCopy.tsx', 'QS-COPY-010').length, 1)
assert(!apReport.findings.some((item) => item.file.endsWith('AntiCopy.tsx') && (item.evidence.includes('共 12 条记录') || item.evidence.includes('3 个工作日内退款') || item.evidence.includes('Unlock account') || item.evidence.includes('9:00—18:00') || item.evidence.includes('Saved — 3 files') || item.evidence.includes('99.95% 可用'))))
assert.deepEqual(byFileRule('AntiVisual.tsx', 'QS-SLOP-001').map((item) => item.line), [1, 2, 3])
assert.equal(byFileRule('AntiVisual.tsx', 'QS-COMPOSITION-001').length, 1)
const antiVisualMetric = apReport.metrics.find((metric) => metric.file.endsWith('AntiVisual.tsx'))
assert.equal(antiVisualMetric.pillCount, 4)
assert.equal(byFileRule('DemoSlop.tsx', 'QS-SLOP-003').length, 0)
fs.rmSync(antiPatternsDir, { recursive: true, force: true })

process.stdout.write('quiet-systems-review self-test passed\n')
