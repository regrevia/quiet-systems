// reviewer-contract.md is handed to another model together with a target project,
// so it is the only place the reviewer learns what a complete report contains. The
// checker that scores those reports lives in validate-review-report.mjs. If the two
// drift, a reviewer produces a report the project then rejects — or worse, one it
// accepts while a required check was never mentioned anywhere.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const contract = fs.readFileSync('reviewer-contract.md', 'utf8')
const checker = fs.readFileSync(path.join('scripts', 'validate-review-report.mjs'), 'utf8')

function evidenceNames() {
  const start = checker.indexOf('const requiredEvidence = [')
  const end = checker.indexOf('const evidencePattern')
  assert.ok(start > 0 && end > start, 'validate-review-report.mjs no longer declares requiredEvidence')
  return [...checker.slice(start, end).matchAll(/\{ name: '([^']+)', pattern: /g)].map((match) => match[1])
}

function sectionNames() {
  const start = checker.indexOf('const requiredSections = [')
  const end = checker.indexOf('const missing =')
  return [...checker.slice(start, end).matchAll(/\{ name: '([^']+)', pattern: /g)].map((match) => match[1])
}

test('every strict evidence item the checker requires is named in the contract', () => {
  const names = evidenceNames()
  assert.equal(names.length, 10, 'the strict checklist changed size; update the contract and this test together')
  const missing = names.filter((name) => !contract.includes(name))
  assert.deepEqual(missing, [], 'a reviewer cannot supply evidence it was never asked for: ' + missing.join(', '))
})

test('the contract does not document a check the checker dropped', () => {
  for (const name of ['design contract', 'interaction inventory', 'field mapping', 'state matrix', 'viewport evidence', 'composition metrics', 'empty-space pressure', 'text-button pressure', 'decoration pressure', 'copy deletion check']) {
    assert.ok(contract.includes(name), `${name} is quoted in the contract but no longer exists — update both`)
  }
})

test('the fixed output order matches the order the checker enforces', () => {
  const names = sectionNames()
  assert.deepEqual(names, ['P0', 'P1', 'P2', 'verified', 'unverified'])
  const positions = ['1. `P0`', '2. `P1`', '3. `P2`', '4. 已验证的约束', '5. 尚未验证的项目'].map((line) => contract.indexOf(line))
  assert.ok(positions.every((position) => position > 0), 'the contract no longer lists the five sections in order')
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, 'the contract lists the sections out of order')
  assert.match(checker, /sections must be ordered P0, P1, P2, verified, unverified/)
})

test('the read-only promise is stated before the reviewer is told what to look at', () => {
  const promise = contract.indexOf('不要修改任何文件')
  const checklist = contract.indexOf('使用 UI Guard 的设计约束')
  assert.ok(promise > 0, 'the contract no longer forbids editing the workspace')
  assert.ok(promise < checklist, 'the read-only rule must come before the review checklist, not after it')
})

test('rewriting the contract keeps the pressure checks paired with evidence', () => {
  // The three pressure checks are only meaningful with a location, because a
  // deletion argument without a file is an opinion.
  for (const name of ['empty-space pressure', 'text-button pressure', 'decoration pressure', 'copy deletion check']) {
    const line = contract.split('\n').find((text) => text.startsWith(`- ${name}`))
    assert.ok(line, `${name} needs its own bullet in the contract`)
    assert.match(line, /`[^`]+\.(?:tsx?|css|md):\d+`/, `${name} must show where the evidence is`)
  }
})

// The contract tells an outside reviewer which states to look for. The union in
// examples/view-state-contract.ts is what a project actually renders. If the
// contract names a state the union does not have, the reviewer hunts for a
// screen that cannot exist and skips the one that can.
const stateNames = {
  loading: '加载',
  ready: '真实数据',
  empty: '空状态',
  error: '错误',
  permission: '权限',
  offline: '离线',
  partial: '部分失败',
  recovered: '恢复'
}

function unionKinds() {
  const source = fs.readFileSync(path.join('examples', 'view-state-contract.ts'), 'utf8')
  const start = source.indexOf('export type ViewState<T> =')
  const end = source.indexOf('export type RecoveryAction')
  assert.ok(start > 0 && end > start, 'examples/view-state-contract.ts no longer declares ViewState')
  return [...source.slice(start, end).matchAll(/\{ kind: '([a-z]+)'/g)].map((match) => match[1]).sort()
}

test('the contract lists one state word per member of the view-state union', () => {
  const kinds = unionKinds()
  assert.equal(kinds.length, 8, `the union has ${kinds.length} kinds; the contract must be updated with it`)
  assert.deepEqual(Object.keys(stateNames).sort(), kinds)
  assert.equal(new Set(Object.values(stateNames)).size, 8, 'eight distinct words, one per kind')
})

test('every state word appears on the contract line that describes state coverage', () => {
  const line = contract.split('\n').find((text) => text.includes('状态是否与原型一致'))
  assert.ok(line, 'the contract no longer asks whether every state matches the prototype')
  for (const word of Object.values(stateNames)) {
    assert.ok(line.includes(word), `the contract does not name the ${word} state`)
  }
  assert.ok(!line.includes('陈旧'), 'the contract still names a state the union does not define')
  assert.match(line, /八种状态/, 'the contract should say how many states a reviewer checks')
})

test('the README and the review reference both point at the contract', () => {
  const readme = fs.readFileSync('README.md', 'utf8')
  assert.ok(readme.includes('`reviewer-contract.md`'), 'README.md no longer mentions the reviewer contract')
  const review = fs.readFileSync(path.join('references', 'review.md'), 'utf8')
  assert.ok(review.includes('[reviewer contract](../reviewer-contract.md)'), 'references/review.md no longer links the contract')
  assert.ok(fs.existsSync('reviewer-contract.md'), 'the contract file the docs link to is missing')
})
