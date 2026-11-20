import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { adaptDemoPayload, adaptProductionPayload } from '../examples/production-adapter.ts'

test('product and prototype entries select their data source explicitly', () => {
  const fixture = JSON.parse(readFileSync(new URL('../examples/fixtures/partial-failure.json', import.meta.url)))
  assert.throws(() => adaptProductionPayload(fixture), /Fixture marker/)
  const preview = adaptDemoPayload(fixture)
  assert.equal(preview.failedItems[0].reason, fixture.failedItems[0].reason)
  assert.equal('__source' in preview, false)
  assert.throws(() => adaptDemoPayload({ ...fixture, __source: 'unknown' }), /Unknown fixture/)
  const live = { state: 'ready', items: [{ id: 'branch-a', name: '南馆', status: 'ready', count: 0 }] }
  assert.deepEqual(adaptProductionPayload(live), live)
})
