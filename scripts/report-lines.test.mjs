// references/report-validation.md tells a reader which trailing lines the review
// may print. Each name it quotes has to exist in the scanner, spelled the same
// way, because a reader greps for the exact string they were shown. A line the
// doc names and the script never prints is a worse defect than a missing line:
// it teaches someone to look for output that cannot appear.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const doc = fs.readFileSync(path.join('references', 'report-validation.md'), 'utf8')
const source = fs.readFileSync(path.join('scripts', 'ui-guard-review.mjs'), 'utf8')

// The trailing lines the document promises, and what they mean.
const lines = [
  ['reviewed no files', 'the scan read nothing, so a clean summary would be a lie'],
  ['matched the baseline', 'findings were frozen by --baseline'],
  ['scan incomplete', 'a read error means the coverage gap is not the same as clean']
]

for (const [line, meaning] of lines) {
  test(`the document and the scanner agree on "${line}"`, () => {
    assert.ok(doc.includes(line), `references/report-validation.md no longer mentions "${line}" (${meaning})`)
    assert.ok(source.includes(line), `references/report-validation.md promises "${line}" but scripts/ui-guard-review.mjs never prints it`)
  })
}

test('the documented first-past-the-post order still matches the scanner', () => {
  // Exit code 2 wins over 1 wins over 0: a coverage gap is not a review verdict.
  const docOrder = doc.match(/读取失败是覆盖缺口，退 `2`/)
  assert.ok(docOrder, 'references/report-validation.md no longer explains which code an incomplete scan returns')
  assert.match(source, /incomplete \? 2 :/, 'the scanner no longer ranks an incomplete scan above findings')
})

test('a clean pass over zero files is documented as distinct from a real clean pass', () => {
  assert.match(doc, /只有 0 个文件的“干净”和真正干净不是同一个答案/)
  assert.match(source, /reviewed no files — check the root path/, 'the zero-file hint lost its advice on what to fix')
})
