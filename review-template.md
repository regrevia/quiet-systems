# UI Guard UI Review

## 1. Task and audience

- Primary user:
- Primary task:
- Object being acted on:
- Platform and viewport:
- Success signal:

## 2. Information convergence

- Always visible:
- Deferred to detail:
- Evidence or diagnostics:
- Primary action:
- Contextual and destructive actions:

## 3. Direction decision

- Chosen direction:
- Alternatives considered:
- Why this direction fits the task and data:
- Open visual decisions:

## 4. Component and state contracts

| Component | States | Data source | Recovery action |
| --- | --- | --- | --- |
|  |  |  |  |

## 5. Data and action mapping

| Visible field or action | Source field or command | Transformation | Verified |
| --- | --- | --- | --- |
| Status label | `task.status` | `statusLabels[status]` | ✓ |
| Retry | `retryTask(task.id)` | Keeps the current task and error summary |  |

## 6. Verification evidence

- Static review command and result:
- Real-data or production-shaped fixture result:
- API adapter and view-model shape result:
- Wide, medium, and narrow viewport result:
- Keyboard and focus result:
- Screen reader or accessibility-tree result:
- Reduced-motion result:
- Interrupted transition: first action, immediate reversal, final visible object and focus destination:
- For a save flow, record the visible message and editable values after a forced write failure, then the confirmed effect after retry:
- Permission, stale, error, retry, and recovery result:

## 7. Findings

Use `P0` for a broken production boundary or data-integrity gate, `P1` for a visible, interaction, accessibility, or visual-system defect, and `P2` for a quality or consistency improvement.

| Priority | Finding | Action | Evidence |
| --- | --- | --- | --- |
| P1 | List row hides the current failure reason | Keep the summary visible and move logs to detail | Screenshot at 1024px |

## 8. Unverified items

List anything that still needs a browser, device, assistive technology, backend, permission, or user decision.
