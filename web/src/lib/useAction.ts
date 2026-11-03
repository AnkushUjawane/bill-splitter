import { useState } from 'react'
import { describeError } from './api'

export function useAction() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<void>): Promise<boolean> {
    if (pending) return false
    setPending(true)
    setError(null)
    try {
      await action()
      return true
    } catch (caught) {
      setError(describeError(caught).message)
      return false
    } finally {
      setPending(false)
    }
  }

  return { pending, error, setError, run }
}
