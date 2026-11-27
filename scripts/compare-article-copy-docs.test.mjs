// Three documents tell a reader how to run compare-article-copy.mjs and what its
// exit codes mean. A copy-paste command that no longer runs, or a code whose
// meaning drifted, sends a reader to the wrong conclusion about whether copy was
// preserved. Each documented form is extracted and executed here.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { spawnSync } from 'node:child_process'

const sites = ['docs/evaluation.md', 'references/task-tests.md', 'examples/direction-samples/README.md']
const script = 'scripts/compare-article-copy.mjs'

function documentedCommands() {
  // The three documents quote the invocation slightly differently (some wrap the
  // path in quotes, some in backticks), so read the operands off the end instead
  // of insisting on one spelling.
  const found = []
  for (const site of sites) {
    const text = fs.readFileSync(site, 'utf8')
    for (const line of text.split('\n')) {
      if (!line.includes('compare-article-copy.mjs')) continue
      const start = line.indexOf('node ')
      if (start < 0) continue
      const tail = line.slice(start).replace(/[`"]/g, ' ')
      const words = tail.split(/\s+/).filter(Boolean)
      const scriptIndex = words.findIndex((word) => word.endsWith('compare-article-copy.mjs'))
      if (scriptIndex < 0 || words.length < scriptIndex + 3) continue
      found.push({ site, approved: words[scriptIndex + 1], rendered: words[scriptIndex + 2], raw: tail.split('。')[0].trim() })
    }
  }
  return found
}

const workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'cac-docs-'))
const approved = path.join(workdir, 'approved.txt')
const same = path.join(workdir, 'rendered-same.txt')
const differs = path.join(workdir, 'rendered-differs.txt')
const body = '第一段：设备已连接。\n\n第二段：上次同步 09:41。\n'
fs.writeFileSync(approved, body)
fs.writeFileSync(same, body)
fs.writeFileSync(differs, body.replace('已连接', '已断开'))

function run(args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' })
}

test('every document that shows the command names a script that exists', () => {
  const commands = documentedCommands()
  assert.ok(commands.length >= 3, `expected the command in all three documents, found ${commands.length}`)
  assert.deepEqual([...new Set(commands.map((item) => item.site))].sort(), [...sites].sort(), 'a document stopped showing the command')
  assert.ok(fs.existsSync(script))
})

test('the documented exit codes mean what the documents say they mean', () => {
  const identical = run([approved, same])
  assert.equal(identical.status, 0, identical.stdout + identical.stderr)

  const difference = run([approved, differs])
  assert.equal(difference.status, 1, 'a paragraph mismatch must be reported as a difference, not an error')
  assert.match(difference.stderr, /"paragraph":1/)

  const badInput = run([approved, path.join(workdir, 'missing.txt')])
  assert.equal(badInput.status, 2, 'a file that cannot be read is an input error, not a difference')
})

test('0 and 2 are not the same answer in either document wording', () => {
  const sentence = fs.readFileSync('docs/evaluation.md', 'utf8').match(/返回 0 表示[^。]+。?/)
  assert.ok(sentence, 'docs/evaluation.md no longer states what 0, 1 and 2 mean')
  const text = sentence[0]
  assert.match(text, /0 表示段落内容与顺序一致/)
  assert.match(text, /1 表示存在差异/)
  assert.match(text, /2 表示输入错误/)
})

test('the approved copy being empty is an input error, not a match', () => {
  const empty = path.join(workdir, 'empty.txt')
  fs.writeFileSync(empty, '   \n')
  const result = run([empty, same])
  assert.equal(result.status, 2, 'an empty approved copy compares nothing; it cannot pass')
  assert.match(result.stderr, /approved copy is empty/)
})

test('the documented command runs verbatim, with the operand names it shows', () => {
  // Create the files under the names the documents use, so the documented line is
  // executed exactly as printed instead of being rewritten into something else.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cac-verbatim-'))
  const absolute = path.resolve(script)
  for (const command of documentedCommands()) {
    fs.writeFileSync(path.join(dir, command.approved), body)
    fs.writeFileSync(path.join(dir, command.rendered), body)
    const result = spawnSync(process.execPath, [absolute, command.approved, command.rendered], { cwd: dir, encoding: 'utf8' })
    assert.equal(result.status, 0, `${command.site} shows a line that does not run: ${command.raw}`)
  }
})
