import { type CSSProperties, useRef, useState } from 'react'
import { type Bill, describeError, payShare, type Share } from '../../lib/api'
import { formatCents, formatDate, formatDay } from '../../lib/format'
import { Button } from '../Button/Button'
import { Money } from '../Money/Money'
import { SplitBar } from '../SplitBar/SplitBar'
import styles from './BillCard.module.css'

type ShareRowProps = { billId: string; share: Share; color: string; onChanged: () => void }

function ShareRow({ billId, share, color, onChanged }: ShareRowProps) {
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
    <li className={styles.share} style={{ '--member': color } as CSSProperties}>
      <div className={styles.shareRow}>
        {/* Filled dot with a tick = paid. Empty ring = still to pay. */}
        <span
          className={paidAt ? `${styles.dot} ${styles.dotPaid}` : styles.dot}
          aria-hidden="true"
        />
        <span className={styles.name}>{share.memberName}</span>
        <Money cents={share.amountCents} />
        <span className={styles.action}>
          {paidAt ? (
            <span className={styles.paid} title={formatDate(paidAt)}>
              Paid
            </span>
          ) : (
            <Button variant="success" size="sm" onClick={handlePay} disabled={pending}>
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

type BillCardProps = { bill: Bill; colorOf: (memberId: string) => string; onChanged: () => void }

export function BillCard({ bill, colorOf, onChanged }: BillCardProps) {
  const paidCount = bill.shares.filter((share) => share.paidAt !== null).length
  const leftCents = bill.shares.reduce(
    (sum, share) => (share.paidAt === null ? sum + share.amountCents : sum),
    0,
  )
  const allPaid = paidCount === bill.shares.length

  return (
    <article className={styles.bill}>
      <header className={styles.head}>
        <div>
          <h3 className={styles.title}>{bill.title}</h3>
          <p className={styles.date}>{formatDay(bill.createdAt)}</p>
        </div>
        <Money cents={bill.totalCents} size="lg" />
      </header>

      <SplitBar
        label={`${paidCount} of ${bill.shares.length} shares paid`}
        segments={bill.shares.map((share) => ({
          key: share.id,
          cents: share.amountCents,
          color: colorOf(share.memberId),
          paid: share.paidAt !== null,
        }))}
      />
      <p className={styles.progress}>
        {allPaid
          ? 'Fully paid'
          : `${paidCount} of ${bill.shares.length} paid, ${formatCents(leftCents)} left`}
      </p>

      <ul className={styles.shares}>
        {bill.shares.map((share) => (
          <ShareRow
            key={share.id}
            billId={bill.id}
            share={share}
            color={colorOf(share.memberId)}
            onChanged={onChanged}
          />
        ))}
      </ul>
    </article>
  )
}
