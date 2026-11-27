## Interaction and icon inventory

在写页面结构和样式前，先建立一份动作清单。它约束交互语义，不固定视觉主题。

### 1. Map the task

记录当前对象、用户目标、主要结果、可逆动作、破坏性动作和恢复路径。把每个动作绑定到对象或状态，避免出现没有作用域的按钮。

### 2. Classify each action

为每个动作选择一个角色。这七个名字就是 JSON 里 `role` 字段的取值，校验脚本按这张表判定，写别的会被拒。

- `primary` — Primary action
- `frequent-compact` — Frequent compact action
- `navigation` — Navigation or scope change
- `state` — State indicator
- `destructive` — Destructive or consequential action
- `recovery` — Recovery or undo
- `low-frequency` — Low-frequency action

### 3. Choose the label form

- `labelForm` 只有三个取值，写别的会被校验脚本拒：`text`、`icon-only`、`icon+label`。
- Familiar frequent compact action may use an icon-only control.
- Navigation may use an icon with a visible label when the scope is not obvious.
- Destructive, first-use, ambiguous, and recovery actions keep visible text. 校验脚本把 `primary`、`destructive`、`recovery` 三个角色里的 `icon-only` 直接判成 `labelForm-risk`，因为这三类动作在第一次使用时就得能读懂；其余角色允许只留图标，条件是写清 `recognitionBasis`。
- A familiar download or share icon may be icon-only when its scope is unambiguous in the surrounding toolbar or editor. Keep its accessible name, tooltip, focus state, and a sufficient hit area.
- State indicators use readable text and may add a small semantic marker.
- Never replace a clear action with an unfamiliar symbol to reduce text.

### 4. Define the control grammar

For each family record hit area, optical icon size, stroke or fill, baseline, focus, hover, pressed, disabled, loading and reduced-motion behavior. Low-risk icon actions usually use a borderless hit area. A boundary indicator or filled container needs a reason such as selection, grouping, or platform convention.

### 5. Prototype the task path

Test the primary path and one failure or recovery path with representative data before polishing. Check that the action remains discoverable with labels hidden, icons hidden, keyboard input, touch input, and larger text.

### 6. Audit before delivery

Count visible text actions, icon-only actions, state markers, pills, and independent borders. §2 的角色决定 §3 的标签形态，也决定这条计数读什么：`state` 不该出现在可点控件里，`destructive` 与 `recovery` 不该只由图标承担，`frequent-compact` 才允许省掉文字。计数和角色对不上，说明清单写完就没再回头看界面。 For every text action, record why an icon would be ambiguous or insufficient. For every icon-only action, record its accessible name and recognition basis. Remove any control that only repeats a heading, state, or nearby action.

Two of those audits are machine-checkable, so the reviewer does not have to remember them: `QS-INTERACTION-001` flags a destructive action carried only by an icon, and `QS-INTERACTION-002` flags a control whose label restates its heading or its own state. Both read the control's own text, so the finding points at a line that can be changed. The rest — whether the icon is recognisable, whether the state marker reads as a state — still needs a person.

一份填满七个角色的清单在 [`examples/interaction-inventory.json`](../examples/interaction-inventory.json)，可直接跑校验脚本对照字段写法。

Save the inventory as JSON when it is used as a handoff artifact and run `node "$SKILL_HOME/scripts/validate-interaction-inventory.mjs" interaction-inventory.json`. The validator checks `object`, `goal`, `result`, `recoveryPath`, then for every action `label`, `role`, `labelForm`, `controlGrammar`, `accessibleName`, without prescribing a visual theme. `recognitionBasis` is required only for `icon-only` actions.
