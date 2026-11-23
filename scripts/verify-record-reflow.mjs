import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(path.resolve('package.json'))
const { chromium } = require('playwright-core')
const browser = await chromium.launch({ channel: 'chrome' })
const sample = new URL('../examples/record-tabs/index.html', import.meta.url)
try {
  for (const width of [320, 390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 700 } })
    await page.goto(sample.href)
    await page.getByRole('heading', { level: 1 }).evaluate(el => {
      el.textContent = '卷三修复记录 ARCHIVE2026EASTCOLLECTIONRESTORATIONREGISTER0198'
    })
    await page.getByRole('tab', { name: '原文' }).press('ArrowRight')
    const panel = page.getByRole('tabpanel', { name: '校注' })
    await panel.locator('.field-content').evaluate(el => {
      el.textContent = '保留原折痕，暂不压平。修复前先核对纸张纤维方向，记录折痕两侧的磨损情况。'.repeat(8) + '末页已核对。'
    })
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal page overflow at ' + width)
    const contentFits = await panel.evaluate(el => {
      const range = document.createRange()
      range.selectNodeContents(el.querySelector('.field-content'))
      const bounds = range.getBoundingClientRect()
      const frame = el.getBoundingClientRect()
      return bounds.left >= frame.left && bounds.right <= frame.right && bounds.bottom <= frame.bottom
    })
    assert(contentFits, 'Panel clips the text at ' + width)
    if (width === 320 && process.argv[2]) await page.screenshot({ path: process.argv[2], fullPage: true })
    await page.close()
    console.log(width, 'record reflow passed')
  }
} finally {
  await browser.close()
}
