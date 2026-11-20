import type { FailedItem } from './view-state-contract'

type ViewState = 'ready' | 'empty' | 'loading' | 'error' | 'offline' | 'partial-failure' | 'permission-limited' | 'recovered'

type ProductionItem = {
  id: string
  name: string
  status: string
  description?: string | null
  updatedAt?: string | null
  count?: number
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

export function adaptProductionPayload(payload: DemoPayload | ProductionViewModel): ProductionViewModel {
  if ('__source' in payload) {
    if (payload.__source !== 'demo') {
      throw new Error('Unknown payload source')
    }
    const runtime = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } }
    if (runtime.process?.env?.NODE_ENV === 'production') {
      throw new Error('Demo payload cannot reach a production UI. Check the data source and strip __source before the view layer.')
    }
    return {
      state: payload.state,
      items: payload.items,
      error: payload.error,
      failedItems: payload.failedItems,
      message: payload.message,
      lastKnownUpdatedAt: payload.lastKnownUpdatedAt
    }
  }

  return payload
}
