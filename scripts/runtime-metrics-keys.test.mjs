// The delivery gate refuses a handoff whose runtime metrics lack a counter. The
// counters come from scripts/measure-composition.mjs, which is the only producer
// of that file. If the gate asks for a name the producer never writes, every
// handoff is blocked by a metric nobody can supply — the gate looks strict while
// being impossible to satisfy.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import test from 'node:test'
import { spawnSync } from 'node:child_process'

const gate = fs.readFileSync('scripts/validate-delivery-gate.mjs', 'utf8')
const measure = fs.readFileSync('scripts/measure-composition.mjs', 'utf8')

function gateKeys() {
  const start = gate.indexOf('const compositionKeys = [')
  assert.ok(start > 0, 'the gate no longer lists runtime composition keys')
  const line = gate.slice(start, gate.indexOf(']', start))
  return [...line.matchAll(/'([A-Za-z]+)'/g)].map((match) => match[1]).sort()
}

function producedKeys() {
  // measure-composition builds its row inside page.evaluate; every `name:` in the
  // returned object literal is a counter a handoff can actually carry.
  const start = measure.indexOf('return {')
  const end = measure.indexOf('metrics.push({ width')
  assert.ok(start > 0 && end > start, 'measure-composition.mjs no longer returns a metrics row')
  return [...measure.slice(start, end).matchAll(/^\s{8}([A-Za-z]+):/gm)].map((match) => match[1])
    .filter((key) => key !== 'bodyText' && key !== 'route')
    .sort()
}

test('the gate asks for exactly the counters the measuring script emits', () => {
  const asked = gateKeys()
  const produced = producedKeys()
  assert.ok(produced.length >= 7, `only ${produced.length} counters found in the producer`)
  assert.deepEqual(asked, produced, 'the gate and the measuring script disagree about counter names')
})

test('a handoff carrying the measuring script output passes the metrics check', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rmk-'))
  for (const file of ['contract.md', 'a.html', 'b.html', 'inventory.md', 'mapping.md', 'states.md', 'entry.md', 'fixture.json', 'rollback.md']) {
    fs.writeFileSync(path.join(root, file), 'evidence')
  }
  const row = { route: '/editor', titleCount: 1, secondaryCopyCount: 0, textActionCount: 1, iconOnlyActionCount: 2, surfaceCount: 1, pillCount: 0, dividerCount: 1 }
  fs.writeFileSync(path.join(root, 'metrics.json'), JSON.stringify({ advisory: true, metrics: [390, 1440].map((width) => ({ ...row, width })) }))
  const manifest = {
    phase: 'handoff-ready',
    completedPhases: ['brief-frozen', 'direction-selected', 'interaction-locked', 'data-slice-connected', 'visual-verified', 'handoff-ready'],
    taskId: 'editor-preview',
    contentFixture: 'fixture.json',
    selectedDirection: 'a.html',
    directionSamples: ['a.html'],
    runtimeMetrics: 'metrics.json'
  }
  const manifestPath = path.join(root, 'delivery.json')
  fs.writeFileSync(manifestPath, JSON.stringify(manifest))
  const run = spawnSync(process.execPath, [path.resolve('scripts/validate-delivery-gate.mjs'), manifestPath], { encoding: 'utf8' })
  assert.doesNotMatch(run.stdout + run.stderr, /runtimeMetrics/, 'the gate rejected metrics written in the producer shape')
})

test('one missing counter still blocks, so the check is not vacuous', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rmk2-'))
  for (const file of ['contract.md', 'a.html', 'inventory.md', 'mapping.md', 'states.md', 'entry.md', 'fixture.json', 'rollback.md']) {
    fs.writeFileSync(path.join(root, file), 'evidence')
  }
  const row = { route: '/editor', titleCount: 1, secondaryCopyCount: 0, textActionCount: 1, surfaceCount: 1, pillCount: 0, dividerCount: 1 }
  fs.writeFileSync(path.join(root, 'metrics.json'), JSON.stringify({ advisory: true, metrics: [390, 1440].map((width) => ({ ...row, width })) }))
  const manifest = {
    phase: 'handoff-ready',
    completedPhases: ['brief-frozen', 'direction-selected', 'interaction-locked', 'data-slice-connected', 'visual-verified', 'handoff-ready'],
    taskId: 'editor-preview',
    contentFixture: 'fixture.json',
    selectedDirection: 'a.html',
    directionSamples: ['a.html'],
    runtimeMetrics: 'metrics.json'
  }
  const manifestPath = path.join(root, 'delivery.json')
  fs.writeFileSync(manifestPath, JSON.stringify(manifest))
  const run = spawnSync(process.execPath, [path.resolve('scripts/validate-delivery-gate.mjs'), manifestPath], { encoding: 'utf8' })
  assert.match(run.stdout + run.stderr, /runtimeMetrics:route-and-composition/)
})
