// The evaluation doc closes with a list of hand-written claims that tests bind.
// The sentence introducing it states how many claims follow. Nothing counted
// that number, so it drifted: the list grew to six bullets while the sentence
// still said three. A reader who trusts the count stops reading early and never
// learns that half the claims are enforced.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const numerals = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 }

const doc = fs.readFileSync('docs/evaluation.md', 'utf8')

function bindingBullets() {
  const lines = doc.split('\n')
  const start = lines.findIndex((line) => /处手写清单由测试绑定/.test(line))
  assert.ok(start >= 0, 'docs/evaluation.md no longer introduces the list of bound claims')
  const bullets = []
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('- ')) bullets.push(line)
    else if (bullets.length > 0 && line.trim() === '') break
  }
  return bullets
}

test('the count before the bound-claim list matches the bullets under it', () => {
  const intro = doc.split('\n').find((line) => /处手写清单由测试绑定/.test(line))
  const stated = [...intro.matchAll(/([一二三四五六七八九十])处手写清单/g)].map((match) => numerals[match[1]])
  assert.equal(stated.length, 1, 'the intro states its count more than once, or in digits')
  assert.equal(stated[0], bindingBullets().length, `the intro says ${stated[0]} claims; ${bindingBullets().length} bullets follow`)
})

test('every bound claim names the test that binds it', () => {
  const bullets = bindingBullets()
  assert.ok(bullets.length > 0, 'the bound-claim list is empty')
  for (const bullet of bullets) {
    const cited = [...bullet.matchAll(/`(scripts\/[a-z-]+\.test\.mjs)`/g)].map((match) => match[1])
    assert.ok(cited.length > 0, `a bound claim credits no test: ${bullet.slice(0, 40)}`)
    for (const file of cited) {
      assert.ok(fs.existsSync(file), `the doc credits ${file}, which does not exist`)
    }
  }
})
