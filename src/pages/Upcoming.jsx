import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, Plus } from 'lucide-react'
import useStore from '@/lib/store'
import DeadlineCard from '@/components/features/DeadlineCard'
import Button from '@/components/ui/Button'
import { sortDeadlines, formatDate } from '@/utils/helpers'

/**
 * Upcoming deadlines page
 * Person 4's responsibility
 */
export default function Upcoming() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const course = useStore((state) => state.courses.find((c) => c.id === courseId))

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600">Course not found</p>
      </div>
    )
  }

  const handleDeadlineClick = (deadline) => {
    // Navigate to course map filtered by this deadline
    navigate(`/course/${courseId}?deadline=${deadline.id}`)
  }

  const sortedDeadlines = sortDeadlines(course.deadlines || [])

  // Group by status
  const now = new Date()
  const upcoming = sortedDeadlines.filter((d) => new Date(d.dueDate) > now)
  const past = sortedDeadlines.filter((d) => new Date(d.dueDate) <= now)

  if (sortedDeadlines.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Upcoming Deadlines</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Deadlines Found</h2>
          <p className="text-gray-600 mb-6">
            No deadlines were found in your syllabus. You can add them manually.
          </p>
          <Button variant="outline" icon={<Plus className="w-5 h-5" />}>
            Add Deadline
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upcoming Deadlines</h1>
        <p className="text-gray-600">{course.name}</p>
      </div>

      {/* Upcoming Deadlines */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming</h2>
          <div className="space-y-4">
            {upcoming.map((deadline) => (
              <DeadlineCard
                key={deadline.id}
                deadline={deadline}
                onClick={() => handleDeadlineClick(deadline)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Deadlines */}
      {past.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Past</h2>
          <div className="space-y-4 opacity-60">
            {past.map((deadline) => (
              <DeadlineCard
                key={deadline.id}
                deadline={deadline}
                onClick={() => handleDeadlineClick(deadline)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
