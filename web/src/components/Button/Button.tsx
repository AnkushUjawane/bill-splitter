import type { ComponentPropsWithoutRef } from 'react'
import styles from './Button.module.css'

type Props = ComponentPropsWithoutRef<'button'> & {
  variant?: 'primary' | 'secondary' | 'success' | 'danger'
}

export function Button({ variant = 'primary', type = 'button', className, ...rest }: Props) {
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(' ')
  return <button type={type} className={classes} {...rest} />
}
