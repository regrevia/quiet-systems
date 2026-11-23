import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const [source, requiredPath, forbiddenPath] = process.argv.slice(2)
if (process.argv.length !== 5) throw Error('Usage: node verify-copy-contract.mjs URL-or-file required.json forbidden.json')
const required = JSON.parse(await readFile(path.resolve(requiredPath), 'utf8'))
const forbidden = JSON.parse(await readFile(path.resolve(forbiddenPath), 'utf8'))
assert(Array.isArray(required) && Array.isArray(forbidden), 'Copy contracts must be arrays')
const url = /^[a-z]+:/i.test(source) ? source : pathToFileURL(path.resolve(source)).href
const { chromium } = createRequire(path.resolve('package.json'))('playwright-core')
const browser = await chromium.launch({ channel: 'chrome' })
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } })
    await page.goto(url)
    const visibleText = await page.locator('body').innerText()
    for (const phrase of required) assert(visibleText.includes(phrase), `${width}: missing required copy: ${phrase}`)
    for (const phrase of forbidden) assert(!visibleText.includes(phrase), `${width}: forbidden copy is visible: ${phrase}`)
    await page.close()
    console.log(width, 'copy contract passed')
  }
} finally {
  await browser.close()
}
