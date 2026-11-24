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

const args = process.argv.slice(2)
const json = args.includes('--json')
const includeMarkdown = args.includes('--include-markdown')
const roots = args.filter((arg) => !arg.startsWith('--'))
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
  'QS-COMPOSITION-001': 'P1',
  'QS-SLOP-001': 'P2',
  'QS-SLOP-002': 'P2',
  'QS-SLOP-003': 'P2'
}
function loadConfig(root) {
  const candidates = []
  let current = fs.statSync(root).isDirectory() ? root : path.dirname(root)
  while (true) {
    candidates.push(path.join(current, '.quiet-systems.json'))
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }
  candidates.push(path.resolve('.quiet-systems.json'))
  const file = candidates.find((candidate) => fs.existsSync(candidate))
  if (!file) return {}
  try {
    return { ...JSON.parse(fs.readFileSync(file, 'utf8')), __baseDir: fs.realpathSync(path.dirname(file)) }
  } catch (error) {
    process.stderr.write(`quiet-systems review: invalid config ${file}: ${error.message}\n`)
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
  process.stderr.write(`quiet-systems review: skip ${file}: ${error.message}\n`)
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
  if (stat.isSymbolicLink()) return
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
  if (extensions.has(path.extname(entry))) inspect(entry)
}

function add(file, line, rule, message, evidence) {
  if (isIgnored(file, rule)) return
  findings.push({ file, line, rule, severity: severityByRule[rule] ?? 'P2', message, evidence: evidence.trim() })
}

function isProductionSource(file) {
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
  let text
  try {
    text = fs.readFileSync(file, 'utf8')
  } catch (error) {
    recordReadError(file, error)
    return
  }
  const lines = text.split(/\r?\n/)
  const maxCopyLength = Number(config.rules?.['QS-COPY-003']?.maxLength ?? 180)
  const copyFindings = new Set()
  const copySlopFindings = new Set()
  const separatorFindings = new Set()
  const otherSeparatorFindings = new Set()
  const nativeControlFindings = new Set()
  const composition = {
    file,
    headingCount: countMatches(text, /<h[1-6]\b/gi),
    surfaceCount: countMatches(text, /(?:class|className)\s*=\s*["'][^"']*\b(?:card|panel|surface|tile)\b/gi),
    pillCount: countMatches(text, /(?:class|className)\s*=\s*["'][^"']*\b(?:pill|badge|chip|tag)\b/gi),
    dividerCount: countMatches(text, /<hr\b|(?:class|className)\s*=\s*["'][^"']*\b(?:divider|separator)\b/gi),
    ...actionMetrics(text)
  }
  metrics.push(composition)
  if (isProductionSource(file) && (composition.headingCount > 1 || composition.surfaceCount > 4 || composition.pillCount > 3 || composition.dividerCount > 3 || composition.textActionCount > 2)) {
    add(file, 1, 'QS-COMPOSITION-001', '源文件组合预算疑似超限。请优先用运行时 route 指标复核，保留一个主标题、一个主工作面，默认移除装饰性胶囊和重复分割线，并在审阅记录中逐项说明合法例外。', JSON.stringify(composition))
  }
  const copySlop = /(?:无缝(?:衔接|协作|体验)?|赋能|重新定义|全新体验|极致(?:体验|效率)|一站式|智能化(?:地)?|轻松(?:实现|提升|开始)|无界(?:协作|体验)|为你打造|随时准备|seamless|revolutionary|next[- ]generation|game[- ]changing|effortless|made for you|ready when you are)/i
  const defensiveCopy = /(?:为了更好地|如有任何问题|温馨提示|请注意|仅供参考|感谢(?:您的|你?的)理解|你可以放心|放心使用|我们不会|为了方便起见|特别说明|需要注意|务必(?:保证|确认|检查)?|please note|for your convenience|rest assured|just so you know)/i
  const concreteSafetyCondition = /(?:务必|请注意|please note)\s*(?:在|于|当|如果|关闭|断电|before|after|when|if)\S*/i
  const disclaimerCopy = /(?:内容由\s*AI\s*生成|AI\s*生成内容|仅为演示|效果因人而异|请自行判断|可能存在误差|不构成(?:建议|承诺)|我们无法保证|免责声明|AI-generated content|generated by AI|for demonstration only|results may vary|not financial advice|use your own judgment)/i
  const promiseCopy = /(?:敬请期待|即将上线|持续优化中|为你带来|我们致力于|stay tuned|coming soon|constantly improving|we are committed to)/i
  const copyContext = /<(?:p|button|label|h[1-6]|span|a)\b[^>]*>|\b(?:label|title|placeholder|aria-label|children|text|description)\s*[:=]\s*["'`]/i
  lines.forEach((source, index) => {
    const line = index + 1
    const trimmed = source.trim()

    if (/\S\s*[·•⋅∙]\s*\S/.test(source)) {
      add(file, line, 'QS-COPY-001', '行内装饰性分隔符会把不同字段收缩成一段不可扫描文本，请拆成独立元素。', source)
      separatorFindings.add(`${line}:${source}`)
    }

    const containsJsx = /<[A-Za-z][^>]*>/.test(source)
    const looksLikeTypeSyntax = !containsJsx && /\b(?:type|interface|extends|implements|import|export|const|let|var)\b[^;]*\|/.test(source)
    const containsShortcut = /\b(?:Cmd|Ctrl|Alt|Shift|Meta)\s*(?:\+|\|)\s*(?:Cmd|Ctrl|Alt|Shift|Meta|[A-Za-z0-9])/.test(source)
    if (/\S\s+[|／/]\s+\S/.test(source) && !looksLikeTypeSyntax && !containsShortcut && !/https?:\/\//.test(source) && !/^\s*\|/.test(source) && !/\d+\s*\/\s*\d+/.test(source)) {
      add(file, line, 'QS-COPY-002', '不要用竖线或斜杠替代中点连接元信息，请使用布局和语义字段。', source)
      otherSeparatorFindings.add(`${line}:${source}`)
    }

    if (/style\s*=|style\s*:\s*\{/.test(source) && !/^\s*(\/\/|\*|\/\*)/.test(source)) {
      add(file, line, 'QS-VISUAL-001', '视觉值写在业务行内会绕过统一 Token，请移到设计系统样式或语义变量。', source)
    }

    if (/#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})\b/i.test(source) && !/(^|[/\\])(tokens?|theme|design)([/\\]|$)/i.test(file) && !/^\s*(\/\/|\*|\/\*)/.test(source)) {
      add(file, line, 'QS-VISUAL-002', '业务文件中出现硬编码颜色，请使用语义 Token。', source)
    }

    const inputTag = source.match(/<input\b[^>]*>/i)?.[0] ?? ''
    const visibleInput = inputTag && !/\btype\s*=\s*["']hidden["']/i.test(inputTag)
    const nativeControl = /<(?:select|meter|progress|textarea)\b|appearance\s*:\s*auto/i.test(source) || Boolean(visibleInput)
    const adaptedNativeControl = /data-quiet-adapted|quiet-systems:\s*allow-native/.test(source)
    if (nativeControl && !adaptedNativeControl) {
      add(file, line, 'QS-COMPONENT-001', '发现未经设计适配的原生视觉入口。保留原生语义和键盘行为，但由统一组件接管外观。', source)
      nativeControlFindings.add(`${line}:${source}`)
    }

    if (/(width|height)\s*=\s*["'](?:12|14|16|18|20|24|32)["']/.test(source) && /icon|svg|symbol/i.test(source)) {
      add(file, line, 'QS-ICON-001', '图标尺寸疑似写死为单一像素值，请使用光学尺寸 Token，并按文字、控件和平台密度协调。', source)
    }

    if (isProductionSource(file) && /<(?:small|h[4-6])\b|\b(?:subtitle|sub-title|tagline|eyebrow|helper-text|helperText|caption|description)\b/i.test(source)) {
      add(file, line, 'QS-HIERARCHY-001', '发现可能的副标题、小字或解释性层级。请证明它改变了方向、状态、后果或下一步决策，否则删除并用布局、换行、字重或位置建立层级。', source)
    }

    if (isProductionSource(file) && defensiveCopy.test(source) && !concreteSafetyCondition.test(source) && copyContext.test(source) && !/^\s*(\/\/|\*|\/\*)/.test(source)) {
      add(file, line, 'QS-COPY-004', '发现防御性或礼貌性解释文案。删除无法改变当前决策的安抚、免责声明和“方便说明”，只保留具体条件、结果、限制或恢复动作。', source)
    }

    const hasVisibleTag = /<(?:p|button|label|h[1-6]|span|a)\b[^>]*>/i.test(source)
    const hasMetadataOnlyContext = /(?:aria-label|aria-describedby|description)\s*[:=]/i.test(source) && !hasVisibleTag
    if (isProductionSource(file) && disclaimerCopy.test(source) && copyContext.test(source) && !hasMetadataOnlyContext && !/^\s*(\/\/|\*|\/\*)/.test(source)) {
      add(file, line, 'QS-COPY-005', '发现免责声明式文案。只保留会改变当前操作的具体限制，并放在对应决策旁，删除泛化防御和责任转移。', source)
    }

    if (isProductionSource(file) && promiseCopy.test(source) && copyContext.test(source) && !hasMetadataOnlyContext && !/^\s*(\/\/|\*|\/\*)/.test(source)) {
      add(file, line, 'QS-COPY-006', '发现无法由当前界面证明的未来承诺或安抚语。改成已完成的结果、具体日期或当前可执行动作。', source)
    }

    if (/<button\b/i.test(source) && /(?:查看|编辑|删除|关闭|搜索|复制|下载|撤销|还原|更多|对比|分享|刷新|保存|提交|开始|停止|返回|确认|取消|创建|导入|导出|移动|添加|移除|展开|收起|save|submit|start|stop|back|confirm|cancel|create|import|export|expand|collapse)/i.test(source) && !/<svg\b|<[^>]*(?:Icon|icon|data-icon|aria-label|title)=/i.test(source)) {
      add(file, line, 'QS-ICON-002', '发现可由熟悉图标表达的文字动作。请评估无边界图标控件，并保留可访问名称、焦点态和命中区。', source)
    }

    if (/(backdrop-filter|backdrop-blur|filter\s*:\s*blur|linear-gradient|linearGradient|radial-gradient|radialGradient|text-shadow|box-shadow\s*:[^;]*0\s+0\s+[1-9]\d*px|boxShadow\s*:\s*["'][^"']*0\s+0\s+[1-9]\d*px)/i.test(source)) {
      add(file, line, 'QS-SLOP-001', '发现可能只承担装饰作用的玻璃、渐变、模糊或发光效果，请证明它服务于层级或任务。', source)
    }

    if (/<(?:Sparkles|Stars|Robot|Brain|Bot|Hexagon)(?:Icon|Graphic|Background)\b|(?:sparkles|magic-wand|neural-network-background|ai-(?:sparkles|magic))/i.test(source)) {
      add(file, line, 'QS-SLOP-002', '发现可能泛化表达 AI 的装饰图形，请替换为实际对象或动作语义。', source)
    }

    const completeCopyBlock = /<(?:p|button|label|h[1-6]|span|a)\b[^>]*>[\s\S]*<\/(?:p|button|label|h[1-6]|span|a)>/i.test(source)
    if (copySlop.test(source) && copyContext.test(source) && !completeCopyBlock && !/^\s*(\/\/|\*|\/\*)/.test(source)) {
      add(file, line, 'QS-SLOP-003', '发现可能脱离当前对象和动作的泛化营销文案。请改成具体对象、结果或下一步动作，或在评审中说明它的产品语义。', source)
      copySlopFindings.add(`${line}:${source}`)
    }

    const demoName = /\b(?:mock|demo|fake|fixture)(?:Data|User|Item|_[A-Za-z0-9]+|[A-Z][A-Za-z0-9]*)\b|\b(?:Mock|Demo|Fake|Fixture)(?:Data|User|Item|_[A-Za-z0-9]+|[A-Z][A-Za-z0-9]*)\b/.test(source)
    const demoPayload = /__source\s*[:=]\s*["']demo["']/.test(source)
    if (isProductionSource(file) && (demoName || demoPayload) && !/^\s*(\/\/|\*|\/\*)/.test(source)) {
      add(file, line, 'QS-PROTOTYPE-001', '生产源文件中出现演示数据命名。请通过明确的 adapter 和生产数据类型接入，或将其移到 prototype、test 或 fixture 目录。', source)
    }

    if (trimmed.length > maxCopyLength && /<(?:p|button|label|h[1-6])\b/i.test(source)) {
      add(file, line, 'QS-COPY-003', '可见 UI 文案过长，可能把解释性文本塞进了当前层级。请考虑摘要、详情或错误恢复区域。', source)
      copyFindings.add(`${line}:${source}`)
    }
  })

  for (const match of text.matchAll(/<(p|button|label|h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const visibleCopy = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (visibleCopy.length <= maxCopyLength) continue
    const line = text.slice(0, match.index).split(/\r?\n/).length
    const evidence = match[0].split(/\r?\n/)[0]
    const key = `${line}:${evidence}`
    if (copyFindings.has(key)) continue
    add(file, line, 'QS-COPY-003', '可见 UI 文案过长，可能把解释性文本塞进了当前层级。请考虑摘要、详情或错误恢复区域。', evidence)
  }

  for (const match of text.matchAll(/<(p|button|label|h[1-6]|span|a)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const visibleCopy = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const line = text.slice(0, match.index).split(/\r?\n/).length
    const evidence = match[0].split(/\r?\n/)[0]
    const blockRules = [
      [defensiveCopy, 'QS-COPY-004', '发现防御性或礼貌性解释文案。删除无法改变当前决策的安抚、免责声明和“方便说明”，只保留具体条件、结果、限制或恢复动作。'],
      [disclaimerCopy, 'QS-COPY-005', '发现免责声明式文案。只保留会改变当前操作的具体限制，并放在对应决策旁，删除泛化防御和责任转移。'],
      [promiseCopy, 'QS-COPY-006', '发现无法由当前界面证明的未来承诺或安抚语。改成已完成的结果、具体日期或当前可执行动作。']
    ]
    for (const [pattern, rule, message] of blockRules) {
      if (!isProductionSource(file) || !pattern.test(visibleCopy) || (rule === 'QS-COPY-004' && concreteSafetyCondition.test(visibleCopy))) continue
      if (!findings.some((finding) => finding.file === file && finding.line === line && finding.rule === rule)) add(file, line, rule, message, evidence)
    }
  }

  for (const match of text.matchAll(/<(p|button|label|h[1-6]|span|a)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const visibleCopy = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (!copySlop.test(visibleCopy)) continue
    const line = text.slice(0, match.index).split(/\r?\n/).length
    const evidence = match[0].split(/\r?\n/)[0]
    const key = `${line}:${evidence}`
    if (copySlopFindings.has(key)) continue
    add(file, line, 'QS-SLOP-003', '发现可能脱离当前对象和动作的泛化营销文案。请改成具体对象、结果或下一步动作，或在评审中说明它的产品语义。', evidence)
  }

  // Inspect character references in markup text without decoding the source file.
  if (/\.(?:html|jsx|tsx|vue|svelte|astro)$/.test(file)) {
    const markup = text.replace(/<!--[^]*?-->|<(script|style|pre|code)\b[^>]*>[^]*?<\/\1>/gi,
      block => ' '.repeat(block.length))
    for (const node of markup.matchAll(/[>}]([^<>{}]*?)(?=[<{])/g)) {
      const value = node[1]
      const entity = /&(?:middot|centerdot|CenterDot|bull|bullet|sdot|#(?:0*(?:183|8226|8901|8729)|[xX]0*(?:[bB]7|2022|22[cC]5|2219)));/.exec(value)
      if (!entity) continue
      const offset = node.index + 1 + entity.index
      const line = text.slice(0, offset).split('\n').length
      if (!separatorFindings.has(`${line}:${lines[line - 1]}`)) {
        add(file, line, 'QS-COPY-001', '可见文字中的 HTML 字符引用会渲染为中点。请用独立字段和间距区分内容。', lines[line - 1])
      }
    }
  }

  for (const match of text.matchAll(/<(span|small|p|div|label)\b[^>]*>\s*[·•⋅∙]\s*<\/\1>/gi)) {
    const line = text.slice(0, match.index).split(/\r?\n/).length
    const evidence = match[0].split(/\r?\n/)[0]
    if (!match[0].includes('\n') && separatorFindings.has(`${line}:${evidence}`)) continue
    add(file, line, 'QS-COPY-001', '独立节点中出现装饰性分隔符。请使用布局、间距、对齐或语义字段区分内容。', evidence)
  }

  for (const match of text.matchAll(/<(span|small|p|div|label|h[1-6]|button|a)\b[^>]*>\s*[|／/]\s*<\/\1>/gi)) {
    const line = text.slice(0, match.index).split(/\r?\n/).length
    const evidence = match[0].split(/\r?\n/)[0]
    const before = text.slice(0, match.index)
    const codeContexts = ['code', 'pre', 'kbd']
    const isCodeContext = codeContexts.some((tagName) => before.lastIndexOf(`<${tagName}`) > before.lastIndexOf(`</${tagName}>`))
    if (isCodeContext) continue
    if (!match[0].includes('\n') && /\S\s+[|／/]\s+\S/.test(text.split(/\r?\n/)[line - 1] ?? '') && otherSeparatorFindings.has(`${line}:${text.split(/\r?\n/)[line - 1]}`)) continue
    add(file, line, 'QS-COPY-002', '独立节点中出现竖线或斜杠分隔符。请使用布局、间距、对齐或语义字段区分内容。', evidence)
  }

  for (const match of text.matchAll(/<(input|textarea|select|meter|progress)\b[\s\S]*?>/gi)) {
    const tag = match[0]
    const line = text.slice(0, match.index).split(/\r?\n/).length
    const lineSource = lines[line - 1] ?? ''
    const hiddenInput = /^<input\b[^>]*\btype\s*=\s*["']hidden["']/i.test(tag)
    const adapted = /data-quiet-adapted|quiet-systems:\s*allow-native/.test(tag)
    if (hiddenInput || adapted || nativeControlFindings.has(`${line}:${lineSource}`)) continue
    add(file, line, 'QS-COMPONENT-001', '发现未经设计适配的原生视觉入口。保留原生语义和键盘行为，但由统一组件接管外观。', tag)
  }

  for (const match of text.matchAll(/<img\b[\s\S]*?>/gi)) {
    const tag = match[0]
    const line = text.slice(0, match.index).split(/\r?\n/).length
    if (!/\balt\s*=/.test(tag) && !/\baria-label\s*=/.test(tag) && !/role\s*=\s*["']presentation["']/.test(tag) && !/aria-hidden\s*=\s*["']true["']/.test(tag)) {
      add(file, line, 'QS-A11Y-001', '图片必须提供 alt 属性，或明确标记为装饰性图片。', tag)
    }
  }

  for (const match of text.matchAll(/<[^>]+>/gi)) {
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
  const hasMotionReviewMarker = /quiet-systems:\s*motion-adapted/i.test(text)
  if (isCssSource && hasMotionDeclaration && !hasReducedMotionPath && !hasMotionReviewMarker) {
    const line = text.slice(0, Math.max(text.search(/\b(?:transition|animation)\s*:/i), 0)).split(/\r?\n/).length
    add(file, line, 'QS-MOTION-001', '发现 CSS 动效但没有 reduced-motion 路径。请提供 prefers-reduced-motion 降级，或留下 quiet-systems: motion-adapted 的人工验证标记。', text.split(/\r?\n/)[line - 1] ?? text)
  }

  const longMotion = /\b(?:transition|animation)\s*:[^;{}]*(?:\b(?:[5-9]\d{2}|\d{4,})ms\b|\b(?:0\.[5-9]|[1-9]\d*)s\b)/i
  if (isCssSource && longMotion.test(text) && !/quiet-systems:\s*motion-duration-reviewed/i.test(text)) {
    const match = text.match(longMotion)
    const line = text.slice(0, match?.index ?? 0).split(/\r?\n/).length
    add(file, line, 'QS-MOTION-002', '发现超过 400ms 的 CSS 动效。请确认它服务于连续任务或状态叙事，并留下 motion-duration-reviewed 的人工验证标记。', match?.[0] ?? text)
  }

  for (const match of text.matchAll(/<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
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

for (const root of roots) {
  const resolved = path.resolve(root)
  let realRoot = resolved
  try {
    realRoot = fs.realpathSync(resolved)
  } catch (error) {
    recordReadError(resolved, error)
    continue
  }
  scanRoot = realRoot
  config = loadConfig(realRoot)
  walk(realRoot)
}

const output = {
  version: 1,
  roots,
  findings,
  metrics,
  summary: {
    total: findings.length,
    skipped: skipped.length,
    bySeverity: Object.fromEntries(['P0', 'P1', 'P2'].map((severity) => [severity, findings.filter((item) => item.severity === severity).length])),
    byRule: Object.fromEntries([...new Set(findings.map((item) => item.rule))].map((rule) => [rule, findings.filter((item) => item.rule === rule).length]))
  },
  skipped
}

if (json) {
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
} else if (findings.length === 0) {
  process.stdout.write(process.exitCode === 2 ? 'quiet-systems review: scan incomplete\n' : 'quiet-systems review: no static findings\n')
} else {
  for (const item of findings) {
    process.stdout.write(`${item.file}:${item.line} ${item.rule} ${item.message}\n  ${item.evidence}\n`)
  }
  process.stdout.write(`quiet-systems review: ${findings.length} finding(s)\n`)
}

if (process.exitCode !== 2) process.exitCode = findings.length === 0 ? 0 : 1
