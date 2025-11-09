import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BrainCircuit, Check } from 'lucide-react'
import useStore from '@/lib/store'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Input from '@/components/ui/Input'
import { LoadingScreen } from '@/components/ui/Spinner'
import { generateId } from '@/utils/helpers'

/**
 * Quiz builder - Select topics and generate quiz
 * Person 4's responsibility
 */
export default function QuizBuilder() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const course = useStore((state) => state.courses.find((c) => c.id === courseId))
  const addQuiz = useStore((state) => state.addQuiz)

  const [selectedTopicIds, setSelectedTopicIds] = useState([])
  const [difficulty, setDifficulty] = useState('intermediate')
  const [questionCount, setQuestionCount] = useState(10)
  const [questionTypes, setQuestionTypes] = useState(['mcq', 'short'])
  const [isLoading, setIsLoading] = useState(false)

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600">Course not found</p>
      </div>
    )
  }

  const handleTopicToggle = (topicId) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    )
  }

  const handleQuestionTypeToggle = (type) => {
    if (questionTypes.includes(type)) {
      if (questionTypes.length > 1) {
        setQuestionTypes(questionTypes.filter((t) => t !== type))
      }
    } else {
      setQuestionTypes([...questionTypes, type])
    }
  }

  const handleGenerateQuiz = async () => {
    if (selectedTopicIds.length === 0) {
      alert('Please select at least one topic')
      return
    }

    try {
      setIsLoading(true)

      const selectedTopics = course.topics
        .filter((t) => selectedTopicIds.includes(t.id))
        .map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
        }))

      const response = await fetch('http://localhost:3001/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topics: selectedTopics,
          difficulty,
          questionCount,
          questionTypes,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate quiz')
      }

      const result = await response.json()

      // Create quiz
      const quizId = generateId()
      const quiz = {
        id: quizId,
        courseId,
        topicIds: selectedTopicIds,
        questions: result.questions,
        difficulty,
      }

      addQuiz(quiz)
      navigate(`/course/${courseId}/quiz/${quizId}`)
    } catch (error) {
      console.error('Error generating quiz:', error)
      alert('Failed to generate quiz. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Quiz</h1>
        <p className="text-gray-600">{course.name}</p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Topic Selection */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Select Topics ({selectedTopicIds.length}/20)
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {course.topics.map((topic) => (
                <Checkbox
                  key={topic.id}
                  label={topic.title}
                  checked={selectedTopicIds.includes(topic.id)}
                  onChange={() => handleTopicToggle(topic.id)}
                  disabled={
                    selectedTopicIds.length >= 20 && !selectedTopicIds.includes(topic.id)
                  }
                />
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Difficulty</h2>
            <div className="flex gap-3">
              {['intro', 'intermediate', 'exam'].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                    difficulty === level
                      ? 'border-primary-600 bg-primary-50 text-primary-900'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div>
            <Input
              label="Number of Questions"
              type="number"
              min={5}
              max={50}
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
            />
          </div>

          {/* Question Types */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Question Types</h2>
            <div className="space-y-2">
              <Checkbox
                label="Multiple Choice"
                checked={questionTypes.includes('mcq')}
                onChange={() => handleQuestionTypeToggle('mcq')}
              />
              <Checkbox
                label="Short Answer"
                checked={questionTypes.includes('short')}
                onChange={() => handleQuestionTypeToggle('short')}
              />
            </div>
          </div>

          {/* Generate Button */}
          <Button
            variant="success"
            className="w-full"
            onClick={handleGenerateQuiz}
            disabled={selectedTopicIds.length === 0}
            icon={<BrainCircuit className="w-5 h-5" />}
          >
            Generate Quiz
          </Button>
        </div>
      </div>

      {isLoading && <LoadingScreen message="Generating quiz questions..." />}
    </div>
  )
}
