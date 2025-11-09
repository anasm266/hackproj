/**
 * Generate a unique ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Calculate progress percentage from completed items
 */
export function calculateProgress(total, completed) {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

/**
 * Format date to readable string
 */
export function formatDate(date) {
  if (!(date instanceof Date)) {
    date = new Date(date)
  }

  const options = { month: 'short', day: 'numeric', year: 'numeric' }
  return date.toLocaleDateString('en-US', options)
}

/**
 * Format date with time
 */
export function formatDateTime(date) {
  if (!(date instanceof Date)) {
    date = new Date(date)
  }

  const dateStr = formatDate(date)
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  return `${dateStr} at ${timeStr}`
}

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours")
 */
export function getRelativeTime(date) {
  if (!(date instanceof Date)) {
    date = new Date(date)
  }

  const now = new Date()
  const diffMs = date - now
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffDays > 0) {
    return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`
  } else if (diffDays < 0) {
    return `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} ago`
  } else if (diffHours > 0) {
    return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`
  } else if (diffHours < 0) {
    return `${Math.abs(diffHours)} hour${Math.abs(diffHours) > 1 ? 's' : ''} ago`
  } else if (diffMinutes > 0) {
    return `in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`
  } else if (diffMinutes < 0) {
    return `${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) > 1 ? 's' : ''} ago`
  } else {
    return 'just now'
  }
}

/**
 * Check if a deadline is upcoming (within 7 days)
 */
export function isUpcoming(date) {
  if (!(date instanceof Date)) {
    date = new Date(date)
  }

  const now = new Date()
  const diffMs = date - now
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  return diffDays >= 0 && diffDays <= 7
}

/**
 * Check if a deadline is overdue
 */
export function isOverdue(date) {
  if (!(date instanceof Date)) {
    date = new Date(date)
  }

  return date < new Date()
}

/**
 * Sort deadlines by date
 */
export function sortDeadlines(deadlines) {
  return [...deadlines].sort((a, b) => {
    const dateA = a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate)
    const dateB = b.dueDate instanceof Date ? b.dueDate : new Date(b.dueDate)
    return dateA - dateB
  })
}

/**
 * Get deadline type badge color
 */
export function getDeadlineTypeColor(type) {
  switch (type) {
    case 'exam':
      return 'danger'
    case 'assignment':
      return 'warning'
    case 'project':
      return 'primary'
    default:
      return 'secondary'
  }
}

/**
 * Get resource type icon name
 */
export function getResourceTypeIcon(type) {
  switch (type) {
    case 'video':
      return 'Video'
    case 'article':
      return 'FileText'
    case 'docs':
      return 'Book'
    case 'tutorial':
      return 'GraduationCap'
    default:
      return 'Link'
  }
}

/**
 * Format duration in minutes to readable string
 */
export function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (mins === 0) {
    return `${hours}h`
  }

  return `${hours}h ${mins}m`
}

/**
 * Extract video ID from YouTube URL
 */
export function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

/**
 * Get YouTube thumbnail URL
 */
export function getYouTubeThumbnail(videoId) {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
}

/**
 * Flatten topic tree to get all microtopics
 */
export function getAllMicrotopics(topics) {
  const microtopics = []

  topics.forEach((topic) => {
    topic.subtopics.forEach((subtopic) => {
      subtopic.microtopics.forEach((micro) => {
        microtopics.push({
          ...micro,
          topicId: topic.id,
          topicTitle: topic.title,
          subtopicId: subtopic.id,
          subtopicTitle: subtopic.title,
        })
      })
    })
  })

  return microtopics
}

/**
 * Filter topics by exam or project
 */
export function filterTopicsByDeadline(topics, deadlineId) {
  return topics
    .map((topic) => ({
      ...topic,
      subtopics: topic.subtopics
        .map((subtopic) => ({
          ...subtopic,
          microtopics: subtopic.microtopics.filter(
            (micro) =>
              micro.examIds?.includes(deadlineId) ||
              micro.projectIds?.includes(deadlineId)
          ),
        }))
        .filter((subtopic) => subtopic.microtopics.length > 0),
    }))
    .filter((topic) => topic.subtopics.length > 0)
}

/**
 * Get completion stats for a course
 */
export function getCompletionStats(course) {
  const allMicrotopics = getAllMicrotopics(course.topics)
  const completed = allMicrotopics.filter((m) => m.completed).length
  const total = allMicrotopics.length

  return {
    completed,
    total,
    percentage: calculateProgress(total, completed),
  }
}

/**
 * Validate course form data
 */
export function validateCourseForm(data) {
  const errors = {}

  if (!data.name || data.name.trim() === '') {
    errors.name = 'Course name is required'
  }

  if (!data.files || data.files.length === 0) {
    errors.files = 'At least one syllabus file is required'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Download text as file
 */
export function downloadAsFile(content, filename, type = 'text/plain') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy:', error)
    return false
  }
}
