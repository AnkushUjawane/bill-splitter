import type { Context } from 'hono'
import type { z } from 'zod'
import { HttpError } from './errors'

export async function parseBody<Schema extends z.ZodType>(
  c: Context,
  schema: Schema,
): Promise<z.infer<Schema>> {
  let raw: unknown
  try {
    raw = await c.req.json()
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON')
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    const first = result.error.issues[0]
    const field = first?.path.join('.') || 'body'
    throw new HttpError(422, `Invalid ${field}: ${first?.message ?? 'invalid value'}`)
  }
  return result.data
}
