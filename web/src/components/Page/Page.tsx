import type { ReactNode } from 'react'
import styles from './Page.module.css'

// The centered column that holds a whole screen.
export function Page({ children }: { children: ReactNode }) {
  return <main className={styles.page}>{children}</main>
}
