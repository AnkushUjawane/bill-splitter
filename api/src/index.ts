import { Hono } from 'hono'
import { HttpError } from './errors'
import { homes } from './routes/homes'

const app = new Hono<{ Bindings: Env }>()

app.get('/api/health', (c) => c.json({ status: 'ok' }))
app.route('/api/homes', homes)

app.notFound((c) => c.json({ error: 'Route not found' }, 404))

app.onError((err, c) => {
  if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
