---
name: quiet-systems
description: Use when designing, redesigning, reviewing, or documenting a web, desktop, or mobile UI that needs clear hierarchy, restrained visual language, reliable information disclosure, coherent cross-platform behavior, or protection against AI-generated design and copy slop.
---

# Quiet Systems

## Purpose

Treat a UI as a place where people identify an object, make a decision, and complete an action. The visual language may be expressive, dense, warm, playful, or technical. This skill does not prescribe one aesthetic. It provides a repeatable process for choosing and validating a visual system.

Apple contributes principles for hierarchy, typography, materials, icons, layout, accessibility, and platform adaptation. Linear contributes practices for task flow, contextual actions, command entry, list density, grouping, ordering, and display preferences. Do not copy either product's brand assets or page appearance.

Resolve bundled script, example and template paths relative to this SKILL.md. Run the tools against the product workspace. In shell examples, set QS_DIR to the directory containing this file.

Use this skill as the single entry point for a new screen, redesign or review. Start with the brief, actual content and existing visual language. Ground one consequential layout decision in the subject: a reader may need the passage first, while an operator may need the failed item and its recovery action together. Flag a choice when it adds unsupported content, obscures a relationship, impedes a task, or contradicts the intended character. Identify the element and its effect before suggesting a change. Treat the patterns below as options.

Before generating markup, inventory the supplied facts, required decisions and actual inputs. Do not invent form fields (including contact details), steps, badges, headings or helper text to complete a familiar template. Show each fact where the person uses it. Do not summarize the same availability, prices or statuses under the title when the choices already show them. Keep independent fields in separate elements, including in summaries assembled at runtime. Never concatenate them with a decorative middle dot. Before delivery inspect the rendered text at entry and after the action against this inventory. Enumerate the actual enabled inputs from the rendered form. For each, identify the requirement or service operation that consumes its value. Remove any orphan input and its validation, then repeat the task without supplying that value.

When the user has chosen an expressive style, preserve the features they value during cleanup. When they are exploring, let them point to what to keep, combine or discard in the samples. Compare directions with identical content and actions. Hide their names and ask a reviewer to match each to the brief using visible details. If the only clue is an added slogan, revisit the layout or typography.

Avoid defensive interface copy. For a caveat, identify the actual condition, who it affects and what decision it changes here. Omit speculative caveats, implementation excuses and repeated reassurance. Keep a material limitation where the user commits, in plain language. For example, a booking simulator can label its action “模拟预约”. A persistent save failure still needs its recovery instruction. Inspect the initial render before interacting: feedback belongs after the operation succeeds. An unavailable recording needs one factual status. Do not turn “unavailable” into a release promise, append “stay tuned”, or add third-party destinations without a supplied destination. On a narrow screen, inspect the actual headline background and line breaks, especially inside names.

## Choose the first design test

Pick the row that describes the visitor's next decision. For a mixed screen, use the primary task first. Review the same content at a narrow width and with keyboard input.

| Task | Keep in the first reading path | Test before polishing |
| --- | --- | --- |
| Discover a product or service | A concrete offer, a representative example and the relevant next step | Remove the slogan. Can a newcomer tell what they get and inspect the example? |
| Read or learn | Title, current section, readable text and meaningful illustrations | Follow a deep link on a narrow screen and return to the same passage. |
| Browse or compare | Comparable attributes in a stable order, active filters and result count when known | Apply a filter that yields zero results. Clear it without losing the other filters. |
| Enter or edit data | Field labels, consequential requirements and the next action | Submit an invalid value. Retain the draft, locate the error by keyboard and correct just that field. |
| Monitor or recover | Affected object, consequence and available recovery | Retry one failure twice during a pending request. Successful records remain usable. |
| Interpret a measure | The question, unit, period and comparison basis | Switch the period and distinguish a measured zero from missing data without relying on color. |

At the first width where the layout breaks, collapse secondary navigation or diagnostics before hiding the active object or its next action. From the keyboard, open the deferred controls, act on the same object, then dismiss the overlay and verify focus returns to its trigger. Capture the viewport and focus sequence so another direction can be compared under the same conditions.

For a product introduction, lead with the concrete input, output and a way to inspect one example. Use the supplied example records. Every capability claim needs a source in the brief or the working product. Remove secondary feature lists when the example already demonstrates the offer. If the brief calls for opening and closing an example, verify the example itself is concealed initially, readable when opened and concealed after closing. Use Tab and Enter to open the example. Inspect the worked input and output in the accessibility tree before opening, while open and after closing. Confirm focus returns to the opening control. For a modal, also dismiss with Escape. Choose an inline disclosure or a dialog according to how much context the visitor needs.

Before handing over a prototype, replay each requested verb from its visible entry point. For “inspect”, open the control and locate the requested object and its available details. A toast announcing that it will open does not complete the action. For text search, provide a labeled query field and identify the searchable fields from the brief. In a catalog, enter part of a known title, apply a filter, then clear only the query. Check the remaining records after each action.

When typesetting supplied editorial copy, preserve the text, punctuation and paragraph order unless editing is requested. Compare each rendered paragraph with its source, then inspect the remaining body text for added explanations or claims. For an exact-copy handoff, export the approved paragraphs and the visible prose blocks in reading order as UTF-8 text, with a blank line between blocks. Run `node "$QS_DIR"/scripts/compare-article-copy.mjs approved.txt rendered.txt`. Inspect captions and any extra body text when selecting those blocks. Keep navigation labels outside the article prose. Open a shared section URL in a fresh tab and reload it. After layout settles, confirm the target heading is visible below any persistent header and that browser Back restores the previous passage.

Write confirmation copy from the effect that actually completed. A local-only form can say “已保存到此设备” after a successful device write. A claim about a reserved place, sent email or follow-up call needs a corresponding service result or business commitment. Exercise both outcomes at the persistence boundary. Force the save to fail once before it acknowledges the write. Verify the draft is editable, the failure is visible and no success message appears. Keep the save error visible with the editable draft. Use the local draft sample in `examples/local-draft/` to exercise this path. Restore the writer and retry using the same draft. Publish success only after the write returns or resolves successfully. When the screen uses custom field errors, associate each error with its field and move focus to the first invalid field after submission.

Treat supplied records as the content budget for comparison. When a record contains only a title, day and format, render those fields. Add a description, price, timetable or availability claim only when supplied or explicitly requested as sample content. With zero matches, state the result once and keep the active filters available.

For a report, name the event being counted in the heading or column label (for example, “已完成维修” for completed repairs). Keep the unit next to the measure. At the target width and text scale, read the entire longest axis label. If ticks collide, reduce their number or reposition them while preserving their relation to the data. Keep multi-digit values on one line. Show a missing reason beside the affected value. Add a coverage summary only when it changes how readers interpret a total or decide what to do. When the task requires a total, exercise three inputs: all values reported (including a real zero), some missing, and all missing. For nonnegative whole counts, reuse the coverage calculation in `examples/report/count-summary.mjs`. Pass one value per expected source. Verify the actual total cell against the model result, including a partial sum of zero. Label a partial sum with its reporting scope. With no observations, show the missing state in the total cell. Compare periods only when the metric and coverage are comparable.

When retrying one record, keep its name visible and label the pending action in text. Hold the request open, activate retry twice and inspect a different record by keyboard. Verify one request for the failed ID and one inspection for a single activation. Reject with a different, user-safe reason and check that it persists beside the affected record. Retry successfully and check that the stale reason disappears. Open details with a sparse fixture. Trace each visible factual value to a supplied field or documented derivation. Omit optional facts that are absent, or mark a required value as unavailable. Keep internal identifiers out of the view unless the task uses them.

Avoid unnecessary secondary labels and descriptions. Let the layout do the explaining. Do not generate a subtitle under a heading, an eyebrow above it, or a highlighted keyword to make a screen look finished. Preserve supplied editorial content and task-critical instructions. On the rendered page, temporarily remove any added line and try the task again. If nothing is lost, leave it out. On the narrow layout, switch views and check whether a reader can still name the current record from the visible screen. Keep its identifying title once where it applies to both views. Check short content too. Reserve extra panel height only when it serves a task or prevents disruptive movement.

For each line of interface copy, name the decision, consequence or recovery step it supports. Try removing it in context. Retain instructions that prevent an error, including when the shortest label cannot convey the consequence.

## Scope

Use this skill for UI and design-system work. It covers:

- Information architecture and visual hierarchy
- Progressive disclosure and information convergence
- Typography, spacing, surfaces, icons, controls, and motion
- Empty, loading, error, permission, offline, stale, and recovery states
- Copy quality, localization readiness, and AI-Slop prevention
- Design direction exploration when requirements are unclear
- Keeping prototypes, view models, APIs, permissions, and production data coherent
- Static code review guardrails and human visual review

It does not replace product requirements, security review, API contracts, accessibility testing, or platform-specific implementation guidance.

## Non-negotiable boundaries

- Do not lock every product into one palette, font, radius, density, or material.
- Do not copy Apple's or Linear's visual identity, proprietary assets, or exact screens.
- Do not make a polished static prototype the definition of completion.
- Do not remove required permissions, warnings, recovery actions, or audit evidence in the name of simplicity.
- Do not use decorative punctuation to join unrelated UI fields.

## Workflow

### 1. Resolve uncertainty before styling

Write a short design brief with the user, primary role, main task, object being acted on, platform, data source, permissions, success signal, and constraints. If these are materially unclear, do not guess a single finished direction.

Ask the smallest set of questions that can change the design. If the user cannot answer yet, state assumptions and produce two or three materially different low-cost samples using the same content and task. Vary information hierarchy, density, navigation, or interaction model, not random colors. Use references, screenshots, open-source patterns, or small prototypes when they help the user choose. Stop for direction selection before investing in a full visual system.

Use the direction sample format in `examples/direction-samples/README.md`. Each sample names its task, data assumptions, hierarchy, density, interaction model, and decision tradeoff. If the choice turns on navigation, supply a clickable path for the same object in each sample. Open the same detail in every direction and compare all visible factual claims with the shared record. A reading-first sample may have only one sentence. Preserve that sentence, even when the screen has room for more. On return, verify focus reaches a visible control for the originating object. Put the selection question in the handoff. Ask which task is frequent and which secondary task must remain possible. Walk through both before recommending a direction.

### 2. Model the task and information

Before high fidelity, describe:

- The primary task and one primary object
- The reading order and action order
- What is visible at list, summary, detail, and evidence levels
- The default, empty, loading, error, permission, offline, stale, and recovery states
- Which actions are direct, contextual, command-based, or destructive
- What the user can undo, retry, cancel, or inspect

Use one source of truth for object names, status labels, dates, permissions, and actions. Do not invent presentation-only fields that the production model cannot provide.

Keep an explicit mapping from API or domain model to view model. Derive labels and state copy from shared maps or typed enums. Do not let each component invent a second status vocabulary.

### 3. Establish a visual system

Avoid polishing a hierarchy that users cannot follow. Use the cheapest artifact that exposes the uncertainty. A grayscale sketch can test grouping, while a color-dependent visualization needs representative colors and data.

Define semantic tokens for type, spacing, surfaces, borders, controls, icons, motion, and states. The tokens may map to any coherent visual direction. Reuse existing tokens and components before adding new ones. A component earns its place through a repeated behavior and state contract, not through a visual variation.

### 3.1 Minimal complete change protocol

Apply the smallest change that completes the requested UI behavior. Before editing, list the affected entry points, callers, components, styles, fixtures, data adapters, tests, and configuration. Reuse an existing component when its behavior and state contract match. Create a new component only when the behavior contract differs or an existing component cannot express the required states without distortion.

Finish every affected caller, fixture, loading and error path, keyboard path, and focused check. Do not leave a polished isolated sample while its real entry point still uses a second visual or data path. Keep comments for constraints and failure boundaries, not for obvious code.

### 4. Build a real-data slice

Before declaring a prototype complete, connect one representative vertical slice from the real entry point through the view model to the UI. Use production-shaped fixtures with long names, missing values, large counts, stale updates, permission limits, partial failures, and mixed-language text.

Keep demo data, fixture data, API data, and transformed view data distinguishable. Record the mapping between API fields and visible fields. Verify loading, refresh, retry, cancellation, duplicate updates, stale results, and empty results. A screenshot of a static sample is evidence of direction, not evidence of integration.

Use `Mock*`, `Demo*`, and `Fixture*` names only in prototype, test, or fixture locations. Mark demo payloads with `__source: "demo"` or an equivalent typed value. Keep the adapter boundary explicit and make production builds reject demo payloads when the framework supports runtime assertions. The example fixture set in `examples/fixtures/` is a minimum boundary-data reference.

When a visual or data check fails, return to the earliest layer that caused it. A hierarchy failure returns to the task model. A field or state mismatch returns to the data contract. A token or component mismatch returns to the visual system. Do not patch a downstream screenshot with unrelated copy or decorative CSS.

### 5. Verify and review

Run the static guardrail script when available:

```bash
node "$QS_DIR"/scripts/quiet-systems-review.mjs path/to/ui
node "$QS_DIR"/scripts/quiet-systems-review.mjs --json path/to/ui
node "$QS_DIR"/scripts/quiet-systems-review.mjs --include-markdown path/to/ui
```

For visual reviews, give the reviewer screenshots from the running product at a known viewport with representative data. Request a specific location and a visible value, then reproduce the observation. Trace the defect back to a missing design rule or a missed implementation step before changing this skill. Treat findings as review prompts. The script cannot prove visual quality, accessibility, data correctness, or platform behavior. Follow it with browser or device checks, keyboard and focus checks, reduced-motion checks, real-data checks, and a human visual review at wide, medium, and narrow widths.

## Universal design constraints

### Hierarchy and information convergence

- Order content by task importance and reading order.
- Avoid competing emphasis when the task has a clear next action. Comparison views may give peers equal weight.
- Group related content with alignment, spacing, surface, or semantic headings. Use dividers only when they clarify a real boundary.
- Keep list rows short enough to scan. Move explanation, technical logs, history, and evidence to a detail level.
- At each level answer only the questions needed there. The summary identifies the object and current outcome. The detail explains decisions and actions. When a summary promises a breakdown, follow one row into detail. Reconcile its amount and count against the same period and contributing records. Carry the context needed to verify those figures. A magnitude and a signed movement can both be correct. Make the convention legible when moving between them, and verify the same underlying unit and direction in each view. The evidence shows raw history or diagnostics.
- Keep the user’s current object, status, consequence, and next action together.
- Do not make every field, message, or status its own card.
- Do not use a tooltip to carry an accessible name or essential instruction.
- Expanded content must preserve the current task and return focus to its trigger when closed.

### Typography and content separation

- Use typography, position, alignment, spacing, and surface to distinguish content roles.
- Limit typefaces and weights. Do not create hierarchy by making everything bold, faint, uppercase, or colorful.
- Preserve relative hierarchy when text is enlarged or localized. Exercise the narrow detail view with a long name, an unbroken identifier and multiline text. Verify that the distinguishing suffix and final line are readable without horizontal page scrolling.
- Do not join names, statuses, times, counts, sources, permissions, or other unrelated fields with a middle dot, bullet, vertical bar, slash, or repeated hyphen.
- Render those fields as separate semantic elements. Use font, color, alignment, position, spacing, wrapping, or components to express their relationship.
- This restriction does not ban semantic lists, mathematical notation, code, user-authored text, or product names that require such characters. The static rule may still flag source text containing a middle dot, so preserve a legitimate exception only with a documented rule ignore and review evidence.
- Action labels use concrete verbs. Error copy states what happened, what it affects, and what the user can do next.
- Remove redundant labels, generic marketing claims, filler subtitles, and explanations of backend implementation.

### Materials, surfaces, and controls

- Keep the main reading surface visually quiet enough for text and decisions.
- Use translucent or blurred material only when it establishes a functional or transient layer and remains legible over changing content.
- Do not apply glass, gradients, glow, heavy shadow, or oversized rounded containers to every element.
- Prefer one coherent surface system over a collection of unrelated cards.
- Do not expose an unadapted native visual appearance as the product’s design language.
- Preserve native semantics, keyboard behavior, focus management, and assistive-technology interfaces. A unified visual system owns the rendered appearance, states, spacing, and motion.
- A platform adapter may change touch feedback, key bindings, window behavior, or density without creating a second visual language.
- If a native control is intentionally retained after visual adaptation, mark the integration with `data-quiet-adapted` or a nearby `quiet-systems: allow-native` comment and verify its states manually.

### Icons

- One icon expresses one object, action, or state.
- Prefer familiar metaphors and consistent stroke, fill, perspective, and optical weight.
- Use semantic optical-size tiers instead of one hard-coded pixel size. The tier depends on text, control height, density, platform, and the icon’s visual weight.
- Allow optical offsets and per-icon bounding-box corrections for asymmetric shapes.
- Do not use a brand motif as a substitute for a functional icon.
- A status icon supplements a status word or accessible name when the state matters.
- Icon-only controls have an accessible name and a visible focus state.

### Menus and tabs

Keep frequent commands at the first menu level. Give a submenu a visible name that predicts its children and preserve that name in its accessible label. With the keyboard, open a branch and return to its parent before dismissing the root. Check focus at each return and verify that the chosen command acts on the original object.

Use tabs for peer content panels. Give each tab and panel a matching accessible relationship. Exercise the inactive tab by keyboard, then verify its selected state and a unique fact inside the visible panel. Keep the focus indicator distinct from selection when activation is manual. A period filter updates the same measure and may use a single-choice control instead. When the panel contains a record-specific value, keep the record identity visible across switches if the surrounding view would otherwise lose it. Reuse an existing screen title or breadcrumb. Choose surface materials after the interaction works.

### Motion and state

- Define default, hover, active, focus, disabled, loading, success, warning, error, offline, stale, cancelled, and recovery behavior where applicable.
- Do not express a state only through color, glow, pulse, or motion.
- Respect reduced-motion preferences. Commit the new state and place focus as soon as the user acts. The essential action must also complete when no animation runs or an entry is interrupted. In both motion preferences, open a record, dismiss it immediately and open another. Verify the second record and the focus destination after dismissal. Scope motion overrides to the components you own.
- Keep live updates stable. Do not reorder content unexpectedly or duplicate optimistic actions after reconnect.
- Put retry, cancel, permission, and recovery actions next to the state that needs them.

## Apple and Linear application patterns

### Apple-derived patterns

- Content, functional, and transient layers have different responsibilities.
- Toolbars contain titles, navigation, search, and frequent actions. Low-frequency actions use menus or an action panel.
- Sidebars expose the current scope and can collapse without losing the route.
- Avoid burying attributes people need to compare. Test whether readers can locate the same attribute across records in the chosen layout.
- Alignment and indentation communicate relationships. Reading order remains stable when the window or text size changes.

### Linear-derived patterns

- Display options may control layout, grouping, ordering, and visible properties without changing the underlying object.
- Personal view preferences and workspace defaults are separate.
- Selected objects expose actions through keyboard, command menu, and contextual menu.
- Hidden actions remain discoverable. Do not force users to remember a shortcut.
- Bulk actions operate on the selected objects and appear in the selection context.
- Ordering, grouping, filters, and visible properties are distinct concepts.

## AI-Slop review

Inspect these patterns in context. A material, illustration or motif can express the requested identity. Flag it when it substitutes for missing content, repeats across unrelated roles, competes with the task, or could be pasted into an unrelated product without changing its meaning. Cite visible evidence.

- Decorative glass, gradients, glow, particles, 3D spheres, or futuristic backgrounds
- Repeated cards around every message, field, or status
- Robot portraits, random stars, hexagons, or neural lines used as generic AI symbols
- Large metrics without a decision, object, time range, or action
- Long subtitles and onboarding banners that restate the interface
- Status communicated only by color, pulse, or light
- Components that differ only by color instead of behavior
- Generated copy that is vague, inflated, repetitive, or detached from the current object

For each finding, choose delete, merge, move to detail, replace with a familiar metaphor, or define a real behavior contract. Do not add explanatory text to rescue a confusing layout before testing a simpler hierarchy.

## Prototype-to-production gate

A prototype may pass visual direction review only after the following are present for the represented flow:

- A named object model and field mapping
- A view model or fixture with production-shaped data
- Default, empty, loading, error, permission, stale, and recovery states
- Real action labels and action outcomes
- Long text, missing values, large counts, and mixed-language cases
- A narrow layout and a keyboard/focus path
- A clear boundary between demo content and live data
- At least one end-to-end read or write path through the real entry point

If any item is missing, label the artifact as a direction sample, wireframe, or unintegrated prototype. Do not describe it as production-ready.

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

## Static review rules

The companion `scripts/quiet-systems-review.mjs` reports common source-level issues:

- `QS-COPY-001` and `QS-COPY-002` detect inline decorative separators
- `QS-VISUAL-001` and `QS-VISUAL-002` detect bypasses around visual tokens
- `QS-COMPONENT-001` flags visible native input, textarea, select, meter, progress, and automatic native-appearance controls without an explicit visual adaptation marker
- `QS-ICON-001` flags suspicious fixed `width` or `height` attributes on icon-like HTML, JSX, SVG, or component source. It does not evaluate CSS classes or runtime size tokens.
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

The static accessibility and motion checks cover source patterns, not every browser state. Follow them with keyboard, focus, accessibility-tree, screen-reader, and reduced-motion verification.

Use semantic icon tiers instead of a universal pixel size. `examples/icon-tiers.ts` is a reference contract showing how inline, control, navigation, and hero icons can adapt their optical box, stroke, and baseline offset by platform. Consumers must validate and tune these starting points against the actual font, icon library, density, touch target, and asymmetric shapes in the product.

Exit code `0` means no findings, `1` means findings were reported, and `2` means the configuration or a scan target could not be read. A reported finding is a review gate, not proof that the UI is incorrect.

## Reference sources

- Apple Human Interface Guidelines: Design Principles, Layout, Typography, Materials, Icons, Toolbars, Sidebars, Lists and Tables, Menus
- Linear Docs: Display Options, Select Issues, Contextual Menus
- GitHub Primer: Content
- GitLab Pajamas: Content
- Mattermost Web App Style Guide
- Ponytail: minimal complete frontend changes, reuse existing components, and finish every required caller, fixture, and check
