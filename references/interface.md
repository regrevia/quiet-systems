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

## Copy in context

Before generating markup, inventory the supplied facts, required decisions and actual inputs. Do not invent form fields (including contact details), steps, badges, headings or helper text to complete a familiar template. Show each fact where the person uses it. Do not summarize the same availability, prices or statuses under the title when the choices already show them. Keep independent fields in separate elements, including in summaries assembled at runtime. Never concatenate them with a decorative middle dot. Before delivery inspect the rendered text at entry and after the action against this inventory. Enumerate the actual enabled inputs from the rendered form. For each, identify the requirement or service operation that consumes its value. Remove any orphan input and its validation, then repeat the task without supplying that value.

Avoid defensive interface copy. For a caveat, identify the actual condition, who it affects and what decision it changes here. Omit speculative caveats, implementation excuses and repeated reassurance. Keep a material limitation where the user commits, in plain language. For example, a booking simulator can label its action “模拟预约”. A persistent save failure still needs its recovery instruction. Inspect the initial render before interacting: feedback belongs after the operation succeeds. An unavailable recording needs one factual status. Do not turn “unavailable” into a release promise, append “stay tuned”, or add third-party destinations without a supplied destination. On a narrow screen, inspect the actual headline background and line breaks, especially inside names.

On an unavailable media screen, check what the title and action imply together. A listening invitation suggests playback is available. A production or release claim needs its own evidence. Keep an alternative action specific to the supplied item and destination.
