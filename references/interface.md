## Universal design constraints

### Hierarchy and scope convergence

- Order content by task importance. Give each visible level **one scope owner, one title, one primary action, and one focal content group**. Do not repeat the same noun across navigation, selected tab, heading, and button unless disambiguating scope.
- Keep list rows scannable; defer logs, history, and raw diagnostics to detail views. When a summary drills into detail, reconcile counts, amounts, units, and sign conventions across the same period.
- Keep the current object, status, consequence, and next action adjacent along **one stable reading edge**—closer to each other than to unrelated chrome.
- Delete subtitles and helper lines by default. Retain a secondary line only when removing it changes orientation, state recognition, consequence, or the next decision; record the before/after evidence as an explicit exception.
- Render tags and statuses as plain text, position, tone, or a quiet semantic dot by default. Reserve filled capsules for interactive filters, selection, or necessary grouping, scaled so status never outshouts the object.
- Never hide an accessible name or essential instruction inside a tooltip. Expanded disclosures must preserve task context and return focus to their trigger on close.

### Visual craft and aesthetic direction (style-agnostic)

Deleting noise prevents ugliness, not blandness. Without prescribing a palette, typeface, corner radius, or aesthetic genre, create visual beauty and finish through six structural relationships:

- **Typographic tension and rhythm**: avoid a timid `12–20px` band where headings, body, and metadata blur together. Pair decisive scale, weight, or tracking contrast on the focal title/figure with calm prose measure (`60–75ch` Latin, `30–42` CJK chars), looser CJK body line-height (`1.6–1.75` vs. `1.45–1.6` Latin), `text-wrap: balance` on headlines so words never split mid-term, and `tabular-nums` on vertically compared figures. Avoid heavy bold on ≤ 12px CJK labels where strokes clog.
- **Asymmetric proportion and active negative space**: favor purposeful unequal splits (dominant work canvas + compact context rail, or stable reading column + quiet margin) over splitting wide viewports into mechanical equal columns. Treat empty space as an intentional frame for the focal region; after deleting copy, tighten spacing and column widths so dead gaps never remain as scars.
- **Tonal layering and edge precision**: let one primary surface carry the work rather than boxing every field or row into a card. Separate planes through subtle surface lightness steps and alignment before reaching for lines; use gray dividers only at genuine structural boundaries. Where borders or elevation are earned, prefer `1px` low-alpha surface-tinted hairlines and two-part ambient+key shadows on transient layers over harsh opaque outlines. In dark themes, express elevation through stepped surface lightness rather than dark drop shadows.
- **Color restraint and surface harmony**: verify hierarchy in grayscale first—if structure collapses without color, fix typography and spacing. On tinted or saturated surfaces, shift text lightness/alpha within the surface hue rather than dropping washed-out neutral gray on top, clearing WCAG contrast (≥ 4.5:1 body, ≥ 3:1 large text and UI boundaries).
- **Geometric and optical harmony**: keep nested rounded containers concentric (`innerRadius <= outerRadius - padding`), align spacing to a coherent `4px`/`8px` rhythm, and apply `±1px` optical offsets when asymmetric glyphs or mixed CJK/Latin baselines look mathematically centered but visually off.
- **Subject-anchored character (the swap test)**: anchor at least one layout or typographic choice in the actual subject (specimen + index for an archive, slot matrix for bookings, aligned ledger for finance). If swapping the title and data for an unrelated SaaS product still looks equally at home, rework the composition around the real object.

### Typography and field separation

- Limit typefaces and weights; preserve relative hierarchy when text enlarges, wraps, or localizes. Test narrow views (`320–390px`) with unbroken identifiers and multiline copy to confirm zero horizontal page overflow and readable suffixes.
- Never join independent fields (names, statuses, times, counts, permissions) with middle dots (`·`), bullets, pipes (`|`), slashes (`/`), or repeated hyphens. Render separate semantic elements styled by position, spacing, or tone. Legitimate prose lists, math, code, or brand names require an explicit rule ignore with review evidence.
- Action labels use concrete verbs; error copy states what failed, what it affects, and how to recover.

### Materials, controls, and platform character

- Use translucent or blurred material only to establish a functional or transient layer that stays legible over scrolling content.
- Treat control adaptation as a unified contract—hit area, silhouette, radius, border/fill, typography, focus ring, and disabled state belong to the surrounding surface language while preserving native semantics, keyboard behavior, and assistive-technology roles. Never leave an unadapted browser-default input or button inside a custom surface (mark intentional adapted native controls with `data-ui-guard-adapted` / `ui-guard: allow-native` and verify states; opt-in browser check: `node "$SKILL_HOME/scripts/verify-control-adaptation.mjs" page.html 'button' 6`).
- Do not copy Apple.com marketing pixels into workspace UI. Use Apple.com for editorial storytelling, Apple HIG for native control/focus/touch behavior, and Linear for dense workspace orientation and reduced chrome. Check control height, icon optical box, stroke weight, label baseline, and touch target together across target platforms (`examples/icon-tiers.ts`).

### Icons, menus, tabs, and motion

- **Icons**: one icon = one object, action, or state, sized by semantic optical tier rather than a single hard-coded pixel value. Treat icon count as a budget: use borderless hit-area icons (with focus ring and accessible name) for frequent, familiar compact actions (`view`, `search`, `copy`, `edit`, `close`), remove decorative label-echo icons, and keep visible text for first-use, ambiguous, consequential, destructive, state, or recovery actions.
- **Menus and tabs**: keep frequent commands at the top menu level; verify keyboard branch traversal and focus restoration to the originating object. Use tabs only for peer panels (use segmented/single-choice controls for period filters on the same measure), keep manual focus distinct from selection, and keep record identity visible across tab switches.
- **Motion and state**: define interactive and boundary states (`default`, `hover`, `active`, `focus`, `disabled`, `loading`, `error`, `offline`, `partial`, `recovery`) without relying solely on color or pulse. Honor `prefers-reduced-motion`, commit state and focus immediately on action, keep interrupted reverse transitions continuous, avoid layout jumps on live reconnect, and place retry/cancel/recovery controls beside the affected item.

## AI-Slop review

Flag any pattern below when it substitutes for missing content, repeats mechanically across roles, competes with the task, or could be pasted into an unrelated product unchanged:

- Decorative glass, gradients, gradient-clipped headlines (`background-clip: text`), AI-default purple-to-indigo glows, particles, 3D spheres, or futuristic backgrounds
- Card-in-card nesting (bordered/shadowed cards inside bordered cards) or boxing every message, field, and status
- Thick colored side-tab accents (`border-left: 4px`) on rounded cards, or interchangeable feature cards with generic unrelated icons
- Hero announcement pills (`✨ v2.0 is live →`) without a task decision, or arbitrary `01 / 02 / 03` numbering on items without sequential dependency
- Fake floating dashboard mockups or invented chart curves standing in for real states and data mapping
- Generic AI motifs (robot heads, random sparkles/stars, hexagons, neural lines) or decorative emojis (`✨`, `🚀`, `💡`) used as UI icons or heading prefixes
- Decorative pulsing/pinging dots (`animate-pulse`, `animate-ping`) faking "live/AI" status outside skeletons or `role="status"`
- Unverified vanity metrics/social proof, em-dash slogan stitches, forced three-adjective triads, or subtitles restating the UI
- Status shown only by color/glow, components differing only by color, or vague/defensive generated copy

For each finding: delete, merge, defer to detail, replace with a concrete metaphor, or bind to a real behavior contract. Never add explanatory text to rescue weak hierarchy before simplifying the layout.

### Cross-style execution defects

These checks block broken execution across any aesthetic direction (high-contrast monochrome print, dense workspaces, and expressive posters all stay valid when intentional):

- **Nested bordered cards**: flatten inner groups with alignment, spacing, or a quiet tonal step.
- **Non-concentric radii**: enforce `innerRadius <= outerRadius - padding` on corner-adjacent nested elements.
- **Washed-out contrast**: never place neutral gray text over saturated/tinted fills; clear WCAG AA (≥ 4.5:1 text, ≥ 3:1 large text/controls).
- **Skipped headings or sub-12px copy**: keep heading levels sequential (`h1` → `h2` → `h3`) and ban `< 12px` disclaimer/metadata stuffing.
- **Jittering digits or broken CJK typography**: enforce `tabular-nums` on comparable figures, balanced headline wraps, ≥ 1.5 CJK prose line-height, and non-clogged small CJK weights.
- **Sterile over-deletion**: stripping slop must be followed by compositional tuning (scale contrast, proportion, alignment, surface steps)—never ship a blank, uncalibrated wireframe.

## Copy in context and visual finish gate

1. **Fact and input inventory**: render only supplied facts and inputs consumed by a real requirement or service operation; delete orphan form fields and premature success messages. State material caveats plainly at the commit point (e.g., “模拟预约”) rather than in blanket apologies, and never turn an unavailable item into an unsourced release promise (“敬请期待”).
2. **Squint and finish pass**: at `390px` and `1440px` (in color, grayscale, and a quick blur/squint), verify six relationships before handoff—**type scale tension, outer-margin-to-measure proportion, surface count, control-to-icon ratio, row rhythm, and state contrast**. One focal region and one primary action must dominate effortlessly; fix any remaining browser-default control, accidental `1px` double border, mismatched corner, or dead empty band through layout and proportion, never by pasting back a badge, subtitle, or extra card.
