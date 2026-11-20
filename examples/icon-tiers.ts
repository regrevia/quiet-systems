/** Reference contract only. Tune these values for the consuming font and icon set. */
export type IconOpticalTier = 'inline' | 'control' | 'navigation' | 'hero'

export type IconMetrics = {
  box: number
  stroke: number
  baselineOffset: number
}

export type IconPlatform = 'web' | 'macos' | 'ios' | 'android'

// These values are starting points for optical balance. Validate them against
// the target font, icon set, density, and touch target in the consuming UI.

const baseMetrics: Record<IconOpticalTier, IconMetrics> = {
  inline: { box: 14, stroke: 1.5, baselineOffset: 0 },
  control: { box: 18, stroke: 1.5, baselineOffset: 0 },
  navigation: { box: 22, stroke: 1.75, baselineOffset: 0 },
  hero: { box: 32, stroke: 2, baselineOffset: 0 }
}

/** Returns a starting point for optical balance, not a universal asset size. */
export function iconMetrics(tier: IconOpticalTier, platform: IconPlatform): Readonly<IconMetrics> {
  const metrics = baseMetrics[tier]
  // iOS inline symbols often need a one-pixel optical correction beside text.
  if (platform === 'ios' && tier === 'inline') return { ...metrics, box: 15, baselineOffset: 0.5 }
  // Android controls commonly need a larger optical box for touch density.
  if (platform === 'android' && tier === 'control') return { ...metrics, box: 20 }
  // macOS navigation icons can use a smaller stroke at sidebar density.
  if (platform === 'macos' && tier === 'navigation') return { ...metrics, box: 20, stroke: 1.5 }
  return metrics
}
