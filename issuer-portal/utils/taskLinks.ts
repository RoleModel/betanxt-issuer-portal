export interface TaskLink {
  label: string
  action: string
  url?: string
}

function isTaskLink(obj: unknown): obj is TaskLink {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'label' in obj &&
    'action' in obj &&
    typeof (obj as Record<string, unknown>).label === 'string' &&
    typeof (obj as Record<string, unknown>).action === 'string'
  )
}

export function parseTaskLinks(json: unknown): TaskLink[] {
  if (!Array.isArray(json)) return []
  return json.filter(isTaskLink)
}
