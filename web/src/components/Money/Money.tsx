import { formatCents } from '../../lib/format'
import styles from './Money.module.css'

type Props = { cents: number; size?: 'md' | 'lg' | 'xl' | 'hero' }

// An amount of money: big dollars, small cents. Screen readers get the plain "$11.34".
export function Money({ cents, size = 'md' }: Props) {
  const whole = Math.trunc(cents / 100).toLocaleString('en-US')
  const rest = String(Math.abs(cents % 100)).padStart(2, '0')

  return (
    <span className={`${styles.money} ${styles[size]}`}>
      <span aria-hidden="true">
        <span className={styles.symbol}>$</span>
        {whole}
        <span className={styles.cents}>.{rest}</span>
      </span>
      <span className={styles.plain}>{formatCents(cents)}</span>
    </span>
  )
}
