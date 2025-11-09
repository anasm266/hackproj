import clsx from 'clsx'

/**
 * Reusable Card component
 */
export default function Card({ children, className, hoverable = false, ...props }) {
  return (
    <div
      className={clsx(
        'card',
        hoverable && 'hover:shadow-md transition-shadow cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }) {
  return <div className={clsx('mb-4', className)}>{children}</div>
}

export function CardTitle({ children, className }) {
  return <h3 className={clsx('text-xl font-semibold text-gray-900', className)}>{children}</h3>
}

export function CardDescription({ children, className }) {
  return <p className={clsx('text-sm text-gray-600 mt-1', className)}>{children}</p>
}

export function CardContent({ children, className }) {
  return <div className={className}>{children}</div>
}

export function CardFooter({ children, className }) {
  return <div className={clsx('mt-4 pt-4 border-t border-gray-200', className)}>{children}</div>
}
