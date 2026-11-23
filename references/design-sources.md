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
## Reference sources

- Apple Human Interface Guidelines: Design Principles, Layout, Typography, Materials, Icons, Toolbars, Sidebars, Lists and Tables, Menus
- Linear Docs: Display Options, Select Issues, Contextual Menus
- GitHub Primer: Content
- GitLab Pajamas: Content
- Mattermost Web App Style Guide
- Ponytail: minimal complete frontend changes, reuse existing components, and finish every required caller, fixture, and check

## What travels across products

Apple’s temperature warning illustrates how an image, heading and action share the explanation. Read the heading and button first. Then restore any copy a person needs to understand a consequence or recover. Apple’s alarm example makes scope explicit at the decision point: changing one alarm and changing the schedule have different effects. [Writing for interfaces, WWDC22](https://developer.apple.com/videos/play/wwdc2022/10037/)

For direct manipulation, try reversing an interaction while the surface is moving. Watch for a jump to the start or end position. Apple’s fluid interface work emphasizes continuity and immediate response. The web implementation in Emil Kowalski’s skill carries velocity into interrupted motion. Reserve this test for interactions that actually move. [WWDC18](https://developer.apple.com/videos/play/wwdc2018/803/), [apple-design skill](https://github.com/emilkowalski/skills/blob/main/skills/apple-design/SKILL.md)

Linear’s 2024 redesign compared old and new versions in the running app, including navigation across browser and desktop contexts. Its 2026 refresh makes orientation recede after arrival and makes actions predictable across analogous views. Visit two related records and locate the same action in each. Check the active location with keyboard focus and the sidebar collapsed. Lowering the contrast of essential text to imitate quiet chrome can defeat this goal. [2024 redesign](https://linear.app/now/how-we-redesigned-the-linear-ui), [2026 refresh](https://linear.app/now/behind-the-latest-design-refresh)

## Reference implementations

| Source | Implementation and appropriate use |
| --- | --- |
| [Apple DESIGN.md](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/apple/DESIGN.md) and [Linear DESIGN.md](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md) | Marketing-site studies encode actual palettes, type scales and surface roles. Use a study to explore a direction the user requested. Check its fit with real content before transferring its tokens to a workspace. |
| [Anthropic Frontend Design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) | Derives the visual direction from audience, subject and content. Ask which visible choice belongs to this particular brief. |
| [UI UX Pro Max search implementation](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/src/ui-ux-pro-max/scripts/search.py) | Retrieves relevant candidates by domain and stack and supports project-wide defaults with page overrides. UI Guard applies selective retrieval with ordinary Markdown links, so the agent can open only the relevant guide. |
| [Impeccable](https://github.com/pbakaus/impeccable) | Separates critique and audit from visual polish. Reproduce an issue on the rendered interface and retain evidence of its effect on the task. |
| [Vercel Web Interface Guidelines](https://github.com/vercel-labs/agent-skills/blob/main/skills/web-design-guidelines/SKILL.md) | A short entry point loads a bundled rules snapshot and reports findings against files and lines. This makes review reproducible without a network fetch on every use. |

For a rendered comparison and the rules derived from it, use [Benchmark review](benchmark-review.md). It records the distinction between Apple’s task-first hierarchy, Linear’s reduced chrome, and the current prototype’s remaining density and scope problems.

Apple’s “Establish hierarchy” applies to a busy editor as well as a sparse launch page. Use the current input method, content size and state when evaluating prominence. A platform control may already supply focus, activation and motion behavior. Preserve that behavior while adapting appearance. [Apple design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles/), [Apple motion guidance](https://developer.apple.com/design/human-interface-guidelines/motion)
