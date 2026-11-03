// Everything that talks to the API lives here, so the rest of the app never calls fetch directly.

export type Share = {
  id: string
  memberId: string
  memberName: string
  amountCents: number
  paidAt: string | null
}

export type Bill = {
  id: string
  homeId: string
  title: string
  totalCents: number
  createdAt: string
  shares: Share[]
}

export type Balance = { memberId: string; name: string; outstandingCents: number }

// An error with a message that is safe to show to the person using the page.
export class ApiError extends Error {
  readonly status: number | null // null = no answer at all (offline, timeout)

  constructor(message: string, status: number | null) {
    super(message)
    this.status = status
  }
}

const TIMEOUT_MS = 10_000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function errorMessageFrom(body: unknown): string | null {
  return isRecord(body) && typeof body.error === 'string' ? body.error : null
}

async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  // If the server is too slow we give up, so the page never waits forever.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(path, { ...init, signal: controller.signal })
    const text = await response.text()

    let body: unknown = null
    try {
      body = JSON.parse(text)
    } catch {
      // The answer was not JSON (for example an HTML error page). Handled below.
    }

    if (!response.ok) {
      throw new ApiError(
        errorMessageFrom(body) ?? `The server answered with an error (${response.status}).`,
        response.status,
      )
    }
    return body
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('The server is taking too long to answer.', null)
    }
    throw new ApiError('Could not reach the server. Check your connection.', null)
  } finally {
    clearTimeout(timer)
  }
}

async function postJson(path: string, data: unknown): Promise<unknown> {
  return request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  })
}

const unexpected = () => new ApiError('The server sent an answer we did not understand.', null)

export async function getBills(homeId: string): Promise<Bill[]> {
  const body = await request(`/api/homes/${encodeURIComponent(homeId)}/bills`)
  if (!isRecord(body) || !Array.isArray(body.bills)) throw unexpected()
  return body.bills as Bill[]
}

export async function getBalances(homeId: string): Promise<Balance[]> {
  const body = await request(`/api/homes/${encodeURIComponent(homeId)}/balances`)
  if (!isRecord(body) || !Array.isArray(body.balances)) throw unexpected()
  return body.balances as Balance[]
}

export async function payShare(
  billId: string,
  shareId: string,
  idempotencyKey: string,
): Promise<{ paidAt: string }> {
  const body = await request(
    `/api/bills/${encodeURIComponent(billId)}/shares/${encodeURIComponent(shareId)}/pay`,
    { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey } },
  )
  if (!isRecord(body) || typeof body.paidAt !== 'string') throw unexpected()
  return { paidAt: body.paidAt }
}

export function describeError(error: unknown): { message: string; status: number | null } {
  if (error instanceof ApiError) return { message: error.message, status: error.status }
  return { message: 'Something went wrong.', status: null }
}

export async function createHome(name: string): Promise<{ id: string }> {
  const body = await postJson('/api/homes', { name })
  if (!isRecord(body) || typeof body.id !== 'string') throw unexpected()
  return { id: body.id }
}

export async function addMember(homeId: string, name: string): Promise<void> {
  const body = await postJson(`/api/homes/${encodeURIComponent(homeId)}/members`, { name })
  if (!isRecord(body) || typeof body.id !== 'string') throw unexpected()
}

export async function createBill(homeId: string, title: string, totalCents: number): Promise<void> {
  const body = await postJson(`/api/homes/${encodeURIComponent(homeId)}/bills`, {
    title,
    totalCents,
  })
  if (!isRecord(body) || typeof body.id !== 'string') throw unexpected()
}
