# Detail-first sample

- Task and object: identify the failed record and retry it while keeping the loaded record visible.
- Assumed fields and states: [shared partial-failure fixture](../fixtures/partial-failure.json). Show the visible record name, failed record ID, reason, and retry eligibility.
- Reading and action order: open the failed record, read its reason and retry eligibility, then retry. Keep the successful record in a compact summary.
- Density and navigation: generous reading width with progressive disclosure for diagnostics and history.
- Primary action: Retry below the failure reason in the detail view.
- Contextual actions: return to the collection to select another record.
- Tradeoff: strongest focus and explanation, with a higher cost when users switch among many objects.
- Decision supported: choose this direction when review or approval matters more than comparison.
