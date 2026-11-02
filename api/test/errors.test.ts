import { describe, expect, it, vi } from 'vitest'
import app from '../src/index'

// A fake database that always crashes, to force an unexpected error (a 500).
const brokenEnv = {
  DB: {
    prepare() {
      throw new Error('secret database detail')
    },
    batch() {
      throw new Error('secret database detail')
    },
  },
} as unknown as Env

describe('error responses', () => {
  it('answers an unexpected crash with a safe JSON 500', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await app.request(
      '/api/homes',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Flat' }),
      },
      brokenEnv,
    )

    expect(response.status).toBe(500)
    expect(response.headers.get('content-type')).toContain('application/json')
    const text = await response.text()
    expect(JSON.parse(text)).toEqual({ error: 'Internal server error' })
    expect(text).not.toContain('secret database detail') // internals never reach the client
    expect(log).toHaveBeenCalled() // but we still log them for ourselves
    log.mockRestore()
  })

  it('answers a crash on every kind of route with JSON', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const requests: [string, string][] = [
      ['POST', '/api/homes/h/members'],
      ['POST', '/api/homes/h/bills'],
      ['POST', '/api/bills/b/shares/s/pay'],
      ['GET', '/api/homes/h/balances'],
    ]

    for (const [method, path] of requests) {
      const response = await app.request(
        path,
        {
          method,
          headers: { 'content-type': 'application/json', 'Idempotency-Key': 'k' },
          body:
            method === 'POST'
              ? JSON.stringify({ name: 'x', title: 'x', totalCents: 100 })
              : undefined,
        },
        brokenEnv,
      )
      expect(response.status, `${method} ${path}`).toBe(500)
      expect(await response.json()).toEqual({ error: 'Internal server error' })
    }
    log.mockRestore()
  })

  it('answers unknown routes and wrong methods with a JSON 404', async () => {
    for (const [method, path] of [
      ['GET', '/api/nothing'],
      ['GET', '/api/homes'],
      ['DELETE', '/api/homes/h/members'],
    ] as const) {
      const response = await app.request(path, { method }, brokenEnv)
      expect(response.status, `${method} ${path}`).toBe(404)
      expect(await response.json()).toEqual({ error: 'Route not found' })
    }
  })

  it('answers bad input with a JSON error, never a crash', async () => {
    const response = await app.request(
      '/api/homes',
      { method: 'POST', body: '{ not json' },
      brokenEnv,
    )
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Request body must be valid JSON' })
  })
})
