#!/usr/bin/env node

import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-systems-gate-'))
function png(width, height = 1) {
  const data = Buffer.alloc(33)
  data.writeUInt32BE(0x89504e47, 0)
  data.write('PNG', 1, 'ascii')
  data.writeUInt32BE(width, 16)
  data.writeUInt32BE(height, 20)
  data.write('IHDR', 12, 'ascii')
  return data
}
for (const file of ['contract.md', 'direction-a.html', 'direction-b.html', 'inventory.md', 'mapping.md', 'states.md', 'entry.md', 'fixture.json', 'rollback.md']) fs.writeFileSync(path.join(root, file), 'evidence')
fs.writeFileSync(path.join(root, 'screen-390.png'), png(390))
fs.writeFileSync(path.join(root, 'screen-1440.png'), png(1440))
fs.writeFileSync(path.join(root, 'metrics.json'), JSON.stringify({ advisory: true, metrics: [390, 1440].map((width) => ({ width, route: '/editor', titleCount: 1, secondaryCopyCount: 0, textActionCount: 1, iconOnlyActionCount: 2, surfaceCount: 1, pillCount: 0, dividerCount: 1 })) }))
const manifest = path.join(root, 'delivery.json')
fs.writeFileSync(manifest, JSON.stringify({
  phase: 'handoff-ready',
  completedPhases: ['brief-frozen', 'direction-selected', 'interaction-locked', 'data-slice-connected', 'visual-verified', 'handoff-ready'],
  taskId: 'editor-preview',
  contentFixture: 'fixture.json',
  selectedDirection: 'direction-a.html',
  directionSelectionEvidence: 'direction-a.html',
  directionTaskId: 'editor-preview',
  directionContentFixture: 'fixture.json',
  rollbackEvidence: 'rollback.md',
  designContract: 'contract.md',
  directionSamples: ['direction-a.html', 'direction-b.html'],
  interactionInventory: 'inventory.md',
  fieldMapping: 'mapping.md',
  stateMatrix: 'states.md',
  screenshots: { narrow: 'screen-390.png', wide: 'screen-1440.png' },
  screenshotViewports: { narrow: 390, wide: 1440 },
  realEntryPath: 'entry.md',
  runtimeMetrics: 'metrics.json'
}, null, 2))

const script = fileURLToPath(new URL('./validate-delivery-gate.mjs', import.meta.url))
const valid = spawnSync(process.execPath, [script, manifest], { encoding: 'utf8' })
assert.equal(valid.status, 0)
assert.match(valid.stdout, /handoff-ready/)

const briefManifest = path.join(root, 'brief.json')
fs.writeFileSync(briefManifest, JSON.stringify({ phase: 'brief-frozen', completedPhases: ['brief-frozen'], designContract: 'contract.md' }))
const briefResult = spawnSync(process.execPath, [script, briefManifest], { encoding: 'utf8' })
assert.equal(briefResult.status, 0)

const missing = path.join(root, 'missing.json')
fs.writeFileSync(missing, JSON.stringify({ phase: 'handoff-ready', designContract: 'contract.md' }))
const invalid = spawnSync(process.execPath, [script, missing], { encoding: 'utf8' })
assert.equal(invalid.status, 1)
assert.match(invalid.stderr, /directionSamples|interactionInventory|stateMatrix/)

// The gate's job is to refuse a handoff whose runtime metrics cannot be read as
// measurements. A row with a missing counter, a string where a count belongs, a
// negative count, or a route that is not a name is not a measurement — but the
// branch that rejects them and the branch that accepts them look identical from
// the outside unless each shape is fed through, so each shape gets a case here.
const goodMetrics = JSON.parse(fs.readFileSync(path.join(root, 'metrics.json'), 'utf8'))
function handoffWith(name, mutate) {
  const metrics = JSON.parse(JSON.stringify(goodMetrics))
  mutate(metrics.metrics[0])
  fs.writeFileSync(path.join(root, `${name}-metrics.json`), JSON.stringify(metrics))
  const file = path.join(root, `${name}.json`)
  const body = JSON.parse(fs.readFileSync(manifest, 'utf8'))
  body.runtimeMetrics = `${name}-metrics.json`
  fs.writeFileSync(file, JSON.stringify(body))
  return spawnSync(process.execPath, [script, file], { encoding: 'utf8' })
}

const missingCounter = handoffWith('missing-counter', (row) => { delete row.dividerCount })
assert.equal(missingCounter.status, 1)
assert.match(missingCounter.stderr, /runtimeMetrics:route-and-composition/)

const stringCounter = handoffWith('string-counter', (row) => { row.titleCount = '1' })
assert.equal(stringCounter.status, 1)
assert.match(stringCounter.stderr, /runtimeMetrics:route-and-composition/)

const negativeCounter = handoffWith('negative-counter', (row) => { row.pillCount = -1 })
assert.equal(negativeCounter.status, 1)
assert.match(negativeCounter.stderr, /runtimeMetrics:route-and-composition/)

const unnamedRoute = handoffWith('unnamed-route', (row) => { row.route = '' })
assert.equal(unnamedRoute.status, 1)
assert.match(unnamedRoute.stderr, /runtimeMetrics:route-and-composition/)

const numericRoute = handoffWith('numeric-route', (row) => { row.route = 7 })
assert.equal(numericRoute.status, 1)
assert.match(numericRoute.stderr, /runtimeMetrics:route-and-composition/)

const zeroCounters = handoffWith('zero-counters', (row) => {
  for (const key of Object.keys(row)) if (key !== 'route' && key !== 'width') row[key] = 0
})
assert.equal(zeroCounters.status, 0, `zero is a real measurement: ${zeroCounters.stderr}`)

fs.writeFileSync(path.join(root, 'not-advisory-metrics.json'), JSON.stringify({ advisory: false, metrics: goodMetrics.metrics }))
const notAdvisoryBody = JSON.parse(fs.readFileSync(manifest, 'utf8'))
notAdvisoryBody.runtimeMetrics = 'not-advisory-metrics.json'
const notAdvisoryFile = path.join(root, 'not-advisory.json')
fs.writeFileSync(notAdvisoryFile, JSON.stringify(notAdvisoryBody))
const notAdvisory = spawnSync(process.execPath, [script, notAdvisoryFile], { encoding: 'utf8' })
assert.equal(notAdvisory.status, 1)
assert.match(notAdvisory.stderr, /runtimeMetrics:route-and-composition/)

const unreadableMetricsBody = JSON.parse(fs.readFileSync(manifest, 'utf8'))
unreadableMetricsBody.runtimeMetrics = 'absent-metrics.json'
const unreadableMetricsFile = path.join(root, 'unreadable-metrics.json')
fs.writeFileSync(unreadableMetricsFile, JSON.stringify(unreadableMetricsBody))
const unreadableMetrics = spawnSync(process.execPath, [script, unreadableMetricsFile], { encoding: 'utf8' })
assert.equal(unreadableMetrics.status, 1)
assert.match(unreadableMetrics.stderr, /runtimeMetrics:json/)

process.stdout.write('validate-delivery-gate self-test passed\n')
