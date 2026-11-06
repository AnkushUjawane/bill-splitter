import { useNavigate } from '@tanstack/react-router'
import { type FormEvent, useState } from 'react'
import { Button } from '../Button/Button'
import { Notice } from '../Notice/Notice'
import { TextField } from '../TextField/TextField'
import styles from './OpenHomeForm.module.css'

export function OpenHomeForm({ onCancel }: { onCancel: () => void }) {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const homeId = value.trim()
    if (!homeId) {
      setError('Enter a home ID.')
      return
    }
    void navigate({ to: '/', search: { homeId } })
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <TextField
          label="Home ID"
          value={value}
          onChange={setValue}
          placeholder="Paste a home ID"
        />
        <div className={styles.buttons}>
          <Button type="submit">Open home</Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  )
}
