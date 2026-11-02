import { Hono } from 'hono'
import { HttpError } from '../errors'

type ShareRow = { id: string; memberId: string; amountCents: number; paidAt: string | null }
type StoredShare = ShareRow & { paymentKey: string | null }

export const payments = new Hono<{ Bindings: Env }>()

payments.post('/:billId/shares/:shareId/pay', async (c) => {
  const billId = c.req.param('billId')
  const shareId = c.req.param('shareId')
  const key = c.req.header('Idempotency-Key')?.trim()

  if (!key) throw new HttpError(400, 'Idempotency-Key header is required')
  if (key.length > 255) throw new HttpError(400, 'Idempotency-Key is too long')

  const db = c.env.DB

  // The whole decision "who gets to pay?" is this ONE statement. The database
  // runs it atomically, and `paid_at IS NULL` means only a share that is still
  // unpaid can be changed. If two requests arrive together, one changes the row
  // and the other finds nothing to change.
  const paid = await db
    .prepare(
      `UPDATE shares SET paid_at = ?1, payment_key = ?2
       WHERE id = ?3 AND bill_id = ?4 AND paid_at IS NULL
       RETURNING id, member_id AS memberId, amount_cents AS amountCents, paid_at AS paidAt`,
    )
    .bind(new Date().toISOString(), key, shareId, billId)
    .first<ShareRow>()

  if (paid) return c.json(paid, 200)

  // Nothing was changed. Either the share does not exist, or it is already paid.
  const existing = await db
    .prepare(
      `SELECT id, member_id AS memberId, amount_cents AS amountCents,
              paid_at AS paidAt, payment_key AS paymentKey
       FROM shares WHERE id = ? AND bill_id = ?`,
    )
    .bind(shareId, billId)
    .first<StoredShare>()

  if (!existing) throw new HttpError(404, 'Bill or share not found')

  // Same key as the payment that already happened: a retry. Answer the same way.
  if (existing.paymentKey === key) {
    const { paymentKey: _ignored, ...share } = existing
    return c.json(share, 200)
  }

  throw new HttpError(409, 'Share was already paid with a different Idempotency-Key')
})
