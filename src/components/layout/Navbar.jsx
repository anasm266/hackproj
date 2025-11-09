import { Link, useNavigate, useParams } from 'react-router-dom'
import { Home, Calendar, BookOpen, BrainCircuit } from 'lucide-react'
import useStore from '@/lib/store'

/**
 * Navigation bar component
 * Person 1's responsibility
 */
export default function Navbar() {
  const navigate = useNavigate()
  const { courseId } = useParams()
  const currentCourse = useStore((state) =>
    state.courses.find((c) => c.id === courseId)
  )

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <BrainCircuit className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">StudyMap</span>
          </Link>

          {/* Course-specific navigation */}
          {courseId && currentCourse && (
            <div className="flex items-center gap-6">
              <Link
                to={`/course/${courseId}`}
                className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                <span className="font-medium">Course Map</span>
              </Link>

              <Link
                to={`/course/${courseId}/upcoming`}
                className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <Calendar className="w-5 h-5" />
                <span className="font-medium">Upcoming</span>
              </Link>

              <div className="text-sm text-gray-600">
                {currentCourse.name}
              </div>
            </div>
          )}

          {/* Right side */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
