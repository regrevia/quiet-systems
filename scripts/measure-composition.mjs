#!/usr/bin/env node

const target = process.argv.slice(2).find((argument) => !argument.startsWith('--'))
if (!target) {
  process.stderr.write('usage: node scripts/measure-composition.mjs [--json] http://localhost:3000/path\n')
  process.exit(2)
}

let chromium
try {
  const playwright = await import('playwright').catch(() => import('playwright-core'))
  chromium = playwright.chromium
} catch (error) {
  process.stderr.write(`quiet-systems composition: install playwright or playwright-core in the workspace (${error.message})\n`)
  process.exit(2)
}

const browser = await chromium.launch({ headless: true })
try {
  const metrics = []
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } })
    await page.goto(target, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(250)
    const result = await page.evaluate(() => {
      const visible = (element) => {
        const style = getComputedStyle(element)
        const box = element.getBoundingClientRect()
        return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0
      }
      const textOf = (element) => (element.innerText || '').replace(/\s+/g, ' ').trim()
      const actions = [...document.querySelectorAll('button, a')].filter(visible)
      return {
        route: location.pathname,
        titleCount: [...document.querySelectorAll('h1')].filter(visible).length,
        secondaryCopyCount: [...document.querySelectorAll('small, [class*="subtitle"], [class*="helper"], [data-secondary-copy]')].filter(visible).length,
        textActionCount: actions.filter((element) => textOf(element) && !element.querySelector('svg, img, [data-icon], [class*="icon"]')).length,
        iconOnlyActionCount: actions.filter((element) => !textOf(element) && element.querySelector('svg, img, [data-icon], [class*="icon"]')).length,
        surfaceCount: [...document.querySelectorAll('[class*="card"], [class*="panel"], [class*="surface"], [class*="tile"], [data-surface]')].filter(visible).length,
        pillCount: [...document.querySelectorAll('[class*="pill"], [class*="badge"], [class*="chip"], [class*="tag"], [data-pill]')].filter(visible).length,
        dividerCount: [...document.querySelectorAll('hr, [class*="divider"], [class*="separator"], [role="separator"]')].filter(visible).length,
        bodyText: textOf(document.body)
      }
    })
    metrics.push({ width, ...result })
    await page.close()
  }
  const output = { advisory: true, target, metrics }
  if (process.argv.includes('--json')) process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
  else for (const metric of metrics) process.stdout.write(`${metric.route} ${metric.width}px title=${metric.titleCount} secondary=${metric.secondaryCopyCount} text-action=${metric.textActionCount} icon-only=${metric.iconOnlyActionCount} surface=${metric.surfaceCount} pill=${metric.pillCount} divider=${metric.dividerCount}\n`)
} finally {
  await browser.close()
}
