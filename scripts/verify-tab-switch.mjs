import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const [source, startName, nextName, nextFact] = process.argv.slice(2)
if (process.argv.length !== 6 || !nextFact?.trim()) {
  console.error('Usage: node verify-tab-switch.mjs URL-or-file start-tab next-tab unique-panel-text')
  process.exit(2)
}
const url = /^[a-z]+:/i.test(source) ? source : pathToFileURL(path.resolve(source)).href
const require = createRequire(path.resolve('package.json'))
const { chromium } = require('playwright-core')
const browser = await chromium.launch({ channel: 'chrome' })
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } })
    await page.goto(url)
    const start = page.getByRole('tab', { name: startName, exact: true })
    const group = page.getByRole('tablist').filter({ has: start })
    const next = group.getByRole('tab', { name: nextName, exact: true })
    const panelFor = name => page.getByRole('tabpanel', { name, exact: true })
    await start.click()
    assert.equal(await start.getAttribute('aria-selected'), 'true')
    const startPanel = panelFor(startName)
    await startPanel.waitFor()
    const startControls = await start.getAttribute('aria-controls')
    assert(startControls && startControls === await startPanel.getAttribute('id'), 'Initial tab must reference its panel')
    assert.equal(await page.getByText(nextFact, { exact: true }).isVisible(), false)
    const key = await group.evaluate(el => {
      if (el.getAttribute('aria-orientation') === 'vertical') return 'ArrowDown'
      return getComputedStyle(el).direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
    })
    await start.press(key)
    assert(await next.evaluate(el => el === document.activeElement), 'Arrow key must focus the adjacent tab')
    if (await next.getAttribute('aria-selected') !== 'true') await page.keyboard.press('Enter')
    const panel = panelFor(nextName)
    await panel.getByText(nextFact, { exact: true }).waitFor()
    assert.equal(await next.getAttribute('aria-selected'), 'true')
    assert.equal(await start.getAttribute('aria-selected'), 'false')
    const controls = await next.getAttribute('aria-controls')
    assert(controls && controls === await panel.getAttribute('id'), 'Selected tab must reference its panel')
    await startPanel.waitFor({ state: 'hidden' })
    await page.close()
    console.log(width, nextName, 'keyboard switch and panel content passed')
  }
} finally {
  await browser.close()
}
