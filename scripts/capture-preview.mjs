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
const loaders = [() => require('playwright-core')]
if (process.env.UI_GUARD_PLAYWRIGHT_ROOT) {
  loaders.push(() => createRequire(path.resolve(process.env.UI_GUARD_PLAYWRIGHT_ROOT, 'package.json'))('playwright-core'))
}
loaders.push(() => createRequire('/Users/apple/.codex/skills/huashu-design/package.json')('playwright-core'))
for (const load of loaders) {
  try { playwright = load(); break } catch {}
}
if (!playwright) throw Error('playwright-core is required. Install it or set UI_GUARD_PLAYWRIGHT_ROOT.')
const { chromium } = playwright
async function launchBrowser() {
  const args = ['--disable-gpu']
  if (process.env.UI_GUARD_CHROME_PATH) {
    return chromium.launch({ executablePath: process.env.UI_GUARD_CHROME_PATH, args })
  }
  try { return await chromium.launch({ channel: 'chrome', args }) } catch {}
  try { return await chromium.launch({ executablePath: chromium.executablePath(), args }) } catch {}
  throw Error('No usable Chromium browser found. Set UI_GUARD_CHROME_PATH.')
}
const browser = await launchBrowser()
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
    const consoleErrors = []
    const pageErrors = []
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
    page.on('pageerror', error => pageErrors.push(String(error)))
    await page.route(/^https?:/, route => route.abort())
    await page.goto(pathToFileURL(path.resolve(input)).href, { waitUntil: 'load' })
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
    await page.waitForFunction(() => {
      const marker = document.querySelector('[data-preview-ready]')
      return !marker || marker.getAttribute('data-preview-ready') === 'true'
    }, { timeout: 5000 }).catch(() => {
      throw Error(`${width}px preview timed out waiting for data-preview-ready`)
    })
    await page.evaluate(async () => {
      await document.fonts.ready
      await Promise.all([...document.images].map(image => image.complete
        ? Promise.resolve()
        : new Promise(resolve => {
            image.addEventListener('load', resolve, { once: true })
            image.addEventListener('error', resolve, { once: true })
          })))
    })
    const inspection = await page.evaluate(() => {
      const images = [...document.images]
      const overflow = document.documentElement.scrollWidth > window.innerWidth + 1
      const incomplete = images.filter(image => !image.complete || image.naturalWidth === 0)
      const candidates = [...images, ...document.querySelectorAll('[data-preview-primary]')]
      const clipped = candidates.filter(element => {
        const box = element.getBoundingClientRect()
        if (box.left < -1 || box.top < -1 || box.right > window.innerWidth + 1) return true
        for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
          const style = getComputedStyle(parent)
          if (!/(hidden|clip|scroll|auto)/.test(style.overflow + style.overflowX + style.overflowY)) continue
          const parentBox = parent.getBoundingClientRect()
          if (box.left < parentBox.left - 1 || box.right > parentBox.right + 1 || box.top < parentBox.top - 1 || box.bottom > parentBox.bottom + 1) return true
        }
        return false
      })
      return { imageCount: images.length, incomplete: incomplete.length, clipped: clipped.length, overflow }
    })
    inspection.consoleErrors = consoleErrors
    inspection.pageErrors = pageErrors
    if (inspection.incomplete || inspection.clipped || inspection.overflow || inspection.consoleErrors.length || inspection.pageErrors.length) {
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
