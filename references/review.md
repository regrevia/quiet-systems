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

Before implementation, validate the input contract with `node "$QS_DIR/scripts/validate-design-brief.mjs" design-brief.json`. The brief prevents context dumping by requiring a reason for each loaded reference, names generated or supplied material that remains untrusted, blocks focused repairs without reusable evidence, and permits exploratory work before a direction is selected.

## Static review rules

The companion `scripts/ui-guard-review.mjs` reports common source-level issues:

- `QS-COPY-001` and `QS-COPY-002` detect inline decorative separators
- `QS-VISUAL-001` and `QS-VISUAL-002` detect bypasses around visual tokens
- `QS-COMPONENT-001` flags visible native input, textarea, select, meter, progress, and automatic native-appearance controls without an explicit visual adaptation marker
- `QS-ICON-001` flags suspicious fixed `width` or `height` attributes on icon-like HTML, JSX, SVG, or component source. It does not evaluate CSS classes or runtime size tokens.
- `QS-ICON-002` flags common compact actions that remain text-only without an icon or accessible naming evidence. Review each candidate instead of converting unfamiliar, destructive, or consequential actions mechanically.
- `QS-HIERARCHY-001` flags likely subtitles, captions, helper text, small labels, and eyebrow layers in production source. Delete them when they repeat the task. Keep them only when they change orientation, state, consequence, or the next decision.
- `QS-COPY-004` flags defensive, polite, or convenience copy such as “请注意”, “仅供参考”, “为了更好地”, and “please note”. Delete it unless the line states a concrete condition, limitation, result, or recovery action that changes the current decision.
- `QS-COPY-005` flags disclaimer-style copy such as “内容由 AI 生成，请核实重要信息”, “仅为演示”, “效果因人而异”, “请自行判断”, “不构成建议”, and “可能存在误差”. Keep only a specific limitation at the decision point when it changes the current action. See [Copy constraints](copy-constraints.md).
- `QS-COPY-006` flags vague future promises and reassurance such as “敬请期待”, “即将上线”, “持续优化中”, and “为你带来”. Keep only a dated, sourced commitment or a completed result. Action labels such as “Try it now” and “Welcome” are reviewed by task semantics instead.
- `QS-COMPOSITION-001` reports per-file counts for headings, surfaces, pills, dividers, text actions, and icon-only actions. It flags more than one heading, more than four card-like surfaces, more than three pills, more than three dividers, or more than two text actions in a production source file. Treat the result as a budget review, then record the reason for every retained exception.
- `scripts/measure-composition.mjs` measures the rendered route at 390 and 1440 CSS pixels. Its output is advisory and selector-based. Use it with a running app to replace source heuristics with visible DOM counts and body text, then record its JSON output and any selector exceptions in the review evidence.
- `QS-SLOP-001` and `QS-SLOP-002` flag common decorative AI treatment
- `QS-SLOP-003` flags common generic AI-marketing copy patterns for human review
- `QS-A11Y-001` flags images without an alternative text attribute
- `QS-A11Y-002` flags common native, semantic, or event-bound interactive elements hidden with `aria-hidden="true"`
- `QS-A11Y-003` flags icon-only buttons or links without an accessible name
- `QS-PROTOTYPE-001` flags demo-shaped data names in production source paths
- `QS-COPY-003` flags unusually long inline UI copy
- `QS-MOTION-001` flags CSS transitions or animations without a reduced-motion path or an explicit manual-review marker
- `QS-MOTION-002` flags CSS transitions or animations longer than 400ms unless their duration has an explicit manual-review marker

The optional `.quiet-systems.json` file configures ignored paths, rule ignores, copy-length thresholds, and the maximum file size. Findings are review prompts. Fix or justify each finding. Do not silence the script by deleting the evidence or hiding the source from the scan.

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
node "$QS_DIR/scripts/verify-sample-save.mjs"
```

It exercises failure, keyboard retry and persistence, then deliberately injects a phone field and premature success copy. In a product test, import the helper and let assertion failures propagate to CI.

After the assertions pass, compare available, selected and unavailable choices in the actual layout. In the booking sample, removing an availability label left the active choice relying heavily on its outline. Field counts alone cannot establish that a reader can distinguish these states.

### Paired design trials

Before generation, freeze the brief, content, model identifier, tool access, generation budget and task success condition. Run each skill in a separate fresh session. Save every first output, including failures. Compare revisions as a separate experiment. Record any material differences in available references or tools.

For self-contained HTML, run `node "$QS_DIR/scripts/capture-design-pair.mjs" first.html second.html new-output-directory` from a workspace with Chrome and playwright-core. The script assigns anonymous A/B labels, blocks HTTP assets and captures both pages at 390 and 1440 CSS pixels under the same browser settings. Keep the answer key from reviewers. For full apps, use equivalent routes, fixtures and authenticated state in product tests instead.

Record task success per attempt, unsupported factual claims and unsolicited destinations per screen. Record visual preference separately as A, B or tie with one visible reason. Score the copy after disclosing the same approved facts to each reviewer. Repeat with different tasks and generation runs before generalizing. Separate simultaneous independent votes from successive reviewers who saw revised work.

A visual reviewer may fail to receive a local screenshot. Record that as unverified instead of inferring from the filename or prompt. Re-run with a supported image attachment or a browser viewer. A text-only result cannot establish hierarchy, contrast or line breaks.

### Enforce a visible copy contract

Keep `required.json` and `forbidden.json` beside the product fixture. Run `node "$QS_DIR/scripts/verify-copy-contract.mjs" page.html required.json forbidden.json`. Use it for state-specific copy such as an approved title and action, and for phrases the brief explicitly rejects, including a redundant subtitle. Keep the list small and task-specific. This check does not judge tone, hierarchy or whether a sentence is warranted. Pair it with visual review and the input boundary ledger.
