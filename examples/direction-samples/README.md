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

### Compare the task in both samples

Give the reviewer the same starting record and destination in each sample. Note what they can read before acting, which control reveals the requested detail and where they land on return. A text-only brief is enough for choosing terminology. If the uncertainty is about navigation, provide a clickable path in each direction. Keep the choice question and tradeoffs with the samples, outside the product UI.

Ask about the work that changes the choice, for example “Do visitors usually compare dates across the collection, or read one item to the end?” Also check which secondary task the chosen direction must preserve. If visitors need to compare dates, observe whether both years are visible together at the target width. If they need to read one item, follow it back to the same place in the collection. Record the answer and the observed cost before building out the selected direction.

When the brief supplies approved prose, export the visible description from the opened object in each direction. Compare each export separately with the approved text using `node "$SKILL_HOME/scripts/compare-article-copy.mjs" approved.txt visible.txt`. Checking the two exports only against each other can miss a factual invention shared by both.

Try the [collection overview](archive/overview.html) and [reading index](archive/reading.html) locally. Both use the same two records. The overview aligns both dates and opens a temporary detail. The reading index opens one record at a time. Find the paper knife, read its note, then return to its entry by keyboard. Decide whether visitors must also compare both years without opening an item.
