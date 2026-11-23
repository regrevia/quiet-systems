## Interaction and icon inventory

在写页面结构和样式前，先建立一份动作清单。它约束交互语义，不固定视觉主题。

### 1. Map the task

记录当前对象、用户目标、主要结果、可逆动作、破坏性动作和恢复路径。把每个动作绑定到对象或状态，避免出现没有作用域的按钮。

### 2. Classify each action

为每个动作选择一个角色。

- Primary action
- Frequent compact action
- Navigation or scope change
- State indicator
- Destructive or consequential action
- Recovery or undo
- Low-frequency action

### 3. Choose the label form

- Familiar frequent compact action may use an icon-only control.
- Navigation may use an icon with a visible label when the scope is not obvious.
- Destructive, consequential, first-use, ambiguous, and recovery actions keep visible text.
- A familiar download or share icon may be icon-only when its scope is unambiguous in the surrounding toolbar or editor. Keep its accessible name, tooltip, focus state, and a sufficient hit area.
- State indicators use readable text and may add a small semantic marker.
- Never replace a clear action with an unfamiliar symbol to reduce text.

### 4. Define the control grammar

For each family record hit area, optical icon size, stroke or fill, baseline, focus, hover, pressed, disabled, loading and reduced-motion behavior. Low-risk icon actions usually use a borderless hit area. A boundary indicator or filled container needs a reason such as selection, grouping, or platform convention.

### 5. Prototype the task path

Test the primary path and one failure or recovery path with representative data before polishing. Check that the action remains discoverable with labels hidden, icons hidden, keyboard input, touch input, and larger text.

### 6. Audit before delivery

Count visible text actions, icon-only actions, state markers, pills, and independent borders. For every text action, record why an icon would be ambiguous or insufficient. For every icon-only action, record its accessible name and recognition basis. Remove any control that only repeats a heading, state, or nearby action.
