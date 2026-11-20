export type ViewPreferences = {
  grouping: 'none' | 'status' | 'assignee'
  ordering: 'manual' | 'updated' | 'priority'
  density: 'comfortable' | 'compact'
}

export type SelectionAction = {
  id: string
  label: string
  shortcut?: string
  minSelection?: number
  maxSelection?: number
  applicableStates?: string[]
  run: (ids: string[]) => Promise<void>
}

export function resolveViewPreferences(
  workspaceDefaults: ViewPreferences,
  personalPreferences?: Partial<ViewPreferences>
): ViewPreferences {
  return { ...workspaceDefaults, ...personalPreferences }
}

export function availableSelectionActions(
  selectedIds: string[],
  actions: SelectionAction[],
  selectedStates: string[] = []
): SelectionAction[] {
  if (selectedIds.length === 0) return []
  return actions.filter((action) => {
    if (action.minSelection !== undefined && selectedIds.length < action.minSelection) return false
    if (action.maxSelection !== undefined && selectedIds.length > action.maxSelection) return false
    const applicableStates = action.applicableStates
    if (applicableStates && !selectedStates.every((state) => applicableStates.includes(state))) return false
    return true
  })
}
