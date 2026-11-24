#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const file = process.argv.slice(2).find((argument) => !argument.startsWith('--'))
if (!file) {
  process.stderr.write('usage: node scripts/validate-design-brief.mjs path/to/design-brief.json\n')
  process.exit(2)
}

let brief
try {
  brief = JSON.parse(fs.readFileSync(file, 'utf8'))
} catch (error) {
  process.stderr.write(`ui-guard design brief: cannot read brief (${error.message})\n`)
  process.exit(2)
}

const missing = []
const required = ['mode', 'taskId', 'audience', 'object', 'successCondition', 'visualDirection', 'contentFixture', 'loadedReferences', 'untrustedInputs', 'knownUnknowns']
for (const name of required) {
  const value = brief[name]
  if (Array.isArray(value) ? value.length === 0 : typeof value !== 'string' || value.trim() === '') missing.push(name)
}

for (const name of ['untrustedInputs', 'knownUnknowns']) {
  if (!Array.isArray(brief[name])) continue
  brief[name].forEach((entry, index) => {
    if (!entry || typeof entry.source !== 'string' || !entry.source.trim()) missing.push(`${name}[${index}]:source`)
    if (!entry || typeof entry.reason !== 'string' || !entry.reason.trim()) missing.push(`${name}[${index}]:reason`)
  })
}

if (!['new', 'repair', 'exploration'].includes(brief.mode)) missing.push('mode:new|repair|exploration')
if (brief.mode === 'exploration' && brief.visualDirection === 'undecided' && brief.contentFixture === 'exploration') {
  missing.splice(missing.indexOf('visualDirection'), 1)
  missing.splice(missing.indexOf('contentFixture'), 1)
}
if (!Array.isArray(brief.loadedReferences)) missing.push('loadedReferences:array')
else {
  const extraCount = Math.max(0, brief.loadedReferences.length - 6)
  if (extraCount > 0 && (!Array.isArray(brief.additionalReferenceDecisions) || brief.additionalReferenceDecisions.length < extraCount || typeof brief.reviewRecord !== 'string' || !brief.reviewRecord.trim())) missing.push('loadedReferences:max-6')
  const seen = new Set()
  brief.loadedReferences.forEach((entry, index) => {
    if (!entry || typeof entry.path !== 'string' || !entry.path.trim()) missing.push(`loadedReferences[${index}]:path`)
    if (!entry || typeof entry.reason !== 'string' || !entry.reason.trim()) missing.push(`loadedReferences[${index}]:reason`)
    if (entry?.path && seen.has(entry.path)) missing.push(`loadedReferences[${index}]:duplicate`)
    if (entry?.path) seen.add(entry.path)
  })
}

if (brief.mode === 'repair') {
  if (!Array.isArray(brief.existingEvidence) || brief.existingEvidence.length === 0) missing.push('existingEvidence')
  else brief.existingEvidence.forEach((entry, index) => {
    if (!entry || typeof entry.path !== 'string' || !entry.path.trim()) missing.push(`existingEvidence[${index}]:path`)
    if (!entry || typeof entry.type !== 'string' || !entry.type.trim()) missing.push(`existingEvidence[${index}]:type`)
    if (!entry || typeof entry.reason !== 'string' || !entry.reason.trim()) missing.push(`existingEvidence[${index}]:reason`)
    const evidencePath = entry?.path ?? ''
    const external = /^(?:https?:|plugin:)/i.test(evidencePath) || path.isAbsolute(evidencePath)
    if (evidencePath && !external && !fs.existsSync(path.resolve(path.dirname(file), evidencePath))) missing.push(`existingEvidence[${index}]:file`)
    const extension = path.extname(evidencePath).toLowerCase()
    const expectedExtensions = {
      'design-contract': ['.md', '.json'],
      screenshot: ['.png', '.jpg', '.jpeg'],
      'runtime-metrics': ['.json'],
      fixture: ['.json']
    }[entry?.type]
    if (expectedExtensions && extension && !expectedExtensions.includes(extension)) missing.push(`existingEvidence[${index}]:type-mismatch`)
  })
}

if (missing.length > 0) {
  process.stderr.write(`ui-guard design brief: blocked\n${missing.map((item) => `- ${item}`).join('\n')}\n`)
  process.exit(1)
}

process.stdout.write(`ui-guard design brief: valid (${brief.mode})\n`)
