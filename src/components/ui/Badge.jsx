import clsx from 'clsx'

/**
 * Reusable Badge component
 */
export default function Badge({ children, variant = 'primary', className }) {
  const variantClasses = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    secondary: 'bg-gray-100 text-gray-800',
  }

  return (
    <span className={clsx('badge', variantClasses[variant], className)}>
      {children}
    </span>
  )
}
