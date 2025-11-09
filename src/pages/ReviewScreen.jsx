import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Edit2, Check } from 'lucide-react'
import useStore from '@/lib/store'
import Button from '@/components/ui/Button'
import TopicTree from '@/components/features/TopicTree'
import Alert from '@/components/ui/Alert'

/**
 * Review screen for study map draft
 * Shows parsed data and allows editing before accepting
 * Person 1's responsibility
 */
export default function ReviewScreen() {
  const navigate = useNavigate()
  const { courseId } = useParams()
  const updateCourse = useStore((state) => state.updateCourse)
  const course = useStore((state) => state.courses.find((c) => c.id === courseId))

  const [selectedNodeId, setSelectedNodeId] = useState(null)

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600">Course not found</p>
      </div>
    )
  }

  const handleAccept = () => {
    updateCourse(courseId, { status: 'active' })
    navigate(`/course/${courseId}`)
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Review Study Map: {course.name}
        </h1>
        <p className="text-gray-600">
          Review the AI-generated study map. You can accept it as-is or make edits.
        </p>
      </div>

      <Alert
        type="info"
        message="This is a draft of your study map. Review the topics, subtopics, and microtopics below. When ready, click Accept to start using your course planner."
        className="mb-6"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Topic Tree */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Study Map Structure</h2>
              <Button variant="outline" size="sm" icon={<Edit2 className="w-4 h-4" />}>
                Edit
              </Button>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              <TopicTree
                topics={course.topics}
                onNodeSelect={handleNodeSelect}
                selectedNodeId={selectedNodeId}
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
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    {selectedNode.type}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 mt-1">
                    {selectedNode.data.title}
                  </h3>
                </div>

                {selectedNode.data.description && (
                  <p className="text-sm text-gray-600 mb-4">{selectedNode.data.description}</p>
                )}

                {selectedNode.type === 'microtopic' && (
                  <div className="space-y-2">
                    {selectedNode.data.examIds?.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-500">Related Exams:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedNode.data.examIds.map((id) => {
                            const exam = course.deadlines.find((d) => d.id === id)
                            return (
                              <span
                                key={id}
                                className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded"
                              >
                                {exam?.title || id}
                              </span>
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
                              <span
                                key={id}
                                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                              >
                                {project?.title || id}
                              </span>
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

          <Button
            variant="success"
            className="w-full mt-4"
            onClick={handleAccept}
            icon={<Check className="w-5 h-5" />}
          >
            Accept & Start Learning
          </Button>
        </div>
      </div>
    </div>
  )
}
