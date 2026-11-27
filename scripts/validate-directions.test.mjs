// validate-directions guards the comparison brief: two or three samples that
// answer the same question, each field filled once, no duplicated structure.
// It was the only script in the repo with a documented contract and no test.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

const script = path.resolve('scripts/validate-directions.mjs')

const fields = [
  ['Task and object', 'Pick one room for tonight'],
  ['Assumed fields and states', 'Name, seats, availability'],
  ['Reading and action order', 'Scan the row, then open'],
  ['Density and navigation', 'Four rows, one scroll'],
  ['Primary action', 'Join'],
  ['Contextual actions', 'Preview'],
  ['Tradeoff', 'Fewer rooms visible'],
  ['Decision supported', 'Which room is free now']
]

function sample(overrides = {}) {
  return fields.map(([key, value]) => `- ${key}: ${overrides[key] ?? value}`).join('\n') + '\n'
}

function run(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-guard-directions-'))
  const paths = files.map((content, index) => {
    const file = path.join(dir, `sample-${index}.md`)
    fs.writeFileSync(file, content)
    return file
  })
  return { ...spawnSync(process.execPath, [script, ...paths], { encoding: 'utf8' }), dir }
}

test('accepts two samples that answer the same brief differently', () => {
  const result = run([
    sample(),
    sample({ 'Reading and action order': 'Compare the seats, then the price', 'Density and navigation': 'Two columns, no scroll' })
  ])
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout, '')
})

test('accepts three samples', () => {
  const result = run([
    sample(),
    sample({ 'Reading and action order': 'Read the schedule first', 'Density and navigation': 'One card per screen' }),
    sample({ 'Reading and action order': 'Start from the map', 'Density and navigation': 'Map with a sheet' })
  ])
  assert.equal(result.status, 0, result.stderr)
})

test('rejects a single sample, because one sample cannot be compared', () => {
  const result = run([sample()])
  assert.equal(result.status, 2)
  assert.match(result.stderr, /Usage: node scripts\/validate-directions\.mjs/)
})

test('rejects a missing field', () => {
  const result = run([
    sample().replace('- Tradeoff: Fewer rooms visible\n', ''),
    sample({ 'Reading and action order': 'Compare the seats, then the price', 'Density and navigation': 'Two columns, no scroll' })
  ])
  assert.equal(result.status, 1)
  assert.match(result.stderr, /expected one filled field for Tradeoff/)
})

test('rejects an empty field', () => {
  const result = run([
    sample({ Tradeoff: '' }),
    sample({ 'Reading and action order': 'Compare the seats, then the price', 'Density and navigation': 'Two columns, no scroll' })
  ])
  assert.equal(result.status, 1)
  assert.match(result.stderr, /expected one filled field for Tradeoff/)
})

test('rejects a field filled twice', () => {
  const result = run([
    sample() + '- Tradeoff: also fewer prices\n',
    sample({ 'Reading and action order': 'Compare the seats, then the price', 'Density and navigation': 'Two columns, no scroll' })
  ])
  assert.equal(result.status, 1)
  assert.match(result.stderr, /expected one filled field for Tradeoff/)
})

test('rejects samples that were copied instead of varied', () => {
  const result = run([sample(), sample()])
  assert.equal(result.status, 1)
  assert.match(result.stderr, /Repeated reading order and navigation description/)
})

test('rejects samples written against different briefs', () => {
  const result = run([
    sample(),
    sample({ 'Task and object': 'Book a table for six', 'Reading and action order': 'Compare the seats, then the price', 'Density and navigation': 'Two columns, no scroll' })
  ])
  assert.equal(result.status, 1)
  assert.match(result.stderr, /Use the same comparison brief for Task and object/)
})

test('reports an unreadable sample as a usage error', () => {
  const result = spawnSync(process.execPath, [script, 'missing-a.md', 'missing-b.md'], { encoding: 'utf8' })
  assert.equal(result.status, 2)
  assert.match(result.stderr, /ENOENT/)
})

test('the command printed in examples/direction-samples/README.md still runs green', () => {
  const readme = fs.readFileSync(path.join('examples', 'direction-samples', 'README.md'), 'utf8')
  const quoted = readme.match(/node scripts\/validate-directions\.mjs ((?:\S+\*?-first\.md|\S+)\s+\S+\.md)/)
  assert.ok(quoted, 'examples/direction-samples/README.md no longer shows how to run the check')
  const args = quoted[1].split(/\s+/).flatMap((argument) => {
    if (!argument.includes('*')) return [argument]
    const dir = argument.slice(0, argument.lastIndexOf('/'))
    return fs.readdirSync(dir).filter((name) => name.endsWith('-first.md')).map((name) => `${dir}/${name}`)
  })
  const result = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
})
