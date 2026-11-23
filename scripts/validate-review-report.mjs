#!/usr/bin/env node

const strict = process.argv.includes('--strict')
const reportPath = process.argv.slice(2).find((argument) => !argument.startsWith('--'))
if (!reportPath) {
  process.stderr.write('usage: node scripts/validate-review-report.mjs [--strict] path/to/review.md\n')
  process.exit(2)
}

let report
try {
  report = await import('node:fs/promises').then(({ readFile }) => readFile(reportPath, 'utf8'))
} catch (error) {
  process.stderr.write(`quiet-systems report validation: cannot read ${reportPath}: ${error.message}\n`)
  process.exit(2)
}

const requiredSections = [
  { name: 'P0', pattern: /(?:^|\n)\s*(?:#{1,6}\s*)?P0\b/im },
  { name: 'P1', pattern: /(?:^|\n)\s*(?:#{1,6}\s*)?P1\b/im },
  { name: 'P2', pattern: /(?:^|\n)\s*(?:#{1,6}\s*)?P2\b/im },
  { name: 'verified', pattern: /(?:已验证|验证结果|verified constraints|verified)/i },
  { name: 'unverified', pattern: /(?:尚未验证|未验证|unverified|evidence still needed)/i }
]
const missing = requiredSections.filter((section) => !section.pattern.test(report)).map((section) => section.name)

if (missing.length > 0) {
  process.stderr.write(`quiet-systems report validation: missing ${missing.join(', ')}\n`)
  process.exit(1)
}

const positions = requiredSections.map((section) => ({ name: section.name, position: report.search(section.pattern) }))
const outOfOrder = positions.some((section, index) => index > 0 && section.position < positions[index - 1].position)
if (outOfOrder) {
  process.stderr.write(`quiet-systems report validation: sections must be ordered P0, P1, P2, verified, unverified\n`)
  process.exit(1)
}

if (strict) {
  const requiredEvidence = [
    { name: 'design contract', pattern: /(?:design contract|设计合同)/i },
    { name: 'interaction inventory', pattern: /(?:interaction inventory|交互清单)/i },
    { name: 'field mapping', pattern: /(?:field mapping|字段映射)/i },
    { name: 'state matrix', pattern: /(?:state matrix|状态矩阵)/i },
    { name: 'viewport evidence', pattern: /(?:viewport|视口).*(?:390|1440)|(?:390|1440).*(?:viewport|视口)/i },
    { name: 'composition metrics', pattern: /(?:metrics|指标).*(?:title|secondary|text.?action|surface|pill|separator)/i },
    { name: 'empty-space pressure', pattern: /(?=[^]*(?:empty.?space|空白填充|副标题))(?=[^]*(?:delete|删除|reflow|重排|reject|拒绝))/i },
    { name: 'text-button pressure', pattern: /(?=[^]*(?:text.?button|文字按钮))(?=[^]*(?:icon|图标|reject|拒绝))/i },
    { name: 'decoration pressure', pattern: /(?=[^]*(?:decoration|装饰|gradient|渐变|glass|玻璃))(?=[^]*(?:reject|拒绝|remove|删除))/i },
    { name: 'copy deletion check', pattern: /(?=[^]*(?:copy deletion|文案删除|删除复测))(?=[^]*(?:rerun|重跑|decision|结果|决策))/i }
  ]
  const evidencePattern = /(?:证据|evidence)\s*[:：]\s*(?!无|暂无|待补|需要)(?=\S)[^\n]+|(?:位置|文件|file|line)\s*[:：]?\s*[^\n]*(?:行\s*\d+|line\s*\d+|\.(?:tsx?|jsx?|vue|svelte|css|md|json)(?::\d+)?)/i
  const vaguePraisePattern = /(?:整体很好|高级感很强|看起来很棒|looks great|overall good|very polished)/i
  const strictErrors = requiredEvidence.filter((item) => !item.pattern.test(report)).map((item) => `missing ${item.name}`)
  for (let index = 0; index < 3; index += 1) {
    const current = positions[index]
    const next = positions[index + 1]?.position ?? report.length
    const block = report.slice(current.position, next)
    const noFindings = new RegExp(`^\\s*(?:[-*]\\s*)?(?:无|没有|none|no)\\s*${current.name}\\b`, 'im').test(block)
    if (!noFindings && !evidencePattern.test(block)) {
      strictErrors.push(`${current.name} findings need file, line, or evidence`)
    }
  }
  if (vaguePraisePattern.test(report)) strictErrors.push('remove vague praise and state an actionable finding or evidence')
  if (strictErrors.length > 0) {
    process.stderr.write(`quiet-systems report validation: strict checks failed\n${strictErrors.join('\n')}\n`)
    process.exit(1)
  }
}

process.stdout.write('quiet-systems report validation: valid\n')
