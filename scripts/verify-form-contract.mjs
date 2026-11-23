// Call after the page has reached the state described by the product brief.
import assert from 'node:assert/strict'

const fieldRoles = [
  'textbox', 'searchbox', 'spinbutton', 'combobox', 'listbox',
  'checkbox', 'radio', 'switch', 'slider'
]

export async function verifyFormContract(scope, { fields, absentText = [] }) {
  assert.equal(await scope.count(), 1, 'The contract must target one rendered region')
  assert(await scope.isVisible(), 'The contract region must be visible')
  assert(Array.isArray(absentText), 'Supply forbidden phrases as an array')
  assert(Array.isArray(fields), 'Supply the expected fields, including an empty array for a field-free state')
  for (const field of fields) {
    assert(fieldRoles.includes(field.role), 'Unsupported field role: ' + field.role)
    assert(typeof field.name === 'string' && field.name.trim(), 'Supply an accessible field name')
  }
  for (const role of fieldRoles) {
    const expected = fields.filter(field => field.role === role)
    const actualCount = await scope.getByRole(role).count()
    assert.equal(actualCount, expected.length, 'Unexpected number of ' + role + ' fields')
    for (const name of new Set(expected.map(field => field.name))) {
      const matches = scope.getByRole(role, { name, exact: true })
      assert.equal(await matches.count(), expected.filter(field => field.name === name).length,
        'Unexpected accessible name inventory for ' + role + ': ' + name)
    }
  }
  for (const phrase of absentText) {
    assert(typeof phrase === 'string' && phrase.trim(), 'Supply a nonempty forbidden phrase')
    const matches = scope.getByText(phrase, { exact: true })
    for (const match of await matches.all()) {
      assert(!await match.isVisible(), 'Unexpected visible copy: ' + phrase)
    }
  }
}
