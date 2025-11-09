import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Search, Loader } from 'lucide-react'
import useStore from '@/lib/store'
import ResourceCard from '@/components/features/ResourceCard'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'

/**
 * Resources page for a specific topic
 * Person 4's responsibility
 */
export default function Resources() {
  const { courseId, topicId } = useParams()
  const course = useStore((state) => state.courses.find((c) => c.id === courseId))
  const addResources = useStore((state) => state.addResources)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Find the topic
  const topic = course?.topics.find((t) => t.id === topicId)
  const resources = course?.resources[topicId] || []

  useEffect(() => {
    // Auto-fetch resources if none exist
    if (topic && resources.length === 0) {
      handleFindResources()
    }
  }, [topicId])

  const handleFindResources = async () => {
    if (!topic) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('http://localhost:3001/api/find-resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicTitle: topic.title,
          topicDescription: topic.description,
          courseName: course.name,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to find resources')
      }

      const data = await response.json()
      addResources(courseId, topicId, data.resources)
    } catch (err) {
      console.error('Error finding resources:', err)
      setError('Failed to find resources. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!course || !topic) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600">Topic not found</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Resources</h1>
        <p className="text-gray-600">
          {course.name} • {topic.title}
        </p>
      </div>

      {topic.description && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">About This Topic</h2>
          <p className="text-gray-600">{topic.description}</p>
        </div>
      )}

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} className="mb-6" />
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Loader className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Finding the best learning resources for you...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Resources Found</h2>
          <p className="text-gray-600 mb-6">
            We couldn't find any trusted resources for this topic. Try finding more.
          </p>
          <Button
            variant="primary"
            onClick={handleFindResources}
            icon={<Search className="w-5 h-5" />}
          >
            Find Resources
          </Button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {resources.length} Resource(s) Found
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFindResources}
              icon={<Search className="w-4 h-4" />}
              disabled={isLoading}
            >
              Find More
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
