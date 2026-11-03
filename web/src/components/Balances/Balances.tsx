import type { Balance } from '../../lib/api'
import { formatCents } from '../../lib/format'
import type { LoadState } from '../../lib/useLoad'
import { Card } from '../Card/Card'
import { Notice } from '../Notice/Notice'
import styles from './Balances.module.css'

type Props = { state: LoadState<Balance[]>; onRetry: () => void }

export function Balances({ state, onRetry }: Props) {
  return (
    <Card title="Who owes what">
      {state.status === 'loading' && <p role="status">Loading balances…</p>}
      {state.status === 'error' && (
        <Notice tone="error" onRetry={onRetry}>
          {state.message}
        </Notice>
      )}
      {state.status === 'ready' && state.data.length === 0 && (
        <p className={styles.muted}>This home has no members yet.</p>
      )}
      {state.status === 'ready' && state.data.length > 0 && (
        <ul className={styles.list}>
          {state.data.map((balance) => (
            <li key={balance.memberId} className={styles.row}>
              <span>{balance.name}</span>
              <strong>{formatCents(balance.outstandingCents)}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
