import type { FailedItem } from './view-state-contract'

type ViewState = 'ready' | 'empty' | 'loading' | 'error' | 'offline' | 'partial-failure' | 'permission-limited' | 'recovered'

type ProductionItem = {
  id: string
  name: string
  status: string
  description?: string | null
  updatedAt?: string | null
  count?: number | null
}

type DemoPayload = {
  __source: 'demo'
  state: ViewState
  items: ProductionItem[] | null
  error?: { code: string; retryable: boolean }
  failedItems?: FailedItem[]
  message?: string
  lastKnownUpdatedAt?: string
}

type ProductionViewModel = {
  state: ViewState
  items: ProductionItem[] | null
  error?: { code: string; retryable: boolean }
  failedItems?: FailedItem[]
  message?: string
  lastKnownUpdatedAt?: string
}

/** Use at the product transport boundary, including browser builds. */
export function adaptProductionPayload(payload: ProductionViewModel): ProductionViewModel {
  if ('__source' in payload) throw new Error('Fixture marker in production data')
  return payload
}

/** Import only in a prototype or fixture entry point. */
export function adaptDemoPayload(payload: DemoPayload): ProductionViewModel {
  if (payload.__source !== 'demo') throw new Error('Unknown fixture source')
  return {
    state: payload.state,
    items: payload.items,
    error: payload.error,
    failedItems: payload.failedItems,
    message: payload.message,
    lastKnownUpdatedAt: payload.lastKnownUpdatedAt
  }
}
