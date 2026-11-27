// A reviewer fills in composition metrics by name. Three hand-written lists decide
// what those names are: the reviewer contract, the validation table, and the
// alternation the report checker accepts. None of them is generated, so each can
// drift from the counters the runtime measurement actually produces — and a
// reviewer then reports a number for a field that does not exist.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const measure = fs.readFileSync('scripts/measure-composition.mjs', 'utf8')
const gate = fs.readFileSync('scripts/validate-delivery-gate.mjs', 'utf8')
const checker = fs.readFileSync('scripts/validate-review-report.mjs', 'utf8')
const contract = fs.readFileSync('reviewer-contract.md', 'utf8')
const table = fs.readFileSync('references/report-validation.md', 'utf8')
const delivery = fs.readFileSync('references/delivery.md', 'utf8')

// The name a report uses for each counter the runtime measurement produces.
const reportName = {
  titleCount: 'title',
  secondaryCopyCount: 'secondary',
  textActionCount: 'text-action',
  iconOnlyActionCount: 'icon-only-action',
  surfaceCount: 'surface',
  pillCount: 'pill',
  dividerCount: 'separator'
}

function producedCounters() {
  const start = measure.indexOf('return {')
  const end = measure.indexOf('metrics.push({ width')
  assert.ok(start > 0 && end > start, 'measure-composition.mjs no longer returns a metrics row')
  return measure.slice(start, end)
    .match(/^\s{8}([A-Za-z]+):/gm)
    .map((line) => line.trim().replace(':', ''))
    .filter((key) => key !== 'bodyText' && key !== 'route')
    .sort()
}

function checkerPattern() {
  const line = checker.split('\n').find((text) => text.includes("name: 'composition metrics'"))
  assert.ok(line, 'the checker no longer requires composition metrics')
  return line.slice(line.indexOf('/'), line.lastIndexOf('/'))
}

test('every counter the measurement produces has a report name', () => {
  assert.deepEqual(Object.keys(reportName).sort(), producedCounters())
  assert.equal(new Set(Object.values(reportName)).size, 7, 'seven names, one per counter')
})

test('the checker accepts all seven documented metric names', () => {
  const pattern = checkerPattern()
  const missing = Object.values(reportName).filter((name) => {
    const flexible = name.replaceAll('-', '.?')
    return !pattern.includes(name) && !pattern.includes(flexible)
  })
  assert.deepEqual(missing, [], 'a report name is documented but the checker rejects it: ' + missing.join(', '))
})

test('the contract and the validation table name the same seven counters', () => {
  const contractLine = contract.split('\n').find((text) => text.startsWith('- composition metrics'))
  assert.ok(contractLine, 'the contract no longer explains composition metrics')
  const tableRow = table.split('\n').find((text) => text.startsWith('| composition metrics |'))
  assert.ok(tableRow, 'references/report-validation.md dropped the composition metrics row')
  for (const name of Object.values(reportName)) {
    assert.ok(contractLine.includes(name), `the contract does not name ${name}`)
    assert.ok(tableRow.includes(name), `the validation table does not name ${name}`)
  }
  assert.match(contractLine, /七项/, 'the contract should say how many counters a report gives')
})

test('the validation table lists exactly seven counters', () => {
  const tableRow = table.split('\n').find((text) => text.startsWith('| composition metrics |'))
  const listed = tableRow.split('|')[2].split('、').length
  assert.equal(listed, 7, `the table row lists ${listed} counters`)
})

test('the delivery gate demands the same seven counters the report names', () => {
  const start = gate.indexOf('const compositionKeys = [')
  assert.ok(start > 0, 'the gate no longer lists runtime composition keys')
  const asked = [...gate.slice(start, gate.indexOf(']', start)).matchAll(/'([A-Za-z]+)'/g)].map((match) => match[1])
  assert.deepEqual(asked.sort(), Object.keys(reportName).sort())
})

test('the delivery doc names the same seven counters as the contract', () => {
  const line = delivery.split('\n').find((text) => text.includes('The metrics must include'))
  assert.ok(line, 'references/delivery.md no longer lists the metrics a handoff must carry')
  for (const name of Object.values(reportName)) {
    assert.ok(line.includes(name), `references/delivery.md calls a counter something other than ${name}`)
  }
  // Handing the same measurement two spellings lets a reviewer report the one
  // the checker rejects, so the alternative wording is refused outright.
  for (const wrong of ['divider', 'secondary-copy']) {
    assert.equal(line.includes(wrong), false, `references/delivery.md renames a counter to ${wrong}`)
  }
})

test('the validation table counts exactly the hand-written lists that carry the names', () => {
  const line = table.split('\n').find((text) => text.includes('手写清单'))
  assert.ok(line, 'references/report-validation.md no longer says how many lists carry the names')
  const numerals = { 二: 2, 三: 3, 四: 4, 五: 5, 六: 6 }
  const stated = [...line.matchAll(/([二三四五六])份手写清单/g)].map((match) => numerals[match[1]])
  assert.equal(stated.length, 1, 'the table states its list count more than once, or in digits')
  const docs = ['references/report-validation.md', 'references/delivery.md', 'reviewer-contract.md']
  const carriers = docs.filter((file) => {
    const text = fs.readFileSync(file, 'utf8')
    return Object.values(reportName).every((name) => text.includes(name))
  })
  assert.deepEqual(carriers, docs, 'a doc the table credits no longer names all seven counters')
  // The checker spells the hyphenated names as an alternation (`text.?action`),
  // so it counts as a carrier only if its pattern accepts all seven.
  const pattern = checkerPattern()
  const checkerCarries = Object.values(reportName).every((name) => pattern.includes(name) || pattern.includes(name.replaceAll('-', '.?')))
  assert.equal(checkerCarries, true, 'the checker no longer accepts all seven names')
  const total = carriers.length + 1
  assert.equal(stated[0], total, `the table says ${stated[0]} lists, ${total} places carry the names`)
})
