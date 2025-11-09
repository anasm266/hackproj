import { Calendar, Clock, AlertCircle } from 'lucide-react'
import { formatDate, getRelativeTime, isOverdue, isUpcoming, getDeadlineTypeColor } from '@/utils/helpers'
import Badge from '../ui/Badge'
import clsx from 'clsx'

/**
 * Deadline display card
 * Person 4's responsibility
 */
export default function DeadlineCard({ deadline, onClick, compact = false }) {
  const overdue = isOverdue(deadline.dueDate)
  const upcoming = isUpcoming(deadline.dueDate)

  if (compact) {
    return (
      <div
        onClick={onClick}
        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <div className={clsx(
          'w-2 h-full rounded-full',
          overdue ? 'bg-red-500' : upcoming ? 'bg-yellow-500' : 'bg-gray-300'
        )} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900">{deadline.title}</h4>
            <Badge variant={getDeadlineTypeColor(deadline.type)}>
              {deadline.type}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">
            {formatDate(deadline.dueDate)} • {getRelativeTime(deadline.dueDate)}
          </p>
        </div>

        {overdue && <AlertCircle className="w-5 h-5 text-red-500" />}
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={clsx(
        'border-l-4 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer',
        overdue
          ? 'border-l-red-500'
          : upcoming
          ? 'border-l-yellow-500'
          : 'border-l-gray-300'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">{deadline.title}</h3>
          <Badge variant={getDeadlineTypeColor(deadline.type)}>
            {deadline.type}
          </Badge>
        </div>
        {overdue && (
          <div className="flex items-center gap-1 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Overdue</span>
          </div>
        )}
      </div>

      {deadline.description && (
        <p className="text-sm text-gray-600 mb-3">{deadline.description}</p>
      )}

      {deadline.scope && (
        <div className="bg-gray-50 rounded p-3 mb-3">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Scope:</span> {deadline.scope}
          </p>
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(deadline.dueDate)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{getRelativeTime(deadline.dueDate)}</span>
        </div>
      </div>
    </div>
  )
}
