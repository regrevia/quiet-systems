#!/usr/bin/env node

/**
 * Cross-platform Claude Code PostToolUse hook for UI Guard.
 *
 * Reads the hook payload JSON from stdin, scans only the edited UI/i18n file,
 * and exits 2 ONLY when P0 or P1 findings exist (asking Claude Code to fix
 * them immediately). P2 findings are printed to stderr without blocking.
 * Scanner errors, missing binaries, and timeouts exit 0 so the edit loop never stalls.
 */

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const UI_EXTENSIONS = new Set(['.tsx', '.jsx', '.ts', '.js', '.vue', '.svelte', '.astro', '.html', '.css', '.json'])

let raw = ''
try {
  raw = fs.readFileSync(0, 'utf8')
} catch {
  process.exit(0)
}
if (!raw.trim()) process.exit(0)

let payload
try {
  payload = JSON.parse(raw)
} catch {
  process.exit(0)
}

const inputPath = payload?.tool_input?.file_path
if (typeof inputPath !== 'string' || !inputPath.trim()) process.exit(0)

const projectRoot = fs.realpathSync(process.env.CLAUDE_PROJECT_DIR || process.cwd())
let targetPath
try {
  const resolved = path.resolve(projectRoot, inputPath)
  if (!fs.existsSync(resolved)) process.exit(0)
  const stat = fs.lstatSync(resolved)
  if (stat.isSymbolicLink() || !stat.isFile()) process.exit(0)
  targetPath = fs.realpathSync(resolved)
} catch {
  process.exit(0)
}

const relativeToProject = path.relative(projectRoot, targetPath)
if (relativeToProject.startsWith('..') || path.isAbsolute(relativeToProject)) process.exit(0)

const ext = path.extname(targetPath).toLowerCase()
if (!UI_EXTENSIONS.has(ext)) process.exit(0)

const cliArgs = ['--format', 'json']
if (ext === '.json') cliArgs.push('--include-i18n')
cliArgs.push(targetPath)

const localBin = path.join(projectRoot, 'node_modules', '@regrevia', 'ui-guard', 'scripts', 'ui-guard-review.mjs')
const repoBin = path.join(projectRoot, 'scripts', 'ui-guard-review.mjs')
const configuredBin = process.env.UI_GUARD_REVIEW_SCRIPT

let run
if (configuredBin && fs.existsSync(configuredBin)) {
  run = spawnSync(process.execPath, [configuredBin, ...cliArgs], { cwd: projectRoot, encoding: 'utf8', timeout: 10_000 })
} else if (fs.existsSync(localBin)) {
  run = spawnSync(process.execPath, [localBin, ...cliArgs], { cwd: projectRoot, encoding: 'utf8', timeout: 10_000 })
} else if (fs.existsSync(repoBin)) {
  run = spawnSync(process.execPath, [repoBin, ...cliArgs], { cwd: projectRoot, encoding: 'utf8', timeout: 10_000 })
} else {
  process.stderr.write('ui-guard hook: skipped (install @regrevia/ui-guard or set UI_GUARD_REVIEW_SCRIPT)\n')
  process.exit(0)
}

if (run.error || run.status === 2) {
  process.stderr.write(`ui-guard hook: scan incomplete (${run.error?.message || 'exit 2'}), skipping block\n`)
  process.exit(0)
}

let report
try {
  report = JSON.parse(run.stdout || '{}')
} catch {
  process.exit(0)
}

const findings = Array.isArray(report.findings) ? report.findings : []
if (findings.length === 0) process.exit(0)

const blocking = findings.filter((item) => item.severity === 'P0' || item.severity === 'P1')
const notices = findings.filter((item) => item.severity === 'P2')

for (const item of [...blocking, ...notices].slice(0, 12)) {
  process.stderr.write(`${item.file}:${item.line} ${item.severity} ${item.rule} ${item.message}\n  → ${item.remediation}\n`)
}
if (findings.length > 12) {
  process.stderr.write(`ui-guard hook: ...and ${findings.length - 12} more finding(s)\n`)
}

// Exit 2 tells Claude Code to repair P0/P1 findings immediately; P2 stays advisory.
process.exit(blocking.length > 0 ? 2 : 0)
