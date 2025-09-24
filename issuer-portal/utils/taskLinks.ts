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
  // Handle null/undefined
  if (!json) return []

  let links: TaskLink[] = []

  // If it's already an array, use it directly
  if (Array.isArray(json)) {
    links = json.filter(isTaskLink)
  }
  // If it's a string, try to parse it as JSON
  else if (typeof json === 'string') {
    try {
      const parsed = JSON.parse(json)
      if (Array.isArray(parsed)) {
        links = parsed.filter(isTaskLink)
      }
    } catch (e) {
      console.warn('Failed to parse task links JSON:', e)
      return []
    }
  }

  // Auto-add upload link when there's a download link
  const hasDownloadLink = links.some(link => link.action === 'download')
  const hasUploadLink = links.some(link => link.action === 'upload')

  if (hasDownloadLink && !hasUploadLink) {
    links.push({
      label: 'Upload Document',
      action: 'upload',
      url: ''
    })
  }

  return links
}
