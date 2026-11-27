#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const manifestPath = process.argv.slice(2).find((argument) => !argument.startsWith('--'))
if (!manifestPath) {
  process.stderr.write('usage: node scripts/validate-delivery-gate.mjs path/to/delivery.json\n')
  process.exit(2)
}

let manifest
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
} catch (error) {
  process.stderr.write(`quiet-systems delivery gate: cannot read manifest (${error.message})\n`)
  process.exit(2)
}

const phases = ['brief-frozen', 'direction-selected', 'interaction-locked', 'data-slice-connected', 'visual-verified', 'handoff-ready']
const phaseIndex = phases.indexOf(manifest.phase)
const root = path.dirname(path.resolve(manifestPath))
const missing = []
if (phaseIndex < 0) missing.push('phase')
const requiredByPhase = [
  ['designContract'],
  ['designContract', 'directionSamples', 'selectedDirection', 'directionSelectionEvidence', 'taskId', 'contentFixture', 'directionTaskId', 'directionContentFixture'],
  ['designContract', 'directionSamples', 'selectedDirection', 'directionSelectionEvidence', 'taskId', 'contentFixture', 'directionTaskId', 'directionContentFixture', 'interactionInventory'],
  ['designContract', 'directionSamples', 'selectedDirection', 'directionSelectionEvidence', 'taskId', 'contentFixture', 'directionTaskId', 'directionContentFixture', 'interactionInventory', 'fieldMapping', 'stateMatrix', 'realEntryPath'],
  ['designContract', 'directionSamples', 'selectedDirection', 'directionSelectionEvidence', 'taskId', 'contentFixture', 'directionTaskId', 'directionContentFixture', 'interactionInventory', 'fieldMapping', 'stateMatrix', 'realEntryPath', 'screenshots', 'screenshotViewports', 'runtimeMetrics'],
  ['designContract', 'directionSamples', 'selectedDirection', 'directionSelectionEvidence', 'taskId', 'contentFixture', 'directionTaskId', 'directionContentFixture', 'interactionInventory', 'fieldMapping', 'stateMatrix', 'realEntryPath', 'screenshots', 'screenshotViewports', 'runtimeMetrics', 'rollbackEvidence']
]
const requiredNames = phaseIndex >= 0 ? requiredByPhase[phaseIndex] : []
if (!Array.isArray(manifest.completedPhases) || manifest.completedPhases.length !== phaseIndex + 1 || manifest.completedPhases.some((phase, index) => phase !== phases[index])) missing.push('completedPhases:contiguous')
const required = requiredNames.map((name) => [name, manifest[name]])
const pathFields = new Set(['designContract', 'interactionInventory', 'fieldMapping', 'stateMatrix', 'contentFixture', 'realEntryPath', 'runtimeMetrics', 'rollbackEvidence', 'directionSelectionEvidence'])
function imageDimensions(file) {
  const data = fs.readFileSync(file)
  if (data.length >= 24 && data.readUInt32BE(0) === 0x89504e47 && data.toString('ascii', 1, 4) === 'PNG') return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) }
  if (data.length >= 4 && data[0] === 0xff && data[1] === 0xd8) {
    let offset = 2
    while (offset + 9 < data.length) {
      if (data[offset] !== 0xff) { offset += 1; continue }
      const marker = data[offset + 1]
      const length = data.readUInt16BE(offset + 2)
      if (marker >= 0xc0 && marker <= 0xc3) return { height: data.readUInt16BE(offset + 5), width: data.readUInt16BE(offset + 7) }
      if (length < 2) break
      offset += 2 + length
    }
  }
  return null
}
for (const [name, value] of required) {
  if (!value) {
    missing.push(name)
    continue
  }
  if (name === 'directionSamples' || name === 'screenshots') continue
  if (pathFields.has(name)) {
    if (typeof value !== 'string' || !value.trim()) missing.push(`${name}:path`)
    else {
      const resolved = path.resolve(root, value)
      if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) missing.push(`${name}:file`)
    }
  }
}
if (requiredNames.includes('directionSamples')) {
  if (!Array.isArray(manifest.directionSamples) || manifest.directionSamples.length < 2) missing.push('directionSamples')
  else for (const sample of manifest.directionSamples) if (!fs.existsSync(path.resolve(root, sample))) missing.push(`directionSamples:file:${sample}`)
}
if (requiredNames.includes('screenshots') && (!manifest.screenshots?.narrow || !manifest.screenshots?.wide)) missing.push('screenshots:390-and-1440')
else {
  for (const [name, expectedWidth] of [['narrow', 390], ['wide', 1440]]) {
    const file = manifest.screenshots?.[name]
    if (!file) continue
    const screenshotPath = path.resolve(root, file)
    if (!/\.(?:png|jpe?g)$/i.test(file) || !fs.existsSync(screenshotPath) || fs.statSync(screenshotPath).size === 0) missing.push(`screenshots:${name}:${expectedWidth}`)
    else {
      try {
        const dimensions = imageDimensions(screenshotPath)
        if (!dimensions || dimensions.width !== expectedWidth || dimensions.height < 1) missing.push(`screenshots:${name}:dimensions`)
      } catch { missing.push(`screenshots:${name}:dimensions`) }
    }
  }
}
if (requiredNames.includes('screenshotViewports') && (!manifest.screenshotViewports || manifest.screenshotViewports.narrow !== 390 || manifest.screenshotViewports.wide !== 1440)) missing.push('screenshotViewports:390-and-1440')
if (requiredNames.includes('runtimeMetrics')) {
  try {
    const metrics = JSON.parse(fs.readFileSync(path.resolve(root, manifest.runtimeMetrics), 'utf8'))
    const widths = new Set((metrics.metrics ?? []).map((metric) => metric.width))
    if (!widths.has(390) || !widths.has(1440)) missing.push('runtimeMetrics:390-and-1440')
    const compositionKeys = ['titleCount', 'secondaryCopyCount', 'textActionCount', 'iconOnlyActionCount', 'surfaceCount', 'pillCount', 'dividerCount']
    if (metrics.advisory !== true || (metrics.metrics ?? []).some((metric) => typeof metric.route !== 'string' || !metric.route || compositionKeys.some((key) => !Number.isFinite(metric[key]) || metric[key] < 0))) missing.push('runtimeMetrics:route-and-composition')
  } catch {
    missing.push('runtimeMetrics:json')
  }
}
if (manifest.directionTaskId && manifest.directionTaskId !== manifest.taskId) missing.push('directionTaskId:mismatch')
if (manifest.directionContentFixture && manifest.directionContentFixture !== manifest.contentFixture) missing.push('directionContentFixture:mismatch')
if (requiredNames.includes('selectedDirection') && Array.isArray(manifest.directionSamples) && !manifest.directionSamples.includes(manifest.selectedDirection)) {
  missing.push('selectedDirection:sample')
}

if (missing.length > 0) {
  process.stderr.write(`quiet-systems delivery gate: blocked at ${manifest.phase ?? 'unknown'}\n${missing.map((item) => `- ${item}`).join('\n')}\n`)
  process.exit(1)
}

process.stdout.write(`quiet-systems delivery gate: ${manifest.phase} (${phaseIndex + 1}/${phases.length})\n`)
