import { forwardRef } from 'react'
import styles from './Button.module.css'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  loadingLabel?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    loadingLabel = 'Carregando…',
    disabled,
    children,
    className,
    ...rest
  },
  ref,
) {
  const cls = [
    styles.button,
    styles[variant],
    size !== 'md' ? styles[size] : undefined,
    isLoading ? styles.loading : undefined,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      ref={ref}
      className={cls}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...rest}
    >
      {children}
      {isLoading && (
        <span className={styles.spinner} aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </span>
      )}
      {isLoading && <span className="sr-only">{loadingLabel}</span>}
    </button>
  )
})
