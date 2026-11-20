export type FailedItem = { id: string; reason: string; retryable: boolean }

/**
 * UI-facing state contract. `empty` means a successful query returned no
 * records. `offline` means the connection is unavailable and may carry the
 * last cached value when one exists.
 */
export type ViewState<T> =
  | { kind: 'loading'; previous?: T }
  | { kind: 'ready'; data: T; updatedAt: string }
  | { kind: 'empty' }
  | { kind: 'error'; message: string; retryable: boolean }
  // No data means offline with no cache. lastUpdatedAt is absent when no
  // successful result has ever been observed.
  | { kind: 'offline'; data?: T; lastUpdatedAt?: string }
  | { kind: 'partial'; data: T; failedItems: FailedItem[] }
  | { kind: 'permission'; reason: string }
  | { kind: 'recovered'; data: T; recoveredAt: string }

export type RecoveryAction = 'retry' | 'request-access' | 'reconnect' | 'none'

/** Keep stable data visible during refresh to avoid a blanking transition. */
export function visibleData<T>(state: ViewState<T>): T | undefined {
  // Loading keeps the previous result. Error and permission states expose no
  // stale data because the UI must explain the blocked action first.
  if (state.kind === 'loading') return state.previous
  if (state.kind === 'ready' || state.kind === 'partial' || state.kind === 'recovered') return state.data
  if (state.kind === 'offline') return state.data
  return undefined
}

/** Derive the smallest user action that can recover the current state. */
export function recoveryAction<T>(state: ViewState<T>, itemId?: string): RecoveryAction {
  if (state.kind === 'partial') {
    const item = state.failedItems.find(failure => failure.id === itemId)
    return item?.retryable ? 'retry' : 'none'
  }
  if (state.kind === 'error') return state.retryable ? 'retry' : 'none'
  if (state.kind === 'permission') return 'request-access'
  if (state.kind === 'offline') return 'reconnect'
  return 'none'
}
