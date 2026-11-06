import type { ReactNode } from 'react'
import styles from './Page.module.css'

// The whole screen: theme colors, the wordmark, and a left-aligned column.
export function Page({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <header className={styles.header}>
          <a href="/" className={styles.brand}>
            <span className={styles.mark} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            Bill Splitter
          </a>
        </header>
        <main>{children}</main>
      </div>
    </div>
  )
}
