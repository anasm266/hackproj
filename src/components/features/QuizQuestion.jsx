import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import Button from '../ui/Button'
import clsx from 'clsx'

/**
 * Quiz question display and interaction component
 * Person 4's responsibility
 */
export default function QuizQuestion({ question, onAnswer, showResult = false }) {
  const [selectedOption, setSelectedOption] = useState(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = () => {
    const answer = question.type === 'mcq' ? selectedOption : userAnswer
    setIsSubmitted(true)
    onAnswer(question.id, answer)
  }

  const isCorrect = () => {
    if (question.type === 'mcq') {
      return selectedOption === question.answer
    }
    return userAnswer.toLowerCase().trim() === question.answer.toLowerCase().trim()
  }

  const canSubmit = () => {
    if (question.type === 'mcq') {
      return selectedOption !== null
    }
    return userAnswer.trim() !== ''
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{question.question}</h3>
      </div>

      {question.type === 'mcq' && (
        <div className="space-y-3 mb-6">
          {question.options.map((option, index) => {
            const isSelected = selectedOption === option
            const isCorrectOption = option === question.answer
            const showCorrect = showResult && isCorrectOption
            const showIncorrect = showResult && isSelected && !isCorrectOption

            return (
              <button
                key={index}
                onClick={() => !isSubmitted && setSelectedOption(option)}
                disabled={isSubmitted}
                className={clsx(
                  'w-full text-left p-4 rounded-lg border-2 transition-all',
                  isSelected && !showResult && 'border-primary-600 bg-primary-50',
                  !isSelected && !showResult && 'border-gray-200 hover:border-primary-300',
                  showCorrect && 'border-success-600 bg-success-50',
                  showIncorrect && 'border-red-600 bg-red-50',
                  isSubmitted && 'cursor-not-allowed'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={clsx(
                    'font-medium',
                    showCorrect && 'text-success-900',
                    showIncorrect && 'text-red-900'
                  )}>
                    {option}
                  </span>
                  {showCorrect && <CheckCircle className="w-5 h-5 text-success-600" />}
                  {showIncorrect && <XCircle className="w-5 h-5 text-red-600" />}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {question.type === 'short' && (
        <div className="mb-6">
          <textarea
            value={userAnswer}
            onChange={(e) => !isSubmitted && setUserAnswer(e.target.value)}
            disabled={isSubmitted}
            placeholder="Type your answer here..."
            rows={4}
            className={clsx(
              'w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2',
              showResult && isCorrect()
                ? 'border-success-600 bg-success-50'
                : showResult && !isCorrect()
                ? 'border-red-600 bg-red-50'
                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
              isSubmitted && 'cursor-not-allowed'
            )}
          />
        </div>
      )}

      {!isSubmitted && (
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit()}
          className="w-full"
        >
          Submit Answer
        </Button>
      )}

      {showResult && (
        <div className={clsx(
          'mt-6 p-4 rounded-lg',
          isCorrect() ? 'bg-success-50 border border-success-200' : 'bg-red-50 border border-red-200'
        )}>
          <div className="flex items-center gap-2 mb-2">
            {isCorrect() ? (
              <>
                <CheckCircle className="w-5 h-5 text-success-600" />
                <span className="font-semibold text-success-900">Correct!</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-900">Incorrect</span>
              </>
            )}
          </div>

          {!isCorrect() && question.type === 'short' && (
            <p className="text-sm text-red-900 mb-2">
              <span className="font-medium">Correct answer:</span> {question.answer}
            </p>
          )}

          <p className="text-sm text-gray-700">
            <span className="font-medium">Explanation:</span> {question.explanation}
          </p>
        </div>
      )}
    </div>
  )
}
