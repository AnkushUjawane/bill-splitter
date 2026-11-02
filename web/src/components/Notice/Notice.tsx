import type { ReactNode } from 'react'
import { Button } from '../Button/Button'
import styles from './Notice.module.css'

type Props = {
  tone?: 'info' | 'error'
  onRetry?: () => void
  retryLabel?: string
  children: ReactNode
}

// A message box. Errors are announced to screen readers and can offer a retry button.
export function Notice({ tone = 'info', onRetry, retryLabel = 'Try again', children }: Props) {
  const isError = tone === 'error'
  return (
    <div
      className={isError ? `${styles.notice} ${styles.error}` : styles.notice}
      role={isError ? 'alert' : 'status'}
    >
      <p>{children}</p>
      {onRetry && (
        <Button type="button" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
