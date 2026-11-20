import assert from 'node:assert/strict'
import path from 'node:path'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'

const require = createRequire(path.resolve('package.json'))
const { chromium } = require('playwright-core')
const files = new Map([
  ['/', ['../examples/local-draft/index.html', 'text/html']],
  ['/draft.js', ['../examples/local-draft/draft.js', 'text/javascript']],
  ['/direction-samples/archive/sample.css', ['../examples/direction-samples/archive/sample.css', 'text/css']]
])
const browser = await chromium.launch({ channel: 'chrome' })
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } })
    await page.route('**/*', async route => {
      const asset = files.get(new URL(route.request().url()).pathname)
      if (!asset) return route.abort()
      const [file, contentType] = asset
      await route.fulfill({ body: await readFile(new URL(file, import.meta.url)), contentType })
    })
    const dialogs = []
    page.on('dialog', async dialog => { dialogs.push(dialog.type()); await dialog.dismiss() })
    await page.goto('http://draft.test/')
    const field = page.getByRole('textbox', { name: '记录' })
    const formError = page.getByRole('alert')
    await field.fill('首轮访谈')
    await page.evaluate(() => {
      const write = Storage.prototype.setItem
      Storage.prototype.setItem = function (...args) {
        Storage.prototype.setItem = write
        throw new DOMException('Storage full', 'QuotaExceededError')
      }
    })
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    assert.match(await formError.innerText(), /未能保存/)
    assert.equal(await page.getByRole('status').innerText(), '')
    assert.equal(await field.inputValue(), '首轮访谈')
    assert(await field.isEditable())
    await page.keyboard.press('Enter')
    assert.equal(await formError.innerText(), '')
    assert.equal(await page.getByRole('status').innerText(), '已保存到此设备')
    await page.reload()
    assert.equal(await field.inputValue(), '首轮访谈')
    assert.deepEqual(dialogs, [])
    await page.close()
    console.log(width, 'save failure, keyboard retry and reload passed')
  }
} finally {
  await browser.close()
}
