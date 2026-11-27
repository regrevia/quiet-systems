// A script with a documented contract and no test is a promise nobody checks.
// This lists the scripts that cannot be tested without Chrome — they drive a real
// page — so the gap is declared instead of forgotten. Anything else must have a
// sibling test file, and the exemption list must not name a script that has one.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const exempt = new Map([
  ['capture-design-pair.mjs', 'launches Chrome and writes screenshots'],
  ['capture-preview.mjs', 'launches Chrome for every viewport width'],
  ['measure-composition.mjs', 'measures a running page over the network'],
  ['quiet-systems-review.mjs', 'compatibility entry point, asserted byte for byte from ui-guard-cli.test.mjs'],
  ['verify-control-adaptation.mjs', 'reads computed style from a running page'],
  ['verify-copy-contract.mjs', 'reads a running page'],
  ['verify-record-reflow.mjs', 'drives a running page through the record lifecycle'],
  ['verify-sample-copy.mjs', 'drives the sample page in Chrome'],
  ['verify-sample-motion.mjs', 'drives the sample page in Chrome'],
  ['verify-sample-save.mjs', 'drives the sample page in Chrome'],
  ['verify-tab-switch.mjs', 'drives a running page']
])

const scripts = fs.readdirSync('scripts').filter((name) => name.endsWith('.mjs') && !name.endsWith('.test.mjs'))

test('every script either has a sibling test or a declared reason it cannot have one', () => {
  const untested = scripts.filter((name) => !fs.existsSync(path.join('scripts', name.replace(/\.mjs$/, '.test.mjs'))))
  const undeclared = untested.filter((name) => !exempt.has(name))
  assert.deepEqual(undeclared, [], 'these scripts have no test and no declared reason: ' + undeclared.join(', '))
})

test('the exemption list does not outlive the gap it describes', () => {
  for (const name of exempt.keys()) {
    assert.ok(scripts.includes(name), `the exemption list names ${name}, which is not a script any more`)
    assert.ok(!fs.existsSync(path.join('scripts', name.replace(/\.mjs$/, '.test.mjs'))), `${name} now has a test, so drop it from the exemption list`)
  }
})

test('the browser-driven checks say in their own header that they need a page', () => {
  for (const [name, reason] of exempt) {
    if (reason.startsWith('compatibility')) continue
    const source = fs.readFileSync(path.join('scripts', name), 'utf8')
    assert.match(source, /playwright|chromium|page\./, `${name} is listed as browser-driven but reads no page`)
  }
})
