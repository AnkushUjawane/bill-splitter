import { type ComponentPropsWithoutRef, useId } from 'react'
import styles from './TextField.module.css'

type Props = Omit<ComponentPropsWithoutRef<'input'>, 'id' | 'onChange'> & {
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
}

// A label, a text box, and an optional hint line under it.
export function TextField({ label, hint, onChange, ...inputProps }: Props) {
  const id = useId()
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        className={styles.input}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        {...inputProps}
      />
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  )
}
