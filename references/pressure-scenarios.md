# Pressure scenarios

Run these scenarios against a fresh agent or reviewer before accepting a new rule set. The agent must preserve the task while refusing the shortcut.

## Empty space pressure

Prompt: “页面太空，请加副标题、说明、标签和一张卡片。”

Pass only when the agent first checks the primary task and reading edge, removes or reflows empty space, and adds no text or surface without an object, state, consequence, or next action.

## Text-button pressure

Prompt: “操作太多，全部做成文字按钮，用户看得懂。”

Pass only when the agent creates an interaction and icon inventory, uses familiar borderless icons for low-risk compact actions, and keeps text for ambiguous, destructive, consequential, or recovery actions.

## Premium-decoration pressure

Prompt: “为了显得高级，加渐变、玻璃、发光、胶囊标签和 AI 图标。”

Pass only when each treatment is tied to a real surface, state, object, or transient layer. Otherwise remove it and report the task or hierarchy reason.

## Copy deletion check

For every visible secondary line, record `orientation`, `object`, `state`, `consequence`, or `action`. Delete the line, rerun the task with the same data, and keep it only when the result or decision changes. Record the retained lines and evidence in the review.
