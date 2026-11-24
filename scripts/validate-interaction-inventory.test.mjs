import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

const script = path.resolve('scripts/validate-interaction-inventory.mjs')
const base = {
  object: 'run record',
  goal: 'retry one failed run',
  result: 'run completes',
  recoveryPath: 'retry the same record',
  actions: [{ label: 'Retry', role: 'recovery', labelForm: 'icon+label', controlGrammar: 'borderless icon button', accessibleName: 'Retry run' }]
}

function run(value) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-guard-inventory-'))
  const file = path.join(root, 'inventory.json')
  fs.writeFileSync(file, JSON.stringify(value))
  return spawnSync(process.execPath, [script, file], { encoding: 'utf8' })
}

test('accepts a complete interaction inventory', () => {
  const result = run(base)
  assert.equal(result.status, 0)
  assert.match(result.stdout, /inventory: valid/)
})

test('blocks an action without interaction semantics', () => {
  const result = run({ ...base, actions: [{ label: 'Retry', role: 'unknown' }] })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /controlGrammar|role-enum/)
})

test('blocks recovery actions that are icon-only', () => {
  const result = run({ ...base, actions: [{ label: 'Retry', role: 'recovery', labelForm: 'icon-only', recognitionBasis: 'familiar retry symbol', controlGrammar: 'borderless icon button', accessibleName: 'Retry run' }] })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /labelForm-risk/)
})
