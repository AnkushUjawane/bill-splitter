import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getBalances, getBills } from '../../lib/api'
import { memberColor, NEUTRAL_COLOR } from '../../lib/colors'
import { rememberHome } from '../../lib/recentHomes'
import { useLoad } from '../../lib/useLoad'
import { AddBillForm } from '../AddBillForm/AddBillForm'
import { AddMemberForm } from '../AddMemberForm/AddMemberForm'
import { BillCard } from '../BillCard/BillCard'
import { Button } from '../Button/Button'
import { Notice } from '../Notice/Notice'
import { Summary } from '../Summary/Summary'
import styles from './HomeView.module.css'

export function HomeView({ homeId }: { homeId: string }) {
  const bills = useLoad(homeId, getBills)
  const balances = useLoad(homeId, getBalances)
  const [addingMember, setAddingMember] = useState(false)
  const [addingBill, setAddingBill] = useState(false)

  const billsState = bills.state
  const homeName = billsState.status === 'ready' ? billsState.data.home.name : null

  // Remember this home in the browser, so it shows up on the start page next time.
  useEffect(() => {
    if (homeName) rememberHome({ id: homeId, name: homeName })
  }, [homeId, homeName])

  // After a payment (or a conflict) we quietly refresh both lists.
  function refreshAll() {
    void bills.refresh()
    void balances.refresh()
  }

  // Each member keeps one color everywhere, decided by the order they were added.
  const colors = new Map<string, string>()
  if (balances.state.status === 'ready') {
    balances.state.data.forEach((balance, index) => {
      colors.set(balance.memberId, memberColor(index))
    })
  }
  const colorOf = (memberId: string) => colors.get(memberId) ?? NEUTRAL_COLOR

  const hasNoMembers = balances.state.status === 'ready' && balances.state.data.length === 0
  const refreshError = bills.refreshError ?? balances.refreshError

  // A home that does not exist gets one clear message, not a page of broken parts.
  if (billsState.status === 'error' && billsState.httpStatus === 404) {
    return (
      <div className={styles.missing}>
        <h1 className={styles.heading}>Home not found</h1>
        <Notice tone="error">
          We could not find a home with that ID. Check it, or{' '}
          <Link to="/">go back to the start</Link>.
        </Notice>
      </div>
    )
  }

  return (
    <>
      <Summary
        homeId={homeId}
        homeName={homeName}
        balances={balances.state}
        billCount={billsState.status === 'ready' ? billsState.data.bills.length : null}
        onRetry={balances.retry}
      />

      {refreshError && (
        <Notice tone="error" onRetry={refreshAll}>
          Could not refresh the latest data: {refreshError}
        </Notice>
      )}

      <div className={styles.memberArea}>
        {addingMember ? (
          <AddMemberForm
            homeId={homeId}
            onAdded={() => void balances.refresh()}
            onClose={() => setAddingMember(false)}
          />
        ) : (
          <Button
            variant={hasNoMembers ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setAddingMember(true)}
          >
            Add member
          </Button>
        )}
      </div>

      <div className={styles.billsHeader}>
        <h2 className={styles.heading}>Bills</h2>
        {!addingBill && <Button onClick={() => setAddingBill(true)}>Add bill</Button>}
      </div>

      {addingBill && (
        <AddBillForm
          homeId={homeId}
          onCreated={() => {
            setAddingBill(false)
            refreshAll()
          }}
          onClose={() => setAddingBill(false)}
        />
      )}

      {billsState.status === 'loading' && (
        <p role="status" className={styles.quiet}>
          Loading bills…
        </p>
      )}

      {billsState.status === 'error' && (
        <Notice tone="error" onRetry={bills.retry}>
          Could not load the bills. {billsState.message}
        </Notice>
      )}

      {billsState.status === 'ready' && billsState.data.bills.length === 0 && (
        <Notice>No bills yet. Add one and it splits between everyone in the home.</Notice>
      )}

      {billsState.status === 'ready' &&
        billsState.data.bills.map((bill) => (
          <BillCard key={bill.id} bill={bill} colorOf={colorOf} onChanged={refreshAll} />
        ))}
    </>
  )
}
