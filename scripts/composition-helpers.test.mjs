import assert from 'node:assert/strict'
import test from 'node:test'
import vm from 'node:vm'
import {
  browserHelperSource,
  contrastRatio,
  hasVisibleShadow,
  isCrampedSmallCjkBold,
  isNonConcentricChild,
  isNumericCellText,
  isTabularOrMonospace,
  isTightCjkParagraph,
  parseRgbColor,
  resolveCanvasFallback,
  resolveContrastChain,
  resolveLineHeightRatio,
  sourceOver
} from './composition-helpers.mjs'

test('parseRgbColor handles transparent, float channels, percent alpha, and rejects non-rgb', () => {
  assert.deepEqual(parseRgbColor('transparent'), [0, 0, 0, 0])
  assert.deepEqual(parseRgbColor('rgba(12.5, 34, 56.5, 0.5)'), [12.5, 34, 56.5, 0.5])
  assert.deepEqual(parseRgbColor('rgb(255 0 128 / 50%)'), [255, 0, 128, 0.5])
  assert.deepEqual(parseRgbColor('rgba(0, 0, 0, 0)'), [0, 0, 0, 0])
  assert.equal(parseRgbColor('oklch(0.62 0.15 260)'), null)
})

test('hasVisibleShadow ignores transparent and all-zero shadows, keeps currentColor and oklch', () => {
  assert.equal(hasVisibleShadow('none'), false)
  assert.equal(hasVisibleShadow('rgba(0, 0, 0, 0) 0px 0px 0px 0px'), false)
  assert.equal(hasVisibleShadow('rgb(0, 0, 0) 0px 0px 0px 0px'), false)
  assert.equal(hasVisibleShadow('0px 4px 12px 0px currentColor'), true)
  assert.equal(hasVisibleShadow('0px 4px 12px 0px rgba(0, 0, 0, 0.12)'), true)
  assert.equal(hasVisibleShadow('0px 4px 12px 0px oklch(0.3 0.02 250 / 0.2)', (c) => (c.startsWith('oklch') ? [40, 42, 50, 0.2] : null)), true)
  assert.equal(hasVisibleShadow('0px 4px 12px 0px oklch(0.3 0.02 250 / 0)', () => [40, 42, 50, 0]), false)
})

test('resolveContrastChain composites translucent foreground, stacked ancestor opacity, and bg images', () => {
  const transparentFg = resolveContrastChain([0, 0, 0, 0], [{ bgColor: [255, 255, 255, 1], opacity: 1, hasBgImage: false }])
  assert.equal(transparentFg.unknown, false)
  assert.ok(contrastRatio(transparentFg.fg, transparentFg.bg) < 1.05)

  const nestedOpacity = resolveContrastChain([0, 0, 0, 1], [
    { bgColor: [0, 0, 0, 0], opacity: 0.5, hasBgImage: false },
    { bgColor: [0, 0, 0, 0], opacity: 0.5, hasBgImage: false },
    { bgColor: [255, 255, 255, 1], opacity: 1, hasBgImage: false }
  ])
  assert.equal(nestedOpacity.unknown, false)
  assert.ok(contrastRatio(nestedOpacity.fg, nestedOpacity.bg) < 2.0)

  const overImage = resolveContrastChain([255, 255, 255, 1], [
    { bgColor: [0, 0, 0, 0], opacity: 1, hasBgImage: true }
  ])
  assert.equal(overImage.unknown, true)

  const unparsed = resolveContrastChain([0, 0, 0, 1], [
    { bgColor: null, opacity: 1, hasBgImage: false }
  ])
  assert.equal(unparsed.unknown, true)
})

test('resolveCanvasFallback handles dark-only and ambiguous light-dark schemes', () => {
  assert.deepEqual(resolveCanvasFallback('dark'), { unknown: false, color: [18, 18, 18, 1] })
  assert.deepEqual(resolveCanvasFallback('light dark'), { unknown: true })
  assert.deepEqual(resolveCanvasFallback('normal'), { unknown: false, color: [255, 255, 255, 1] })
  assert.deepEqual(sourceOver([0, 0, 0, 0.5], [255, 255, 255, 1]), [127.5, 127.5, 127.5, 1])
})

test('isNonConcentricChild skips padding >= radius, pills, and center elements, catches corner violation', () => {
  const parentBox = { left: 0, right: 300, top: 0, bottom: 200 }
  assert.equal(isNonConcentricChild({
    parentBox,
    parentRadius: 8,
    parentPadding: { top: 24, bottom: 24, left: 24, right: 24 },
    childBox: { left: 24, right: 276, top: 24, bottom: 80, width: 252, height: 56 },
    childRadius: 6
  }), false)

  assert.equal(isNonConcentricChild({
    parentBox,
    parentRadius: 16,
    parentPadding: { top: 8, bottom: 8, left: 8, right: 8 },
    childBox: { left: 8, right: 292, top: 8, bottom: 60, width: 284, height: 52 },
    childRadius: 14
  }), true)

  assert.equal(isNonConcentricChild({
    parentBox,
    parentRadius: 16,
    parentPadding: { top: 8, bottom: 8, left: 8, right: 8 },
    childBox: { left: 8, right: 292, top: 80, bottom: 120, width: 284, height: 40 },
    childRadius: 14
  }), false)

  assert.equal(isNonConcentricChild({
    parentBox,
    parentRadius: 16,
    parentPadding: { top: 8, bottom: 8, left: 8, right: 8 },
    childBox: { left: 8, right: 96, top: 8, bottom: 40, width: 88, height: 32 },
    childRadius: 9999
  }), false)
})

test('CJK line-height, small bold, and tabular numeric helpers catch defects without false positives', () => {
  assert.equal(resolveLineHeightRatio('normal', 16), 1.2)
  assert.equal(resolveLineHeightRatio('24px', 16), 1.5)
  assert.equal(isTightCjkParagraph({ text: '这是一段超过十二个汉字的正文内容用于验证中文行高是否过紧', fontSize: 16, lineHeightRaw: 'normal', lineCount: 2 }), true)
  assert.equal(isTightCjkParagraph({ text: '这是一段超过十二个汉字的正文内容用于验证中文行高是否过紧', fontSize: 16, lineHeightRaw: '26px', lineCount: 2 }), false)
  assert.equal(isTightCjkParagraph({ text: '这是一段超过十二个汉字的正文内容用于验证中文行高是否过紧', fontSize: 16, lineHeightRaw: '20px', lineCount: 1 }), false)
  assert.equal(isTightCjkParagraph({ text: 'Short English paragraph with tight line height', fontSize: 16, lineHeightRaw: '20px', lineCount: 2 }), false)

  assert.equal(isCrampedSmallCjkBold({ text: '已归档', fontSize: 12, fontWeight: 700 }), true)
  assert.equal(isCrampedSmallCjkBold({ text: '已归档', fontSize: 12, fontWeight: 500 }), false)
  assert.equal(isCrampedSmallCjkBold({ text: '已归档', fontSize: 14, fontWeight: 700 }), false)
  assert.equal(isCrampedSmallCjkBold({ text: 'DRAFT', fontSize: 12, fontWeight: 700 }), false)

  assert.equal(isNumericCellText('$1,240.50'), true)
  assert.equal(isNumericCellText('98.5%'), true)
  assert.equal(isNumericCellText('14:30:05'), true)
  assert.equal(isNumericCellText('Room 2'), false)

  assert.equal(isTabularOrMonospace({ fontVariantNumeric: 'tabular-nums', fontFamily: 'sans-serif' }), true)
  assert.equal(isTabularOrMonospace({ fontVariantNumeric: 'normal', fontFamily: 'ui-monospace, SFMono-Regular' }), true)
  assert.equal(isTabularOrMonospace({ fontVariantNumeric: 'normal', fontFamily: 'Inter, sans-serif' }), false)
})

test('browserHelperSource exposes the same pure functions on window.__uiGuardMath', () => {
  const sandbox = { window: {} }
  vm.runInNewContext(browserHelperSource(), sandbox)
  assert.equal(typeof sandbox.window.__uiGuardMath.resolveContrastChain, 'function')
  assert.equal(typeof sandbox.window.__uiGuardMath.isNonConcentricChild, 'function')
  assert.equal(typeof sandbox.window.__uiGuardMath.isTightCjkParagraph, 'function')
  assert.deepEqual(Array.from(sandbox.window.__uiGuardMath.parseRgbColor('rgba(10, 20, 30, 0.5)')), [10, 20, 30, 0.5])
})
