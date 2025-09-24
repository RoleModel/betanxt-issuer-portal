/**
 * Calculate the number of days until a given date
 * @param dateString - The target date string
 * @returns Number of days until the date (negative if past)
 */
export const calculateDaysUntil = (dateString: string): number => {
  const targetDate = new Date(dateString)
  const today = new Date()

  // Reset time to start of day for accurate comparison
  today.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)

  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * Format a date string for display
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
/**
 * Format a date string for display
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export const friendlyDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/**
 * Check if a date is in the past
 * @param dateString - The date string to check
 * @returns True if the date is in the past
 */
export const isDateInPast = (dateString: string): boolean => {
  return calculateDaysUntil(dateString) < 0
}

/**
 * Format days until a date for display
 * @param days - Number of days until the date (negative if past)
 * @returns Formatted string describing the time until/since the date
 */
export const formatDaysUntil = (days: number): string => {
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  if (days > 0) return `${days} Days Until`
  return `${Math.abs(days)} days ago`
}
