export const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
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
