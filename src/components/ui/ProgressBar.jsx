import clsx from 'clsx'

/**
 * Reusable ProgressBar component
 */
export default function ProgressBar({ progress, showLabel = false, size = 'md', className }) {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  const percentage = Math.min(Math.max(progress, 0), 100)

  return (
    <div className={className}>
      <div className={clsx('progress-bar', sizeClasses[size])}>
        <div
          className={clsx(
            'progress-fill',
            percentage === 100 && 'bg-success-600'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-600 mt-1 block">
          {Math.round(percentage)}% complete
        </span>
      )}
    </div>
  )
}

/**
 * Circular progress indicator
 */
export function ProgressCircle({ progress, size = 60, strokeWidth = 4, className }) {
  const percentage = Math.min(Math.max(progress, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className={clsx('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={clsx(
            'transition-all duration-300',
            percentage === 100 ? 'text-success-600' : 'text-primary-600'
          )}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xs font-semibold">
        {Math.round(percentage)}%
      </span>
    </div>
  )
}
