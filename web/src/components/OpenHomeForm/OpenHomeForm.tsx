import { useNavigate } from '@tanstack/react-router'
import { type FormEvent, useState } from 'react'
import { Card } from '../Card/Card'
import styles from './OpenHomeForm.module.css'

export function OpenHomeForm() {
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
    <Card>
      <h2 className={styles.title}>Open a home</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label htmlFor="home-id" className={styles.hidden}>
          Home ID
        </label>
        <input
          id="home-id"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Paste a home ID"
          autoComplete="off"
        />
        <button type="submit">Open</button>
      </form>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <details className={styles.help}>
        <summary>How do I get a home ID?</summary>
        <p>With the API running, create a home, add members, then add a bill:</p>
        <pre className={styles.code}>{`curl -X POST localhost:8787/api/homes \\
  -H 'content-type: application/json' -d '{"name":"Flat"}'

curl -X POST localhost:8787/api/homes/HOME_ID/members \\
  -H 'content-type: application/json' -d '{"name":"Asha"}'

curl -X POST localhost:8787/api/homes/HOME_ID/bills \\
  -H 'content-type: application/json' \\
  -d '{"title":"Electricity","totalCents":1000}'`}</pre>
      </details>
    </Card>
  )
}
