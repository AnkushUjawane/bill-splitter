import type { CSSProperties } from 'react'
import styles from './SplitBar.module.css'

export type Segment = { key: string; cents: number; color: string; paid: boolean }

type Props = {
  segments: Segment[]
  // A text description for screen readers. Leave it out when the bar is only decoration.
  label?: string
  size?: 'md' | 'lg'
}

// A bar cut into one piece per person. A piece is solid once that person has paid.
export function SplitBar({ segments, label, size = 'md' }: Props) {
  const className = size === 'lg' ? `${styles.bar} ${styles.large}` : styles.bar
  const pieces = segments
    .filter((segment) => segment.cents > 0)
    .map((segment) => (
      <span
        key={segment.key}
        className={segment.paid ? `${styles.segment} ${styles.paid}` : styles.segment}
        style={{ flexGrow: segment.cents, '--member': segment.color } as CSSProperties}
      />
    ))

  // Decorative bars are hidden from screen readers. Meaningful ones are described.
  if (label === undefined) {
    return (
      <div className={className} aria-hidden="true">
        {pieces}
      </div>
    )
  }
  return (
    <div className={className} role="img" aria-label={label}>
      {pieces}
    </div>
  )
}
