import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import path from 'node:path'

// Resolve the optional browser driver from the caller's project.
const require = createRequire(path.resolve('package.json'))
const { chromium } = require('playwright-core')
const browser = await chromium.launch({ channel: 'chrome' })
const sample = new URL('../examples/direction-samples/archive/overview.html', import.meta.url)

try {
  for (const width of [390, 768, 1440]) {
    for (const reducedMotion of ['no-preference', 'reduce']) {
      const page = await browser.newPage({ viewport: { width, height: 844 }, reducedMotion })
      await page.goto(sample.href)
      // Pause only the test fixture's entry so slow browsers also exercise interruption.
      await page.evaluate(() => document.addEventListener('animationstart', event => {
        if (event.target.matches('dialog')) {
          for (const effect of event.target.getAnimations()) effect.pause()
        }
      }))
      await page.addStyleTag({ content: `
        @keyframes host-indicator { from { opacity: .8; } to { opacity: 1; } }
        .host-indicator { animation: host-indicator 2s linear paused; }
      ` })
      const host = await page.evaluate(() => {
        const indicator = document.createElement('span')
        indicator.className = 'host-indicator'
        document.body.append(indicator)
        const { animationName, animationDuration } = getComputedStyle(indicator)
        return [animationName, animationDuration]
      })
      assert.deepEqual(host, ['host-indicator', '2s'])
      const records = page.locator('#records button')
      const detail = page.locator('dialog')
      await records.first().focus()
      await page.keyboard.press('Enter')
      assert.equal(await detail.locator('h2').textContent(), '蓝布票据册')
      const animation = await detail.evaluate(dialog => getComputedStyle(dialog).animationName)
      assert.equal(animation, reducedMotion === 'reduce' ? 'none' : 'quiet-fade-in')
      if (reducedMotion === 'no-preference') {
        await page.waitForFunction(() => document.querySelector('dialog').getAnimations()
          .some(effect => effect.playState === 'paused'))
      }
      await page.keyboard.press('Escape')
      await page.waitForFunction(() => !document.querySelector('dialog').open)
      assert(await records.first().evaluate(button => button === document.activeElement))
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      assert.equal(await detail.locator('p').innerText(), '曾用于裁切封套。')
      await detail.getByRole('button', { name: '关闭' }).press('Enter')
      assert(await records.last().evaluate(button => button === document.activeElement))
      await page.close()
      console.log(width, reducedMotion, 'passed')
    }
  }
} finally {
  await browser.close()
}
