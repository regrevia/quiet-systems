# Direction samples

When the brief is unclear, create two or three low-cost samples with the same task and content. Make the differences structural so the user can choose an information model before visual polish.

Each sample must state:

- the task and object
- the assumed data fields and states
- the reading and action order
- the density and navigation model
- the primary action and contextual actions
- the tradeoff and the decision it supports

For the three retry samples below, activate Retry twice before the response arrives. Expect one request for the failed ID. Show progress on that record, keep the successful record visible, and leave other records usable. On success replace the failed state in place. On another retryable failure show the current reason and enable Retry again.

Suggested directions:

- **List-first** keeps scanning and keyboard movement fast. Choose it for repeated objects and frequent comparison.
- **Detail-first** keeps one object and its next action prominent. Choose it for review, editing, or approval.
- **Split-view** keeps the object list and current detail visible together. Choose it when users switch among objects often and the window supports the width.

Use grayscale or restrained tokens first. Do not turn a direction sample into a production component library before the task and data model are chosen.

For a comparison written in this Markdown format, run `node scripts/validate-directions.mjs examples/direction-samples/*-first.md examples/direction-samples/split-view.md` from the skill directory. Copy the task and data lines verbatim across the alternatives. The check detects missing fields and repeated descriptions. Walk through the same task in each prototype to verify that the structural differences are real.
