import { forwardRef, useId } from 'react'
import styles from './Field.module.css'

export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, id: idProp, required, className, ...rest },
  ref,
) {
  const autoId = useId()
  const id = idProp ?? autoId
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  const describedBy = [error ? errorId : undefined, hint ? hintId : undefined]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`${styles.field}${className ? ` ${className}` : ''}`}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span className={styles.required} aria-hidden="true">*</span>}
      </label>
      <input
        ref={ref}
        id={id}
        required={required}
        aria-required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy || undefined}
        className={styles.input}
        {...rest}
      />
      {hint && !error && (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className={styles.error} role="alert">
          <span aria-hidden="true">⚠</span> {error}
        </span>
      )}
    </div>
  )
})
