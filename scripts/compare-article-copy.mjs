#!/usr/bin/env node
import { readFileSync } from 'node:fs'

function paragraphs(file) {
  const text = readFileSync(file, 'utf8').replace(/\r\n?/g, '\n').trim()
  return text ? text.split(/\n[ \t]*\n+/).map(paragraph => paragraph.trim()) : []
}

const files = process.argv.slice(2)
if (files.length !== 2) {
  console.error('Usage: node compare-article-copy.mjs approved.txt rendered.txt')
  process.exit(2)
}
try {
  const [source, rendered] = files.map(paragraphs)
  if (!source.length) throw new Error('The approved copy is empty')
  for (let index = 0; index < Math.max(source.length, rendered.length); index++) {
    if (source[index] === rendered[index]) continue
    console.error(JSON.stringify({ paragraph: index + 1, expected: source[index] ?? null, rendered: rendered[index] ?? null }))
    process.exitCode = 1
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 2
}
