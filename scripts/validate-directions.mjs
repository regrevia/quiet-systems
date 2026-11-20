import fs from 'node:fs'
import path from 'node:path'

const files = process.argv.slice(2)
const fields = ['Task and object', 'Assumed fields and states', 'Reading and action order', 'Density and navigation', 'Primary action', 'Contextual actions', 'Tradeoff', 'Decision supported']
const samples = []
function issue(message) {
  console.error(message)
  process.exitCode = 1
}
if (files.length < 2 || files.length > 3) {
  console.error('Usage: node scripts/validate-directions.mjs sample-a.md sample-b.md [sample-c.md]')
  process.exit(2)
}
for (const file of files) {
  let source
  try {
    source = fs.readFileSync(path.resolve(file), 'utf8')
  } catch (error) {
    console.error(error.message)
    process.exit(2)
  }
  const sample = new Map()
  for (const field of fields) {
    const matches = [...source.matchAll(new RegExp('^- ' + field + ':[ \\t]*(.*)$', 'gm'))]
    const value = matches[0]?.[1].trim()
    if (matches.length !== 1 || !value) issue(file + ': expected one filled field for ' + field)
    sample.set(field, value)
  }
  samples.push(sample)
}
if (!process.exitCode) {
  for (const field of fields.slice(0, 2)) {
    if (new Set(samples.map(sample => sample.get(field))).size !== 1) issue('Use the same comparison brief for ' + field)
  }
  const structures = samples.map(sample => JSON.stringify([sample.get('Reading and action order'), sample.get('Density and navigation')]))
  if (new Set(structures).size !== samples.length) issue('Repeated reading order and navigation description')
}
