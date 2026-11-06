// Remembers the homes opened in this browser, so you don't have to paste an ID again.
const KEY = 'bill-splitter:recent-homes'
const MAX_HOMES = 6

export type RecentHome = { id: string; name: string }

function isRecentHome(value: unknown): value is RecentHome {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof value.id === 'string' &&
    typeof value.name === 'string'
  )
}

// Browser storage can be empty, full, blocked or edited by hand, so every use is guarded.
export function getRecentHomes(): RecentHome[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isRecentHome).slice(0, MAX_HOMES) : []
  } catch {
    return []
  }
}

export function rememberHome(home: RecentHome): void {
  try {
    const others = getRecentHomes().filter((saved) => saved.id !== home.id)
    localStorage.setItem(KEY, JSON.stringify([home, ...others].slice(0, MAX_HOMES)))
  } catch {
    // Storage is unavailable. Remembering homes is a convenience, so we carry on without it.
  }
}
