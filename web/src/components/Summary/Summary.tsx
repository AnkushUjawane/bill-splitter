import { type CSSProperties, useState } from 'react'
import type { Balance } from '../../lib/api'
import { memberColor } from '../../lib/colors'
import type { LoadState } from '../../lib/useLoad'
import { Button } from '../Button/Button'
import { Money } from '../Money/Money'
import { Notice } from '../Notice/Notice'
import styles from './Summary.module.css'

type Props = {
  homeId: string
  homeName: string | null
  balances: LoadState<Balance[]>
  billCount: number | null
  onRetry: () => void
}

function CopyHomeId({ id }: { id: string }) {
  const [label, setLabel] = useState('Copy home ID')

  async function copy() {
    try {
      await navigator.clipboard.writeText(id)
      setLabel('Copied')
    } catch {
      setLabel('Could not copy')
    }
    setTimeout(() => setLabel('Copy home ID'), 2000)
  }

  return (
    <Button variant="secondary" size="sm" onClick={copy}>
      {label}
    </Button>
  )
}

function Ready({ balances, billCount }: { balances: Balance[]; billCount: number | null }) {
  const people = balances.length
  const total = balances.reduce((sum, balance) => sum + balance.outstandingCents, 0)

  if (people === 0) {
    return (
      <p className={styles.headline}>
        Add the people who live here, then split a bill between them.
      </p>
    )
  }

  return (
    <>
      {total > 0 ? (
        <>
          <Money cents={total} size="hero" />
          <p className={styles.caption}>still to pay in total</p>
        </>
      ) : (
        <p className={styles.headline}>
          {billCount ? 'Everyone is paid up.' : 'Nothing to pay right now.'}
        </p>
      )}

      <ul className={styles.tiles}>
        {balances.map((balance, index) => (
          <li
            key={balance.memberId}
            className={styles.tile}
            style={{ '--member': memberColor(index) } as CSSProperties}
          >
            <span className={styles.name}>{balance.name}</span>
            <Money cents={balance.outstandingCents} size="xl" />
            <span className={styles.note}>
              {balance.outstandingCents > 0 ? 'still to pay' : 'all paid'}
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}

export function Summary({ homeId, homeName, balances, billCount, onRetry }: Props) {
  return (
    <section className={styles.summary}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{homeName ?? 'Your home'}</h1>
        <CopyHomeId id={homeId} />
      </div>

      {balances.status === 'loading' && (
        <p role="status" className={styles.caption}>
          Adding it up…
        </p>
      )}
      {balances.status === 'error' && (
        <Notice tone="error" onRetry={onRetry}>
          {balances.message}
        </Notice>
      )}
      {balances.status === 'ready' && <Ready balances={balances.data} billCount={billCount} />}
    </section>
  )
}
