import type { ReactNode } from 'react'
import styles from './Card.module.css'

type Props = { as?: 'section' | 'article'; title?: string; children: ReactNode }

export function Card({ as: Tag = 'section', title, children }: Props) {
  return (
    <Tag className={styles.card}>
      {title && <h2 className={styles.title}>{title}</h2>}
      {children}
    </Tag>
  )
}
