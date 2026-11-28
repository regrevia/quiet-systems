/**
 * Pure geometry, color, shadow, and contrast helpers shared between Node unit
 * tests and the Chromium DOM audit in scripts/measure-composition.mjs.
 *
 * `browserHelperSource()` serialises these exact functions into the page so
 * the browser runtime and the Node tests always execute the same implementation.
 */

export function parseRgbColor(value) {
  if (!value || value === 'transparent') return [0, 0, 0, 0]
  const rgb = value.match(/^rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i)
  if (!rgb) return null
  const alphaRaw = rgb[4]
  const alpha = alphaRaw === undefined ? 1 : (alphaRaw.endsWith('%') ? Number.parseFloat(alphaRaw) / 100 : Number.parseFloat(alphaRaw))
  return [Number.parseFloat(rgb[1]), Number.parseFloat(rgb[2]), Number.parseFloat(rgb[3]), alpha]
}

export function splitShadowLayers(value) {
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

export function hasVisibleShadow(boxShadow, resolveColor = parseRgbColor) {
  if (!boxShadow || boxShadow === 'none') return false
  for (const layer of splitShadowLayers(boxShadow)) {
    const lengths = [...layer.matchAll(/(?:^|\s)(-?[\d.]+)px\b/g)].map((m) => Math.abs(Number.parseFloat(m[1])))
    if (lengths.length > 0 && lengths.every((len) => len === 0)) continue
    if (/\bcurrentcolor\b/i.test(layer)) return true
    const colorMatch = layer.match(/(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\([^)]*\)|#[0-9a-f]{3,8}\b/i)
    if (!colorMatch) continue
    const rgba = resolveColor(colorMatch[0])
    if (rgba && rgba[3] > 0.01) return true
  }
  return false
}

export function sourceOver(top, bottom) {
  const alpha = top[3] + bottom[3] * (1 - top[3])
  if (alpha <= 0) return [0, 0, 0, 0]
  return [
    (top[0] * top[3] + bottom[0] * bottom[3] * (1 - top[3])) / alpha,
    (top[1] * top[3] + bottom[1] * bottom[3] * (1 - top[3])) / alpha,
    (top[2] * top[3] + bottom[2] * bottom[3] * (1 - top[3])) / alpha,
    alpha
  ]
}

export function luminance(rgb) {
  const channel = (v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2])
}

export function contrastRatio(fg, bg) {
  const l1 = luminance(fg)
  const l2 = luminance(bg)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

export function resolveCanvasFallback(rootScheme) {
  const normalized = (rootScheme || '').trim().toLowerCase()
  const darkOnly = normalized === 'dark' || normalized.startsWith('dark only') || normalized === 'only dark'
  const ambiguous = normalized.includes('dark') && normalized.includes('light')
  if (ambiguous) return { unknown: true }
  return { unknown: false, color: darkOnly ? [18, 18, 18, 1] : [255, 255, 255, 1] }
}

export function resolveContrastChain(fgRaw, chain, rootScheme = '') {
  if (!fgRaw) return { unknown: true }
  let fgPixel = [...fgRaw]
  let bgPixel = [0, 0, 0, 0]
  for (const node of chain) {
    if (bgPixel[3] < 0.99 && node.hasBgImage) return { unknown: true }
    if (node.bgColor === null) return { unknown: true }
    if (node.bgColor[3] > 0.01) {
      fgPixel = sourceOver(fgPixel, node.bgColor)
      bgPixel = sourceOver(bgPixel, node.bgColor)
    }
    if (node.opacity < 1) {
      fgPixel = [fgPixel[0], fgPixel[1], fgPixel[2], fgPixel[3] * node.opacity]
      bgPixel = [bgPixel[0], bgPixel[1], bgPixel[2], bgPixel[3] * node.opacity]
    }
  }
  if (bgPixel[3] < 0.99) {
    const fallback = resolveCanvasFallback(rootScheme)
    if (fallback.unknown) return { unknown: true }
    fgPixel = sourceOver(fgPixel, fallback.color)
    bgPixel = sourceOver(bgPixel, fallback.color)
  }
  return { unknown: false, fg: fgPixel, bg: bgPixel }
}

export function isNonConcentricChild({ parentBox, parentRadius, parentPadding, childBox, childRadius }) {
  const pPad = Math.min(parentPadding.top, parentPadding.left)
  if (parentRadius < 6 || pPad < 4 || pPad >= parentRadius) return false
  if (childRadius <= 0) return false
  if (childRadius >= Math.min(childBox.width, childBox.height) * 0.45) return false
  const nearX = Math.abs(childBox.left - (parentBox.left + parentPadding.left)) <= 16 || Math.abs(childBox.right - (parentBox.right - parentPadding.right)) <= 16
  const nearY = Math.abs(childBox.top - (parentBox.top + parentPadding.top)) <= 16 || Math.abs(childBox.bottom - (parentBox.bottom - parentPadding.bottom)) <= 16
  return nearX && nearY && childRadius > parentRadius - pPad + 1
}

export function browserHelperSource() {
  const fns = [
    parseRgbColor,
    splitShadowLayers,
    hasVisibleShadow,
    sourceOver,
    luminance,
    contrastRatio,
    resolveCanvasFallback,
    resolveContrastChain,
    isNonConcentricChild
  ].map((fn) => fn.toString()).join('\n')
  return `(() => {\n${fns}\nwindow.__uiGuardMath = { parseRgbColor, splitShadowLayers, hasVisibleShadow, sourceOver, luminance, contrastRatio, resolveCanvasFallback, resolveContrastChain, isNonConcentricChild }\n})()`
}
