import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { recoveryAction, visibleData } from '../examples/view-state-contract.ts'

test('partial failure offers recovery only for the affected retryable record', () => {
  const fixture = new URL('../examples/fixtures/partial-failure.json', import.meta.url)
  const { items, failedItems } = JSON.parse(readFileSync(fixture, 'utf8'))
  const state = { kind: 'partial', data: items, failedItems }

  assert.equal(visibleData(state), items)
  assert.equal(recoveryAction(state), 'none')
  assert.equal(recoveryAction(state, items[0].id), 'none')
  assert.equal(recoveryAction(state, failedItems[0].id), 'retry')

  failedItems[0].retryable = false
  assert.equal(recoveryAction(state, failedItems[0].id), 'none')
})
