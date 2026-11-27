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

test('the documented roles are exactly the ones the validator accepts', () => {
  const source = fs.readFileSync(script, 'utf8')
  const enumLine = source.match(/const roles = new Set\(\[([^\]]+)\]\)/)
  assert.ok(enumLine, 'validator no longer declares its role enum in one line')
  const accepted = [...enumLine[1].matchAll(/'([^']+)'/g)].map((match) => match[1]).sort()
  const doc = fs.readFileSync(path.resolve('references/interaction-inventory.md'), 'utf8')
  const section = doc.slice(doc.indexOf('### 2. Classify each action'), doc.indexOf('### 3.'))
  const documented = [...section.matchAll(/^- `([a-z-]+)`/gm)].map((match) => match[1]).sort()
  assert.deepEqual(documented, accepted, 'the role names in the inventory doc disagree with the validator')
})

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

test('accepts a read-only state marker', () => {
  const result = run({
    ...base,
    actions: [{ label: '已满', role: 'state', labelForm: 'text', controlGrammar: 'read-only status text', accessibleName: '已满' }]
  })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /valid \(1 actions\)/)
})

test('blocks destructive actions that are icon-only', () => {
  const result = run({
    ...base,
    actions: [{ label: 'Delete', role: 'destructive', labelForm: 'icon-only', recognitionBasis: 'trash can', controlGrammar: 'borderless icon button', accessibleName: 'Delete run' }]
  })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /labelForm-risk/)
})

test('accepts a destructive action that keeps its text', () => {
  const result = run({
    ...base,
    actions: [{ label: 'Delete run', role: 'destructive', labelForm: 'text', controlGrammar: 'borderless text button', accessibleName: 'Delete run' }]
  })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /valid \(1 actions\)/)
})

test('blocks an icon-only action that never says how it is recognised', () => {
  const result = run({
    ...base,
    actions: [{ label: 'Next', role: 'frequent-compact', labelForm: 'icon-only', controlGrammar: 'borderless icon button', accessibleName: 'Next room' }]
  })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /recognitionBasis/)
})

test('the inventory example in the docs passes the validator', () => {
  const result = spawnSync(process.execPath, [script, path.resolve('examples/interaction-inventory.json')], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /valid \(7 actions\)/)
})
