import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrainCircuit, CheckCircle, Upload, Zap } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import FileUpload from '@/components/ui/FileUpload'
import Modal from '@/components/ui/Modal'
import { LoadingScreen } from '@/components/ui/Spinner'
import { validateCourseForm, generateId } from '@/utils/helpers'
import useStore from '@/lib/store'

/**
 * Landing page with "Create Course Planner" CTA
 * Person 1's responsibility
 */
export default function Landing() {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  const handleCreateCourse = () => {
    setShowModal(true)
  }

  const handleCourseCreated = (courseId) => {
    navigate(`/course/${courseId}/review`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <BrainCircuit className="w-20 h-20 text-primary-600" />
          </div>

          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Transform Your Syllabus into an
            <span className="text-primary-600"> Interactive Study Map</span>
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Upload your course syllabus and let AI create a structured learning path with
            progress tracking, deadlines, and personalized quizzes.
          </p>

          <Button
            variant="primary"
            size="lg"
            onClick={handleCreateCourse}
            icon={<Upload className="w-5 h-5" />}
          >
            Create Course Planner
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
          <FeatureCard
            icon={<Zap className="w-8 h-8 text-primary-600" />}
            title="AI-Powered Parsing"
            description="Claude extracts topics, deadlines, and exam scopes from your syllabus automatically"
          />
          <FeatureCard
            icon={<CheckCircle className="w-8 h-8 text-success-600" />}
            title="Progress Tracking"
            description="Track completion at microtopic level with visual progress indicators"
          />
          <FeatureCard
            icon={<BrainCircuit className="w-8 h-8 text-purple-600" />}
            title="Smart Quizzes"
            description="Generate custom quizzes on demand for any topic or exam preparation"
          />
        </div>
      </div>

      {/* Create Course Modal */}
      {showModal && (
        <CreateCourseModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onCourseCreated={handleCourseCreated}
          setIsLoading={setIsLoading}
          setLoadingMessage={setLoadingMessage}
        />
      )}

      {/* Loading Screen */}
      {isLoading && <LoadingScreen message={loadingMessage} />}
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function CreateCourseModal({ isOpen, onClose, onCourseCreated, setIsLoading, setLoadingMessage }) {
  const addCourse = useStore((state) => state.addCourse)
  const [formData, setFormData] = useState({
    name: '',
    courseNumber: '',
    term: '',
    files: [],
  })
  const [errors, setErrors] = useState({})

  const handleSubmit = async () => {
    // Validate form
    const validation = validateCourseForm(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    try {
      setIsLoading(true)
      setLoadingMessage('Uploading syllabus...')

      // Create FormData for file upload
      const apiFormData = new FormData()
      apiFormData.append('courseName', formData.name)
      apiFormData.append('courseNumber', formData.courseNumber)
      apiFormData.append('term', formData.term)
      formData.files.forEach((file) => {
        apiFormData.append('files', file)
      })

      setLoadingMessage('Analyzing syllabus with Claude...')

      // Call API
      const response = await fetch('http://localhost:3001/api/parse-syllabus', {
        method: 'POST',
        body: apiFormData,
      })

      if (!response.ok) {
        throw new Error('Failed to parse syllabus')
      }

      const result = await response.json()

      // Create course
      const courseId = generateId()
      const course = {
        id: courseId,
        name: formData.name,
        courseNumber: formData.courseNumber,
        term: formData.term,
        topics: result.topics,
        deadlines: result.deadlines,
        resources: {},
        progress: 0,
        status: 'draft',
      }

      addCourse(course)
      onClose()
      onCourseCreated(courseId)
    } catch (error) {
      console.error('Error creating course:', error)
      alert('Failed to parse syllabus. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Course Planner"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Create Planner
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Course Name *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Data Structures and Algorithms"
          error={errors.name}
        />

        <Input
          label="Course Number"
          value={formData.courseNumber}
          onChange={(e) => setFormData({ ...formData, courseNumber: e.target.value })}
          placeholder="e.g., CS 201"
        />

        <Input
          label="Term"
          value={formData.term}
          onChange={(e) => setFormData({ ...formData, term: e.target.value })}
          placeholder="e.g., Fall 2025"
        />

        <FileUpload
          label="Upload Syllabus (PDF) *"
          accept=".pdf"
          multiple
          files={formData.files}
          onChange={(files) => setFormData({ ...formData, files })}
          error={errors.files}
        />
      </div>
    </Modal>
  )
}
