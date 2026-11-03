import { type FormEvent, useState } from 'react'
import { addMember } from '../../lib/api'
import { useAction } from '../../lib/useAction'
import { Button } from '../Button/Button'
import { Card } from '../Card/Card'
import { Notice } from '../Notice/Notice'
import { TextField } from '../TextField/TextField'
import styles from './AddMemberForm.module.css'

type Props = { homeId: string; onAdded: () => void }

export function AddMemberForm({ homeId, onAdded }: Props) {
  const [name, setName] = useState('')
  const action = useAction()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const ok = await action.run(() => addMember(homeId, name))
    if (ok) {
      setName('')
      onAdded()
    }
  }

  return (
    <Card title="Add a member">
      <form onSubmit={handleSubmit} className={styles.form}>
        <TextField label="Name" value={name} onChange={setName} placeholder="For example: Asha" />
        <Button type="submit" disabled={action.pending}>
          {action.pending ? 'Adding…' : 'Add member'}
        </Button>
      </form>
      {action.error && <Notice tone="error">{action.error}</Notice>}
    </Card>
  )
}
