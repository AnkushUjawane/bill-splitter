import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { getRecentHomes } from '../../lib/recentHomes'
import { Button } from '../Button/Button'
import { CreateHomeForm } from '../CreateHomeForm/CreateHomeForm'
import { OpenHomeForm } from '../OpenHomeForm/OpenHomeForm'
import { SplitBar } from '../SplitBar/SplitBar'
import styles from './Landing.module.css'

// A sample split, only to show what the bars in the app mean.
const SAMPLE = [
  { key: 'a', cents: 34, color: 'var(--member-0)', paid: true },
  { key: 'b', cents: 33, color: 'var(--member-1)', paid: true },
  { key: 'c', cents: 33, color: 'var(--member-2)', paid: false },
]

export function Landing() {
  const [recent] = useState(getRecentHomes)
  const [opening, setOpening] = useState(false)

  return (
    <>
      <section className={styles.hero}>
        <h1 className={styles.title}>Shared bills, split to the cent.</h1>
        <p className={styles.lead}>
          Create a home, add the people you live with, and see who owes what.
        </p>
        <div className={styles.bar}>
          <SplitBar segments={SAMPLE} size="lg" />
        </div>
        <CreateHomeForm />
      </section>

      {recent.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.heading}>Your homes</h2>
          <ul className={styles.homes}>
            {recent.map((home) => (
              <li key={home.id}>
                <Link to="/" search={{ homeId: home.id }} className={styles.homeLink}>
                  {home.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.section}>
        {opening ? (
          <OpenHomeForm onCancel={() => setOpening(false)} />
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setOpening(true)}>
            Open a home with its ID
          </Button>
        )}
      </section>
    </>
  )
}
