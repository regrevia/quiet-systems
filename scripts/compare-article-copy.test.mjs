// compare-article-copy exists so a rendered page is compared with the approved
// copy paragraph by paragraph instead of by eye. Its exit codes carry the
// meaning: 1 is "this paragraph differs", 2 is "the comparison never ran".
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

const script = path.resolve('scripts/compare-article-copy.mjs')

function pair(approved, rendered) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-guard-copy-'))
  const approvedPath = path.join(dir, 'approved.txt')
  const renderedPath = path.join(dir, 'rendered.txt')
  fs.writeFileSync(approvedPath, approved)
  fs.writeFileSync(renderedPath, rendered)
  return spawnSync(process.execPath, [script, approvedPath, renderedPath], { encoding: 'utf8' })
}

test('accepts copy that renders unchanged', () => {
  const text = 'Slow fire cooks the sauce.\n\nThe second paragraph stays short.\n'
  const result = pair(text, text)
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout, '')
})

test('accepts trailing whitespace and CRLF line endings', () => {
  const result = pair('One line.\n', '\r\nOne line.  \r\n\r\n')
  assert.equal(result.status, 0, result.stderr)
})

test('names the paragraph that changed, with both versions', () => {
  const result = pair('First.\n\nSecond.\n', 'First.\n\nSecond paragraph, rewritten.\n')
  assert.equal(result.status, 1)
  assert.deepEqual(JSON.parse(result.stderr.trim()), { paragraph: 2, expected: 'Second.', rendered: 'Second paragraph, rewritten.' })
})

test('names a paragraph the rendered page dropped', () => {
  const result = pair('First.\n\nSecond.\n', 'First.\n')
  assert.equal(result.status, 1)
  assert.deepEqual(JSON.parse(result.stderr.trim()), { paragraph: 2, expected: 'Second.', rendered: null })
})

test('names a paragraph the rendered page added', () => {
  const result = pair('First.\n', 'First.\n\nAn extra line nobody approved.\n')
  assert.equal(result.status, 1)
  assert.deepEqual(JSON.parse(result.stderr.trim()), { paragraph: 2, expected: null, rendered: 'An extra line nobody approved.' })
})

test('reports every differing paragraph, not just the first', () => {
  const result = pair('One.\n\nTwo.\n', 'First.\n\nSecond.\n')
  assert.equal(result.status, 1)
  assert.equal(result.stderr.trim().split('\n').length, 2)
})

test('refuses to compare against an empty approved file', () => {
  const result = pair('   \n\n', 'Anything at all.\n')
  assert.equal(result.status, 2)
  assert.match(result.stderr, /The approved copy is empty/)
})

test('refuses to run with one argument', () => {
  const result = spawnSync(process.execPath, [script, 'only-approved.txt'], { encoding: 'utf8' })
  assert.equal(result.status, 2)
  assert.match(result.stderr, /Usage: node compare-article-copy\.mjs approved\.txt rendered\.txt/)
})
