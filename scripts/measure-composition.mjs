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
    await page.evaluate(() => {
      const probeCanvas = document.createElement('canvas')
      probeCanvas.width = 1
      probeCanvas.height = 1
      const probeCtx = probeCanvas.getContext('2d', { willReadFrequently: true })
      const colorCache = new Map()
      const parseColor = (value) => {
        if (!value || value === 'transparent') return [0, 0, 0, 0]
        if (colorCache.has(value)) return colorCache.get(value)
        let parsed = null
        const rgb = value.match(/^rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i)
        if (rgb) {
          const alphaRaw = rgb[4]
          const alpha = alphaRaw === undefined ? 1 : (alphaRaw.endsWith('%') ? Number.parseFloat(alphaRaw) / 100 : Number.parseFloat(alphaRaw))
          parsed = [Number.parseFloat(rgb[1]), Number.parseFloat(rgb[2]), Number.parseFloat(rgb[3]), alpha]
        } else if (probeCtx && typeof CSS !== 'undefined' && CSS.supports('color', value)) {
          probeCtx.clearRect(0, 0, 1, 1)
          probeCtx.fillStyle = value
          probeCtx.fillRect(0, 0, 1, 1)
          const [r, g, b, a] = probeCtx.getImageData(0, 0, 1, 1).data
          parsed = [r, g, b, a / 255]
        }
        colorCache.set(value, parsed)
        return parsed
      }
      const splitShadowLayers = (value) => {
        const layers = []
        let depth = 0
        let start = 0
        for (let i = 0; i < value.length; i += 1) {
          if (value[i] === '(') depth += 1
          else if (value[i] === ')') depth = Math.max(0, depth - 1)
          else if (value[i] === ',' && depth === 0) {
            layers.push(value.slice(start, i).trim())
            start = i + 1
          }
        }
        layers.push(value.slice(start).trim())
        return layers.filter(Boolean)
      }
      const hasVisibleShadow = (boxShadow) => {
        if (!boxShadow || boxShadow === 'none') return false
        for (const layer of splitShadowLayers(boxShadow)) {
          const lengths = [...layer.matchAll(/(?:^|\s)(-?[\d.]+)px\b/g)].map((m) => Math.abs(Number.parseFloat(m[1])))
          if (lengths.length > 0 && lengths.every((len) => len === 0)) continue
          const colorMatch = layer.match(/(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\([^)]*\)|#[0-9a-f]{3,8}\b/i)
          if (!colorMatch) continue
          const rgba = parseColor(colorMatch[0])
          if (rgba && rgba[3] > 0.01) return true
        }
        return false
      }
      const visible = (element) => {
        const style = getComputedStyle(element)
        const box = element.getBoundingClientRect()
        return style.display !== 'none' && style.visibility !== 'hidden' && Number.parseFloat(style.opacity) > 0 && box.width > 0 && box.height > 0
      }
      const hasVisibleBg = (color) => {
        const rgba = parseColor(color)
        return Boolean(rgba && rgba[3] >= 0.1)
      }
      const hasVisibleBorderSide = (style, side) =>
        Number.parseFloat(style[`border${side}Width`]) > 0 && style[`border${side}Style`] !== 'none' && hasVisibleBg(style[`border${side}Color`])
      const hasFullBorder = (style) =>
        ['Top', 'Right', 'Bottom', 'Left'].every((side) => hasVisibleBorderSide(style, side))
      const isRowOrCellRole = (element) =>
        ['row', 'cell', 'gridcell', 'columnheader', 'rowheader'].includes((element.getAttribute('role') || '').toLowerCase())
      window.__uiGuardDom = Object.assign({}, {
        parseColor,
        hasVisibleShadow,
        visible,
        hasVisibleBg,
        hasVisibleBorderSide,
        hasFullBorder,
        isRowOrCellRole
      })
    })
    const result = await page.evaluate(() => {
      const { visible, hasVisibleBg, hasVisibleBorderSide, hasFullBorder, hasVisibleShadow, isRowOrCellRole } = window.__uiGuardDom
      const textOf = (element) => (element.innerText || '').replace(/\s+/g, ' ').trim()
      const nearestVisibleBg = (element) => {
        let current = element
        while (current) {
          const bg = getComputedStyle(current).backgroundColor
          if (hasVisibleBg(bg)) return bg
          current = current.parentElement
        }
        return 'rgb(255, 255, 255)'
      }
      const hasSingleSideDividerBorder = (style) => {
        const sides = ['Top', 'Right', 'Bottom', 'Left'].filter((side) => hasVisibleBorderSide(style, side))
        return sides.length === 1 && (sides[0] === 'Top' || sides[0] === 'Bottom')
      }
      const hasSurfaceFrame = (element) => {
        if (!visible(element) || isRowOrCellRole(element)) return false
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
        if (Math.abs(box.width - box.height) <= 2 && text.length <= 2 && !/^\d+$/.test(text)) return false
        const radius = Number.parseFloat(style.borderTopLeftRadius)
        return radius >= box.height * 0.45 && (hasVisibleBg(style.backgroundColor) || hasFullBorder(style))
      }
      const actions = [...document.querySelectorAll('button, a')].filter(visible)
      const surfaces = new Set()
      const hasTrackedAncestor = (element) => {
        let parent = element.parentElement
        while (parent) {
          if (surfaces.has(parent)) return true
          parent = parent.parentElement
        }
        return false
      }
      for (const element of document.querySelectorAll('[class*="card"], [class*="panel"], [class*="surface"], [class*="tile"], [data-surface]')) {
        if (visible(element) && !hasTrackedAncestor(element)) surfaces.add(element)
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
      const { parseColor, hasVisibleShadow, visible, hasFullBorder, isRowOrCellRole } = window.__uiGuardDom
      const sourceOver = (top, bottom) => {
        const alpha = top[3] + bottom[3] * (1 - top[3])
        if (alpha <= 0) return [0, 0, 0, 0]
        return [
          (top[0] * top[3] + bottom[0] * bottom[3] * (1 - top[3])) / alpha,
          (top[1] * top[3] + bottom[1] * bottom[3] * (1 - top[3])) / alpha,
          (top[2] * top[3] + bottom[2] * bottom[3] * (1 - top[3])) / alpha,
          alpha
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
      const rootScheme = (getComputedStyle(document.documentElement).colorScheme || '').trim().toLowerCase()
      const resolveContrastColors = (element, fgRaw) => {
        let fgPixel = [...fgRaw]
        let bgPixel = [0, 0, 0, 0]
        let current = element
        while (current) {
          const style = getComputedStyle(current)
          const opacity = Number.parseFloat(style.opacity)
          if (bgPixel[3] < 0.99 && style.backgroundImage && style.backgroundImage !== 'none') return { unknown: true }
          const rawBg = style.backgroundColor
          const bgColor = parseColor(rawBg)
          if (bgColor === null) return { unknown: true }
          if (bgColor[3] > 0.01) {
            fgPixel = sourceOver(fgPixel, bgColor)
            bgPixel = sourceOver(bgPixel, bgColor)
          }
          if (opacity < 1) {
            fgPixel = [fgPixel[0], fgPixel[1], fgPixel[2], fgPixel[3] * opacity]
            bgPixel = [bgPixel[0], bgPixel[1], bgPixel[2], bgPixel[3] * opacity]
          }
          current = current.parentElement
        }
        if (bgPixel[3] < 0.99) {
          const darkOnly = rootScheme === 'dark' || rootScheme.startsWith('dark only') || rootScheme === 'only dark'
          const ambiguousScheme = rootScheme.includes('dark') && rootScheme.includes('light')
          if (ambiguousScheme) return { unknown: true }
          const canvasFallback = darkOnly ? [18, 18, 18, 1] : [255, 255, 255, 1]
          fgPixel = sourceOver(fgPixel, canvasFallback)
          bgPixel = sourceOver(bgPixel, canvasFallback)
        }
        return { unknown: false, fg: fgPixel, bg: bgPixel }
      }
      const isCardLike = (element) => {
        if (!visible(element) || isRowOrCellRole(element)) return false
        const style = getComputedStyle(element)
        const box = element.getBoundingClientRect()
        if (box.width < 80 || box.height < 48 || box.width >= window.innerWidth * 0.98) return false
        return hasFullBorder(style) || hasVisibleShadow(style.boxShadow)
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
        const fgRaw = parseColor(style.color)
        if (fgRaw === null) {
          contrastUnknownCount += 1
          continue
        }
        const resolved = resolveContrastColors(el, fgRaw)
        if (resolved.unknown) {
          contrastUnknownCount += 1
          continue
        }
        const isLarge = fontSize >= 24 || (fontSize >= 18.66 && Number.parseInt(style.fontWeight, 10) >= 700)
        const minRatio = isLarge ? 3.0 : 4.5
        if (contrastRatio(resolved.fg, resolved.bg) < minRatio) lowContrastCount += 1
      }
      let nonConcentricRadiusCount = 0
      for (const parent of cards) {
        const pStyle = getComputedStyle(parent)
        const pBox = parent.getBoundingClientRect()
        const pRadius = Number.parseFloat(pStyle.borderTopLeftRadius)
        const pPadTop = Number.parseFloat(pStyle.paddingTop)
        const pPadBottom = Number.parseFloat(pStyle.paddingBottom)
        const pPadLeft = Number.parseFloat(pStyle.paddingLeft)
        const pPadRight = Number.parseFloat(pStyle.paddingRight)
        const pPad = Math.min(pPadTop, pPadLeft)
        if (pRadius < 6 || pPad < 4 || pPad >= pRadius) continue
        const maxInnerRadius = pRadius - pPad
        for (const child of parent.children) {
          if (!visible(child)) continue
          const cStyle = getComputedStyle(child)
          const cBox = child.getBoundingClientRect()
          const cRadius = Number.parseFloat(cStyle.borderTopLeftRadius)
          if (cRadius <= 0) continue
          if (cRadius >= Math.min(cBox.width, cBox.height) * 0.45) continue
          const nearX = Math.abs(cBox.left - (pBox.left + pPadLeft)) <= 16 || Math.abs(cBox.right - (pBox.right - pPadRight)) <= 16
          const nearY = Math.abs(cBox.top - (pBox.top + pPadTop)) <= 16 || Math.abs(cBox.bottom - (pBox.bottom - pPadBottom)) <= 16
          if (nearX && nearY && cRadius > maxInnerRadius + 1) nonConcentricRadiusCount += 1
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
