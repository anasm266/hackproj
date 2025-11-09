import clsx from 'clsx'

/**
 * Reusable Spinner component
 */
export default function Spinner({ size = 'md', className }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  }

  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-primary-600 border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  )
}

/**
 * Full page loading spinner
 */
export function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-50">
      <Spinner size="lg" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  )
}
