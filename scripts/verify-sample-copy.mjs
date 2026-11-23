import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import path from 'node:path'

const { chromium } = createRequire(path.resolve('package.json'))('playwright-core')
const browser = await chromium.launch({ channel: 'chrome' })
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } })
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: {
        writeText(value) {
          window.copiedValue = value
          return new Promise((resolve, reject) => { window.settleCopy = { resolve, reject } })
        }
      } })
    })
    await page.goto(new URL('../examples/track-preview/index.html', import.meta.url).href)
    const copy = page.getByRole('button', { name: '复制曲名' })
    const feedback = page.getByRole('status')
    assert.equal(await feedback.textContent(), '')
    assert.equal(await page.getByRole('link').count(), 0)
    await copy.press('Enter')
    assert.equal(await page.evaluate(() => window.copiedValue), '慢火')
    assert.equal(await feedback.textContent(), '')
    await page.evaluate(() => window.settleCopy.reject(new Error('denied')))
    assert.match(await feedback.textContent(), /手动复制/)
    await copy.press('Enter')
    assert.equal(await feedback.textContent(), '')
    await page.evaluate(() => window.settleCopy.resolve())
    assert.equal(await feedback.textContent(), '已复制曲名')
    await page.close()
    console.log(width, 'copy value, pending, failure and retry passed')
  }
} finally {
  await browser.close()
}
