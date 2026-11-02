import { useCallback, useEffect, useRef, useState } from 'react'
import { describeError } from './api'

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string; httpStatus: number | null }
  | { status: 'ready'; data: T }

// Loads data for `key` (for example a home id) and tracks loading / error / ready.
// `load` must be a stable function (defined outside components).
export function useLoad<T>(key: string, load: (key: string) => Promise<T>) {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' })
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const latest = useRef(0)

  const run = useCallback(
    async (silent: boolean) => {
      const id = ++latest.current
      if (!silent) {
        setState({ status: 'loading' })
        setRefreshError(null)
      }
      try {
        const data = await load(key)
        if (id !== latest.current) return // a newer request replaced this one
        setState({ status: 'ready', data })
        setRefreshError(null)
      } catch (error) {
        if (id !== latest.current) return
        const { message, status } = describeError(error)
        // A silent refresh keeps showing the old data and only reports the problem.
        if (silent) setRefreshError(message)
        else setState({ status: 'error', message, httpStatus: status })
      }
    },
    [key, load],
  )

  useEffect(() => {
    void run(false)
    return () => {
      latest.current++ // ignore answers that arrive after we left
    }
  }, [run])

  return {
    state,
    refreshError,
    retry: () => run(false), // shows the loading state again
    refresh: () => run(true), // quietly updates in the background
  }
}
