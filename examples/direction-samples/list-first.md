# List-first sample

- Task and object: identify the failed record and retry it while keeping the loaded record visible.
- Assumed fields and states: [shared partial-failure fixture](../fixtures/partial-failure.json). Show the visible record name, failed record ID, reason, and retry eligibility.
- Reading and action order: scan the visible and failed records, identify the failed ID and reason, then retry from its row.
- Density and navigation: compact repeated rows with predictable keyboard movement and one stable detail entry point.
- Primary action: Retry from the failed row.
- Contextual actions: inspect the failure reason in detail.
- Tradeoff: fastest comparison and lowest navigation cost, with less room for long descriptions.
- Decision supported: choose this direction when scanning repeated objects is the main job.
