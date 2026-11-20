import assert from 'node:assert/strict'
import test from 'node:test'
import { summarizeCounts } from '../examples/report/count-summary.mjs'

test('reported counts preserve coverage and a measured zero', () => {
  for (const [counts, sum, reported] of [
    [[12, null], 12, 1], [[null, null], null, 0], [[5, 0], 5, 2],
    [[0, null], 0, 1], [[0, 0], 0, 2], [[], null, 0]
  ]) {
    assert.deepEqual(summarizeCounts(counts), { sum, reported, expected: counts.length })
  }
})

test('invalid counts cannot silently change a displayed total', () => {
  for (const value of [NaN, -1, Infinity, 0.5, undefined, '12']) {
    assert.throws(() => summarizeCounts([value]), TypeError)
  }
  assert.throws(() => summarizeCounts([Number.MAX_SAFE_INTEGER, 1]), RangeError)
})
