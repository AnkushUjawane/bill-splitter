import type { ReactNode } from 'react'
import styles from './Page.module.css'

type Props = { title?: string; children: ReactNode }

// The centered column that holds a whole screen.
export function Page({ title, children }: Props) {
  return (
    <main className={styles.page}>
      <div className={styles.column}>
        {title && <h1 className={styles.title}>{title}</h1>}
        {children}
      </div>
    </main>
  )
}
