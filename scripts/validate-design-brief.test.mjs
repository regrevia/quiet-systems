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
  for (const entry of value.existingEvidence ?? []) {
    if (typeof entry.path === 'string' && !/^(?:https?:|plugin:|\/)/i.test(entry.path)) {
      const evidencePath = path.join(root, entry.path)
      fs.mkdirSync(path.dirname(evidencePath), { recursive: true })
      fs.writeFileSync(evidencePath, 'evidence')
    }
  }
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
  untrustedInputs: [{ source: 'generated screenshot', reason: 'visual output is not runtime evidence' }],
  knownUnknowns: [{ source: 'production error payload', reason: 'backend fixture is not connected' }]
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
  const result = run({ ...base, mode: 'repair', existingEvidence: [{ path: 'evidence/contract.md', type: 'design-contract', reason: 'reuse the current control grammar' }] })
  assert.equal(result.status, 0)
})

test('blocks repair evidence without a reusable reason', () => {
  const result = run({ ...base, mode: 'repair', existingEvidence: [{ path: 'evidence/contract.md', type: 'design-contract' }] })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /existingEvidence\[0\]:reason/)
})

test('limits accidental context loading', () => {
  const references = Array.from({ length: 7 }, (_, index) => ({ path: `references/${index}.md`, reason: 'named decision' }))
  const result = run({ ...base, loadedReferences: references })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /loadedReferences:max-6/)
})

test('allows exploration without a selected direction', () => {
  const result = run({ ...base, mode: 'exploration', visualDirection: 'undecided', contentFixture: 'exploration' })
  assert.equal(result.status, 0)
})

test('allows extra references only with an explicit decision record', () => {
  const references = Array.from({ length: 7 }, (_, index) => ({ path: `references/${index}.md`, reason: 'named decision' }))
  const blocked = run({ ...base, loadedReferences: references })
  assert.equal(blocked.status, 1)
  const allowed = run({ ...base, loadedReferences: references, additionalReferenceDecisions: ['compare platform control semantics'], reviewRecord: 'review.md' })
  assert.equal(allowed.status, 0)
})

test('requires source and reason for uncertain inputs', () => {
  const result = run({ ...base, untrustedInputs: ['generated screenshot'] })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /untrustedInputs\[0\]:source/)
})
