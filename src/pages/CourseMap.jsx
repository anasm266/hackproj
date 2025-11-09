import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Filter, Search, BookOpen } from 'lucide-react'
import useStore from '@/lib/store'
import TopicTree from '@/components/features/TopicTree'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ProgressBar from '@/components/ui/ProgressBar'
import Badge from '@/components/ui/Badge'
import { filterTopicsByDeadline } from '@/utils/helpers'

/**
 * Main Course Map page with topic tree and progress tracking
 * Person 3's responsibility (with help from Person 1 for layout)
 */
export default function CourseMap() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const course = useStore((state) => state.courses.find((c) => c.id === courseId))
  const toggleMicrotopic = useStore((state) => state.toggleMicrotopic)

  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDeadlineId, setFilterDeadlineId] = useState(null)

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600">Course not found</p>
      </div>
    )
  }

  const handleMicrotopicToggle = (topicId, subtopicId, microtopicId) => {
    toggleMicrotopic(courseId, topicId, subtopicId, microtopicId)
  }

  const handleNodeSelect = (nodeId, nodeType) => {
    setSelectedNodeId(nodeId)
  }

  const getSelectedNode = () => {
    if (!selectedNodeId) return null

    for (const topic of course.topics) {
      if (topic.id === selectedNodeId) {
        return { type: 'topic', data: topic }
      }

      for (const subtopic of topic.subtopics) {
        if (subtopic.id === selectedNodeId) {
          return { type: 'subtopic', data: subtopic }
        }

        for (const micro of subtopic.microtopics) {
          if (micro.id === selectedNodeId) {
            return { type: 'microtopic', data: micro }
          }
        }
      }
    }

    return null
  }

  const selectedNode = getSelectedNode()

  // Filter topics
  let displayTopics = course.topics
  if (filterDeadlineId) {
    displayTopics = filterTopicsByDeadline(displayTopics, filterDeadlineId)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.name}</h1>
        {(course.courseNumber || course.term) && (
          <p className="text-gray-600">
            {course.courseNumber}
            {course.term && ` • ${course.term}`}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Overall Progress</h2>
          <span className="text-2xl font-bold text-primary-600">
            {Math.round(course.progress)}%
          </span>
        </div>
        <ProgressBar progress={course.progress} size="lg" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Topic Tree */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Controls */}
            <div className="mb-4 space-y-3">
              <Input
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />

              {/* Filter chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-gray-500" />
                <button
                  onClick={() => setFilterDeadlineId(null)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    !filterDeadlineId
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All
                </button>
                {course.deadlines
                  ?.filter((d) => d.type === 'exam')
                  .map((exam) => (
                    <button
                      key={exam.id}
                      onClick={() => setFilterDeadlineId(exam.id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filterDeadlineId === exam.id
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {exam.title}
                    </button>
                  ))}
              </div>
            </div>

            {/* Topic Tree */}
            <div className="max-h-[700px] overflow-y-auto">
              <TopicTree
                topics={displayTopics}
                onMicrotopicToggle={handleMicrotopicToggle}
                onNodeSelect={handleNodeSelect}
                selectedNodeId={selectedNodeId}
                filterExamId={filterDeadlineId}
              />
            </div>
          </div>
        </div>

        {/* Right: Details Panel */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Details</h2>

            {selectedNode ? (
              <div>
                <div className="mb-4">
                  <Badge variant="primary" className="mb-2">
                    {selectedNode.type}
                  </Badge>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedNode.data.title}
                  </h3>
                </div>

                {selectedNode.data.description && (
                  <p className="text-sm text-gray-600 mb-4">{selectedNode.data.description}</p>
                )}

                {selectedNode.type === 'topic' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/course/${courseId}/resources/${selectedNode.data.id}`)}
                    icon={<BookOpen className="w-4 h-4" />}
                    className="w-full"
                  >
                    View Resources
                  </Button>
                )}

                {selectedNode.type === 'microtopic' && (
                  <div className="space-y-2 mt-4">
                    {selectedNode.data.examIds?.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-500">Related Exams:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedNode.data.examIds.map((id) => {
                            const exam = course.deadlines.find((d) => d.id === id)
                            return (
                              <Badge key={id} variant="danger">
                                {exam?.title || id}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {selectedNode.data.projectIds?.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-500">
                          Related Projects:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedNode.data.projectIds.map((id) => {
                            const project = course.deadlines.find((d) => d.id === id)
                            return (
                              <Badge key={id} variant="primary">
                                {project?.title || id}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Select a topic to view details</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
