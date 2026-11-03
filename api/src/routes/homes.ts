import { Hono } from 'hono'
import { z } from 'zod'
import { HttpError } from '../errors'
import { parseBody } from '../validate'

const nameBody = z.object({
  name: z
    .string({ error: 'must be text' })
    .trim()
    .min(1, 'must not be empty')
    .max(100, 'must be at most 100 characters'),
})

export const homes = new Hono<{ Bindings: Env }>()

homes.post('/', async (c) => {
  const { name } = await parseBody(c, nameBody)
  const id = crypto.randomUUID()

  await c.env.DB.prepare('INSERT INTO homes (id, name) VALUES (?, ?)').bind(id, name).run()

  return c.json({ id, name }, 201)
})

homes.post('/:homeId/members', async (c) => {
  const homeId = c.req.param('homeId')
  const { name } = await parseBody(c, nameBody)
  const id = crypto.randomUUID()

  const result = await c.env.DB.prepare(
    'INSERT INTO members (id, home_id, name) SELECT ?, id, ? FROM homes WHERE id = ?',
  )
    .bind(id, name, homeId)
    .run()

  if (result.meta.changes === 0) throw new HttpError(404, 'Home not found')

  return c.json({ id, homeId, name }, 201)
})
