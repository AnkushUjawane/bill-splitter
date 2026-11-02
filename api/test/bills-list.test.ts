import { describe, expect, it } from 'vitest'
import { call, createBill, createHome } from './helpers'

type ListedBill = {
  id: string
  title: string
  totalCents: number
  shares: {
    id: string
    memberId: string
    memberName: string
    amountCents: number
    paidAt: string | null
  }[]
}

const list = (homeId: string) => call<{ bills: ListedBill[] }>('GET', `/api/homes/${homeId}/bills`)

describe('list bills of a home', () => {
  it('returns an empty list for a home with no bills', async () => {
    const { homeId } = await createHome(['Asha'])

    const result = await list(homeId)

    expect(result.status).toBe(200)
    expect(result.body).toEqual({ bills: [] })
  })

  it('returns bills newest first, with shares in member order and names', async () => {
    const { homeId, members } = await createHome(['Asha', 'Ben', 'Chen'])
    const first = await createBill(homeId, 1000)
    const second = await createBill(homeId, 300)

    const result = await list(homeId)

    expect(result.status).toBe(200)
    expect(result.body.bills.map((b) => b.id)).toEqual([second.body.id, first.body.id])
    const older = result.body.bills[1]
    expect(older?.shares.map((s) => s.memberName)).toEqual(['Asha', 'Ben', 'Chen'])
    expect(older?.shares.map((s) => s.memberId)).toEqual(members.map((m) => m.id))
    expect(older?.shares.map((s) => s.amountCents)).toEqual([334, 333, 333])
  })

  it('shows paid status after a payment', async () => {
    const { homeId } = await createHome(['Asha', 'Ben'])
    const bill = await createBill(homeId, 1000)
    const share = bill.body.shares[0]
    if (!share) throw new Error('no share')
    await call('POST', `/api/bills/${bill.body.id}/shares/${share.id}/pay`, {
      headers: { 'Idempotency-Key': 'k1' },
    })

    const result = await list(homeId)

    expect(result.body.bills[0]?.shares.map((s) => s.paidAt !== null)).toEqual([true, false])
  })

  it('does not mix up bills of different homes', async () => {
    const a = await createHome(['Asha'])
    const b = await createHome(['Ben'])
    await createBill(a.homeId, 100)

    expect((await list(b.homeId)).body.bills).toEqual([])
  })

  it('returns 404 when the home does not exist', async () => {
    expect((await list('does-not-exist')).status).toBe(404)
  })
})