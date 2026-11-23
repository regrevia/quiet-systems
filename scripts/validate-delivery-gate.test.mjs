#!/usr/bin/env node

import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-systems-gate-'))
for (const file of ['contract.md', 'direction-a.html', 'direction-b.html', 'inventory.md', 'mapping.md', 'states.md', 'screen-390.png', 'screen-1440.png', 'entry.md', 'fixture.json', 'rollback.md']) fs.writeFileSync(path.join(root, file), 'evidence')
fs.writeFileSync(path.join(root, 'metrics.json'), JSON.stringify({ advisory: true, metrics: [{ width: 390, route: '/editor' }, { width: 1440, route: '/editor' }] }))
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

process.stdout.write('validate-delivery-gate self-test passed\n')
