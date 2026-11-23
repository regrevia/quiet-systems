import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const [source, selector = 'button', minimumRadius = '6'] = process.argv.slice(2)
if (!source) throw Error('Usage: node verify-control-adaptation.mjs URL-or-file [selector] [minimum-radius]')
const url = /^[a-z]+:/i.test(source) ? source : pathToFileURL(path.resolve(source)).href
const { chromium } = createRequire(path.resolve('package.json'))('playwright-core')
const browser = await chromium.launch({ channel: 'chrome' })
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } })
    await page.goto(url)
    const controls = page.locator(selector).filter({ visible: true })
    assert(await controls.count(), `${width}: no visible controls matched ${selector}`)
    for (const control of await controls.all()) {
      const details = await control.evaluate(element => {
        const style = getComputedStyle(element)
        return { appearance: style.appearance, radius: parseFloat(style.borderTopLeftRadius) || 0 }
      })
      assert.notEqual(details.appearance, 'auto', `${width}: browser-native appearance remains on ${selector}`)
      assert(details.radius >= Number(minimumRadius), `${width}: ${selector} needs an intentional corner radius`)
    }
    await page.close()
    console.log(width, 'control adaptation passed')
  }
} finally {
  await browser.close()
}
