import type { ReactNode } from 'react'
import styles from './Card.module.css'

type Props = { as?: 'section' | 'article'; children: ReactNode }

// A white box with a border. Used for balances, bills and the "open a home" form.
export function Card({ as: Tag = 'section', children }: Props) {
  return <Tag className={styles.card}>{children}</Tag>
}
