import { Hono } from 'hono'
import { HttpError } from '../errors'

type Balance = { memberId: string; name: string; outstandingCents: number }

export const balances = new Hono<{ Bindings: Env }>()

balances.get('/:homeId/balances', async (c) => {
  const homeId = c.req.param('homeId')
  const db = c.env.DB

  // Both queries run in one batch, so they see the same snapshot of the data.
  const [home, rows] = await db.batch<{ id: string } | Balance>([
    db.prepare('SELECT id FROM homes WHERE id = ?').bind(homeId),
    // LEFT JOIN keeps members who owe nothing. Only unpaid shares are added up.
    db
      .prepare(
        `SELECT m.id AS memberId, m.name AS name,
                COALESCE(SUM(s.amount_cents), 0) AS outstandingCents
         FROM members m
         LEFT JOIN shares s ON s.member_id = m.id AND s.paid_at IS NULL
         WHERE m.home_id = ?
         GROUP BY m.id
         ORDER BY m.seq`,
      )
      .bind(homeId),
  ])

  if (!home?.results.length) throw new HttpError(404, 'Home not found')

  return c.json({ balances: rows?.results ?? [] })
})
