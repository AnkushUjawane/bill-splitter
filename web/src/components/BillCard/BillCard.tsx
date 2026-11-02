import { useRef, useState } from 'react'
import { type Bill, describeError, payShare, type Share } from '../../lib/api'
import { formatCents, formatDate } from '../../lib/format'
import { Button } from '../Button/Button'
import { Card } from '../Card/Card'
import styles from './BillCard.module.css'

type ShareRowProps = { billId: string; share: Share; onChanged: () => void }

function ShareRow({ billId, share, onChanged }: ShareRowProps) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmedPaidAt, setConfirmedPaidAt] = useState<string | null>(null)
  // One key per share. A retry after a failure reuses it, so it can never pay twice.
  const keyRef = useRef<string | null>(null)

  // We only show "paid" when the server has said so. Nothing is assumed in advance.
  const paidAt = share.paidAt ?? confirmedPaidAt

  async function handlePay() {
    if (pending) return
    setPending(true)
    setError(null)
    keyRef.current ??= crypto.randomUUID()

    try {
      const result = await payShare(billId, share.id, keyRef.current)
      setConfirmedPaidAt(result.paidAt)
      onChanged()
    } catch (caught) {
      const { message, status } = describeError(caught)
      setError(message) // the share stays unpaid
      // 409 / 404 mean our view is out of date, so reload to show the truth.
      if (status === 409 || status === 404) onChanged()
    } finally {
      setPending(false)
    }
  }

  return (
    <li className={styles.share}>
      <div className={styles.row}>
        <span>{share.memberName}</span>
        <span className={styles.actions}>
          <strong>{formatCents(share.amountCents)}</strong>
          {paidAt ? (
            <span className={styles.paid} title={formatDate(paidAt)}>
              Paid
            </span>
          ) : (
            <Button variant="success" onClick={handlePay} disabled={pending}>
              {pending ? 'Paying…' : 'Pay'}
            </Button>
          )}
        </span>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          Payment failed: {error} The share is still unpaid.
        </p>
      )}
    </li>
  )
}

type BillCardProps = { bill: Bill; onChanged: () => void }

export function BillCard({ bill, onChanged }: BillCardProps) {
  return (
    <Card as="article">
      <header className={styles.row}>
        <h3>{bill.title}</h3>
        <strong>{formatCents(bill.totalCents)}</strong>
      </header>
      <p className={styles.date}>{formatDate(bill.createdAt)}</p>
      <ul className={styles.list}>
        {bill.shares.map((share) => (
          <ShareRow key={share.id} billId={bill.id} share={share} onChanged={onChanged} />
        ))}
      </ul>
    </Card>
  )
}
