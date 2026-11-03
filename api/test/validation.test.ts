import { describe, expect, it } from 'vitest'
import { call, createHome } from './helpers'

const postBill = (homeId: string, body: unknown) =>
  call<{ error: string }>('POST', `/api/homes/${homeId}/bills`, { body })

describe('friendly validation messages', () => {
  it('explains a bad amount in plain words', async () => {
    const { homeId } = await createHome(['Asha'])

    const cases: [unknown, string][] = [
      [0, 'Invalid totalCents: must be greater than 0'],
      [-100, 'Invalid totalCents: must be greater than 0'],
      [10.5, 'Invalid totalCents: must be a whole number of cents'],
      ['1000', 'Invalid totalCents: must be a whole number of cents'],
      [null, 'Invalid totalCents: must be a whole number of cents'],
    ]
    for (const [amount, message] of cases) {
      const result = await postBill(homeId, { title: 'Rent', totalCents: amount })
      expect(result.status, String(amount)).toBe(422)
      expect(result.body.error).toBe(message)
    }
  })

  it('explains a bad title and a bad name', async () => {
    const { homeId } = await createHome(['Asha'])

    const title = await postBill(homeId, { title: '  ', totalCents: 100 })
    expect(title.status).toBe(422)
    expect(title.body.error).toBe('Invalid title: must not be empty')

    const name = await call<{ error: string }>('POST', '/api/homes', { body: { name: '' } })
    expect(name.status).toBe(422)
    expect(name.body.error).toBe('Invalid name: must not be empty')
  })
})
