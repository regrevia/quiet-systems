// README tells a maintainer to run `node --test scripts/*.test.mjs`. A test file
// that lives anywhere else never runs under that command and never fails — the
// suite simply covers less than the reader believes it does. This binds the
// documented line, package.json, and the set of test files actually on disk.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const documented = 'node --test scripts/*.test.mjs'
const readme = fs.readFileSync('README.md', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

function testFilesOnDisk() {
  const found = []
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name.endsWith('.test.mjs')) found.push(full.split(path.sep).join('/'))
    }
  }
  walk('.')
  return found.sort()
}

test('README still tells the maintainer how to run the suite', () => {
  assert.ok(readme.includes(documented), `README no longer documents "${documented}"`)
  assert.match(readme, /从 skill 仓库根目录执行/, 'the command needs its working directory stated, or it runs nowhere')
})

test('package.json runs the same command the README documents', () => {
  assert.equal(pkg.scripts?.test, documented, 'npm test and the documented command must not diverge')
})

test('every test file on disk is matched by the documented command', () => {
  const onDisk = testFilesOnDisk()
  assert.ok(onDisk.length >= 17, `only ${onDisk.length} test files found; the walker is probably broken`)
  const outside = onDisk.filter((file) => !file.startsWith('scripts/'))
  assert.deepEqual(outside, [], 'these test files never run under the documented command: ' + outside.join(', '))
})

test('the documented glob expands to the same files a directory walk finds', () => {
  // The command depends on the shell expanding `scripts/*.test.mjs`, which only
  // reaches one level down. Simulate that expansion and compare it with the walk,
  // so a test moved into a subdirectory is caught here rather than quietly missed.
  const expanded = fs.readdirSync('scripts')
    .filter((name) => name.endsWith('.test.mjs'))
    .map((name) => `scripts/${name}`)
    .sort()
  assert.deepEqual(expanded, testFilesOnDisk(), 'the documented glob no longer reaches every test file')
  assert.ok(expanded.length >= 17, `the glob reached only ${expanded.length} files`)
})
