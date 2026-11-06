import type { ComponentPropsWithoutRef } from 'react'
import styles from './Button.module.css'

type Props = ComponentPropsWithoutRef<'button'> & {
  // Pick the look of THIS button. Add a new variant by adding a class in Button.module.css.
  variant?: 'primary' | 'secondary' | 'success' | 'danger'
  size?: 'md' | 'sm'
}

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  ...rest
}: Props) {
  const classes = [styles.button, styles[variant], size === 'sm' ? styles.small : '', className]
    .filter(Boolean)
    .join(' ')
  return <button type={type} className={classes} {...rest} />
}
