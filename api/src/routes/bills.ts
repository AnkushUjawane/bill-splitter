import { Hono } from 'hono'
import { z } from 'zod'
import { HttpError } from '../errors'
import { parseBody } from '../validate'

// z.number().int() rejects 10.5, "1000" and null. positive() rejects 0 and negatives.
const billBody = z.object({
  title: z
    .string({ error: 'must be text' })
    .trim()
    .min(1, 'must not be empty')
    .max(200, 'must be at most 200 characters'),
  totalCents: z
    .number({ error: 'must be a whole number of cents' })
    .int('must be a whole number of cents')
    .positive('must be greater than 0'),
})

type ShareRow = { id: string; memberId: string; amountCents: number; paidAt: string | null }

export const bills = new Hono<{ Bindings: Env }>()

bills.post('/:homeId/bills', async (c) => {
  const homeId = c.req.param('homeId')
  const { title, totalCents } = await parseBody(c, billBody)
  const billId = crypto.randomUUID()
  const db = c.env.DB

  // db.batch() runs all statements as ONE transaction: all succeed or none do.
  // Members are read inside the same transaction, so the split always uses the
  // exact member list that exists at that moment.
  const [billInsert] = await db.batch([
    // 1) Create the bill, but only if the home exists AND has at least one member.
    db
      .prepare(
        `INSERT INTO bills (id, home_id, title, total_cents)
         SELECT ?1, h.id, ?2, ?3 FROM homes h
         WHERE h.id = ?4 AND EXISTS (SELECT 1 FROM members m WHERE m.home_id = h.id)`,
      )
      .bind(billId, title, totalCents, homeId),

    // 2) Create one share per member, in the order members were added (seq).
    //    base = total / n (rounded down). The first (total % n) members get +1 cent.
    //    Only runs if step 1 created the bill.
    db
      .prepare(
        `INSERT INTO shares (id, bill_id, member_id, amount_cents)
         SELECT lower(hex(randomblob(16))), ?1, id,
                CAST(?2 AS INTEGER) / n + (rn <= CAST(?2 AS INTEGER) % n)
         FROM (
           SELECT id, ROW_NUMBER() OVER (ORDER BY seq) AS rn, COUNT(*) OVER () AS n
           FROM members WHERE home_id = ?3
         )
         WHERE EXISTS (SELECT 1 FROM bills WHERE id = ?1)`,
      )
      .bind(billId, totalCents, homeId),
  ])

  // Nothing inserted: find out why, so we can answer 404 or 422.
  if (billInsert?.meta.changes === 0) {
    const home = await db.prepare('SELECT id FROM homes WHERE id = ?').bind(homeId).first()
    if (!home) throw new HttpError(404, 'Home not found')
    throw new HttpError(422, 'Home has no members')
  }

  const { results } = await db
    .prepare(
      `SELECT id, member_id AS memberId, amount_cents AS amountCents, paid_at AS paidAt
       FROM shares WHERE bill_id = ? ORDER BY seq`,
    )
    .bind(billId)
    .all<ShareRow>()

  return c.json({ id: billId, homeId, title, totalCents, shares: results }, 201)
})

type BillShareRow = {
  billId: string
  title: string
  totalCents: number
  createdAt: string
  shareId: string
  memberId: string
  memberName: string
  amountCents: number
  paidAt: string | null
}

type BillWithShares = {
  id: string
  homeId: string
  title: string
  totalCents: number
  createdAt: string
  shares: {
    id: string
    memberId: string
    memberName: string
    amountCents: number
    paidAt: string | null
  }[]
}

// Lists the bills of a home, newest first, each with its shares (in member order).
// The web page needs this to show bills. It also gets the home's name for the page title,
// and each share carries the member's name, so no second request is needed.
bills.get('/:homeId/bills', async (c) => {
  const homeId = c.req.param('homeId')
  const db = c.env.DB

  // One batch = one consistent snapshot for the home check and the bill rows.
  const [home, rows] = await db.batch<{ id: string; name: string } | BillShareRow>([
    db.prepare('SELECT id, name FROM homes WHERE id = ?').bind(homeId),
    db
      .prepare(
        `SELECT b.id AS billId, b.title AS title, b.total_cents AS totalCents,
                b.created_at AS createdAt, s.id AS shareId, s.member_id AS memberId,
                m.name AS memberName, s.amount_cents AS amountCents, s.paid_at AS paidAt
         FROM bills b
         JOIN shares s ON s.bill_id = b.id
         JOIN members m ON m.id = s.member_id
         WHERE b.home_id = ?
         ORDER BY b.seq DESC, s.seq`,
      )
      .bind(homeId),
  ])

  const homeRow = home?.results[0] as { id: string; name: string } | undefined
  if (!homeRow) throw new HttpError(404, 'Home not found')

  // The rows are flat (one per share). Group them back into bills, keeping order.
  const grouped = new Map<string, BillWithShares>()
  for (const row of (rows?.results ?? []) as BillShareRow[]) {
    let bill = grouped.get(row.billId)
    if (!bill) {
      bill = {
        id: row.billId,
        homeId,
        title: row.title,
        totalCents: row.totalCents,
        createdAt: row.createdAt,
        shares: [],
      }
      grouped.set(row.billId, bill)
    }
    bill.shares.push({
      id: row.shareId,
      memberId: row.memberId,
      memberName: row.memberName,
      amountCents: row.amountCents,
      paidAt: row.paidAt,
    })
  }

  return c.json({ home: { id: homeRow.id, name: homeRow.name }, bills: [...grouped.values()] })
})
