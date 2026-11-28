## Review deliverable

A UI review should return:

1. The primary task, object, and audience
2. The information hierarchy and visible versus deferred content
3. The chosen visual direction and the alternatives considered when the brief was unclear
4. The component, icon, control, and state contracts
5. The data and action mapping from production input to visible output
6. Findings from static review, real-data checks, keyboard/focus checks, responsive checks, and reduced-motion checks
7. Deletions, merges, or moves to detail with reasons
8. Unverified items and the evidence still needed

Before implementation, validate the input contract with `node "$SKILL_HOME/scripts/validate-design-brief.mjs" design-brief.json`. The brief prevents context dumping by requiring a reason for each loaded reference, names generated or supplied material that remains untrusted, blocks focused repairs without reusable evidence, and permits exploratory work before a direction is selected.

For handoff, validate the interaction contract with `node "$SKILL_HOME/scripts/validate-interaction-inventory.mjs" interaction-inventory.json`. The delivery gate also checks that the narrow and wide screenshot files contain readable PNG or JPEG dimensions matching 390 and 1440 CSS pixels.

## Static review rules

The companion `scripts/ui-guard-review.mjs` reports common source-level issues:

- `QS-COPY-001` and `QS-COPY-002` detect inline decorative separators
- `QS-VISUAL-001` and `QS-VISUAL-002` detect bypasses around visual tokens
- `QS-COMPONENT-001` flags visible native input, textarea, select, meter, progress, and automatic native-appearance controls without an explicit visual adaptation marker
- `QS-ICON-001` flags suspicious fixed `width` or `height` attributes on icon-like HTML, JSX, SVG, or component source. It does not evaluate CSS classes or runtime size tokens.
- `QS-ICON-002` flags common compact actions that remain text-only without an icon or accessible naming evidence. Review each candidate instead of converting unfamiliar, destructive, or consequential actions mechanically.
- `QS-HIERARCHY-001` flags likely subtitles, captions, helper text, small labels, and eyebrow layers in production source. Delete them when they repeat the task. Keep them only when they change orientation, state, consequence, or the next decision.
- `QS-COPY-004` flags defensive, polite, throat-clearing, hedging, or performative-empathy copy such as “请注意”, “仅供参考”, “为了更好地”, “值得注意的是”, “懂你所想”, “我们很抱歉”, “oops”, and “please note”. Delete it unless the line states a concrete condition, limitation, result, or recovery action that changes the current decision.
- `QS-COPY-004` skips a small set of concrete safety conditions such as “务必在关闭电源后操作”. Review the condition and its scope manually. A static pass does not prove that the safety instruction is complete.
- `QS-COPY-005` flags disclaimer-style copy such as “内容由 AI 生成，请核实重要信息”, “仅为演示”, “效果因人而异”, “请自行判断”, “不构成建议”, and “可能存在误差”. Keep only a specific limitation at the decision point when it changes the current action. See [Copy constraints](copy-constraints.md).
- `QS-COPY-006` flags vague future promises and reassurance such as “敬请期待”, “即将上线”, “持续优化中”, and “为你带来”. Keep only a dated, sourced commitment or a completed result. Action labels such as “Try it now” and “Welcome” are reviewed by task semantics instead.
- `QS-COPY-007` flags metaphor and jargon standing in for an action: “闭环”, “赋能”, “底座”, “抓手”, “沉淀”, “打通”, “降维”, “north star”, “flywheel”, “leverage”, “orchestrate”. Rewrite as verb plus concrete object, and state in the review what the sentence would make someone do. A line that names a real action nearby is left alone.
- `QS-COPY-008` flags an unexplained abbreviation on first use. Write the full phrase, or put the expansion in parentheses right after the token. Common interface abbreviations (API, URL, ID, JSON, HTML, CSS, HTTP, PDF, CSV, SVG, OS, SQL, DNS, SDK, CLI, TLS, SSH, IP, MFA, OTP, AI, ML, GPS, FAQ, UUID, RSS, IDE, REST, YAML, UTF, CPU, RAM, GPU, USB) are exempt because they are read as words, not decoded.
- `QS-COPY-009` flags aphoristic, negative-parallelism, or translated syntax: “不止于…”, “为…而生”, “不是…而是…”, “并非…而是…”, “不仅仅是…更是…”, “与其说…不如说…”, “才是…的答案”, “born for”, “isn't just”, “more than just”, “not merely … but”. Restore a sentence you could say to a colleague: who does what, and what changes. See [Copy constraints](copy-constraints.md).
- `QS-COPY-010` flags a capability compressed into a noun phrase with its object dropped: “一键洞察”, “智能治理”, “深度对齐”, “全链路编排”, “无感协同”. The reader cannot tell what is being counted, sent, merged or scheduled. Write out who turns what into what (“把今天的排期抄进周报”), and keep the shortened form only where the object is already on screen. A line that names a concrete action nearby is left alone. See [Copy constraints](copy-constraints.md).
- `QS-COPY-011` flags em-dash slogan stitching (`——` / `—`) inside UI microcopy and forced three-adjective puffery triads such as “高效、安全、稳定” or “fast, simple, and reliable”. Split into plain short statements that carry concrete facts. See [Copy constraints](copy-constraints.md).
- `QS-COPY-012` flags unverified social proof and inflated vanity metrics such as “已被 50,000+ 团队信赖”, “效率提升 300%”, “99.9% 满意度”, “trusted by 10,000+ teams”, or “3x faster”. Remove invented figures, or cite the real data source, scope, and date in the review record. See [Copy constraints](copy-constraints.md).
- `scripts/validate-interaction-inventory.mjs` blocks an interaction handoff when the object, result, recovery path, action role, control grammar, or accessible name is missing.
- `QS-COMPOSITION-001` reports per-file counts for headings, surfaces, pills, dividers, text actions, and icon-only actions (including Tailwind pill and `divide-x/y` cues). It flags more than one heading, more than four card-like surfaces, more than three pills, more than three dividers, or more than two text actions in a production source file. Treat the result as a budget review, then record the reason for every retained exception.
- `scripts/measure-composition.mjs` measures the rendered route at 390 and 1440 CSS pixels using both class cues and computed-style heuristics, and emits an advisory `antiPatterns` audit (nested bordered cards, skipped heading levels, sub-12px text, WCAG contrast failures, non-concentric nested radii, horizontal overflow). Use it with a running app to replace source heuristics with visible DOM counts and body text, then record its JSON output and any selector exceptions in the review evidence.
- `QS-SLOP-001` and `QS-SLOP-002` flag common decorative AI treatment across CSS and Tailwind (glass, gradients, gradient text `bg-clip-text`, thick side-tab `border-l-4`, glow shadows, non-skeleton `animate-pulse`/`animate-ping`, and generic AI icons)
- `QS-INTERACTION-001` flags a destructive or irreversible action whose control carries only an icon. The accessible name is not enough: a sighted reader has to recognise the glyph before they know what it destroys, and a trash can in a list of rooms says nothing about which room. Keep the icon and add the action and its object (“删除房间”).
- `QS-INTERACTION-002` flags a control whose whole label either repeats the heading above it or restates its own state (“已连接”). A button that echoes its state looks pressable while doing nothing, and one that echoes the heading makes the reader re-read the same word. State belongs in read-only text; the control keeps an action verb and its object.
- `QS-SLOP-003` flags common generic AI-marketing copy patterns for human review
- `QS-A11Y-001` flags images without an alternative text attribute
- `QS-A11Y-002` flags common native, semantic, or event-bound interactive elements hidden with `aria-hidden="true"`
- `QS-A11Y-003` flags icon-only buttons or links without an accessible name
- `QS-PROTOTYPE-001` flags demo-shaped data names in production source paths
- `QS-COPY-003` flags unusually long inline UI copy
- `QS-MOTION-001` flags CSS transitions or animations without a reduced-motion path or an explicit manual-review marker
- `QS-MOTION-002` flags CSS transitions or animations longer than 400ms unless their duration has an explicit manual-review marker

### Severity

Severity is registered per rule in `scripts/ui-guard-review.mjs` and mirrors this table. `scripts/review-rules.test.mjs` fails when the two disagree, so a severity change is a code change plus a documentation change in the same commit.

| Rule | Severity |
| --- | --- |
| `QS-PROTOTYPE-001` | P0 |
| `QS-A11Y-001` | P1 |
| `QS-A11Y-002` | P1 |
| `QS-A11Y-003` | P1 |
| `QS-COMPONENT-001` | P1 |
| `QS-COMPOSITION-001` | P1 |
| `QS-COPY-001` | P1 |
| `QS-COPY-002` | P1 |
| `QS-COPY-004` | P1 |
| `QS-COPY-005` | P1 |
| `QS-COPY-006` | P1 |
| `QS-COPY-007` | P1 |
| `QS-HIERARCHY-001` | P1 |
| `QS-MOTION-001` | P1 |
| `QS-VISUAL-001` | P1 |
| `QS-VISUAL-002` | P1 |
| `QS-COPY-003` | P2 |
| `QS-COPY-008` | P2 |
| `QS-COPY-009` | P2 |
| `QS-COPY-010` | P1 |
| `QS-COPY-011` | P2 |
| `QS-COPY-012` | P1 |
| `QS-ICON-001` | P2 |
| `QS-ICON-002` | P2 |
| `QS-MOTION-002` | P2 |
| `QS-SLOP-001` | P2 |
| `QS-SLOP-002` | P2 |
| `QS-SLOP-003` | P2 |
| `QS-INTERACTION-001` | P1 |
| `QS-INTERACTION-002` | P2 |

The copy budget for `QS-COPY-003` is weighted, not a character count: CJK characters weigh 1, Latin letters, digits and spaces weigh 0.5, and the default `maxLength` of 180 means "about 180 CJK characters". Override it with `rules["QS-COPY-003"].maxLength`.

Configuration is optional and read from the first of `.ui-guard.json` and `.quiet-systems.json` found in the scanned root. Six top-level keys exist: `include`, `ignore`, `ignoreDirs`, `maxFileBytes`, `treatAsProduction` and `rules`. `treatAsProduction` takes glob patterns resolved against the config directory; a file that matches is scanned as production source even when it sits under `examples`, `fixtures`, `prototype`, `test`, `tests`, `__tests__`, `scripts` or ends in `.test.`/`.spec.` — that is how a deliberately bad sample gets reviewed. Use it in the sample's own config, never in the repository root, or every downstream project inherits the widened gate. `include` does the opposite of `ignore`: a matching file is inspected even when its extension is outside the built-in list, which is how a template format the script does not know about still gets reviewed. Patterns resolve against both bases, like `ignore`. A key that is accepted but never read is worse than a missing feature, because the run reports clean on files it never opened. Any other key, or a `rules` key that is not a registered rule id, is a configuration error: the script prints `invalid config`, names the offending key and exits `2` rather than falling back to a default. Patterns in `ignore` and in `rules.<id>.ignore` are resolved against both the configuration directory and the scan root, so a pattern matches when either base resolves it. `rules.<id>.maxLength` overrides the default copy budget for `QS-COPY-003`: a number sets one budget, `{ mobile, desktop }` sets both and the narrower one binds, because a line that fits a 1440px column can still overflow a 390px screen. The finding message names both numbers whenever they differ. `cjkWeight` and `latinWeight` change the per-glyph cost. Both must be positive finite numbers: a bad value prints `` `rules.<id>.cjkWeight` must be a positive number `` (or the `latinWeight` equivalent) and exits `2` instead of silently falling back, because a budget calibrated against a wrong weight is worse than no budget — it looks measured. Reweighting is for calibrating a language whose glyphs really are cheaper, not for squeezing copy under a threshold. Ready-made starting points live in `examples/configs/` for Tailwind projects and for CSS-variable projects.

Findings are review prompts. Fix or justify each finding. Do not silence the script by deleting the evidence or hiding the source from the scan.

Severity and remediation belong to the rule, not to the call site. `scripts/ui-guard-review.mjs` keeps one registry for each and `scripts/review-rules.test.mjs` fails when a rule id has no severity, no remediation, no entry in this file, or no fixture that makes it fire. A rule that stops firing is a test failure, not a quiet improvement.

Both formats count the files the scan actually read, as `reviewed` in `--json` and as `N file(s) reviewed` in the summary line. "Clean" over zero files is not the same answer as a clean tree, and without the count the reader cannot tell them apart; a scan that read nothing also prints `reviewed no files` with the three usual causes (wrong root, extension list, `--include-markdown`). The report is stable and machine-readable. `--json` emits `version: 2` with `findings` (each carrying `rule`, `severity`, `file`, `line`, `message`, `evidence`, `remediation`), `summary` (`total`, `skipped`, `baselined`, `bySeverity`, `byRule`), `reviewed`, `metrics` and `skipped`. Text output prints one `file:line SEVERITY RULE message` line per finding, then its evidence line; the repair is printed once per rule at the end as `RULE (N finding(s)) → remediation`, because the same three sentences repeated under every sighting push the file list off the first screen. `--json` still carries `remediation` on every finding, so a script never has to join the tail. Findings sort by severity, then file, line and rule, so two runs over the same tree print identical reports. `skipped` lists every file the scan did not read, each with a `reason`: `maxFileBytes` for a file over the configured size ceiling, `symlink` for a link the walker declines to follow, and an error code such as `EACCES` for a failed read. The first two are declared boundaries and leave the exit code alone — the file is legitimately reviewed somewhere else, or is deliberately out of scope. A read error is a gap in coverage, so it makes the scan incomplete and exits `2`. A closed pipe is not a failure: `ui-guard review . | head` stops the scan when the reader has what it wanted and exits `0`, instead of printing an unhandled `EPIPE` stack trace that reads like the reviewed project crashed. Exit codes mean one thing each: `0` clean, `1` findings, `2` incomplete scan (unreadable root, read error, invalid config, invalid baseline or an unrecognised option), with `2` outranking `1`.

Suppression comments are line-scoped and must sit on the line that emits the finding; a marker on its own line says nothing about the next one. Write `ui-guard: ignore` to suppress every rule on that line, or `ui-guard: ignore QS-COPY-001,QS-COPY-002` for a subset (`*` is equivalent to no list). `quiet-systems:` is accepted as a legacy prefix.

An unrecognised option is a usage error rather than a silent pass: a typo like `--basline` would otherwise drop the flag and report on the whole tree as if the run had been scoped. The script names the option, prints the usage line and exits `2`. `--help` prints the same line and exits `0`, so CI can self-check its own arguments.

`--write-baseline FILE` records the current findings and exits `0`. `--baseline FILE` drops the recorded findings and reports only what is new. The baseline key is rule, path and message, never the line number, so editing an unrelated line does not resurrect a finding and a second identical finding in the same file still appears. Use it to adopt the review on a legacy tree; a baseline entry is still a finding someone accepted. A missing, malformed or unwritable baseline exits `2`, so a CI job that points at a stale path fails loudly instead of quietly reporting every finding as new. A value flag given no path (`--baseline ""`, or `--baseline --json`) is a usage error and exits `2` before anything is scanned.

Use the severity in JSON findings as a triage signal. `P0` means a prototype or demo boundary can reach production. `P1` means a visible, interaction, accessibility, or visual-system violation needs correction before handoff. `P2` means a quality or consistency improvement that can be scheduled after the task path is sound. A severity does not replace human review.

Slop findings are prompts for human review. A gradient, material blur, shadow, bot name, geometric icon, or marketing phrase can be legitimate when it clarifies hierarchy, expresses a real product object, improves contrast, states a measurable benefit, or follows an explicit brand system. Product-function names such as `ChatbotPanel` are not decorative AI evidence by themselves. Keyboard shortcuts and breadcrumb paths can use separators when their semantics are explicit.

The static accessibility and motion checks cover source patterns, not every browser state. Follow them with keyboard, focus, accessibility-tree, screen-reader, and reduced-motion verification. The control adaptation check accepts either an intentional corner radius or a clear boundary indicator such as an active tab underline. It does not require every control to become a rounded capsule.

Use semantic icon tiers instead of a universal pixel size. `examples/icon-tiers.ts` is a reference contract showing how inline, control, navigation, and hero icons can adapt their optical box, stroke, and baseline offset by platform. Consumers must validate and tune these starting points against the actual font, icon library, density, touch target, and asymmetric shapes in the product.

Exit code `0` means no findings, `1` means findings were reported, and `2` means the configuration or a scan target could not be read. A reported finding is a review gate, not proof that the UI is incorrect.

For a structured handoff use the [review template](../review-template.md). When delegating a visual review, use the [reviewer contract](../reviewer-contract.md).

### Enforce the form contract in a browser test

For forms that previously grew unrequested fields or showed success too early, call `verifyFormContract(scope, contract)` from `scripts/verify-form-contract.mjs` in your existing Playwright test. Set the expected names from the approved brief or locale fixture before inspecting generated markup. Wait for the intended state, and pass a Playwright Locator for a single visible form region. For an edit step:

```js
await verifyFormContract(form, {
  fields: [{ role: 'textbox', name: '记录' }],
  absentText: ['已保存到此设备']
})
```

Repeat after a forced save failure. After a successful write, use the product test to assert the actual confirmation and persisted value. The helper checks accessible field roles and names (including disabled options) and exact visible phrases. Hidden fields, password/date inputs without implicit roles, and button-driven pickers need explicit product assertions. Keep the phrase list specific to the state. A scoped inventory avoids imposing a universal copy blacklist.

Run the bundled guardrail regression from a workspace with Chrome and `playwright-core`:

```sh
node "$SKILL_HOME/scripts/verify-sample-save.mjs"
```

It exercises failure, keyboard retry and persistence, then deliberately injects a phone field and premature success copy. In a product test, import the helper and let assertion failures propagate to CI.

After the assertions pass, compare available, selected and unavailable choices in the actual layout. In the booking sample, removing an availability label left the active choice relying heavily on its outline. Field counts alone cannot establish that a reader can distinguish these states.

### Paired design trials

Before generation, freeze the brief, content, model identifier, tool access, generation budget and task success condition. Run each skill in a separate fresh session. Save every first output, including failures. Compare revisions as a separate experiment. Record any material differences in available references or tools.

For self-contained HTML, run `node "$SKILL_HOME/scripts/capture-design-pair.mjs" first.html second.html new-output-directory` from a workspace with Chrome and playwright-core. The script assigns anonymous A/B labels, blocks HTTP assets and captures both pages at 390 and 1440 CSS pixels under the same browser settings. Keep the answer key from reviewers. For full apps, use equivalent routes, fixtures and authenticated state in product tests instead.

Record task success per attempt, unsupported factual claims and unsolicited destinations per screen. Record visual preference separately as A, B or tie with one visible reason. Score the copy after disclosing the same approved facts to each reviewer. Repeat with different tasks and generation runs before generalizing. Separate simultaneous independent votes from successive reviewers who saw revised work.

A visual reviewer may fail to receive a local screenshot. Record that as unverified instead of inferring from the filename or prompt. Re-run with a supported image attachment or a browser viewer. A text-only result cannot establish hierarchy, contrast or line breaks.

### Enforce a visible copy contract

Keep `required.json` and `forbidden.json` beside the product fixture. Run `node "$SKILL_HOME/scripts/verify-copy-contract.mjs" page.html required.json forbidden.json`. Use it for state-specific copy such as an approved title and action, and for phrases the brief explicitly rejects, including a redundant subtitle. Keep the list small and task-specific. This check does not judge tone, hierarchy or whether a sentence is warranted. Pair it with visual review and the input boundary ledger.
