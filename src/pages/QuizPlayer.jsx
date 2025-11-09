import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'
import useStore from '@/lib/store'
import Button from '@/components/ui/Button'
import QuizQuestion from '@/components/features/QuizQuestion'
import ProgressBar from '@/components/ui/ProgressBar'

/**
 * Quiz player - Take quiz and view results
 * Person 4's responsibility
 */
export default function QuizPlayer() {
  const { courseId, quizId } = useParams()
  const navigate = useNavigate()
  const course = useStore((state) => state.courses.find((c) => c.id === courseId))
  const quiz = useStore((state) => state.quizzes.find((q) => q.id === quizId))

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)

  if (!course || !quiz) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600">Quiz not found</p>
      </div>
    )
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1
  const hasAnsweredCurrent = answers[currentQuestion.id] !== undefined

  const handleAnswer = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer,
    })
  }

  const handleNext = () => {
    if (isLastQuestion) {
      setShowResults(true)
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const calculateScore = () => {
    let correct = 0
    quiz.questions.forEach((question) => {
      const userAnswer = answers[question.id]
      if (question.type === 'mcq') {
        if (userAnswer === question.answer) correct++
      } else {
        if (userAnswer?.toLowerCase().trim() === question.answer.toLowerCase().trim()) {
          correct++
        }
      }
    })
    return {
      correct,
      total: quiz.questions.length,
      percentage: Math.round((correct / quiz.questions.length) * 100),
    }
  }

  if (showResults) {
    const score = calculateScore()

    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <CheckCircle className="w-16 h-16 text-success-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
          <p className="text-gray-600 mb-6">Here's how you did:</p>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="text-5xl font-bold text-primary-600 mb-2">{score.percentage}%</div>
            <p className="text-lg text-gray-700">
              {score.correct} out of {score.total} correct
            </p>
          </div>

          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                setShowResults(false)
                setCurrentQuestionIndex(0)
              }}
            >
              Review Answers
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate(`/course/${courseId}`)}
            >
              Back to Course
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/course/${courseId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Course
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </h1>

        <ProgressBar
          progress={((currentQuestionIndex + 1) / quiz.questions.length) * 100}
          showLabel={false}
        />
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
        <QuizQuestion
          question={currentQuestion}
          onAnswer={handleAnswer}
          showResult={false}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Previous
        </Button>

        <span className="text-sm text-gray-600">
          {Object.keys(answers).length} / {quiz.questions.length} answered
        </span>

        <Button
          variant="primary"
          onClick={handleNext}
          disabled={!hasAnsweredCurrent}
          icon={!isLastQuestion && <ArrowRight className="w-4 h-4" />}
        >
          {isLastQuestion ? 'Finish Quiz' : 'Next'}
        </Button>
      </div>
    </div>
  )
}
