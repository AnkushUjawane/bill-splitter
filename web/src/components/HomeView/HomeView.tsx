import { Link } from '@tanstack/react-router'
import { getBalances, getBills } from '../../lib/api'
import { useLoad } from '../../lib/useLoad'
import { Balances } from '../Balances/Balances'
import { BillCard } from '../BillCard/BillCard'
import { Button } from '../Button/Button'
import { Notice } from '../Notice/Notice'
import styles from './HomeView.module.css'

export function HomeView({ homeId }: { homeId: string }) {
  const bills = useLoad(homeId, getBills)
  const balances = useLoad(homeId, getBalances)

  // After a payment (or a conflict) we quietly refresh both lists.
  function refreshAll() {
    void bills.refresh()
    void balances.refresh()
  }

  const refreshError = bills.refreshError ?? balances.refreshError
  const state = bills.state

  return (
    <>
      <p className={styles.homeLine}>
        <span>
          Home : <code>{homeId}</code>
        </span>
        <Link to="/" className="choose-btn">
          <Button>Choose another home</Button>
        </Link>
      </p>

      {refreshError && (
        <Notice tone="error" onRetry={refreshAll}>
          Could not refresh the latest data: {refreshError}
        </Notice>
      )}

      <Balances state={balances.state} onRetry={balances.retry} />

      <h2>Bills</h2>
      {state.status === 'loading' && <p role="status">Loading bills…</p>}

      {state.status === 'error' && state.httpStatus === 404 && (
        <Notice tone="error">We could not find that home. Check the ID.</Notice>
      )}
      {state.status === 'error' && state.httpStatus !== 404 && (
        <Notice tone="error" onRetry={bills.retry}>
          Could not load the bills. {state.message}
        </Notice>
      )}

      {state.status === 'ready' && state.data.length === 0 && (
        <Notice>No bills yet for this home.</Notice>
      )}

      {state.status === 'ready' &&
        state.data.map((bill) => <BillCard key={bill.id} bill={bill} onChanged={refreshAll} />)}
    </>
  )
}
