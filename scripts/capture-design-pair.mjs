// Capture two offline HTML samples under identical browser conditions.
import { createRequire } from 'node:module'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { createHash, randomInt } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const [first, second, output] = process.argv.slice(2)
if (!output || process.argv.length !== 5) throw Error('Usage: node capture-design-pair.mjs first.html second.html new-output-directory')
const files = [first, second]
if (randomInt(2)) files.reverse()
await mkdir(output)
const { chromium } = createRequire(path.resolve('package.json'))('playwright-core')
const launchOptions = { args: ['--disable-gpu'] }
if (process.env.UI_GUARD_CHROME_PATH) launchOptions.executablePath = process.env.UI_GUARD_CHROME_PATH
else launchOptions.channel = 'chrome'
let browser
try {
  browser = await chromium.launch(launchOptions)
} catch {
  delete launchOptions.channel
  browser = await chromium.launch(launchOptions)
}
const samples = []
try {
  for (const [index, file] of files.entries()) {
    const label = ['A', 'B'][index]
    const html = await readFile(file)
    samples.push({ label, file, sha256: createHash('sha256').update(html).digest('hex') })
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ locale: 'zh-CN', colorScheme: 'light', reducedMotion: 'reduce', viewport: { width, height: 844 } })
      await page.route(/^https?:/, route => route.abort())
      await page.goto(pathToFileURL(path.resolve(file)).href)
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({ path: path.join(output, label + '-' + width + '.png'), fullPage: true, animations: 'disabled' })
      await page.close()
    }
  }
  await writeFile(path.join(output, 'answer-key.json'), JSON.stringify({ chrome: browser.version(), samples }, null, 2))
} finally {
  await browser.close()
}
