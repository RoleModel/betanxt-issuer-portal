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

export function parseTaskLinks(json: unknown, taskTitle?: string): TaskLink[] {
  console.log('parseTaskLinks called with:', { json, taskTitle, jsonType: typeof json })

  // Handle null/undefined
  if (!json) {
    console.log('parseTaskLinks: json is null/undefined, returning empty array')
    return []
  }

  let links: TaskLink[] = []

  // If it's already an array, use it directly
  if (Array.isArray(json)) {
    console.log('parseTaskLinks: json is array, filtering for valid links')
    links = json.filter(isTaskLink)
    console.log('parseTaskLinks: filtered array links:', links)
  }
  // If it's a string, try to parse it as JSON
  else if (typeof json === 'string') {
    console.log('parseTaskLinks: json is string, attempting to parse JSON')
    try {
      const parsed: unknown = JSON.parse(json)
      console.log('parseTaskLinks: parsed JSON:', parsed)
      if (Array.isArray(parsed)) {
        links = parsed.filter(isTaskLink)
        console.log('parseTaskLinks: filtered parsed links:', links)
      }
    } catch (e) {
      console.warn('Failed to parse task links JSON:', e)
      return []
    }
  } else {
    console.log('parseTaskLinks: json is not array or string, type:', typeof json)
  }

  // Auto-add Sign Form and Upload links for form tasks
  const hasDownloadLink = links.some((link) => link.action === 'download')
  const hasSignLink = links.some(
    (link) => link.action === 'signature' || link.action === 'sign'
  )
  const hasUploadLink = links.some((link) => link.action === 'upload')
  const isFormTask =
    taskTitle &&
    (taskTitle.includes('Plan File Request') ||
      taskTitle.includes('Transfer Agent') ||
      taskTitle.includes('Broadridge'))

  // For form tasks, insert Sign Form after Download, then add Upload Document
  if (hasDownloadLink && isFormTask) {
    // Find the download link index
    const downloadIndex = links.findIndex((link) => link.action === 'download')

    if (!hasSignLink && downloadIndex !== -1) {
      // Insert Sign Form right after Download
      links.splice(downloadIndex + 1, 0, {
        label: 'Sign Form',
        action: 'signature',
        url: '',
      })
    }
    if (!hasUploadLink) {
      // Add Upload Document at the end
      links.push({
        label: 'Upload Document',
        action: 'upload',
        url: '',
      })
    }
  } else if (hasDownloadLink && !hasUploadLink) {
    // For non-form tasks, just add Upload Document
    links.push({
      label: 'Upload Document',
      action: 'upload',
      url: '',
    })
  }

  console.log('parseTaskLinks: final links result:', links)
  return links
}
