#!/usr/bin/env node
// Capture a complete, deterministic preview and fail when the page or its
// primary image is clipped. JPEG avoids the Chromium headless tiling issue
// that can produce partial PNGs in desktop viewers.
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const [input, outputDir = 'preview'] = process.argv.slice(2)
if (!input) throw Error('Usage: node capture-preview.mjs page.html [output-directory]')

const require = createRequire(path.resolve('package.json'))
let playwright
try {
  playwright = require('playwright-core')
} catch {
  playwright = createRequire('/Users/apple/.codex/skills/huashu-design/package.json')('playwright-core')
}
const { chromium } = playwright
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--disable-gpu']
})
await mkdir(outputDir, { recursive: true })
const source = await readFile(input)
const result = { input: path.resolve(input), bytes: source.length, viewports: {} }

try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({
      locale: 'zh-CN',
      colorScheme: 'light',
      reducedMotion: 'reduce',
      viewport: { width, height: 844 },
      deviceScaleFactor: 1
    })
    await page.route(/^https?:/, route => route.abort())
    await page.goto(pathToFileURL(path.resolve(input)).href, { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    const inspection = await page.evaluate(() => {
      const images = [...document.images]
      const overflow = document.documentElement.scrollWidth > window.innerWidth + 1
      const incomplete = images.filter(image => !image.complete || image.naturalWidth === 0)
      const clipped = images.filter(image => {
        const box = image.getBoundingClientRect()
        return box.left < -1 || box.top < -1 || box.right > window.innerWidth + 1
      })
      return { imageCount: images.length, incomplete: incomplete.length, clipped: clipped.length, overflow }
    })
    if (inspection.incomplete || inspection.clipped || inspection.overflow) {
      throw Error(`${width}px preview failed: ${JSON.stringify(inspection)}`)
    }
    const output = path.join(outputDir, `${width}.jpg`)
    await page.screenshot({ path: output, type: 'jpeg', quality: 100, fullPage: true, animations: 'disabled' })
    result.viewports[width] = { output, ...inspection }
    await page.close()
  }
} finally {
  await browser.close()
}

await writeFile(path.join(outputDir, 'preview.json'), JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
