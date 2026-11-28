#!/usr/bin/env node

import { browserHelperSource } from './composition-helpers.mjs'

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
  const helperScript = browserHelperSource()
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } })
    await page.goto(target, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(250)
    await page.addScriptTag({ content: helperScript })
    await page.evaluate(() => {
      const math = window.__uiGuardMath
      const probeCanvas = document.createElement('canvas')
      probeCanvas.width = 1
      probeCanvas.height = 1
      const probeCtx = probeCanvas.getContext('2d', { willReadFrequently: true })
      const colorCache = new Map()
      const parseColor = (value) => {
        if (colorCache.has(value)) return colorCache.get(value)
        let parsed = math.parseRgbColor(value)
        if (parsed === null && value && probeCtx && typeof CSS !== 'undefined' && CSS.supports('color', value)) {
          probeCtx.clearRect(0, 0, 1, 1)
          probeCtx.fillStyle = value
          probeCtx.fillRect(0, 0, 1, 1)
          const [r, g, b, a] = probeCtx.getImageData(0, 0, 1, 1).data
          parsed = [r, g, b, a / 255]
        }
        colorCache.set(value, parsed)
        return parsed
      }
      const hasVisibleShadow = (boxShadow) => math.hasVisibleShadow(boxShadow, parseColor)
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
      const { contrastRatio, resolveContrastChain, isNonConcentricChild, isTightCjkParagraph, isCrampedSmallCjkBold, isNumericCellText, isTabularOrMonospace } = window.__uiGuardMath
      const rootScheme = getComputedStyle(document.documentElement).colorScheme || ''
      const countRenderedLines = (element) => {
        const range = document.createRange()
        range.selectNodeContents(element)
        const tops = []
        for (const rect of range.getClientRects()) {
          if (rect.width <= 0 || rect.height <= 0) continue
          if (!tops.some((top) => Math.abs(top - rect.top) <= 3)) tops.push(rect.top)
        }
        return tops.length
      }
      const nearestBlockAncestor = (element) => {
        let current = element
        while (current && current !== document.body) {
          const display = getComputedStyle(current).display
          if (display === 'block' || display === 'flex' || display === 'grid' || display === 'list-item' || display === 'table-cell') return current
          current = current.parentElement
        }
        return element
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
      let tightCjkLineHeightCount = 0
      const crampedCjkBlocks = new Set()
      const textElements = [...document.querySelectorAll('div, p, span, a, button, label, li, td, th, small, h1, h2, h3, h4, h5, h6')].filter(visible)
      for (const el of textElements) {
        const directText = [...el.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent.trim()).join('')
        if (!directText) continue
        const style = getComputedStyle(el)
        const fontSize = Number.parseFloat(style.fontSize)
        const fontWeight = Number.parseInt(style.fontWeight, 10)
        if (fontSize < 12) tinyTextCount += 1
        if (el.getAttribute('aria-hidden') !== 'true' && isCrampedSmallCjkBold({ text: directText, fontSize, fontWeight })) {
          crampedCjkBlocks.add(nearestBlockAncestor(el))
        }
        const fgRaw = parseColor(style.color)
        const chain = []
        let current = el
        while (current) {
          const cStyle = getComputedStyle(current)
          chain.push({
            bgColor: parseColor(cStyle.backgroundColor),
            opacity: Number.parseFloat(cStyle.opacity),
            hasBgImage: Boolean(cStyle.backgroundImage && cStyle.backgroundImage !== 'none')
          })
          current = current.parentElement
        }
        const resolved = resolveContrastChain(fgRaw, chain, rootScheme)
        if (resolved.unknown) {
          contrastUnknownCount += 1
          continue
        }
        const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700)
        const minRatio = isLarge ? 3.0 : 4.5
        if (contrastRatio(resolved.fg, resolved.bg) < minRatio) lowContrastCount += 1
      }
      for (const el of [...document.querySelectorAll('p, li, dd, blockquote')].filter(visible)) {
        const text = (el.innerText || '').trim()
        const style = getComputedStyle(el)
        const fontSize = Number.parseFloat(style.fontSize)
        const lineCount = countRenderedLines(el)
        if (isTightCjkParagraph({ text, fontSize, lineHeightRaw: style.lineHeight, lineCount })) {
          tightCjkLineHeightCount += 1
        }
      }
      let nonTabularNumericColumns = 0
      const tableContainers = [...document.querySelectorAll('table, [role="table"], [role="grid"]')].filter(visible)
      for (const table of tableContainers) {
        const rows = [...table.querySelectorAll('tr, [role="row"]')].filter(visible)
        if (rows.length < 3) continue
        const columns = new Map()
        for (const row of rows) {
          const cells = [...row.querySelectorAll('td, [role="cell"], [role="gridcell"]')].filter(visible)
          cells.forEach((cell, colIndex) => {
            if (!isNumericCellText(cell.innerText)) return
            if (!columns.has(colIndex)) columns.set(colIndex, [])
            columns.get(colIndex).push(cell)
          })
        }
        for (const cells of columns.values()) {
          if (cells.length < 3) continue
          const hasNonTabular = cells.some((cell) => {
            const style = getComputedStyle(cell)
            return !isTabularOrMonospace({ fontVariantNumeric: style.fontVariantNumeric, fontFamily: style.fontFamily })
          })
          if (hasNonTabular) nonTabularNumericColumns += 1
        }
      }
      let nonConcentricRadiusCount = 0
      for (const parent of cards) {
        const pStyle = getComputedStyle(parent)
        const pBox = parent.getBoundingClientRect()
        const parentRadius = Number.parseFloat(pStyle.borderTopLeftRadius)
        const parentPadding = {
          top: Number.parseFloat(pStyle.paddingTop),
          bottom: Number.parseFloat(pStyle.paddingBottom),
          left: Number.parseFloat(pStyle.paddingLeft),
          right: Number.parseFloat(pStyle.paddingRight)
        }
        for (const child of parent.children) {
          if (!visible(child)) continue
          const cStyle = getComputedStyle(child)
          const childRadius = Number.parseFloat(cStyle.borderTopLeftRadius)
          if (isNonConcentricChild({ parentBox: pBox, parentRadius, parentPadding, childBox: child.getBoundingClientRect(), childRadius })) {
            nonConcentricRadiusCount += 1
          }
        }
      }
      return {
        nestedCards,
        skippedHeadingLevels,
        tinyTextCount,
        lowContrastCount,
        contrastUnknownCount,
        nonConcentricRadiusCount,
        tightCjkLineHeightCount,
        crampedSmallCjkBoldCount: crampedCjkBlocks.size,
        nonTabularNumericColumns,
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
      if (item.tightCjkLineHeightCount > 0) issues.push(`tight-cjk-line-height=${item.tightCjkLineHeightCount}`)
      if (item.crampedSmallCjkBoldCount > 0) issues.push(`cramped-cjk-bold=${item.crampedSmallCjkBoldCount}`)
      if (item.nonTabularNumericColumns > 0) issues.push(`non-tabular-columns=${item.nonTabularNumericColumns}`)
      if (item.horizontalOverflow) issues.push('horizontal-overflow=true')
      if (issues.length > 0) process.stdout.write(`${item.route} ${item.width}px anti-patterns: ${issues.join(' ')}\n`)
    }
  }
} finally {
  await browser.close()
}
