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

process.stdout.write('validate-review-report self-test passed\n')
