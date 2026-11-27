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

Every review handoff must include the design contract, interaction and icon inventory, API-to-view field mapping, state matrix, screenshot paths for 390 and 1440 CSS pixels, and composition metrics. The metrics must include title, secondary-copy, text-action, icon-only-action, surface, pill, and divider counts. Run the pressure scenarios in `references/pressure-scenarios.md` when changing this skill or when a generated page still looks generic.

Use `node "$SKILL_HOME/scripts/capture-preview.mjs" page.html output-directory` for previews shown in desktop clients. It uses the same 390/1440 CSS viewports, disables headless GPU tiling, captures complete JPEGs, and fails when an image is incomplete, clipped, or the page overflows horizontally. Do not treat a partially visible screenshot as a valid visual result.

Use the phase gate in order: `brief-frozen` → `direction-selected` → `interaction-locked` → `data-slice-connected` → `visual-verified` → `handoff-ready`. Create a `delivery.json` manifest for the represented flow and run `node "$SKILL_HOME/scripts/validate-delivery-gate.mjs" delivery.json`. A later phase is blocked when the manifest is missing a prior artifact, two comparable direction samples, the selected-direction evidence, the real entry path, the state matrix, or 390/1440 screenshots. Small exploratory or single-screen work may stop at `brief-frozen` or `visual-verified`. The full gate is required when the artifact is labeled `handoff-ready`, integrated into a real entry point, or handed to another agent for implementation. The gate checks evidence completeness and metadata. It does not prove that an image has the claimed pixels, that an entry path runs, or that a visual decision is correct. Follow it with browser verification.

When a browser and Playwright are available, run `node "$SKILL_HOME/scripts/measure-composition.mjs" --json http://localhost:3000/path` against the real route. Prefer its visible DOM counts and `bodyText` over source-file heuristics when the two disagree.

Run the static guardrail script when available:

```bash
node "$SKILL_HOME"/scripts/ui-guard-review.mjs path/to/ui
node "$SKILL_HOME"/scripts/ui-guard-review.mjs --json path/to/ui
node "$SKILL_HOME"/scripts/ui-guard-review.mjs --include-markdown path/to/ui
node "$SKILL_HOME"/scripts/ui-guard-review.mjs --write-baseline ui-guard-baseline.json path/to/ui
node "$SKILL_HOME"/scripts/ui-guard-review.mjs --baseline ui-guard-baseline.json path/to/ui
```

For visual reviews, give the reviewer screenshots from the running product at a known viewport with representative data. Request a specific location and a visible value, then reproduce the observation. Trace the defect back to a missing design rule or a missed implementation step before changing this skill. Treat findings as review prompts. The script cannot prove visual quality, accessibility, data correctness, or platform behavior. Follow it with browser or device checks, keyboard and focus checks, reduced-motion checks, real-data checks, and a human visual review at wide, medium, and narrow widths.
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

## Preserve the chosen direction

Use this skill as the single entry point for a new screen, redesign or review. Start with the brief, actual content and existing visual language. Ground one consequential layout decision in the subject: a reader may need the passage first, while an operator may need the failed item and its recovery action together. Flag a choice when it adds unsupported content, obscures a relationship, impedes a task, or contradicts the intended character. Identify the element and its effect before suggesting a change. Treat the patterns below as options.

When the user has chosen an expressive style, preserve the features they value during cleanup. When they are exploring, let them point to what to keep, combine or discard in the samples. Compare directions with identical content and actions. Hide their names and ask a reviewer to match each to the brief using visible details. If the only clue is an added slogan, revisit the layout or typography.
