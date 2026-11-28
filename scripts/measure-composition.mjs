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
  const antiPatterns = []
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } })
    await page.goto(target, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(250)
    const result = await page.evaluate(() => {
      const visible = (element) => {
        const style = getComputedStyle(element)
        const box = element.getBoundingClientRect()
        return style.display !== 'none' && style.visibility !== 'hidden' && Number.parseFloat(style.opacity) > 0 && box.width > 0 && box.height > 0
      }
      const textOf = (element) => (element.innerText || '').replace(/\s+/g, ' ').trim()
      const parseRgba = (value) => {
        const match = value?.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
        return match ? [+match[1], +match[2], +match[3], match[4] === undefined ? 1 : +match[4]] : null
      }
      const hasVisibleBg = (color) => {
        const rgba = parseRgba(color)
        return Boolean(rgba && rgba[3] >= 0.1)
      }
      const nearestVisibleBg = (element) => {
        let current = element
        while (current) {
          const bg = getComputedStyle(current).backgroundColor
          if (hasVisibleBg(bg)) return bg
          current = current.parentElement
        }
        return 'rgb(255, 255, 255)'
      }
      const hasVisibleBorderSide = (style, side) =>
        Number.parseFloat(style[`border${side}Width`]) > 0 && style[`border${side}Style`] !== 'none' && hasVisibleBg(style[`border${side}Color`])
      const hasFullBorder = (style) =>
        ['Top', 'Right', 'Bottom', 'Left'].every((side) => hasVisibleBorderSide(style, side))
      const hasSingleSideDividerBorder = (style) => {
        const sides = ['Top', 'Right', 'Bottom', 'Left'].filter((side) => hasVisibleBorderSide(style, side))
        return sides.length === 1 && (sides[0] === 'Top' || sides[0] === 'Bottom')
      }
      const hasVisibleShadow = (boxShadow) => {
        if (!boxShadow || boxShadow === 'none') return false
        const colors = [...boxShadow.matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/g)]
        if (colors.length === 0) return true
        return colors.some((match) => (match[4] === undefined ? 1 : Number.parseFloat(match[4])) > 0.01)
      }
      const hasSurfaceFrame = (element) => {
        if (!visible(element)) return false
        const tag = element.tagName
        if (['BODY', 'HTML', 'MAIN', 'HEADER', 'FOOTER', 'NAV', 'BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'TR'].includes(tag)) return false
        const style = getComputedStyle(element)
        const box = element.getBoundingClientRect()
        if (box.width < 80 || box.height < 48 || box.width >= window.innerWidth * 0.98) return false
        const ancestorBg = nearestVisibleBg(element.parentElement)
        const distinctBg = hasVisibleBg(style.backgroundColor) && style.backgroundColor !== ancestorBg
        return hasFullBorder(style) || hasVisibleShadow(style.boxShadow) || (distinctBg && Number.parseFloat(style.borderTopLeftRadius) >= 4)
      }
      const isComputedPill = (element) => {
        if (!visible(element)) return false
        if (['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'IMG', 'SVG'].includes(element.tagName)) return false
        const style = getComputedStyle(element)
        const box = element.getBoundingClientRect()
        const text = textOf(element)
        if (!text || text.length > 24 || box.height > 36 || box.height < 14 || box.width > 220) return false
        if (Math.abs(box.width - box.height) <= 2 && text.length <= 2) return false
        const radius = Number.parseFloat(style.borderTopLeftRadius)
        return radius >= box.height * 0.45 && (hasVisibleBg(style.backgroundColor) || hasFullBorder(style))
      }
      const actions = [...document.querySelectorAll('button, a')].filter(visible)
      const surfaces = new Set([...document.querySelectorAll('[class*="card"], [class*="panel"], [class*="surface"], [class*="tile"], [data-surface]')].filter(visible))
      const hasTrackedAncestor = (element) => {
        let parent = element.parentElement
        while (parent) {
          if (surfaces.has(parent)) return true
          parent = parent.parentElement
        }
        return false
      }
      for (const element of document.querySelectorAll('div, section, article, aside, li')) {
        if (!surfaces.has(element) && !hasTrackedAncestor(element) && hasSurfaceFrame(element)) surfaces.add(element)
      }
      const pills = new Set([...document.querySelectorAll('[class*="pill"], [class*="badge"], [class*="chip"], [class*="tag"], [data-pill]')].filter(visible))
      for (const element of document.querySelectorAll('span, div, small, em, strong')) {
        if (isComputedPill(element)) pills.add(element)
      }
      const dividers = new Set([...document.querySelectorAll('hr, [class*="divider"], [class*="separator"], [role="separator"]')].filter(visible))
      for (const element of document.querySelectorAll('div, span, li')) {
        if (!visible(element)) continue
        const box = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        if (!textOf(element) && ((box.height <= 2 && box.width >= 40) || (box.width <= 2 && box.height >= 24))) {
          if (hasVisibleBg(style.backgroundColor) || hasSingleSideDividerBorder(style) || hasFullBorder(style)) dividers.add(element)
        } else if (element.tagName === 'LI' && hasSingleSideDividerBorder(style)) {
          dividers.add(element)
        }
      }
      return {
        route: location.pathname,
        titleCount: [...document.querySelectorAll('h1')].filter(visible).length,
        secondaryCopyCount: [...document.querySelectorAll('small, [class*="subtitle"], [class*="helper"], [data-secondary-copy]')].filter(visible).length,
        textActionCount: actions.filter((element) => textOf(element) && !element.querySelector('svg, img, [data-icon], [class*="icon"]')).length,
        iconOnlyActionCount: actions.filter((element) => !textOf(element) && element.querySelector('svg, img, [data-icon], [class*="icon"]')).length,
        surfaceCount: surfaces.size,
        pillCount: pills.size,
        dividerCount: dividers.size,
        bodyText: textOf(document.body)
      }
    })
    metrics.push({ width, ...result })
    const audit = await page.evaluate(() => {
      const visible = (element) => {
        const style = getComputedStyle(element)
        const box = element.getBoundingClientRect()
        return style.display !== 'none' && style.visibility !== 'hidden' && Number.parseFloat(style.opacity) > 0 && box.width > 0 && box.height > 0
      }
      const parseRgba = (value) => {
        const match = value?.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
        return match ? [+match[1], +match[2], +match[3], match[4] === undefined ? 1 : +match[4]] : null
      }
      const compositeOver = (fg, bg) => {
        const alpha = fg[3]
        return [
          fg[0] * alpha + bg[0] * (1 - alpha),
          fg[1] * alpha + bg[1] * (1 - alpha),
          fg[2] * alpha + bg[2] * (1 - alpha),
          1
        ]
      }
      const luminance = ([r, g, b]) => {
        const channel = (v) => {
          const s = v / 255
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
        }
        return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
      }
      const contrastRatio = (fg, bg) => {
        const l1 = luminance(fg)
        const l2 = luminance(bg)
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
      }
      const resolveBackground = (element) => {
        const layers = []
        let current = element
        while (current) {
          const style = getComputedStyle(current)
          if (style.backgroundImage && style.backgroundImage !== 'none') return { unknown: true }
          const rgba = parseRgba(style.backgroundColor)
          const opacity = Number.parseFloat(style.opacity)
          if (rgba && rgba[3] * opacity > 0.01) {
            layers.push([rgba[0], rgba[1], rgba[2], rgba[3] * opacity])
            if (rgba[3] * opacity >= 0.99) break
          }
          current = current.parentElement
        }
        let color = [255, 255, 255, 1]
        for (let i = layers.length - 1; i >= 0; i -= 1) {
          color = compositeOver(layers[i], color)
        }
        return { unknown: false, color }
      }
      const hasVisibleShadow = (boxShadow) => {
        if (!boxShadow || boxShadow === 'none') return false
        const colors = [...boxShadow.matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/g)]
        if (colors.length === 0) return true
        return colors.some((match) => (match[4] === undefined ? 1 : Number.parseFloat(match[4])) > 0.01)
      }
      const isCardLike = (element) => {
        if (!visible(element)) return false
        if (['BODY', 'HTML', 'MAIN', 'HEADER', 'FOOTER', 'NAV', 'BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'TR'].includes(element.tagName)) return false
        const style = getComputedStyle(element)
        const box = element.getBoundingClientRect()
        if (box.width < 80 || box.height < 48 || box.width >= window.innerWidth * 0.98) return false
        const hasFullBorder = ['Top', 'Right', 'Bottom', 'Left'].every((side) => {
          const rgba = parseRgba(style[`border${side}Color`])
          return Number.parseFloat(style[`border${side}Width`]) > 0 && style[`border${side}Style`] !== 'none' && Boolean(rgba && rgba[3] >= 0.1)
        })
        return hasFullBorder || hasVisibleShadow(style.boxShadow)
      }
      const cards = [...document.querySelectorAll('div, section, article, aside, li')].filter(isCardLike)
      const cardSet = new Set(cards)
      let nestedCards = 0
      for (const card of cards) {
        let parent = card.parentElement
        while (parent) {
          if (cardSet.has(parent)) { nestedCards += 1; break }
          parent = parent.parentElement
        }
      }
      const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter(visible).map((el) => Number(el.tagName[1]))
      const skippedHeadingLevels = []
      for (let i = 1; i < headings.length; i += 1) {
        if (headings[i] - headings[i - 1] > 1) skippedHeadingLevels.push(`h${headings[i - 1]}->h${headings[i]}`)
      }
      let tinyTextCount = 0
      let lowContrastCount = 0
      let contrastUnknownCount = 0
      const textElements = [...document.querySelectorAll('div, p, span, a, button, label, li, td, th, small, h1, h2, h3, h4, h5, h6')].filter(visible)
      for (const el of textElements) {
        const directText = [...el.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent.trim()).join('')
        if (!directText) continue
        const style = getComputedStyle(el)
        const fontSize = Number.parseFloat(style.fontSize)
        if (fontSize < 12) tinyTextCount += 1
        const fgRaw = parseRgba(style.color)
        const bgResult = resolveBackground(el)
        if (bgResult.unknown) {
          contrastUnknownCount += 1
          continue
        }
        if (fgRaw) {
          const effectiveAlpha = fgRaw[3] * Number.parseFloat(style.opacity)
          const fg = compositeOver([fgRaw[0], fgRaw[1], fgRaw[2], effectiveAlpha], bgResult.color)
          const isLarge = fontSize >= 24 || (fontSize >= 18.66 && Number.parseInt(style.fontWeight, 10) >= 700)
          const minRatio = isLarge ? 3.0 : 4.5
          if (contrastRatio(fg, bgResult.color) < minRatio) lowContrastCount += 1
        }
      }
      let nonConcentricRadiusCount = 0
      for (const parent of cards) {
        const pStyle = getComputedStyle(parent)
        const pBox = parent.getBoundingClientRect()
        const pRadius = Number.parseFloat(pStyle.borderTopLeftRadius)
        const pPadTop = Number.parseFloat(pStyle.paddingTop)
        const pPadLeft = Number.parseFloat(pStyle.paddingLeft)
        const pPadRight = Number.parseFloat(pStyle.paddingRight)
        const pPad = Math.min(pPadTop, pPadLeft)
        if (pRadius < 6 || pPad < 4) continue
        const maxInnerRadius = Math.max(0, pRadius - pPad)
        for (const child of parent.children) {
          if (!visible(child)) continue
          const cStyle = getComputedStyle(child)
          const cBox = child.getBoundingClientRect()
          const cRadius = Number.parseFloat(cStyle.borderTopLeftRadius)
          if (cRadius <= 0) continue
          if (cRadius >= Math.min(cBox.width, cBox.height) * 0.45) continue
          const nearCorner = Math.abs(cBox.left - (pBox.left + pPadLeft)) <= 16 || Math.abs(cBox.right - (pBox.right - pPadRight)) <= 16
          if (nearCorner && cRadius > maxInnerRadius + 1) nonConcentricRadiusCount += 1
        }
      }
      return {
        nestedCards,
        skippedHeadingLevels,
        tinyTextCount,
        lowContrastCount,
        contrastUnknownCount,
        nonConcentricRadiusCount,
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
      }
    })
    antiPatterns.push({ width, route: result.route, ...audit })
    await page.close()
  }
  const output = { advisory: true, target, metrics, antiPatterns }
  if (process.argv.includes('--json')) process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
  else {
    for (const metric of metrics) process.stdout.write(`${metric.route} ${metric.width}px title=${metric.titleCount} secondary=${metric.secondaryCopyCount} text-action=${metric.textActionCount} icon-only=${metric.iconOnlyActionCount} surface=${metric.surfaceCount} pill=${metric.pillCount} divider=${metric.dividerCount}\n`)
    for (const item of antiPatterns) {
      const issues = []
      if (item.nestedCards > 0) issues.push(`nested-cards=${item.nestedCards}`)
      if (item.skippedHeadingLevels.length > 0) issues.push(`skipped-headings=${item.skippedHeadingLevels.join(',')}`)
      if (item.tinyTextCount > 0) issues.push(`tiny-text=${item.tinyTextCount}`)
      if (item.lowContrastCount > 0) issues.push(`low-contrast=${item.lowContrastCount}`)
      if (item.contrastUnknownCount > 0) issues.push(`contrast-unknown=${item.contrastUnknownCount}`)
      if (item.nonConcentricRadiusCount > 0) issues.push(`non-concentric-radius=${item.nonConcentricRadiusCount}`)
      if (item.horizontalOverflow) issues.push('horizontal-overflow=true')
      if (issues.length > 0) process.stdout.write(`${item.route} ${item.width}px anti-patterns: ${issues.join(' ')}\n`)
    }
  }
} finally {
  await browser.close()
}
