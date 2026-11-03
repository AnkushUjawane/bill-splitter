import { type FormEvent, useState } from 'react'
import { createBill } from '../../lib/api'
import { formatCents } from '../../lib/format'
import { useAction } from '../../lib/useAction'
import { Button } from '../Button/Button'
import { Card } from '../Card/Card'
import { Notice } from '../Notice/Notice'
import { TextField } from '../TextField/TextField'
import styles from './AddBillForm.module.css'

type Props = { homeId: string; onCreated: () => void }

// Shows what the typed amount means in dollars, as a help while typing.
function amountHint(text: string): string {
  const cents = Number(text)
  if (text.trim() !== '' && Number.isInteger(cents) && cents > 0) return `= ${formatCents(cents)}`
  return 'The amount in whole cents. For example, 1000 means $10.00.'
}

export function AddBillForm({ homeId, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const action = useAction()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    // Only the things the server cannot read at all are checked here.
    // Everything else (0, negative, 10.5, no members) is checked by the server,
    // and its message is shown below.
    const totalCents = Number(amount)
    if (amount.trim() === '' || Number.isNaN(totalCents)) {
      action.setError('Enter the amount as a number of cents.')
      return
    }

    const ok = await action.run(() => createBill(homeId, title, totalCents))
    if (ok) {
      setTitle('')
      setAmount('')
      onCreated()
    }
  }

  return (
    <Card title="Add a bill">
      <form onSubmit={handleSubmit} className={styles.form}>
        <TextField
          label="Title"
          value={title}
          onChange={setTitle}
          placeholder="For example: Electricity"
        />
        <TextField
          label="Amount (cents)"
          value={amount}
          onChange={setAmount}
          inputMode="numeric"
          placeholder="1000"
          hint={amountHint(amount)}
        />
        <Button type="submit" disabled={action.pending} className={styles.submit}>
          {action.pending ? 'Adding…' : 'Add bill'}
        </Button>
      </form>
      {action.error && <Notice tone="error">{action.error}</Notice>}
    </Card>
  )
}
