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

test('the three label forms are the only ones the validator accepts', () => {
  const source = fs.readFileSync(script, 'utf8')
  const enumLine = source.match(/new Set\(\['(text|icon-only|icon\+label)'/)
  assert.ok(enumLine, 'validator no longer declares its label-form enum inline')
  const forms = [...source.matchAll(/\['(text)', '(icon-only)', '(icon\+label)'\]/g)]
  assert.equal(forms.length, 1, 'the label-form enum moved; update the doc and this test together')
  const doc = fs.readFileSync(path.resolve('references/interaction-inventory.md'), 'utf8')
  // `icon-only` appears all over the doc as prose, so the check has to read the
  // one bullet that enumerates the field's accepted values, not the whole file.
  const line = doc.split('\n').find((text) => text.startsWith('- `labelForm`'))
  assert.ok(line, 'the doc no longer states which label forms the field accepts')
  const stated = [...line.matchAll(/`(icon\+label|icon-only|text)`/g)].map((match) => match[1]).sort()
  assert.deepEqual(stated, ['icon+label', 'icon-only', 'text'], 'the doc must list exactly the three accepted label forms')
})

test('blocks a primary action carried only by an icon', () => {
  const result = run({
    ...base,
    actions: [{ label: 'Publish', role: 'primary', labelForm: 'icon-only', recognitionBasis: 'upload arrow', controlGrammar: 'filled icon button', accessibleName: 'Publish run' }]
  })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /labelForm-risk/)
})

test('accepts a primary action that keeps a short label beside its icon', () => {
  const result = run({
    ...base,
    actions: [{ label: 'Publish', role: 'primary', labelForm: 'icon+label', controlGrammar: 'filled button with icon', accessibleName: 'Publish run' }]
  })
  assert.equal(result.status, 0, result.stderr)
})

test('an icon-only navigation action stays allowed with a recognition basis', () => {
  const result = run({
    ...base,
    actions: [{ label: 'Back to runs', role: 'navigation', labelForm: 'icon-only', recognitionBasis: 'chevron pointing left', controlGrammar: 'borderless icon button', accessibleName: 'Back to runs' }]
  })
  assert.equal(result.status, 0, result.stderr)
})

test('the evaluation doc states the label-form rule the validator enforces', () => {
  const doc = fs.readFileSync(path.resolve('docs/evaluation.md'), 'utf8')
  const source = fs.readFileSync(script, 'utf8')
  const risk = source.match(/labelForm === 'icon-only' && \[([^\]]+)\]\.includes\(action\.role\)/)
  assert.ok(risk, 'validator no longer guards icon-only by role')
  const guarded = [...risk[1].matchAll(/'([a-z-]+)'/g)].map((match) => match[1])
  // Read the one bullet that names the inventory test; `primary` and `recovery`
  // appear elsewhere in the doc, so a whole-file search would pass on prose.
  const line = doc.split('\n').find((text) => text.includes('scripts/validate-interaction-inventory.test.mjs'))
  assert.ok(line, 'the doc no longer credits the inventory test')
  const clause = line.slice(0, line.indexOf('不接受'))
  assert.ok(clause.length > 0, 'the doc no longer says which roles refuse an icon-only control')
  const named = [...clause.matchAll(/`([a-z-]+)`/g)].map((match) => match[1]).filter((name) => guarded.includes(name))
  assert.deepEqual([...new Set(named)].sort(), [...guarded].sort(), 'the roles the doc spares from icon-only must be the roles the validator spares')
})

// The doc sentence that tells a reviewer what the validator checks is the only
// place they learn which fields are mandatory. A field the validator enforces
// but the sentence omits reads as optional, and the reviewer omits it.
test('the doc names every field the validator requires', () => {
  const source = fs.readFileSync('scripts/validate-interaction-inventory.mjs', 'utf8')
  const topLine = source.split('\n').find((line) => line.includes("['object', 'goal'"))
  assert.ok(topLine, 'the validator no longer lists its top-level fields')
  const top = [...topLine.matchAll(/'([a-zA-Z]+)'/g)].map((match) => match[1])
  const actionLine = source.split('\n').find((line) => line.includes("['label', 'role'"))
  assert.ok(actionLine, 'the validator no longer lists its per-action fields')
  const perAction = [...actionLine.matchAll(/'([a-zA-Z]+)'/g)].map((match) => match[1])
  const doc = fs.readFileSync('references/interaction-inventory.md', 'utf8')
  const sentence = doc.split('\n').find((line) => line.includes('The validator checks'))
  assert.ok(sentence, 'references/interaction-inventory.md no longer says what the validator checks')
  // Both directions matter. A field the validator enforces but the doc omits
  // reads as optional; a field the doc demands but the validator ignores makes a
  // reviewer hand-write something nobody checks.
  // Both directions matter. A field the validator enforces but the doc omits
  // reads as optional; a field the doc demands but the validator ignores makes a
  // reviewer hand-write something nobody checks. The filter is a fixed field
  // vocabulary rather than the validator's own list, so quietly dropping a field
  // from the validator cannot make the two sides agree by shrinking together.
  const required = new Set([...top, ...perAction, 'recognitionBasis'])
  // The sentence backticks two different kinds of token: the fields it requires,
  // and the label-form values it talks about. Excluding the values (not an
  // unknown-name allowlist) is what makes a field the doc invents visible.
  const notFields = new Set(['text', 'icon-only', 'icon+label'])
  const documented = [...sentence.matchAll(/`([a-zA-Z+-]+)`/g)]
    .map((match) => match[1])
    .filter((name) => !notFields.has(name))
  assert.deepEqual(
    [...new Set(documented)].sort(),
    [...required].sort(),
    'the fields the doc lists must be exactly the fields the validator requires'
  )
  assert.match(sentence, /recognitionBasis.*only for `icon-only`/, 'the doc should say recognitionBasis is conditional')
})
