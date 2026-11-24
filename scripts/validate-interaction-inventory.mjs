#!/usr/bin/env node

import fs from 'node:fs'

const file = process.argv.slice(2).find((argument) => !argument.startsWith('--'))
if (!file) {
  process.stderr.write('usage: node scripts/validate-interaction-inventory.mjs path/to/interaction-inventory.json\n')
  process.exit(2)
}

let inventory
try {
  inventory = JSON.parse(fs.readFileSync(file, 'utf8'))
} catch (error) {
  process.stderr.write(`ui-guard interaction inventory: cannot read inventory (${error.message})\n`)
  process.exit(2)
}

const missing = []
for (const name of ['object', 'goal', 'result', 'recoveryPath']) {
  if (typeof inventory[name] !== 'string' || !inventory[name].trim()) missing.push(name)
}
const roles = new Set(['primary', 'frequent-compact', 'navigation', 'state', 'destructive', 'recovery', 'low-frequency'])
if (!Array.isArray(inventory.actions) || inventory.actions.length === 0) missing.push('actions')
else inventory.actions.forEach((action, index) => {
  for (const name of ['label', 'role', 'labelForm', 'controlGrammar', 'accessibleName']) {
    if (!action || typeof action[name] !== 'string' || !action[name].trim()) missing.push(`actions[${index}]:${name}`)
  }
  if (action?.role && !roles.has(action.role)) missing.push(`actions[${index}]:role-enum`)
  if (action?.labelForm && !new Set(['text', 'icon-only', 'icon+label']).has(action.labelForm)) missing.push(`actions[${index}]:labelForm-enum`)
  if (action?.labelForm === 'icon-only' && (!action.recognitionBasis || typeof action.recognitionBasis !== 'string' || !action.recognitionBasis.trim())) missing.push(`actions[${index}]:recognitionBasis`)
  if (action?.labelForm === 'icon-only' && ['destructive', 'recovery'].includes(action.role)) missing.push(`actions[${index}]:labelForm-risk`)
})

if (missing.length > 0) {
  process.stderr.write(`ui-guard interaction inventory: blocked\n${missing.map((item) => `- ${item}`).join('\n')}\n`)
  process.exit(1)
}
process.stdout.write(`ui-guard interaction inventory: valid (${inventory.actions.length} actions)\n`)
