#!/usr/bin/env node

/**
 * Static guardrails for quiet-systems consumers.
 *
 * This is a review aid, not a substitute for browser, keyboard, assistive
 * technology, or real-data verification. It reports findings with file and
 * line numbers so an agent can fix source code instead of arguing from a screenshot.
 */

import fs from 'node:fs'
import path from 'node:path'

// `ui-guard review . | head` closes the pipe as soon as it has what it wanted,
// and Node turns the next write into an unhandled EPIPE — a stack trace that
// reads like the reviewed project crashed. A reader that stops reading is not an
// error in the scan, so exit quietly instead.
process.stdout.on('error', (error) => {
  if (error.code === 'EPIPE') process.exit(0)
  throw error
})

const args = process.argv.slice(2)
const json = args.includes('--json')
const includeMarkdown = args.includes('--include-markdown')
// Value flags consume the next argument so a path is never mistaken for a root.
const valueOf = (flag) => {
  const index = args.indexOf(flag)
  return index === -1 ? null : (args[index + 1] ?? '')
}
const baselinePath = valueOf('--baseline')
const writeBaselinePath = valueOf('--write-baseline')
const usage = 'usage: ui-guard-review [--json] [--include-markdown] [--baseline PATH] [--write-baseline PATH] [ROOT...]\n'
// A value flag given nothing is a usage error. `--write-baseline ""` used to
// reach fs.writeFileSync and crash with a stack trace, which reads as a bug in
// the project being reviewed rather than in the command line.
for (const [flag, value] of [['--baseline', baselinePath], ['--write-baseline', writeBaselinePath]]) {
  if (value === null) continue
  if (value.trim() === '' || value.startsWith('--')) {
    process.stderr.write(`ui-guard review: ${flag} needs a file path\n`)
    process.stderr.write(usage)
    process.exit(2)
  }
}
const consumed = new Set()
for (const flag of ['--baseline', '--write-baseline']) {
  const index = args.indexOf(flag)
  if (index !== -1) consumed.add(index + 1)
}
const knownFlags = new Set(['--json', '--include-markdown', '--baseline', '--write-baseline', '--help'])
// A misspelled flag used to be dropped on the floor, which turned `--basline`
// into a silent pass. An unrecognised flag is now a usage error.
const unknownFlags = args.filter((arg) => arg.startsWith('--') && !knownFlags.has(arg))
if (unknownFlags.length > 0) {
  process.stderr.write(`ui-guard review: unknown option ${unknownFlags.join(', ')}\n`)
  process.stderr.write(usage)
  process.exit(2)
}
if (args.includes('--help')) {
  process.stdout.write(usage)
  process.exit(0)
}
const roots = args.filter((arg, index) => !arg.startsWith('--') && !consumed.has(index))
if (roots.length === 0) roots.push('.')

// Walking is synchronous. Each requested root owns its configuration and ignore base.
let config
let scanRoot
const extensions = new Set(['.css', '.html', '.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.vue', '.svelte', '.astro', '.json'])
if (includeMarkdown) extensions.add('.md')
const ignored = new Set(['node_modules', '.git', 'dist', 'build', 'coverage'])
const findings = []
const skipped = []
const metrics = []
// How many files were actually read. A verdict of "clean" over zero files is not
// the same answer as a clean tree, and the reader cannot tell them apart without
// this number.
let reviewed = 0
const configFileNames = ['.ui-guard.json', '.quiet-systems.json']
const severityByRule = {
  'QS-PROTOTYPE-001': 'P0',
  'QS-COMPONENT-001': 'P1',
  'QS-A11Y-001': 'P1',
  'QS-A11Y-002': 'P1',
  'QS-A11Y-003': 'P1',
  'QS-COPY-001': 'P1',
  'QS-COPY-002': 'P1',
  'QS-COPY-003': 'P2',
  'QS-MOTION-001': 'P1',
  'QS-MOTION-002': 'P2',
  'QS-VISUAL-001': 'P1',
  'QS-VISUAL-002': 'P1',
  'QS-ICON-001': 'P2',
  'QS-ICON-002': 'P2',
  'QS-HIERARCHY-001': 'P1',
  'QS-COPY-004': 'P1',
  'QS-COPY-005': 'P1',
  'QS-COPY-006': 'P1',
  'QS-COMPOSITION-001': 'P1',
  'QS-SLOP-001': 'P2',
  'QS-SLOP-002': 'P2',
  'QS-SLOP-003': 'P2',
  'QS-COPY-007': 'P1',
  'QS-COPY-008': 'P2',
  'QS-COPY-009': 'P2',
  'QS-COPY-010': 'P1',
  'QS-COPY-011': 'P2',
  'QS-COPY-012': 'P1',
  'QS-INTERACTION-001': 'P1',
  'QS-INTERACTION-002': 'P2'
}
// Every rule must state the repair, not only the objection. The text is what an
// agent reads when it triages a finding, and it is the contract that
// references/copy-constraints.md, references/interface.md and the per-rule table
// in references/review.md are checked against by scripts/review-rules.test.mjs.
const remediationByRule = {
  'QS-PROTOTYPE-001': '把演示数据移出生产源，或经 adapter 注入真实类型的数据。',
  'QS-COMPONENT-001': '改用统一组件接管外观，保留原生语义与键盘行为；确需原生控件时加 data-ui-guard-adapted。',
  'QS-A11Y-001': '补 alt="具体描述"，装饰图改 alt="" 或 aria-hidden="true"。',
  'QS-A11Y-002': '移除 aria-hidden，或把节点改成不可交互的装饰元素。',
  'QS-A11Y-003': '补 aria-label、aria-labelledby、title 或可见文字。',
  'QS-COPY-001': '把分隔符两侧拆成独立元素，用布局而不是字符分隔。',
  'QS-COPY-002': '删掉行内竖线，改成分行、独立字段或表格。',
  'QS-COPY-003': '把长文案拆成摘要 + 详情，或移出当前层级。',
  'QS-COPY-004': '只保留会改变当前决策的条件、结果或恢复动作。',
  'QS-COPY-005': '把限制写进对应决策旁，删除泛化免责声明。',
  'QS-COPY-006': '改成已完成的结果、具体日期或当前可执行动作。',
  'QS-COPY-007': '改写成「动词 + 具体对象」，在评审里给出可执行含义。',
  'QS-COPY-008': '写出完整说法，或紧跟括号解释一次。',
  'QS-COPY-009': '改写成能对同事直接说出的句子：谁、做什么、结果是什么。',
  'QS-COPY-010': '把被压缩掉的宾语写出来：谁把什么东西变成什么，例如「抄一份链接标题」。',
  'QS-COPY-011': '拆成独立短句或只保留具体事实，删掉破折号拼接的卖点从句与机械三连修饰词。',
  'QS-COPY-012': '删除无来源的夸大指标与社会证明；确有真实统计时在审阅记录注明数据源、口径与统计时间，并在同行加 ui-guard: metric-sourced。',
  'QS-COMPOSITION-001': '减少同屏标题、卡片、胶囊与分隔线，用布局建立层级。',
  'QS-MOTION-001': '提供 prefers-reduced-motion: reduce 降级，或加 ui-guard: motion-adapted。',
  'QS-MOTION-002': '把时长压到 400ms 以内，或加 ui-guard: motion-duration-reviewed 说明理由。',
  'QS-VISUAL-001': '把视觉值移到设计系统样式或语义变量。',
  'QS-VISUAL-002': '改用 token 变量，颜色值只出现在 tokens、theme 或 design 文件。',
  'QS-ICON-001': '改用统一图标尺寸档位（如 16/20/24），不要落在非档位值上。',
  'QS-ICON-002': '评估改为无边界图标控件，并保留可访问名称、焦点态与命中区。',
  'QS-HIERARCHY-001': '删除解释性小字，用布局、换行、字重或位置建立层级。',
  'QS-SLOP-001': '去掉装饰性玻璃、渐变、渐变文字、粗左边框、模糊、发光或无语义脉冲动画，或在评审里证明它服务于层级。',
  'QS-SLOP-002': '替换为实际对象或动作语义的图形。',
  'QS-SLOP-003': '改成具体对象、结果或下一步动作。',
  'QS-INTERACTION-001': '补上可见的动作名与作用对象；图标可以保留，但不能是唯一的识别方式。',
  'QS-INTERACTION-002': '改成动作名或作用对象；状态用只读文本呈现，不要做成按钮。'
}

const configSchema = {
  include: 'string[] of glob patterns to force-include beyond the extension list',
  ignore: 'string[] of glob patterns, matched against the config directory and the scan root',
  ignoreDirs: 'string[] of directory basenames skipped while walking',
  maxFileBytes: 'number, files larger than this are skipped and reported',
  treatAsProduction: 'string[] of glob patterns scanned as production source despite the fixture gate',
  rules: 'object keyed by rule id, each value may carry `ignore` (string[]) and rule options; QS-COPY-003 takes `maxLength` as a number or { mobile, desktop } plus `cjkWeight` and `latinWeight`'
}

function validateConfig(config, file) {
  const problems = []
  const isStringArray = (value) => Array.isArray(value) && value.every((item) => typeof item === 'string')
  for (const key of ['include', 'ignore', 'ignoreDirs', 'treatAsProduction']) {
    if (config[key] !== undefined && !isStringArray(config[key])) problems.push(`\`${key}\` must be an array of strings`)
  }
  if (config.maxFileBytes !== undefined && (typeof config.maxFileBytes !== 'number' || !Number.isFinite(config.maxFileBytes) || config.maxFileBytes <= 0)) {
    problems.push('`maxFileBytes` must be a positive number')
  }
  if (config.rules !== undefined) {
    if (typeof config.rules !== 'object' || config.rules === null || Array.isArray(config.rules)) {
      problems.push('`rules` must be an object keyed by rule id')
    } else {
      for (const [rule, options] of Object.entries(config.rules)) {
        if (!severityByRule[rule]) problems.push(`\`rules.${rule}\` is not a known rule id`)
        if (typeof options !== 'object' || options === null || Array.isArray(options)) {
          problems.push(`\`rules.${rule}\` must be an object`)
          continue
        }
        if (options.ignore !== undefined && !isStringArray(options.ignore)) problems.push(`\`rules.${rule}.ignore\` must be an array of strings`)
        const budget = options.maxLength
        if (budget !== undefined && typeof budget !== 'number' && typeof budget !== 'object') {
          problems.push(`\`rules.${rule}.maxLength\` must be a number or { mobile, desktop }`)
        }
        if (budget !== null && typeof budget === 'object') {
          for (const view of ['mobile', 'desktop']) {
            if (budget[view] !== undefined && (typeof budget[view] !== 'number' || !Number.isFinite(budget[view]) || budget[view] <= 0)) {
              problems.push(`\`rules.${rule}.maxLength.${view}\` must be a positive number`)
            }
          }
          for (const view of Object.keys(budget)) {
            if (!['mobile', 'desktop'].includes(view)) problems.push(`\`rules.${rule}.maxLength.${view}\` is not a recognised viewport; known: mobile, desktop`)
          }
        }
        for (const weightKey of ['cjkWeight', 'latinWeight']) {
          const weight = options[weightKey]
          if (weight !== undefined && (typeof weight !== 'number' || !Number.isFinite(weight) || weight <= 0)) {
            problems.push(`\`rules.${rule}.${weightKey}\` must be a positive number`)
          }
        }
      }
    }
  }
  const known = new Set(['include', 'ignore', 'ignoreDirs', 'maxFileBytes', 'treatAsProduction', 'rules', '__baseDir'])
  for (const key of Object.keys(config)) {
    if (!known.has(key)) problems.push(`\`${key}\` is not a recognised key; known keys: ${[...known].filter((item) => item !== '__baseDir').join(', ')}`)
  }
  if (problems.length > 0) {
    process.stderr.write(`ui-guard review: invalid config ${file}\n`)
    for (const problem of problems) process.stderr.write(`  - ${problem}\n`)
    process.stderr.write(`  schema: ${JSON.stringify(configSchema, null, 2).replace(/\n/g, '\n  ')}\n`)
    process.exitCode = 2
    return false
  }
  return true
}

function loadConfig(root) {
  const candidates = []
  let current = fs.statSync(root).isDirectory() ? root : path.dirname(root)
  while (true) {
    for (const name of configFileNames) candidates.push(path.join(current, name))
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }
  for (const name of configFileNames) candidates.push(path.resolve(name))
  const file = candidates.find((candidate) => fs.existsSync(candidate))
  if (!file) return {}
  try {
    const parsed = { ...JSON.parse(fs.readFileSync(file, 'utf8')), __baseDir: fs.realpathSync(path.dirname(file)) }
    return validateConfig(parsed, file) ? parsed : {}
  } catch (error) {
    process.stderr.write(`ui-guard review: invalid config ${file}: ${error.message}\n`)
    process.exitCode = 2
    return {}
  }
}

function globToRegExp(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\//g, '__DOUBLESTAR_SLASH__')
    .replace(/\*\*/g, '__DOUBLESTAR__')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/__DOUBLESTAR_SLASH__/g, '(?:.*/)?')
    .replace(/__DOUBLESTAR__/g, '.*')
  return new RegExp(`^${escaped}$`)
}

function isIgnored(file, rule) {
  const relativeToConfig = path.relative(config.__baseDir ?? process.cwd(), file).split(path.sep).join('/')
  const relativeToRoot = path.relative(scanRoot, file).split(path.sep).join('/')
  const ignorePaths = config.ignore ?? []
  const ignoreRules = config.rules?.[rule]?.ignore ?? []
  return [...ignorePaths, ...ignoreRules].some((pattern) => {
    const matcher = globToRegExp(pattern)
    return matcher.test(relativeToConfig) || matcher.test(relativeToRoot)
  })
}

function recordReadError(file, error) {
  skipped.push({ file, reason: error.code ?? 'readError' })
  process.stderr.write(`ui-guard review: skip ${file}: ${error.message}\n`)
  process.exitCode = 2
}

function walk(entry) {
  let stat
  try {
    stat = fs.lstatSync(entry)
  } catch (error) {
    recordReadError(entry, error)
    return
  }
  // Symlinks are neither followed nor silently dropped. A workspace layout that
  // links a package in (`packages/app -> ../../app`) would otherwise report clean
  // on content that was never opened.
  if (stat.isSymbolicLink()) {
    skipped.push({ file: entry, reason: 'symlink' })
    return
  }
  if (stat.isDirectory()) {
    if (ignored.has(path.basename(entry)) || config.ignoreDirs?.includes(path.basename(entry))) return
    let children
    try {
      children = fs.readdirSync(entry)
    } catch (error) {
      recordReadError(entry, error)
      return
    }
    for (const child of children) walk(path.join(entry, child))
    return
  }
  if (stat.size > (config.maxFileBytes ?? 1_048_576)) {
    skipped.push({ file: entry, reason: 'maxFileBytes' })
    return
  }
  if (extensions.has(path.extname(entry)) || matchesInclude(entry)) inspect(entry)
}

// `include` forces a file past the extension list, so a project can review a
// template format the script does not know about. Without this the key was
// accepted, validated and then ignored: a config that looked like it widened
// the scan reported nothing about the files it named.
function matchesInclude(file) {
  const patterns = config.include ?? []
  if (patterns.length === 0) return false
  const relativeToConfig = path.relative(config.__baseDir ?? process.cwd(), file).split(path.sep).join('/')
  const relativeToRoot = path.relative(scanRoot, file).split(path.sep).join('/')
  return patterns.some((pattern) => {
    const matcher = globToRegExp(pattern)
    return matcher.test(relativeToConfig) || matcher.test(relativeToRoot)
  })
}

// Suppression comments are per line and per rule:
//   ui-guard: ignore              suppress every rule on this line
//   ui-guard: ignore QS-COPY-001  suppress only the listed rules
// `quiet-systems:` prefix is accepted as a legacy alias.
let activeSuppressions = { all: new Set(), byRule: new Map() }

function readSuppressions(lines) {
  const all = new Set()
  const byRule = new Map()
  lines.forEach((line, index) => {
    const match = line.match(/(?:ui-guard|quiet-systems):\s*ignore\b([A-Za-z0-9,\s-]*)/)
    if (!match) return
    const listed = (match[1] ?? '').split(/[,\s]+/).filter(Boolean)
    const lineNumber = index + 1
    if (listed.length === 0) {
      all.add(lineNumber)
      return
    }
    for (const rule of listed) {
      if (!byRule.has(rule)) byRule.set(rule, new Set())
      byRule.get(rule).add(lineNumber)
    }
  })
  return { all, byRule }
}

function isSuppressed(line, rule) {
  if (activeSuppressions.all.has(0) || activeSuppressions.all.has(line)) return true
  if (activeSuppressions.byRule.get(rule)?.has(line)) return true
  if (activeSuppressions.byRule.get('*')?.has(line)) return true
  return false
}

function add(file, line, rule, message, evidence) {
  if (isIgnored(file, rule)) return
  if (isSuppressed(line, rule)) return
  const existing = findings.find((finding) => finding.file === file && finding.line === line && finding.rule === rule)
  if (existing) return
  const severity = severityByRule[rule] ?? 'P2'
  const remediation = remediationByRule[rule] ?? ''
  if (!remediation) process.stderr.write(`ui-guard review: warning: no remediation registered for ${rule}\n`)
  findings.push({ file, line, rule, severity, message, remediation, evidence: evidence.trim() })
}

function isProductionSource(file) {
  const forced = config?.treatAsProduction ?? []
  if (forced.length > 0) {
    const relative = path.relative(config.__baseDir ?? process.cwd(), file).split(path.sep).join('/')
    if (forced.some((pattern) => globToRegExp(pattern).test(relative))) return true
  }
  return !/(^|[/\\])(?:examples|fixtures|prototype|prototypes|test|tests|__tests__|scripts)([/\\]|$)|\.(?:test|spec)\./i.test(file)
}

function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length
}

function actionMetrics(source) {
  let textActionCount = 0
  let iconOnlyActionCount = 0
  for (const match of source.matchAll(/<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
    const content = match[3]
    const visibleText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const hasIcon = /<(?:svg|img|[A-Za-z][A-Za-z0-9]*(?:Icon|Symbol))\b/i.test(content)
    if (hasIcon && !visibleText) iconOnlyActionCount += 1
    if (!hasIcon && visibleText) textActionCount += 1
  }
  return { textActionCount, iconOnlyActionCount }
}

function inspect(file) {
  reviewed += 1
  let text
  try {
    text = fs.readFileSync(file, 'utf8')
  } catch (error) {
    recordReadError(file, error)
    return
  }
  const lines = text.split(/\r?\n/)
  // inspect() is synchronous and runs one file at a time, so the map is reset per file
  // rather than scoped with try/finally around the whole body.
  activeSuppressions = readSuppressions(lines)
  const copyBudget = config.rules?.['QS-COPY-003'] ?? {}
  // A string that fits a 1440px column can still overflow a 390px screen, so the
  // narrow budget is the binding one. maxLength keeps the flat single-number form.
  const budgetSpec = copyBudget.maxLength ?? 180
  const mobileBudget = Number(typeof budgetSpec === 'object' ? budgetSpec.mobile ?? 110 : budgetSpec)
  const desktopBudget = Number(typeof budgetSpec === 'object' ? budgetSpec.desktop ?? 180 : budgetSpec)
  const maxCopyLength = Math.min(mobileBudget, desktopBudget)
  const budgetNote = mobileBudget === desktopBudget ? '' : `（窄屏 ${mobileBudget}，宽屏 ${desktopBudget}，权重单位：CJK 1、拉丁 0.5）`
  const cjkWeight = Number(copyBudget.cjkWeight ?? 1)
  const latinWeight = Number(copyBudget.latinWeight ?? 0.5)
  // CJK glyphs occupy roughly twice the width of a Latin glyph, so a flat
  // character count flags Chinese copy that fits and passes English copy that does not.
  const copyWeight = (value) => {
    let weight = 0
    for (const char of value) {
      if (/[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/.test(char)) weight += cjkWeight
      else if (/\s/.test(char)) continue
      else weight += latinWeight
    }
    return weight
  }
  const composition = {
    file,
    headingCount: countMatches(text, /<h[1-6]\b/gi),
    surfaceCount: countMatches(text, /(?:class|className)\s*=\s*["'][^"']*\b(?:card|panel|surface|tile)\b/gi),
    pillCount: countMatches(text, /(?:class|className)\s*=\s*["'](?:[^"']*\b(?:pill|badge|chip|tag)\b[^"']*|(?![^"']*(?<![\w-])w-(\d+(?:\.\d+)?|\[[^\]]+\])(?![\w-])[^"']*(?<![\w-])h-\1(?![\w-]))(?![^"']*(?<![\w-])h-(\d+(?:\.\d+)?|\[[^\]]+\])(?![\w-])[^"']*(?<![\w-])w-\2(?![\w-]))(?![^"']*(?<![\w-])size-(?:\d+(?:\.\d+)?|\[[^\]]+\])(?![\w-]))(?=[^"']*\brounded-full\b)(?=[^"']*(?:\btext-xs\b|text-\[1[01]px\](?=[\s"'])|\bpy-0\.5\b))[^"']*)["']/gi),
    dividerCount: countMatches(text, /<hr\b|(?:class|className)\s*=\s*["'][^"']*\b(?:divider|separator|divide-[xy])\b/gi),
    ...actionMetrics(text)
  }
  metrics.push(composition)
  if (isProductionSource(file) && (composition.headingCount > 1 || composition.surfaceCount > 4 || composition.pillCount > 3 || composition.dividerCount > 3 || composition.textActionCount > 2)) {
    add(file, 1, 'QS-COMPOSITION-001', '源文件组合预算疑似超限。请优先用运行时 route 指标复核，保留一个主标题、一个主工作面，默认移除装饰性胶囊和重复分割线，并在审阅记录中逐项说明合法例外。', JSON.stringify(composition))
  }
  const copySlop = /(?:无缝(?:衔接|协作|体验)?|赋能|重新定义|全新体验|极致(?:体验|效率)|一站式|智能化(?:地)?|轻松(?:实现|提升|开始)|无界(?:协作|体验)|为你打造|随时准备|颠覆式|划时代|次世代|重磅升级|\b(?:seamless|revolutionary|next[- ]generation|game[- ]chang(?:ing|er)|effortless|made for you|ready when you are|delve|elevate|unlock\s+(?:your|the)\s+(?:potential|power|full|possibilities|productivity)|streamline|cutting[- ]edge|all[- ]in[- ]one|ai[- ]powered|reimagine|supercharge|serves as a testament|boasts a|in a world where)\b)/i
  const defensiveCopy = /(?:为了更好地|如有任何问题|温馨提示|请注意|仅供参考|感谢(?:您的|你?的)理解|你可以放心|放心使用|我们不会|为了方便起见|特别说明|需要注意|务必(?:保证|确认|检查)?|我们很抱歉|我们将(?!在\s*(?:\d|今|明|本|下)|于\s*\d|\s*\d)|值得注意的是|需要指出的是|值得一提的是|不可否认|总而言之|综上所述|换句话说|在一定程度上|从某种意义上说|懂你所想|为你贴心|贴心准备|告别繁琐|解放双手|开启.{0,8}之旅|探索无限可能|触手可及|一切尽在掌握|别担心|糟糕[！!，,]|出了一点小(?:问题|差错)|好极了[！!]|please note|for your convenience|rest assured|just so you know|\boops\b|\buh-oh\b|it(?:'s| is) worth noting|at its core|in today'?s fast[- ]paced)/i
  const concreteSafetyCondition = /(?:务必|请注意|please note)\s*(?:在|于|当|如果|关闭|断电|before|after|when|if)\S*/i
  const disclaimerCopy = /(?:内容由\s*AI\s*生成|AI\s*生成内容|仅为演示|效果因人而异|请自行判断|可能存在误差|不构成(?:建议|承诺)|我们无法保证|免责声明|AI-generated content|generated by AI|for demonstration only|results may vary|not financial advice|use your own judgment)/i
  const promiseCopy = /(?:敬请期待|即将上线|持续优化中|为你带来|我们致力于|stay tuned|coming soon|constantly improving|we are committed to)/i
  const copyContext = /<(?:p|button|label|h[1-6]|span|a)\b[^>]*>|\b(?:label|title|placeholder|aria-label|children|text|description|body|heading|subtitle|cta)\s*[:=]\s*["'`]/i
  const metaphorCopy = /(?:蒸馏|赋能|编排|人管|接管(?:指针|键盘|语义)|沉淀|打通|闭环|抓手|北极星|护城河|底座|飞轮|心智|范式|中枢|锚点|杠杆|生命线|母体|元(?:能力|问题)|复利|降维|升维|全域|全链路|心智模型|语义图谱|supercharge|orchestrat\w*|distill\w*|empower\w*|synerg\w*|north star|flywheel|leverage|paradigm)/i
  const concreteActionNearby = /(?:点击|打开|关闭|保存|删除|选择|输入|提交|重试|返回|导入|导出|查看|下载|复制|发送|同步|撤销|confirm|cancel|open|close|save|delete|select|enter|submit|retry|back|import|export|view|download|copy|send|undo)/i
  // QS-INTERACTION-001/002: read the action vocabulary, not the visual style. A
  // destructive action identified only by a glyph makes the reader guess what it
  // destroys; a control whose whole label restates its state tells them what they
  // already see. Both come from the control's own text, so the finding lands on a
  // line an author can change.
  const headingTexts = new Set(
    [...text.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi)]
      .map((match) => match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
  )
  const destructiveIntent = /(?:delete|remove|destroy|discard|reset|revoke|deactivate|删除|移除|销毁|清空|重置|注销|解绑|撤销授权)/i
  const stateEcho = /^(?:已|未|正在)?(?:开启|关闭|启用|禁用|加载中|进行中|处理中|就绪|完成|成功|失败|已保存|已同步|已连接|已断开)(?:状态|中)?$/
  const lineOf = (index) => text.slice(0, index).split('\n').length
  if (isProductionSource(file)) {
    for (const match of text.matchAll(/<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
      const whole = match[0]
      const label = match[3].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      const controlText = `${match[2]} ${match[3]}`
      if (destructiveIntent.test(controlText) && !label) {
        add(file, lineOf(match.index), 'QS-INTERACTION-001', '破坏性或不可逆动作只有图标，没有可见文字标签。请补上动作名与作用对象；图标可保留，但不能是唯一的识别方式。', whole)
      }
      if (label && (stateEcho.test(label) || headingTexts.has(label))) {
        add(file, lineOf(match.index), 'QS-INTERACTION-002', '控件的文字只是在重复标题或自身状态。请改成动作名或作用对象；状态用只读文本呈现。', whole)
      }
    }
  }
  const abbreviationToken = /\b([A-Z]{2,6})\b/g
  // QS-COPY-010: compressed capability compounds. A noun-verb pair like 「智能调度」or
  // 「一键洞察」names a capability while dropping the object the user would act on. The
  // rule fires only when no concrete action is on the line, so 「查看排期」stays clean.
  const compressedCopy = /(?:一键|自动|智能|深度|全量|统一|批量|无感|极简|轻量)(?:洞察|治理|对齐|编排|调度|协同|赋能|沉淀|拉通|归因|复盘|看板|中台|矩阵|体系|链路|范式|能力|闭环)|(?:洞察|治理|对齐|编排|调度|赋能|沉淀)(?:一切|全域|全量|全链路|全场景|全景)/i
  const aphorismMessage = '发现格言式、否定排比或翻译腔句式。请还原成能对同事直接说出的句子：谁，做什么，结果是什么。'
  const aphorismCopy = /(?:为.{1,12}而生|不是.{1,14}而是.{1,14}的|并非.{1,14}而是|不仅是.{1,14}更是|不仅仅是.{1,14}更是|与其说.{1,14}不如说|不再只是.{1,14}而是|从来不是.{1,14}而是|重塑.{1,10}(?:边界|体验|未来)|让.{1,12}重新(?:定义|想象|出发)|才是.{1,12}的(?:答案|开始|方式)|(?:就|也)是一种.{1,10}|不止于|是.{1,8}的态度|\bborn for\b|\bisn't just\b|\bis not just\b|\bmore than just\b|\bnot merely\b.{1,30}\bbut\b|\bisn't about\b.{1,30}\bit's about\b)/i
  const aiRhythmMessage = '发现破折号拼接从句或机械三连修饰词。请拆成直白短句，只保留能区分对象的具体事实。'
  const emDashStitch = /[\u4e00-\u9fffA-Za-z]\s*——\s*[\u4e00-\u9fffA-Za-z]|[\u4e00-\u9fff]\s*—\s*[\u4e00-\u9fff]|(?:[A-Za-z]+\s+){2,}[A-Za-z]+\s*—\s*[A-Za-z]+(?:\s+[A-Za-z]+){2,}/
  const pufferyTriad = /(?:(?:高效|安全|稳定|简洁|优雅|强大|快速|灵活|智能|可靠|精准|极速|流畅|专业|易用|便捷)[、，,\s]+){2}(?:高效|安全|稳定|简洁|优雅|强大|快速|灵活|智能|可靠|精准|极速|流畅|专业|易用|便捷)|\b(?:fast|simple|reliable|secure|scalable|powerful|intuitive|elegant|modern|seamless),\s*(?:fast|simple|reliable|secure|scalable|powerful|intuitive|elegant|modern|seamless),?\s+and\s+(?:fast|simple|reliable|secure|scalable|powerful|intuitive|elegant|modern|seamless)\b/i
  const aiRhythmPattern = new RegExp(`${emDashStitch.source}|${pufferyTriad.source}`, 'i')
  const unverifiedClaimMessage = '发现疑似无来源的社会证明或夸大指标。请删除虚构数字，或只保留可核对的真实统计口径（确有出处时加 ui-guard: metric-sourced）。'
  const unverifiedClaimCopy = /(?:(?:已被|超过|服务)\s*[\d,.]+\s*(?:万|千|百万)?\+?\s*(?:家|个)?\s*(?:团队|企业|用户|开发者|客户)(?:信赖|选择|使用)|(?:效率|产能|转化|速度|性能)(?:提升|提高|加快)了?\s*(?:\d{2,4}%|\d+\s*倍)|99\.\d+%\s*(?:满意度|好评|可用|准确)|trusted by\s+[\d,.]+[kKmM]?\+?\s*(?:teams|companies|users|developers|customers)|\b(?:\d+x\s+(?:faster|productivity|efficiency|more)|(?:boost|increase|improve)\w*\s+\w+\s+by\s+\d{2,4}%|99\.\d+%\s*(?:satisfaction|uptime|accuracy))\b)/i
  const metricSourcedMarker = /(?:ui-guard|quiet-systems):\s*metric-sourced/i
  const accentReviewedMarker = /(?:ui-guard|quiet-systems):\s*accent-reviewed/i
  const knownAbbreviations = new Set(['API', 'URL', 'URI', 'ID', 'UI', 'UX', 'JSON', 'HTML', 'CSS', 'HTTP', 'HTTPS', 'PDF', 'CSV', 'PNG', 'JPEG', 'SVG', 'OK', 'CPU', 'RAM', 'GPU', 'USB', 'OS', 'SQL', 'DNS', 'SDK', 'CLI', 'TLS', 'SSH', 'IP', 'MFA', 'OTP', 'AI', 'ML', 'GPS', 'FAQ', 'UUID', 'RSS', 'IDE', 'REST', 'YAML', 'UTF'])
  lines.forEach((source, index) => {
    const line = index + 1
    const trimmed = source.trim()

    if (/\S\s*[·•⋅∙]\s*\S/.test(source)) { // ui-guard: ignore QS-COPY-001 — detector source
      add(file, line, 'QS-COPY-001', '行内装饰性分隔符会把不同字段收缩成一段不可扫描文本，请拆成独立元素。', source)
    }

    const containsJsx = /<[A-Za-z][^>]*>/.test(source)
    const looksLikeTypeSyntax = !containsJsx && /\b(?:type|interface|extends|implements|import|export|const|let|var)\b[^;]*\|/.test(source)
    const containsShortcut = /\b(?:Cmd|Ctrl|Alt|Shift|Meta)\s*(?:\+|\|)\s*(?:Cmd|Ctrl|Alt|Shift|Meta|[A-Za-z0-9])/.test(source)
    if (isProductionSource(file) && /\S\s+[|／/]\s+\S/.test(source) && !looksLikeTypeSyntax && !containsShortcut && !/https?:\/\//.test(source) && !/^\s*\|/.test(source) && !/\d+\s*\/\s*\d+/.test(source)) {
      add(file, line, 'QS-COPY-002', '不要用竖线或斜杠替代中点连接元信息，请使用布局和语义字段。', source)
    }

    // `style = getComputedStyle(node)` is a local read, not an inline visual value.
    const inlineStyle = /\bstyle\s*=\s*(?:"|'|\{\{)|\bstyle\s*:\s*\{(?![\s\S]{0,40}(?:getComputedStyle|getPropertyValue))/.test(source)
    if (isProductionSource(file) && inlineStyle && !/^\s*(\/\/|\*|\/\*)/.test(source)) {
      add(file, line, 'QS-VISUAL-001', '视觉值写在业务行内会绕过统一 Token，请移到设计系统样式或语义变量。', source)
    }

    if (isProductionSource(file) && /#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})\b/i.test(source) && !/(^|[/\\])(tokens?|theme|design)([/\\]|$)/i.test(file) && !/^\s*(\/\/|\*|\/\*)/.test(source)) {
      add(file, line, 'QS-VISUAL-002', '业务文件中出现硬编码颜色，请使用语义 Token。', source)
    }

    const inputTag = source.match(/<input\b[^>]*>/i)?.[0] ?? ''
    const visibleInput = inputTag && !/\btype\s*=\s*["']hidden["']/i.test(inputTag)
    const nativeControl = /<(?:select|meter|progress|textarea)\b|appearance\s*:\s*auto/i.test(source) || Boolean(visibleInput)
    const adaptedNativeControl = /data-quiet-adapted|data-ui-guard-adapted|(?:quiet-systems|ui-guard):\s*allow-native/.test(source)
    if (isProductionSource(file) && nativeControl && !adaptedNativeControl) {
      add(file, line, 'QS-COMPONENT-001', '发现未经设计适配的原生视觉入口。保留原生语义和键盘行为，但由统一组件接管外观。', source)
    }

    if (isProductionSource(file) && /(width|height)\s*=\s*["'](?:12|14|16|18|20|24|32)["']/.test(source) && /icon|svg|symbol/i.test(source)) {
      add(file, line, 'QS-ICON-001', '图标尺寸疑似写死为单一像素值，请使用光学尺寸 Token，并按文字、控件和平台密度协调。', source)
    }

    if (isProductionSource(file) && path.extname(file).toLowerCase() !== '.json' && /<(?:small|h[4-6])\b|\b(?:subtitle|sub-title|tagline|eyebrow|helper-text|helperText|caption|description)\b/i.test(source)) {
      add(file, line, 'QS-HIERARCHY-001', '发现可能的副标题、小字或解释性层级。请证明它改变了方向、状态、后果或下一步决策，否则删除并用布局、换行、字重或位置建立层级。', source)
    }

    if (isProductionSource(file) && defensiveCopy.test(source) && !concreteSafetyCondition.test(source) && copyContext.test(source) && !/^\s*(\/\/|\*|\/\*)/.test(source)) {
      add(file, line, 'QS-COPY-004', '发现防御性或礼貌性解释文案。删除无法改变当前决策的安抚、免责声明和“方便说明”，只保留具体条件、结果、限制或恢复动作。', source)
    }

    const hasVisibleTag = /<(?:p|button|label|h[1-6]|span|a)\b[^>]*>/i.test(source)
    const hasMetadataOnlyContext = /description\s*[:=]/i.test(source) && !hasVisibleTag
    if (isProductionSource(file) && disclaimerCopy.test(source) && copyContext.test(source) && !hasMetadataOnlyContext && !/^\s*(\/\/|\*|\/\*)/.test(source)) {
      add(file, line, 'QS-COPY-005', '发现免责声明式文案。只保留会改变当前操作的具体限制，并放在对应决策旁，删除泛化防御和责任转移。', source)
    }

    if (isProductionSource(file) && promiseCopy.test(source) && copyContext.test(source) && !hasMetadataOnlyContext && !/^\s*(\/\/|\*|\/\*)/.test(source)) {
      add(file, line, 'QS-COPY-006', '发现无法由当前界面证明的未来承诺或安抚语。改成已完成的结果、具体日期或当前可执行动作。', source)
    }

    if (isProductionSource(file) && /<button\b/i.test(source) && /(?:查看|编辑|删除|关闭|搜索|复制|下载|撤销|还原|更多|对比|分享|刷新|保存|提交|开始|停止|返回|确认|取消|创建|导入|导出|移动|添加|移除|展开|收起|save|submit|start|stop|back|confirm|cancel|create|import|export|expand|collapse)/i.test(source) && !/<svg\b|<[^>]*(?:Icon|icon|data-icon|aria-label|title)=/i.test(source)) { // ui-guard: ignore QS-COPY-003 — detector source
      add(file, line, 'QS-ICON-002', '发现可由熟悉图标表达的文字动作。请评估无边界图标控件，并保留可访问名称、焦点态和命中区。', source)
    }

    const visualSlopPattern = /(?:backdrop-filter|backdrop-blur|filter\s*:\s*blur|linear-gradient|linearGradient|radial-gradient|radialGradient|text-shadow|(?:-webkit-)?background-clip\s*:\s*text|\bbg-clip-text\b|\bbg-(?:gradient-to-[trbl]{1,2}|(?:linear|radial|conic)(?:-|\b))|box-shadow\s*:[^;]*0\s+0\s+[1-9]\d*px|boxShadow\s*:\s*["'][^"']*0\s+0\s+[1-9]\d*px|\b(?:shadow|drop-shadow)-\[0_0_[1-9]\d*px)/i
    const sideTabPattern = /(?:\bborder-[ls]-(?:[3-9]|\d{2,})\b|\bborder-[ls]-\[(?:[3-9]|\d{2,})px\]|border-left\s*:\s*[3-9]px\s+solid)/i
    const elementContext = () => {
      const chunks = [source]
      const isAttributeContinuation = !/<[A-Za-z]/.test(source) && !/^\s*\{/.test(source)
      if (isAttributeContinuation) {
        for (let offset = 1; offset <= 4 && index - offset >= 0; offset += 1) {
          const prev = lines[index - offset]
          if (/<\/[A-Za-z][^>]*>\s*$|\/\s*>\s*$/.test(prev)) break
          chunks.unshift(prev)
          if (/<[A-Za-z]/.test(prev)) break
        }
      }
      if (!/>/.test(source)) {
        for (let offset = 1; offset <= 4 && index + offset < lines.length; offset += 1) {
          const next = lines[index + offset]
          chunks.push(next)
          if (/>/.test(next)) break
        }
      }
      return chunks.join(' ')
    }
    const hasSideTab = sideTabPattern.test(source)
    const hasPulse = /\banimate-(?:pulse|ping|bounce)\b/i.test(source)
    const tagContext = hasSideTab || hasPulse ? elementContext() : ''
    const semanticLeftBorder = /<blockquote\b|\baria-current\s*=\s*(?:["'](?!false["'])|\{(?!false\b))/i.test(tagContext) || accentReviewedMarker.test(tagContext || source)
    const decorativeSideTab = hasSideTab && !semanticLeftBorder
    const decorativePulse = hasPulse && !/(?:skeleton|loading|placeholder|spinner|shimmer|aria-live|role\s*=\s*["']status["'])/i.test(tagContext)
    if (isProductionSource(file) && (visualSlopPattern.test(source) || decorativeSideTab || decorativePulse) && !/^\s*(\/\/|\*|\/\*)/.test(source)) {
      add(file, line, 'QS-SLOP-001', '发现可能只承担装饰作用的玻璃、渐变、渐变文字、粗左边框、模糊、发光或脉冲动画，请证明它服务于层级或任务。', source)
    }

    if (isProductionSource(file) && /<(?:Sparkles|Stars|Robot|Brain|Bot|Hexagon)(?:Icon|Graphic|Background)\b|(?:sparkles|magic-wand|neural-network-background|ai-(?:sparkles|magic))/i.test(source)) {
      add(file, line, 'QS-SLOP-002', '发现可能泛化表达 AI 的装饰图形，请替换为实际对象或动作语义。', source)
    }

    const completeCopyBlock = /<(?:p|button|label|h[1-6]|span|a)\b[^>]*>[\s\S]*<\/(?:p|button|label|h[1-6]|span|a)>/i.test(source)
    if (isProductionSource(file) && copySlop.test(source) && copyContext.test(source) && !completeCopyBlock && !/^\s*(\/\/|\*|\/\*)/.test(source)) {
      add(file, line, 'QS-SLOP-003', '发现可能脱离当前对象和动作的泛化营销文案。请改成具体对象、结果或下一步动作，或在评审中说明它的产品语义。', source)
    }

    if (isProductionSource(file) && metaphorCopy.test(source) && copyContext.test(source) && !concreteActionNearby.test(source) && !/^\s*(\/\/|\*|\/\*)/.test(source) && !/\b(?:import|export|from|require)\b/.test(source)) {
      add(file, line, 'QS-COPY-007', '发现用抽象隐喻或行话代替具体动作。请写成「动词 + 具体对象」，并在评审里给出这句话的可执行含义。', source)
    }

    if (isProductionSource(file) && copyContext.test(source) && !/^\s*(\/\/|\*|\/\*)/.test(source)) {
      const bare = [...new Set([...source.matchAll(abbreviationToken)].map((match) => match[1]))]
        .filter((token) => !knownAbbreviations.has(token))
        .filter((token) => !new RegExp(`\\b${token}\\s*[（(]`).test(source))
      if (bare.length > 0) {
        add(file, line, 'QS-COPY-008', `发现首次出现且未解释的缩写 ${bare.join(', ')}。请写出完整说法，或紧跟括号说明。`, source)
      }
    }

    if (isProductionSource(file) && compressedCopy.test(source) && copyContext.test(source) && !concreteActionNearby.test(source) && !/^\s*(\/\/|\*|\/\*)/.test(source)) {
      add(file, line, 'QS-COPY-010', '发现被压缩成能力名的短语，宾语被省掉了。请写出谁把什么东西变成什么，让读者能指认它对应哪个动作。', source)
    }

    if (isProductionSource(file) && aphorismCopy.test(source) && copyContext.test(source) && !/^\s*(\/\/|\*|\/\*)/.test(source)) {
      add(file, line, 'QS-COPY-009', aphorismMessage, source)
    }

    const strippedLineComment = source.replace(/(?<![:"'\w])\/\/.*$|\/\*[\s\S]*?\*\//g, '')
    if (isProductionSource(file) && aiRhythmPattern.test(strippedLineComment) && copyContext.test(source) && !completeCopyBlock && !/^\s*(\/\/|\*|\/\*|<!--)/.test(source)) {
      add(file, line, 'QS-COPY-011', aiRhythmMessage, source)
    }

    if (isProductionSource(file) && unverifiedClaimCopy.test(source) && !metricSourcedMarker.test(source) && copyContext.test(source) && !completeCopyBlock && !/^\s*(\/\/|\*|\/\*)/.test(source)) {
      add(file, line, 'QS-COPY-012', unverifiedClaimMessage, source)
    }

    const demoName = /\b(?:mock|demo|fake|fixture)(?:Data|User|Item|_[A-Za-z0-9]+|[A-Z][A-Za-z0-9]*)\b|\b(?:Mock|Demo|Fake|Fixture)(?:Data|User|Item|_[A-Za-z0-9]+|[A-Z][A-Za-z0-9]*)\b/.test(source)
    const demoPayload = /__source\s*[:=]\s*["']demo["']/.test(source)
    if (isProductionSource(file) && (demoName || demoPayload) && !/^\s*(\/\/|\*|\/\*)/.test(source)) {
      add(file, line, 'QS-PROTOTYPE-001', '生产源文件中出现演示数据命名。请通过明确的 adapter 和生产数据类型接入，或将其移到 prototype、test 或 fixture 目录。', source)
    }

    if (copyWeight(trimmed) > maxCopyLength && /<(?:p|button|label|h[1-6])\b/i.test(source)) {
      add(file, line, 'QS-COPY-003', `可见 UI 文案过长${budgetNote}，可能把解释性文本塞进了当前层级。请考虑摘要、详情或错误恢复区域。`, source)
    }
  })

  for (const match of text.matchAll(/<(p|button|label|h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const visibleCopy = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (copyWeight(visibleCopy) <= maxCopyLength) continue
    const line = text.slice(0, match.index).split(/\r?\n/).length
    const evidence = match[0].split(/\r?\n/)[0]
    add(file, line, 'QS-COPY-003', `可见 UI 文案过长${budgetNote}，可能把解释性文本塞进了当前层级。请考虑摘要、详情或错误恢复区域。`, evidence)
  }

  for (const match of text.matchAll(/<(p|button|label|h[1-6]|span|a)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const visibleCopy = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const line = text.slice(0, match.index).split(/\r?\n/).length
    const evidence = match[0].split(/\r?\n/)[0]
    // Inspect literal text across JSX line breaks, excluding expressions and comments.
    if (isProductionSource(file) && match[2].includes('\n') && !/[{}<>]/.test(match[2])) {
      const phrase = aphorismCopy.exec(match[2].replace(/\s/g, ' '))
      if (phrase) {
        const bodyStart = match.index + match[0].indexOf('>') + 1
        add(file, lineOf(bodyStart + phrase.index), 'QS-COPY-009', aphorismMessage, visibleCopy)
      }
    }
    const blockRules = [
      [defensiveCopy, 'QS-COPY-004', '发现防御性或礼貌性解释文案。删除无法改变当前决策的安抚、免责声明和“方便说明”，只保留具体条件、结果、限制或恢复动作。'],
      [disclaimerCopy, 'QS-COPY-005', '发现免责声明式文案。只保留会改变当前操作的具体限制，并放在对应决策旁，删除泛化防御和责任转移。'],
      [promiseCopy, 'QS-COPY-006', '发现无法由当前界面证明的未来承诺或安抚语。改成已完成的结果、具体日期或当前可执行动作。'],
      [metaphorCopy, 'QS-COPY-007', '发现用抽象隐喻或行话代替具体动作。请写成「动词 + 具体对象」，并在评审里给出这句话的可执行含义。'],
      [compressedCopy, 'QS-COPY-010', '发现被压缩成能力名的短语，宾语被省掉了。请写出谁把什么东西变成什么，让读者能指认它对应哪个动作。'],
      [aiRhythmPattern, 'QS-COPY-011', aiRhythmMessage],
      [unverifiedClaimCopy, 'QS-COPY-012', unverifiedClaimMessage]
    ]
    const blockEndLine = lineOf(match.index + match[0].length)
    const blockSource = lines.slice(line - 1, blockEndLine).join('\n')
    for (const [pattern, rule, message] of blockRules) {
      if (!isProductionSource(file) || !pattern.test(visibleCopy)) continue
      if (rule === 'QS-COPY-004' && concreteSafetyCondition.test(visibleCopy)) continue
      if ((rule === 'QS-COPY-007' || rule === 'QS-COPY-010') && concreteActionNearby.test(visibleCopy)) continue
      if (rule === 'QS-COPY-012' && metricSourcedMarker.test(blockSource)) continue
      add(file, line, rule, message, evidence)
    }
  }

  for (const match of text.matchAll(/<(p|button|label|h[1-6]|span|a)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const visibleCopy = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (!isProductionSource(file) || !copySlop.test(visibleCopy)) continue
    const line = text.slice(0, match.index).split(/\r?\n/).length
    const evidence = match[0].split(/\r?\n/)[0]
    add(file, line, 'QS-SLOP-003', '发现可能脱离当前对象和动作的泛化营销文案。请改成具体对象、结果或下一步动作，或在评审中说明它的产品语义。', evidence)
  }

  // Inspect character references in markup text without decoding the source file.
  if (isProductionSource(file) && /\.(?:html|jsx|tsx|vue|svelte|astro)$/.test(file)) {
    const markup = text.replace(/<!--[^]*?-->|<(script|style|pre|code)\b[^>]*>[^]*?<\/\1>/gi,
      block => ' '.repeat(block.length))
    for (const node of markup.matchAll(/[>}]([^<>{}]*?)(?=[<{])/g)) {
      const value = node[1]
      const entity = /&(?:middot|centerdot|CenterDot|bull|bullet|sdot|#(?:0*(?:183|8226|8901|8729)|[xX]0*(?:[bB]7|2022|22[cC]5|2219)));/.exec(value)
      if (!entity) continue
      const offset = node.index + 1 + entity.index
      const line = text.slice(0, offset).split('\n').length
      add(file, line, 'QS-COPY-001', '可见文字中的 HTML 字符引用会渲染为中点。请用独立字段和间距区分内容。', lines[line - 1])
    }
  }

  for (const match of isProductionSource(file) ? text.matchAll(/<(span|small|p|div|label)\b[^>]*>\s*[·•⋅∙]\s*<\/\1>/gi) : []) { // ui-guard: ignore QS-COPY-001 — detector source
    const line = text.slice(0, match.index).split(/\r?\n/).length
    const evidence = match[0].split(/\r?\n/)[0]
    add(file, line, 'QS-COPY-001', '独立节点中出现装饰性分隔符。请使用布局、间距、对齐或语义字段区分内容。', evidence)
  }

  for (const match of isProductionSource(file) ? text.matchAll(/<(span|small|p|div|label|h[1-6]|button|a)\b[^>]*>\s*[|／/]\s*<\/\1>/gi) : []) {
    const line = text.slice(0, match.index).split(/\r?\n/).length
    const evidence = match[0].split(/\r?\n/)[0]
    const before = text.slice(0, match.index)
    const codeContexts = ['code', 'pre', 'kbd']
    const isCodeContext = codeContexts.some((tagName) => before.lastIndexOf(`<${tagName}`) > before.lastIndexOf(`</${tagName}>`))
    if (isCodeContext) continue
    add(file, line, 'QS-COPY-002', '独立节点中出现竖线或斜杠分隔符。请使用布局、间距、对齐或语义字段区分内容。', evidence)
  }

  for (const match of isProductionSource(file) ? text.matchAll(/<(input|textarea|select|meter|progress)\b[\s\S]*?>/gi) : []) {
    const tag = match[0]
    const line = text.slice(0, match.index).split(/\r?\n/).length
    const lineSource = lines[line - 1] ?? ''
    const hiddenInput = /^<input\b[^>]*\btype\s*=\s*["']hidden["']/i.test(tag)
    const adapted = /data-quiet-adapted|data-ui-guard-adapted|(?:quiet-systems|ui-guard):\s*allow-native/.test(tag)
    if (hiddenInput || adapted) continue
    add(file, line, 'QS-COMPONENT-001', '发现未经设计适配的原生视觉入口。保留原生语义和键盘行为，但由统一组件接管外观。', tag)
  }

  for (const match of isProductionSource(file) ? text.matchAll(/<img\b[\s\S]*?>/gi) : []) {
    const tag = match[0]
    const line = text.slice(0, match.index).split(/\r?\n/).length
    if (!/\balt\s*=/.test(tag) && !/\baria-label\s*=/.test(tag) && !/role\s*=\s*["']presentation["']/.test(tag) && !/aria-hidden\s*=\s*["']true["']/.test(tag)) {
      add(file, line, 'QS-A11Y-001', '图片必须提供 alt 属性，或明确标记为装饰性图片。', tag)
    }
  }

  for (const match of isProductionSource(file) ? text.matchAll(/<[^>]+>/gi) : []) {
    const tag = match[0]
    const nativeInteractive = /^<(?:button|a|input|select|textarea)\b/i.test(tag)
    const semanticInteractive = /\b(?:role\s*=\s*["'](?:button|link|checkbox|radio|switch|tab|menuitem|option|combobox|listbox|gridcell)["']|tabindex\s*=\s*["']?\d)/i.test(tag)
    const eventInteractive = /\b(?:on[A-Z]\w*|@\w+|v-on(?::|\.)\w+|x-on(?::|\.)\w+|on:\w+)\s*=/i.test(tag)
    if ((nativeInteractive || semanticInteractive || eventInteractive) && /aria-hidden\s*=\s*["']true["']/i.test(tag)) {
      const line = text.slice(0, match.index).split(/\r?\n/).length
      add(file, line, 'QS-A11Y-002', '可交互元素不能同时隐藏于辅助技术。移除 aria-hidden，或改为非交互装饰元素。', tag)
    }
  }

  const isCssSource = path.extname(file).toLowerCase() === '.css'
  const hasMotionDeclaration = /\b(?:transition|animation)\s*:/i.test(text)
  const hasReducedMotionPath = /prefers-reduced-motion\s*:\s*reduce/i.test(text)
  const hasMotionReviewMarker = /(?:quiet-systems|ui-guard):\s*motion-adapted/i.test(text)
  if (isCssSource && hasMotionDeclaration && !hasReducedMotionPath && !hasMotionReviewMarker) {
    const line = text.slice(0, Math.max(text.search(/\b(?:transition|animation)\s*:/i), 0)).split(/\r?\n/).length
    add(file, line, 'QS-MOTION-001', '发现 CSS 动效但没有 reduced-motion 路径。请提供 prefers-reduced-motion 降级，或留下 ui-guard: motion-adapted 的人工验证标记。', text.split(/\r?\n/)[line - 1] ?? text)
  }

  const longMotion = /\b(?:transition|animation)\s*:[^;{}]*(?:\b(?:[5-9]\d{2}|\d{4,})ms\b|\b(?:0\.[5-9]|[1-9]\d*)s\b)/i
  if (isCssSource && longMotion.test(text) && !/(?:quiet-systems|ui-guard):\s*motion-duration-reviewed/i.test(text)) {
    const match = text.match(longMotion)
    const line = text.slice(0, match?.index ?? 0).split(/\r?\n/).length
    add(file, line, 'QS-MOTION-002', '发现超过 400ms 的 CSS 动效。请确认它服务于连续任务或状态叙事，并留下 motion-duration-reviewed 的人工验证标记。', match?.[0] ?? text)
  }

  for (const match of isProductionSource(file) ? text.matchAll(/<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/gi) : []) {
    const tag = match[0]
    const attributes = match[2]
    const accessibleContent = match[3].replace(/<([A-Za-z][A-Za-z0-9:-]*)\b[^>]*aria-hidden\s*=\s*["']true["'][^>]*>[\s\S]*?<\/\1>/gi, ' ')
    const content = accessibleContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const hasAccessibleName = /\b(?:aria-label|aria-labelledby|title)\s*=\s*(?:["'][^"']+[^"']*["']|\{[^}]+\})/i.test(attributes) || content.length > 0
    const containsIconOnlyContent = /<(?:svg|img|[A-Za-z][A-Za-z0-9]*(?:Icon|Symbol))\b/i.test(match[3])
    if (containsIconOnlyContent && !hasAccessibleName) {
      const line = text.slice(0, match.index).split(/\r?\n/).length
      add(file, line, 'QS-A11Y-003', '图标按钮或链接缺少可访问名称。请提供 aria-label、aria-labelledby、title 或可见文字。', tag)
    }
  }
}

let incomplete = false
for (const root of roots) {
  const exitBefore = process.exitCode
  const skippedBefore = skipped.length
  const resolved = path.resolve(root)
  let realRoot = resolved
  try {
    realRoot = fs.realpathSync(resolved)
  } catch (error) {
    recordReadError(resolved, error)
    incomplete = true
    continue
  }
  scanRoot = realRoot
  config = loadConfig(realRoot)
  walk(realRoot)
  if (process.exitCode === 2 && exitBefore !== 2) incomplete = true
  // `maxFileBytes` is a declared boundary, not a failed read: it is reported but
  // does not make the scan incomplete.
  // `symlink` is a declared boundary too: the target is reviewed from wherever it
  // really lives, so a link inside the tree is visibility, not a failed read.
  for (const item of skipped.slice(skippedBefore)) {
    if (item.reason !== 'maxFileBytes' && item.reason !== 'symlink') incomplete = true
  }
}

const severityRank = { P0: 0, P1: 1, P2: 2 }
const compare = (left, right) =>
  (severityRank[left.severity] ?? 3) - (severityRank[right.severity] ?? 3) ||
  left.file.localeCompare(right.file) ||
  left.line - right.line ||
  left.rule.localeCompare(right.rule)

// Findings are ordered by severity, then file, line and rule so two runs over the
// same tree always print the same report and diffs between runs stay readable.
findings.sort(compare)

const displayPath = (file) => {
  const relative = path.relative(process.cwd(), file)
  return relative && !relative.startsWith('..') ? relative : file
}

// A baseline records accepted findings so a task can adopt the tool on a legacy
// tree without silencing the file. The key is rule + path + message, never the
// line number: editing an unrelated line above a finding must not resurrect it,
// and a second identical finding in the same file is a new occurrence.
const baselineKey = (item) => `${item.rule}|${displayPath(item.file)}|${item.message}`

function readBaseline(file) {
  let raw
  try {
    raw = fs.readFileSync(file, 'utf8')
  } catch {
    process.stderr.write(`ui-guard review: cannot read baseline ${file}\n`)
    process.exitCode = 2
    return null
  }
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    process.stderr.write(`ui-guard review: invalid baseline ${file}: not JSON\n`)
    process.exitCode = 2
    return null
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.entries)) {
    process.stderr.write(`ui-guard review: invalid baseline ${file}: missing entries array\n`)
    process.exitCode = 2
    return null
  }
  return parsed.entries.filter((entry) => typeof entry === 'string')
}

const baselineCounts = new Map()
let baselineSuppressed = 0
if (baselinePath !== null) {
  const entries = readBaseline(baselinePath)
  if (entries === null) {
    process.exit(2)
  }
  for (const entry of entries) baselineCounts.set(entry, (baselineCounts.get(entry) ?? 0) + 1)
  const kept = []
  for (const item of findings) {
    const key = baselineKey(item)
    const remaining = baselineCounts.get(key) ?? 0
    if (remaining > 0) {
      baselineCounts.set(key, remaining - 1)
      baselineSuppressed += 1
      continue
    }
    kept.push(item)
  }
  findings.length = 0
  findings.push(...kept)
}

if (writeBaselinePath !== null) {
  const entries = findings.map(baselineKey).sort()
  try {
    fs.writeFileSync(writeBaselinePath, `${JSON.stringify({ version: 1, entries }, null, 2)}\n`)
  } catch (error) {
    process.stderr.write(`ui-guard review: cannot write baseline ${writeBaselinePath}: ${error.message}\n`)
    process.exit(2)
  }
  process.stdout.write(`ui-guard review: wrote baseline ${writeBaselinePath} (${entries.length} finding(s))\n`)
  process.exit(0)
}

const bySeverity = Object.fromEntries(['P0', 'P1', 'P2'].map((severity) => [severity, findings.filter((item) => item.severity === severity).length]))
const byRule = Object.fromEntries([...new Set(findings.map((item) => item.rule))].sort().map((rule) => [rule, findings.filter((item) => item.rule === rule).length]))

const output = {
  version: 2,
  roots,
  reviewed,
  findings: findings.map((item) => ({ ...item, file: displayPath(item.file) })),
  metrics,
  summary: {
    total: findings.length,
    skipped: skipped.length,
    baselined: baselineSuppressed,
    bySeverity,
    byRule
  },
  skipped
}

if (json) {
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
} else if (findings.length === 0) {
  process.stdout.write(incomplete ? 'ui-guard review: scan incomplete\n' : `ui-guard review: no static findings (${reviewed} file(s) reviewed)\n`)
  if (reviewed === 0) {
    process.stdout.write('ui-guard review: reviewed no files — check the root path, the extension list, or pass --include-markdown\n')
  }
  if (skipped.length > 0) {
    for (const item of skipped) process.stdout.write(`ui-guard review: skipped ${displayPath(item.file)} (${item.reason})\n`)
  }
} else {
  for (const item of findings) {
    process.stdout.write(`${displayPath(item.file)}:${item.line} ${item.severity} ${item.rule} ${item.message}\n`)
    process.stdout.write(`  ${item.evidence}\n`)
  }
  // The repair belongs to the rule, not to the sighting. Printing it under every
  // finding repeated the same three sentences 29 times and pushed the file list —
  // the part the reader acts on — off the first screen. One repair per rule, at
  // the end, with how many places it applies to.
  const repairGroups = [...new Set(findings.map((item) => item.rule))]
    .map((rule) => ({ rule, items: findings.filter((item) => item.rule === rule) }))
    .sort((left, right) => severityRank[left.items[0].severity] - severityRank[right.items[0].severity] || left.rule.localeCompare(right.rule))
  for (const group of repairGroups) {
    const remediation = group.items[0].remediation
    if (!remediation) continue
    const scope = group.items.length > 1 ? ` (${group.items.length} finding(s))` : ''
    process.stdout.write(`${group.rule}${scope} → ${remediation}\n`)
  }
  const counts = ['P0', 'P1', 'P2'].filter((severity) => bySeverity[severity] > 0).map((severity) => `${bySeverity[severity]} ${severity}`)
  process.stdout.write(`ui-guard review: ${findings.length} finding(s) (${counts.join(', ')}) in ${reviewed} file(s)\n`)
  if (baselineSuppressed > 0) process.stdout.write(`ui-guard review: ${baselineSuppressed} finding(s) matched the baseline\n`)
  for (const item of skipped) process.stdout.write(`ui-guard review: skipped ${displayPath(item.file)} (${item.reason})\n`)
  if (incomplete) process.stdout.write('ui-guard review: scan incomplete\n')
}

// Exit code has exactly one source of truth: 2 wins over 1, 1 wins over 0.
process.exitCode = incomplete ? 2 : findings.length === 0 ? 0 : 1
