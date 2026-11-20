import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-systems-fixtures-'))
const validRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-systems-fixtures-valid-'))
process.on('exit', () => {
  fs.rmSync(root, { recursive: true, force: true })
  fs.rmSync(validRoot, { recursive: true, force: true })
})
const script = path.resolve('scripts/validate-fixtures.mjs')
const valid = {
  __source: 'demo',
  state: 'partial-failure',
  items: [{ id: 'one' }],
  failedItems: [{ id: 'two', reason: 'TEMPORARY_UNAVAILABLE', retryable: true }]
}
fs.writeFileSync(path.join(root, 'valid.json'), JSON.stringify(valid))
let result = spawnSync(process.execPath, [script, root], { encoding: 'utf8' })
assert.equal(result.status, 0)
assert.match(result.stdout, /fixture validation: valid/)

fs.writeFileSync(path.join(root, 'invalid.json'), JSON.stringify({ __source: 'demo', state: 'partial-failure', items: [] }))
result = spawnSync(process.execPath, [script, root], { encoding: 'utf8' })
assert.equal(result.status, 1)
assert.match(result.stderr, /requires at least one visible item/)

fs.writeFileSync(path.join(root, 'contradictory-empty.json'), JSON.stringify({ __source: 'demo', state: 'empty', items: [{ id: 'unexpected' }] }))
result = spawnSync(process.execPath, [script, root], { encoding: 'utf8' })
assert.equal(result.status, 1)
assert.match(result.stderr, /empty state requires an empty items array/)

fs.writeFileSync(path.join(root, 'contradictory-recovered.json'), JSON.stringify({ __source: 'demo', state: 'recovered', items: [] }))
result = spawnSync(process.execPath, [script, root], { encoding: 'utf8' })
assert.equal(result.status, 1)
assert.match(result.stderr, /recovered state requires at least one item/)

fs.writeFileSync(path.join(root, 'malformed-failure.json'), JSON.stringify({ __source: 'demo', state: 'partial-failure', items: [{ id: 'visible' }], failedItems: [{ id: 'x' }] }))
result = spawnSync(process.execPath, [script, root], { encoding: 'utf8' })
assert.equal(result.status, 1)
assert.match(result.stderr, /failedItems\[0\] requires id, reason, and retryable/)

fs.writeFileSync(path.join(root, 'invalid-error-items.json'), JSON.stringify({ __source: 'demo', state: 'error', items: [], error: { code: 'FAILED', retryable: true } }))
result = spawnSync(process.execPath, [script, root], { encoding: 'utf8' })
assert.equal(result.status, 1)
assert.match(result.stderr, /error state must use items: null/)

fs.writeFileSync(path.join(root, 'malformed-error.json'), JSON.stringify({ __source: 'demo', state: 'error', items: null, error: { code: 'FAILED' } }))
result = spawnSync(process.execPath, [script, root], { encoding: 'utf8' })
assert.equal(result.status, 1)
assert.match(result.stderr, /error object requires code and retryable/)

fs.writeFileSync(path.join(root, 'missing-permission-message.json'), JSON.stringify({ __source: 'demo', state: 'permission-limited', items: [] }))
result = spawnSync(process.execPath, [script, root], { encoding: 'utf8' })
assert.equal(result.status, 1)
assert.match(result.stderr, /permission-limited requires a message/)

fs.writeFileSync(path.join(validRoot, 'valid-permission.json'), JSON.stringify({ __source: 'demo', state: 'permission-limited', items: [{ id: 'summary' }], message: '你可以查看摘要，但没有权限查看详细记录。' }))
result = spawnSync(process.execPath, [script, validRoot], { encoding: 'utf8' })
assert.equal(result.status, 0)

fs.writeFileSync(path.join(root, 'non-array-failures.json'), JSON.stringify({ __source: 'demo', state: 'partial-failure', items: [{ id: 'visible' }], failedItems: {} }))
result = spawnSync(process.execPath, [script, root], { encoding: 'utf8' })
assert.equal(result.status, 1)
assert.match(result.stderr, /requires at least one failedItems entry/)

fs.writeFileSync(path.join(root, 'broken.json'), '{')
result = spawnSync(process.execPath, [script, root], { encoding: 'utf8' })
assert.equal(result.status, 1)
assert.match(result.stderr, /invalid JSON or unreadable file/)

console.log('validate-fixtures self-test passed')
