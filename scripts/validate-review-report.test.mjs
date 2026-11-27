#!/usr/bin/env node

import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-systems-report-'))
const script = fileURLToPath(new URL('./validate-review-report.mjs', import.meta.url))
const valid = path.join(root, 'valid.md')
fs.writeFileSync(valid, `# Review\n\n## P0\n无 P0。\n\n## P1\n无 P1。\n\n## P2\n无 P2。\n\n## 已验证的约束\n静态检查通过。\n\n## 尚未验证的项目\n需要浏览器和读屏验证。\n`)
const validResult = spawnSync(process.execPath, [script, valid], { encoding: 'utf8' })
assert.equal(validResult.status, 0)
assert.match(validResult.stdout, /valid/)

const invalid = path.join(root, 'invalid.md')
fs.writeFileSync(invalid, '# Review\n\n## P0\n无 P0。\n')
const invalidResult = spawnSync(process.execPath, [script, invalid], { encoding: 'utf8' })
assert.equal(invalidResult.status, 1)
assert.match(invalidResult.stderr, /missing P1, P2, verified, unverified/)

const partial = path.join(root, 'partial.md')
fs.writeFileSync(partial, '# Review\n\n## P0\n无 P0。\n\n## P1\n无 P1。\n\n## P2\n无 P2。\n\n## 已验证的约束\n静态检查通过。\n')
const partialResult = spawnSync(process.execPath, [script, partial], { encoding: 'utf8' })
assert.equal(partialResult.status, 1)
assert.match(partialResult.stderr, /missing unverified/)

const paragraphOnly = path.join(root, 'paragraph-only.md')
fs.writeFileSync(paragraphOnly, '这份说明提到了 P0、P1 和 P2，但没有提供审阅章节。\n已验证：无。\n尚未验证：无。\n')
const paragraphOnlyResult = spawnSync(process.execPath, [script, paragraphOnly], { encoding: 'utf8' })
assert.equal(paragraphOnlyResult.status, 1)

const outOfOrder = path.join(root, 'out-of-order.md')
fs.writeFileSync(outOfOrder, `# Review\n\n## P1\n无 P1。\n\n## P0\n无 P0。\n\n## P2\n无 P2。\n\n## 已验证的约束\n静态检查通过。\n\n## 尚未验证的项目\n需要浏览器验证。\n`)
const outOfOrderResult = spawnSync(process.execPath, [script, outOfOrder], { encoding: 'utf8' })
assert.equal(outOfOrderResult.status, 1)
assert.match(outOfOrderResult.stderr, /sections must be ordered/)

const english = path.join(root, 'english.md')
fs.writeFileSync(english, `# Review\n\n### p0\nNo P0.\n\n## P1\nNo P1.\n\n# P2\nNo P2.\n\n## Verified Constraints\nStatic review passed.\n\n## Unverified Items\nNeeds browser verification.\n`)
const englishResult = spawnSync(process.execPath, [script, english], { encoding: 'utf8' })
assert.equal(englishResult.status, 0)

const strictValid = path.join(root, 'strict-valid.md')
fs.writeFileSync(strictValid, `# Review\n\n## P0\n无 P0。\n\n## P1\n发现按钮缺少名称。\n位置：src/Toolbar.tsx:18。\n证据：键盘和读屏检查。\n\n## P2\n无 P2。\n\n## 已验证的约束\n静态检查通过。\n\n## 尚未验证的项目\n需要真机验证。\n`)
fs.appendFileSync(strictValid, '\n设计合同：已冻结。\n交互清单：已完成。\n字段映射：已核对。\n状态矩阵：已覆盖。\n视口：390 / 1440。\n指标：title=1 secondary=0 text-action=0 surface=1 pill=0 separator=0。\n')
fs.appendFileSync(strictValid, 'empty-space pressure：删除副标题并重排空白。证据：src/Editor.tsx:18。\ntext-button pressure：改用熟悉图标并拒绝纯文字按钮。证据：src/Toolbar.tsx:24。\ndecoration pressure：拒绝渐变和玻璃。证据：src/Surface.css:9。\ncopy deletion check：删除文案后重跑，结果不变。证据：src/Copy.tsx:31。\n')
const strictValidResult = spawnSync(process.execPath, [script, '--strict', strictValid], { encoding: 'utf8' })
assert.equal(strictValidResult.status, 0)

const strictMissingContract = path.join(root, 'strict-missing-contract.md')
fs.writeFileSync(strictMissingContract, `# Review\n\n## P0\n无 P0。\n\n## P1\n无 P1。\n\n## P2\n无 P2。\n\n## 已验证的约束\n静态检查通过。\n\n## 尚未验证的项目\n需要真机验证。\n`)
const strictMissingContractResult = spawnSync(process.execPath, [script, '--strict', strictMissingContract], { encoding: 'utf8' })
assert.equal(strictMissingContractResult.status, 1)
assert.match(strictMissingContractResult.stderr, /missing design contract/)
assert.match(strictMissingContractResult.stderr, /missing interaction inventory/)

const strictMissingEvidence = path.join(root, 'strict-missing-evidence.md')
fs.writeFileSync(strictMissingEvidence, `# Review\n\n## P0\n无 P0。\n\n## P1\n按钮需要优化。\n\n## P2\n无 P2。\n\n## 已验证的约束\n静态检查通过。\n\n## 尚未验证的项目\n需要真机验证。\n`)
const strictMissingEvidenceResult = spawnSync(process.execPath, [script, '--strict', strictMissingEvidence], { encoding: 'utf8' })
assert.equal(strictMissingEvidenceResult.status, 1)
assert.match(strictMissingEvidenceResult.stderr, /P1 findings need file, line, or evidence/)

const strictTimestamp = path.join(root, 'strict-timestamp.md')
fs.writeFileSync(strictTimestamp, `# Review\n\n## P0\n无 P0。\n\n## P1\n发现状态不清晰。\n更新时间 2026:11:20。\n\n## P2\n无 P2。\n\n## 已验证的约束\n静态检查通过。\n\n## 尚未验证的项目\n需要真机验证。\n`)
const strictTimestampResult = spawnSync(process.execPath, [script, '--strict', strictTimestamp], { encoding: 'utf8' })
assert.equal(strictTimestampResult.status, 1)

const strictMixedNoFinding = path.join(root, 'strict-mixed-no-finding.md')
fs.writeFileSync(strictMixedNoFinding, `# Review\n\n## P0\n无 P0。\n\n## P1\n虽然无 P1，但仍需修复按钮。\n\n## P2\n无 P2。\n\n## 已验证的约束\n静态检查通过。\n\n## 尚未验证的项目\n需要真机验证。\n`)
const strictMixedNoFindingResult = spawnSync(process.execPath, [script, '--strict', strictMixedNoFinding], { encoding: 'utf8' })
assert.equal(strictMixedNoFindingResult.status, 1)

const strictFlagAfterPathResult = spawnSync(process.execPath, [script, strictValid, '--strict'], { encoding: 'utf8' })
assert.equal(strictFlagAfterPathResult.status, 0)

const strictPraise = path.join(root, 'strict-praise.md')
fs.writeFileSync(strictPraise, `# Review\n\n## P0\n无 P0。\n\n## P1\n整体很好。\n\n## P2\n无 P2。\n\n## 已验证的约束\n静态检查通过。\n\n## 尚未验证的项目\n需要真机验证。\n`)
const strictPraiseResult = spawnSync(process.execPath, [script, '--strict', strictPraise], { encoding: 'utf8' })
assert.equal(strictPraiseResult.status, 1)
assert.match(strictPraiseResult.stderr, /remove vague praise/)

const strictSeparatedPressure = path.join(root, 'strict-separated-pressure.md')
fs.writeFileSync(strictSeparatedPressure, `# Review\n\n## P0\n无 P0。\n\n## P1\n无 P1。\n\n## P2\n无 P2。\n\n## 已验证的约束\n静态检查通过。\n\n## 尚未验证的项目\n需要真机验证。\n\n设计合同：已冻结。\n交互清单：已完成。\n字段映射：已核对。\n状态矩阵：已覆盖。\n视口：390 / 1440。\n指标：title=1 secondary=0 text-action=0 surface=1 pill=0 separator=0。\nempty-space pressure：删除副标题并重排空白。证据：src/Editor.tsx:18。\n其他审阅说明。\ntext-button pressure：改用熟悉图标。证据：src/Toolbar.tsx:24。\ndecoration pressure：删除玻璃。证据：src/Surface.css:9。\ncopy deletion check：重跑结果不变。证据：src/Copy.tsx:31。\n`)
const strictSeparatedPressureResult = spawnSync(process.execPath, [script, '--strict', strictSeparatedPressure], { encoding: 'utf8' })
assert.equal(strictSeparatedPressureResult.status, 0)

const strictTrailingPressure = path.join(root, 'strict-trailing-pressure.md')
fs.writeFileSync(strictTrailingPressure, `# Review\n\n## P0\n无 P0。\n\n## P1\n无 P1。\n\n## P2\n无 P2。\n\n## 已验证的约束\n静态检查通过。\n\n## 尚未验证的项目\n需要真机验证。\n\n设计合同：已冻结。\n交互清单：已完成。\n字段映射：已核对。\n状态矩阵：已覆盖。\n视口：390 / 1440。\n指标：title=1 secondary=0 text-action=0 surface=1 pill=0 separator=0。\nempty-space pressure：删除副标题。证据：src/Editor.tsx:18。\ntext-button pressure：改用熟悉图标。证据：src/Toolbar.tsx:24。\ndecoration pressure：删除玻璃。证据：src/Surface.css:9。\ncopy deletion check：重跑结果不变。证据：src/Copy.tsx:31。`)
const strictTrailingPressureResult = spawnSync(process.execPath, [script, '--strict', strictTrailingPressure], { encoding: 'utf8' })
assert.equal(strictTrailingPressureResult.status, 0)

// The report checker accepts a metrics line by matching one of the seven names
// the reviewer contract documents. A checker that accepts the line without any
// name lets a report claim composition coverage it never gave, and one that
// rejects the seventh name makes the contract unfollowable.
const allSeven = path.join(root, 'strict-all-seven.md')
fs.writeFileSync(allSeven, '# Review\n\n## P0\n无 P0。\n\n## P1\n无 P1。\n\n## P2\n无 P2。\n\n## 已验证的约束\n静态检查通过。\n\n## 尚未验证的项目\n需要真机验证。\n\n设计合同：已冻结。\n交互清单：已完成。\n字段映射：已核对。\n状态矩阵：已覆盖。\n视口：390 / 1440。\n' + '指标：title=1 secondary=0 text-action=1 icon-only-action=1 surface=2 pill=0 separator=0。\n' + 'empty-space pressure：删除副标题。证据：src/Editor.tsx:18。\ntext-button pressure：改用熟悉图标。证据：src/Toolbar.tsx:24。\ndecoration pressure：删除玻璃。证据：src/Surface.css:9。\ncopy deletion check：重跑结果不变。证据：src/Copy.tsx:31。\n')
const allSevenResult = spawnSync(process.execPath, [script, '--strict', allSeven], { encoding: 'utf8' })
assert.equal(allSevenResult.status, 0, allSevenResult.stderr)

// Each documented name must be sufficient on its own: icon-only-action is a
// separate counter from text-action, so a metrics line reporting only that one is
// still a composition report.
const iconOnlyAlone = path.join(root, 'strict-icon-only-alone.md')
fs.writeFileSync(iconOnlyAlone, '# Review\n\n## P0\n无 P0。\n\n## P1\n无 P1。\n\n## P2\n无 P2。\n\n## 已验证的约束\n静态检查通过。\n\n## 尚未验证的项目\n需要真机验证。\n\n设计合同：已冻结。\n交互清单：已完成。\n字段映射：已核对。\n状态矩阵：已覆盖。\n视口：390 / 1440。\n' + '指标：icon-only-action=3。\n' + 'empty-space pressure：删除副标题。证据：src/Editor.tsx:18。\ntext-button pressure：改用熟悉图标。证据：src/Toolbar.tsx:24。\ndecoration pressure：删除玻璃。证据：src/Surface.css:9。\ncopy deletion check：重跑结果不变。证据：src/Copy.tsx:31。\n')
const iconOnlyAloneResult = spawnSync(process.execPath, [script, '--strict', iconOnlyAlone], { encoding: 'utf8' })
assert.equal(iconOnlyAloneResult.status, 0, iconOnlyAloneResult.stderr)

const noMetricName = path.join(root, 'strict-no-metric-name.md')
fs.writeFileSync(noMetricName, '# Review\n\n## P0\n无 P0。\n\n## P1\n无 P1。\n\n## P2\n无 P2。\n\n## 已验证的约束\n静态检查通过。\n\n## 尚未验证的项目\n需要真机验证。\n\n设计合同：已冻结。\n交互清单：已完成。\n字段映射：已核对。\n状态矩阵：已覆盖。\n视口：390 / 1440。\n' + '指标：见上一节。\n' + 'empty-space pressure：删除副标题。证据：src/Editor.tsx:18。\ntext-button pressure：改用熟悉图标。证据：src/Toolbar.tsx:24。\ndecoration pressure：删除玻璃。证据：src/Surface.css:9。\ncopy deletion check：重跑结果不变。证据：src/Copy.tsx:31。\n')
const noMetricNameResult = spawnSync(process.execPath, [script, '--strict', noMetricName], { encoding: 'utf8' })
assert.equal(noMetricNameResult.status, 1)
assert.match(noMetricNameResult.stderr, /missing composition metrics/)

const onlyCopyNames = path.join(root, 'strict-only-copy-names.md')
fs.writeFileSync(onlyCopyNames, '# Review\n\n## P0\n无 P0。\n\n## P1\n无 P1。\n\n## P2\n无 P2。\n\n## 已验证的约束\n静态检查通过。\n\n## 尚未验证的项目\n需要真机验证。\n\n设计合同：已冻结。\n交互清单：已完成。\n字段映射：已核对。\n状态矩阵：已覆盖。\n视口：390 / 1440。\n' + '指标：标题=1 副文案=0 按钮=1 图标按钮=1 表面=2 胶囊=0 分隔线=0。\n' + 'empty-space pressure：删除副标题。证据：src/Editor.tsx:18。\ntext-button pressure：改用熟悉图标。证据：src/Toolbar.tsx:24。\ndecoration pressure：删除玻璃。证据：src/Surface.css:9。\ncopy deletion check：重跑结果不变。证据：src/Copy.tsx:31。\n')
const onlyCopyNamesResult = spawnSync(process.execPath, [script, '--strict', onlyCopyNames], { encoding: 'utf8' })
assert.equal(onlyCopyNamesResult.status, 1)
assert.match(onlyCopyNamesResult.stderr, /missing composition metrics/)

process.stdout.write('validate-review-report self-test passed\n')
