#!/usr/bin/env node

import fs from 'node:fs'

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

if (!['new', 'repair', 'exploration'].includes(brief.mode)) missing.push('mode:new|repair|exploration')
if (!Array.isArray(brief.loadedReferences)) missing.push('loadedReferences:array')
else {
  if (brief.loadedReferences.length > 6) missing.push('loadedReferences:max-6')
  const seen = new Set()
  brief.loadedReferences.forEach((entry, index) => {
    if (!entry || typeof entry.path !== 'string' || !entry.path.trim()) missing.push(`loadedReferences[${index}]:path`)
    if (!entry || typeof entry.reason !== 'string' || !entry.reason.trim()) missing.push(`loadedReferences[${index}]:reason`)
    if (entry?.path && seen.has(entry.path)) missing.push(`loadedReferences[${index}]:duplicate`)
    if (entry?.path) seen.add(entry.path)
  })
}

if (brief.mode === 'repair' && (!Array.isArray(brief.existingEvidence) || brief.existingEvidence.length === 0)) missing.push('existingEvidence')

if (missing.length > 0) {
  process.stderr.write(`ui-guard design brief: blocked\n${missing.map((item) => `- ${item}`).join('\n')}\n`)
  process.exit(1)
}

process.stdout.write(`ui-guard design brief: valid (${brief.mode})\n`)
