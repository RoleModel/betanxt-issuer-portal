export const formatDate = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return '-'

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)

  // Check if date is valid
  if (isNaN(date.getTime())) return '-'

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export const formatDateWithYear = (
  dateInput: string | Date | undefined | null
): string => {
  if (!dateInput) return '-'

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)

  // Check if date is valid
  if (isNaN(date.getTime())) return '-'

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Split shares into numeric value and suffix for animated counters
export const formatSharesParts = (shares: string): { value: number; suffix: string } => {
  const num = parseFloat(shares)
  if (isNaN(num)) return { value: 0, suffix: '' }
  if (num >= 1_000_000_000)
    return { value: parseFloat((num / 1_000_000_000).toFixed(2)), suffix: 'B' }
  if (num >= 1_000_000)
    return { value: parseFloat((num / 1_000_000).toFixed(2)), suffix: 'M' }
  if (num >= 1_000) return { value: parseFloat((num / 1_000).toFixed(2)), suffix: 'K' }
  return { value: parseFloat(num.toFixed(2)), suffix: '' }
}
