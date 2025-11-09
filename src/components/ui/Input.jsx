import clsx from 'clsx'

/**
 * Reusable Input component
 */
export default function Input({
  label,
  error,
  helperText,
  className,
  containerClassName,
  ...props
}) {
  return (
    <div className={containerClassName}>
      {label && <label className="label">{label}</label>}
      <input
        className={clsx(
          'input',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  )
}

export function TextArea({
  label,
  error,
  helperText,
  className,
  containerClassName,
  rows = 4,
  ...props
}) {
  return (
    <div className={containerClassName}>
      {label && <label className="label">{label}</label>}
      <textarea
        rows={rows}
        className={clsx(
          'input resize-none',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  )
}
