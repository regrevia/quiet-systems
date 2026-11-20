/** Supply one count per expected source. Use null for a missing report. */
export function summarizeCounts(counts) {
  let sum = 0
  let reported = 0
  for (const count of counts) {
    if (count === null) continue
    if (!Number.isSafeInteger(count) || count < 0) throw new TypeError('Invalid count')
    sum += count
    if (!Number.isSafeInteger(sum)) throw new RangeError('Total exceeds safe integer precision')
    reported++
  }
  return { sum: reported ? sum : null, reported, expected: counts.length }
}
