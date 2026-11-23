## Universal design constraints

### Hierarchy and information convergence

- Order content by task importance and reading order.
- Avoid competing emphasis when the task has a clear next action. Comparison views may give peers equal weight.
- Group related content with alignment, spacing, surface, or semantic headings. Use dividers only when they clarify a real boundary.
- Keep list rows short enough to scan. Move explanation, technical logs, history, and evidence to a detail level.
- At each level answer only the questions needed there. The summary identifies the object and current outcome. The detail explains decisions and actions. When a summary promises a breakdown, follow one row into detail. Reconcile its amount and count against the same period and contributing records. Carry the context needed to verify those figures. A magnitude and a signed movement can both be correct. Make the convention legible when moving between them, and verify the same underlying unit and direction in each view. The evidence shows raw history or diagnostics.
- Keep the user’s current object, status, consequence, and next action together.
- Do not make every field, message, or status its own card.
- Give each visible level one title, one primary action, and one focal content group. Do not repeat the same noun in the product title, selected tab, panel heading, and action label unless it disambiguates scope.
- Delete a subtitle by default. Keep a secondary line only when it changes orientation, state, consequence, or the next decision. Dates, owners, counts, and statuses belong beside the object they qualify, not in a decorative explanatory sentence.
- Use a focus test at the target width. After a quick blur or squint, one region should remain dominant and one action should read as primary. If several headings, pills, cards, or buttons compete, reduce contrast, merge levels, or remove the redundant element.
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

### Surface and viewport composition

- Let one surface carry the work. Do not wrap every section, row, or status in a separate bordered card.
- Use a gray divider only for a real reading boundary, such as a header-to-content transition or a change of data group. Remove row-by-row rules when spacing, alignment, tonal shifts, or hover and selection states already separate items.
- Treat the viewport as part of the composition. On wide screens, let the primary work surface expand to a meaningful height and keep its reading column stable. Avoid a small centered card floating in a large unused canvas unless the empty field is an intentional focus state.
- On narrow screens, let the page background and work surface carry the frame. Do not stretch sparse content into a tall empty card only to reach the viewport edge.
- Review empty space by purpose. Keep breathing room that supports focus, scanning, or responsive behavior. Reduce empty bands that have no relationship to the task.

### Reading focus and relationship density

- Assign one scope owner to each visible level. Product navigation, page title, section title, and object name must not repeat the same noun unless the repetition disambiguates scope.
- Establish one reading edge for the primary task. Keep object names, state, consequence, and next action closer to one another than to unrelated regions.
- Do not distribute columns evenly just to fill a wide viewport. Width should follow the relationship between fields. Metadata and actions may recede, while the object and decision remain easy to scan.
- After deleting copy, recheck spacing, column widths, and title levels. Empty space left behind by removed text is a layout defect.
- Run a quick blur or squint test at the target width. One region should remain dominant and one action should read as primary. If several headings, cards, pills, or controls compete, merge, mute, or remove the redundant level.

### Platform character and premium restraint

- Treat an Apple-like direction as a set of relationships between hierarchy, material, typography, control silhouette, response, and restraint. A system font, pale canvas, thin border, or dark button by itself is not a design direction.
- Establish one focal work surface, one supporting navigation or context plane, and transient layers only when they carry a task. Do not give every card, row, badge, outline, and separator equal visual weight.
- Let the content field lead. Keep the reading edge stable, let the title and primary action share a clear alignment, and make secondary controls recede through position, iconography, or tone rather than smaller explanatory copy.
- Use a control silhouette that belongs to the surrounding surface. A primary action may be filled, tonal, outlined, or icon-led, but it needs a reason in the product's direction. Do not default to a heavy black rectangle beside quiet surfaces.
- Keep text roles few and legible. A title, body value, supporting metadata, and state should differ through scale, weight, placement, and tone. Do not make essential information faint to imitate quiet chrome.
- Test the composition in grayscale and after removing decorative color. If hierarchy collapses, the page is relying on color instead of structure.
- During screenshot review, name the dominant surface, alignment edge, control grammar, empty-space purpose, and any remaining browser-default treatment. “Apple-like” is not evidence by itself.

### Icons

- One icon expresses one object, action, or state.
- Prefer familiar metaphors and consistent stroke, fill, perspective, and optical weight.
- Use semantic optical-size tiers instead of one hard-coded pixel size. The tier depends on text, control height, density, platform, and the icon’s visual weight.
- Allow optical offsets and per-icon bounding-box corrections for asymmetric shapes.
- Do not use a brand motif as a substitute for a functional icon.
- A status icon supplements a status word or accessible name when the state matters.
- Prefer an icon action for frequent, familiar, space-sensitive commands such as view, search, copy, edit, close, and more actions. Keep the icon inside the same control grammar as text actions.
- Treat icon density as a budget. Add an icon when it improves recognition, scanning, or target acquisition. Remove it when it only decorates a label or repeats a visible state. Linear's refresh reduced icon count and size because more symbols had begun competing with the task.
- Keep visible text for first-use, ambiguous, consequential, destructive, or recovery actions. Do not force people to decode an unfamiliar symbol.
- Icon-only controls have an accessible name, a visible focus state, an adequate hit area, and a tooltip or adjacent explanation when the meaning is not immediately familiar. The accessible name is not a decorative glyph.

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

### Control adaptation is a contract, not a theme

When the chosen direction calls for a calm Apple-like surface, inspect the control grammar as a set. A button, segmented control and text field need an intentional hit area, typography, border or fill, focus state and corner treatment. Do not leave one browser-default button inside a custom rounded surface. The radius can vary by platform, density and product character. It must belong to the same visual language as the surrounding surfaces. Run `node "$QS_DIR/scripts/verify-control-adaptation.mjs" page.html 'button' 6` as an opt-in check for a direction that requires adapted controls. This does not prescribe one radius for every product.

Before keeping a secondary line, classify it as orientation, object, state, consequence or action. If it repeats the heading, tab, row state or next action, remove it. In the supplied workbench screenshot, “查看结果，处理需要关注的任务” repeats the page purpose and row actions. “本地开发环境” is useful only if the environment changes a decision. A screenshot review should verify that removal did not hide scope or consequence.

### Cross-platform proportion check

Do not copy Apple.com pixel values into a product surface or treat one icon box as universal. Keep a ratio between control height, icon optical box, stroke, label size, baseline and hit area. Validate the same component on the target platforms with the target font and icon set. Compare screenshots at the same CSS viewport and at the platform’s native density. Check that an icon remains visually centered beside Latin and Chinese labels, that a compact control does not become a cramped touch target, and that a large control does not make the icon look weak.

Use `examples/icon-tiers.ts` as a starting contract. Tune the tier for the actual platform, font, icon library and asymmetric shape. The tier names describe roles, not fixed dimensions. Apple.com references are appropriate for marketing composition and product storytelling. Apple Human Interface Guidelines and native platform behavior are the stronger reference for controls, focus, touch and navigation. Linear’s product work is the stronger reference for dense workspace orientation, predictable actions and reduced chrome.

### Visual finish gate

After hierarchy and behavior pass, do one dedicated finish pass. Compare the rendered page against the chosen direction at the target widths and inspect six relationships: type scale, outer margin to content width, surface count, control-to-icon proportion, row rhythm and state contrast. Remove any default browser treatment, accidental one-pixel border, mismatched corner, unexplained empty band or decorative emphasis that does not survive a task change. The page should have a deliberate focal area, a stable alignment edge and a clear quiet area. Do not solve an unfinished composition by adding a subtitle, badge, gradient or extra card.
