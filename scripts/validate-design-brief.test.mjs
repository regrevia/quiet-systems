import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

const script = path.resolve('scripts/validate-design-brief.mjs')

function run(value) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-guard-brief-'))
  const file = path.join(root, 'design-brief.json')
  fs.writeFileSync(file, JSON.stringify(value))
  return spawnSync(process.execPath, [script, file], { encoding: 'utf8' })
}

const base = {
  mode: 'new',
  taskId: 'review-run',
  audience: 'operator',
  object: 'run record',
  successCondition: 'operator can retry one failed run',
  visualDirection: 'quiet single-surface workspace',
  contentFixture: 'fixtures/run.json',
  loadedReferences: [
    { path: 'references/interface.md', reason: 'control grammar and hierarchy' },
    { path: 'references/copy-constraints.md', reason: 'visible copy deletion test' }
  ],
  untrustedInputs: ['generated screenshot'],
  knownUnknowns: ['production error payload']
}

test('accepts a complete brief', () => {
  const result = run(base)
  assert.equal(result.status, 0)
  assert.match(result.stdout, /design brief: valid/)
})

test('blocks high fidelity without the design contract', () => {
  const result = run({ ...base, visualDirection: '' })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /visualDirection/)
})

test('blocks context entries without a named reason', () => {
  const result = run({ ...base, loadedReferences: [{ path: 'references/interface.md' }] })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /loadedReferences\[0\]:reason/)
})

test('requires reused evidence for focused repairs', () => {
  const result = run({ ...base, mode: 'repair', existingEvidence: [] })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /existingEvidence/)
})

test('limits accidental context loading', () => {
  const references = Array.from({ length: 7 }, (_, index) => ({ path: `references/${index}.md`, reason: 'named decision' }))
  const result = run({ ...base, loadedReferences: references })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /loadedReferences:max-6/)
})
