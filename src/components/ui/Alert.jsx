import clsx from 'clsx'
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react'

/**
 * Reusable Alert component
 */
export default function Alert({ type = 'info', title, message, onClose, className }) {
  const typeConfig = {
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      icon: Info,
      iconColor: 'text-blue-500',
    },
    success: {
      bgColor: 'bg-success-50',
      borderColor: 'border-success-200',
      textColor: 'text-success-800',
      icon: CheckCircle,
      iconColor: 'text-success-500',
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      icon: AlertCircle,
      iconColor: 'text-yellow-500',
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      icon: XCircle,
      iconColor: 'text-red-500',
    },
  }

  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <div
      className={clsx(
        'rounded-lg border p-4',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={clsx('w-5 h-5 mt-0.5', config.iconColor)} />
        <div className="flex-1">
          {title && (
            <h4 className={clsx('font-medium mb-1', config.textColor)}>{title}</h4>
          )}
          <p className={clsx('text-sm', config.textColor)}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={clsx('hover:opacity-70 transition-opacity', config.textColor)}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
