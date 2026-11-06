import { useNavigate } from '@tanstack/react-router'
import { type FormEvent, useState } from 'react'
import { createHome } from '../../lib/api'
import { useAction } from '../../lib/useAction'
import { Button } from '../Button/Button'
import { Notice } from '../Notice/Notice'
import { TextField } from '../TextField/TextField'
import styles from './CreateHomeForm.module.css'

export function CreateHomeForm() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const action = useAction()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    let homeId = ''
    const ok = await action.run(async () => {
      homeId = (await createHome(name)).id
    })
    // The new home opens right away.
    if (ok) void navigate({ to: '/', search: { homeId } })
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <TextField
          label="Home name"
          value={name}
          onChange={setName}
          placeholder="For example: Flat 4B"
        />
        <Button type="submit" disabled={action.pending}>
          {action.pending ? 'Creating…' : 'Create home'}
        </Button>
      </form>
      {action.error && <Notice tone="error">{action.error}</Notice>}
    </div>
  )
}
