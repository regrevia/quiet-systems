#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const allowedStates = new Set([
  'ready',
  'empty',
  'loading',
  'error',
  'offline',
  'partial-failure',
  'permission-limited',
  'recovered'
])

function usage() {
  console.error('Usage: node scripts/validate-fixtures.mjs [fixtures-directory]')
  console.error('Defaults to examples/fixtures relative to this script.')
  process.exitCode = 2
}

function fail(file, message) {
  return `${file}: ${message}`
}

function validatePayload(file, payload) {
  const errors = []
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return [fail(file, 'payload must be a JSON object')]
  }
  if (payload.__source !== 'demo') errors.push(fail(file, '__source must be demo'))
  if (typeof payload.state !== 'string' || !allowedStates.has(payload.state)) {
    errors.push(fail(file, `state must be one of ${[...allowedStates].join(', ')}`))
  }
  if (payload.items !== null && payload.items !== undefined && !Array.isArray(payload.items)) {
    errors.push(fail(file, 'items must be an array or null'))
  }
  if (payload.state === 'error') {
    if (!payload.error || typeof payload.error !== 'object') errors.push(fail(file, 'error state requires an error object'))
    else if (typeof payload.error.code !== 'string' || typeof payload.error.retryable !== 'boolean') {
      errors.push(fail(file, 'error object requires code and retryable'))
    }
    if (payload.items !== null) errors.push(fail(file, 'error state must use items: null'))
  }
  if (payload.state === 'partial-failure') {
    if (!Array.isArray(payload.items) || payload.items.length === 0) errors.push(fail(file, 'partial-failure requires at least one visible item'))
    if (!Array.isArray(payload.failedItems) || payload.failedItems.length === 0) {
      errors.push(fail(file, 'partial-failure requires at least one failedItems entry'))
    } else {
      for (const [index, item] of payload.failedItems.entries()) {
        if (!item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.reason !== 'string' || typeof item.retryable !== 'boolean') {
          errors.push(fail(file, `failedItems[${index}] requires id, reason, and retryable`))
        }
      }
    }
  }
  if (payload.state === 'permission-limited' && typeof payload.message !== 'string') {
    errors.push(fail(file, 'permission-limited requires a message'))
  }
  if (payload.state === 'empty' && (!Array.isArray(payload.items) || payload.items.length !== 0)) {
    errors.push(fail(file, 'empty state requires an empty items array'))
  }
  if (payload.state === 'recovered' && (!Array.isArray(payload.items) || payload.items.length === 0)) {
    errors.push(fail(file, 'recovered state requires at least one item'))
  }
  return errors
}

function main() {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
  const directory = path.resolve(process.argv[2] ?? path.join(scriptDirectory, '..', 'examples', 'fixtures'))
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
    usage()
    return
  }
  const files = fs.readdirSync(directory).filter((file) => file.endsWith('.json')).sort()
  if (files.length === 0) {
    console.error(`No JSON fixtures found in ${directory}`)
    process.exitCode = 1
    return
  }
  const errors = []
  for (const file of files) {
    const fullPath = path.join(directory, file)
    try {
      errors.push(...validatePayload(file, JSON.parse(fs.readFileSync(fullPath, 'utf8'))))
    } catch (error) {
      errors.push(fail(file, `invalid JSON or unreadable file: ${error.message}`))
    }
  }
  if (errors.length > 0) {
    console.error(errors.join('\n'))
    process.exitCode = 1
    return
  }
  console.log(`quiet-systems fixture validation: valid (${files.length} files)`)
}

main()
