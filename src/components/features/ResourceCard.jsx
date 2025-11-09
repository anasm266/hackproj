import { ExternalLink, Clock } from 'lucide-react'
import { getResourceTypeIcon, formatDuration } from '@/utils/helpers'
import Badge from '../ui/Badge'
import * as Icons from 'lucide-react'

/**
 * Learning resource display card
 * Person 4's responsibility
 */
export default function ResourceCard({ resource }) {
  const iconName = getResourceTypeIcon(resource.type)
  const Icon = Icons[iconName]

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
    >
      {resource.thumbnail && (
        <div className="relative h-48 bg-gray-100">
          <img
            src={resource.thumbnail}
            alt={resource.title}
            className="w-full h-full object-cover"
          />
          {resource.duration && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(resource.duration)}
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h4 className="font-semibold text-gray-900 flex-1">{resource.title}</h4>
          <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Badge variant="primary" className="flex items-center gap-1">
            {Icon && <Icon className="w-3 h-3" />}
            {resource.type}
          </Badge>
          {resource.duration && (
            <span className="text-sm text-gray-600">
              {formatDuration(resource.duration)}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">{resource.summary}</p>
      </div>
    </a>
  )
}
