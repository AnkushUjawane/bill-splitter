// Display only. The API always works in whole cents.
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString()
}
