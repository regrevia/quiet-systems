// verify-form-contract is the only form check that needs no browser: it reads a
// Playwright-like scope. The contract it enforces is the one the product brief
// states — these fields, these accessible names, and none of these phrases — so
// an empty state (fields: []) must pass and a missing field must fail.
import assert from 'node:assert/strict'
import test from 'node:test'

import { verifyFormContract } from './verify-form-contract.mjs'

function scope({ regions = 1, visible = true, fields = [], texts = [] } = {}) {
  const matches = (role, name) => fields.filter((field) => field.role === role && (name === undefined || field.name === name))
  return {
    count: async () => regions,
    isVisible: async () => visible,
    getByRole(role, options) {
      return { count: async () => matches(role, options?.name).length }
    },
    getByText(phrase) {
      return { all: async () => texts.filter((text) => text.phrase === phrase).map((text) => ({ isVisible: async () => text.visible })) }
    }
  }
}

test('accepts a form that matches the brief', async () => {
  await verifyFormContract(scope({ fields: [{ role: 'textbox', name: 'Room name' }, { role: 'switch', name: 'Recurring' }] }), {
    fields: [{ role: 'textbox', name: 'Room name' }, { role: 'switch', name: 'Recurring' }]
  })
})

test('accepts a field-free state, so an empty list means empty, not unchecked', async () => {
  await verifyFormContract(scope(), { fields: [] })
})

test('accepts a repeated accessible name when the brief says it repeats', async () => {
  const fields = [{ role: 'checkbox', name: 'Include' }, { role: 'checkbox', name: 'Include' }]
  await verifyFormContract(scope({ fields }), { fields })
})

test('rejects a field the page renders and the brief does not', async () => {
  await assert.rejects(
    verifyFormContract(scope({ fields: [{ role: 'textbox', name: 'Room name' }, { role: 'slider', name: 'Seats' }] }), { fields: [{ role: 'textbox', name: 'Room name' }] }),
    /Unexpected number of slider fields/
  )
})

test('rejects a field the brief wants and the page never renders', async () => {
  await assert.rejects(verifyFormContract(scope(), { fields: [{ role: 'searchbox', name: 'Find a room' }] }), /Unexpected number of searchbox fields/)
})

test('rejects a field whose accessible name differs from the brief', async () => {
  await assert.rejects(
    verifyFormContract(scope({ fields: [{ role: 'textbox', name: 'Name' }] }), { fields: [{ role: 'textbox', name: 'Room name' }] }),
    /Unexpected accessible name inventory for textbox: Room name/
  )
})

test('rejects visible copy the brief forbids', async () => {
  await assert.rejects(
    verifyFormContract(scope({ texts: [{ phrase: 'Optional', visible: true }] }), { fields: [], absentText: ['Optional'] }),
    /Unexpected visible copy: Optional/
  )
})

test('accepts a forbidden phrase that exists but stays hidden', async () => {
  await verifyFormContract(scope({ texts: [{ phrase: 'Optional', visible: false }] }), { fields: [], absentText: ['Optional'] })
})

test('rejects a region that resolves to more than one node', async () => {
  await assert.rejects(verifyFormContract(scope({ regions: 2 }), { fields: [] }), /target one rendered region/)
})

test('rejects a region that is not visible', async () => {
  await assert.rejects(verifyFormContract(scope({ visible: false }), { fields: [] }), /must be visible/)
})

test('rejects a role outside the supported set instead of counting zero', async () => {
  await assert.rejects(verifyFormContract(scope(), { fields: [{ role: 'datepicker', name: 'Day' }] }), /Unsupported field role: datepicker/)
})

test('rejects a field with no accessible name', async () => {
  await assert.rejects(verifyFormContract(scope(), { fields: [{ role: 'textbox', name: '  ' }] }), /Supply an accessible field name/)
})

test('rejects a call that forgets the field list', async () => {
  await assert.rejects(verifyFormContract(scope(), {}), /Supply the expected fields/)
})
