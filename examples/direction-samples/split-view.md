# Split-view sample

- Task and object: identify the failed record and retry it while keeping the loaded record visible.
- Assumed fields and states: [shared partial-failure fixture](../fixtures/partial-failure.json). Show the visible record name, failed record ID, reason, and retry eligibility.
- Reading and action order: select the failed ID in the list, read its reason in the detail pane, then retry.
- Density and navigation: persistent narrow list beside a flexible detail pane, collapsing to one pane at narrow widths.
- Primary action: Retry in the detail pane while the visible record stays in the list.
- Contextual actions: switch records in the list while retaining the current scroll position.
- Tradeoff: low switching cost and strong context, with a wider minimum viewport and more responsive rules.
- Decision supported: choose this direction when users compare or triage objects repeatedly.
