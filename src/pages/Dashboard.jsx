import { useNavigate } from 'react-router-dom'
import { Plus, BookOpen, Calendar, Clock } from 'lucide-react'
import useStore from '@/lib/store'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import ProgressBar from '@/components/ui/ProgressBar'
import { formatDate, sortDeadlines } from '@/utils/helpers'

/**
 * Course Dashboard - Shows all courses
 * Person 1's responsibility
 */
export default function Dashboard() {
  const navigate = useNavigate()
  const courses = useStore((state) => state.courses)

  const handleCreateNew = () => {
    navigate('/')
  }

  const handleOpenCourse = (courseId) => {
    navigate(`/course/${courseId}`)
  }

  if (courses.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Courses Yet</h2>
        <p className="text-gray-600 mb-6">
          Get started by creating your first course planner
        </p>
        <Button variant="primary" onClick={handleCreateNew} icon={<Plus className="w-5 h-5" />}>
          Create Course Planner
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-600 mt-1">{courses.length} course(s)</p>
        </div>
        <Button variant="primary" onClick={handleCreateNew} icon={<Plus className="w-5 h-5" />}>
          New Course
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onClick={() => handleOpenCourse(course.id)}
          />
        ))}
      </div>
    </div>
  )
}

function CourseCard({ course, onClick }) {
  const sortedDeadlines = sortDeadlines(course.deadlines || [])
  const nextDeadline = sortedDeadlines.find((d) => new Date(d.dueDate) > new Date())

  return (
    <Card hoverable onClick={onClick}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>{course.name}</CardTitle>
            {course.courseNumber && (
              <CardDescription>
                {course.courseNumber}
                {course.term && ` • ${course.term}`}
              </CardDescription>
            )}
          </div>
          <BookOpen className="w-5 h-5 text-primary-600" />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-medium text-primary-600">
                {Math.round(course.progress)}%
              </span>
            </div>
            <ProgressBar progress={course.progress} />
          </div>

          {/* Next Deadline */}
          {nextDeadline && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                Next: {nextDeadline.title} • {formatDate(nextDeadline.dueDate)}
              </span>
            </div>
          )}

          {/* Last Activity */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Updated {formatDate(course.lastActivity)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
