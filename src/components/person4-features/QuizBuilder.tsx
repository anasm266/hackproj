// ============================================
// PERSON 4: QUIZ BUILDER COMPONENT
// ============================================

import React, { useState } from 'react';
import type { Topic, QuestionType, ClaudeQuizRequest } from '../../types';

interface QuizBuilderProps {
  courseId: string;
  topics: Topic[];
  onQuizGenerated: (quizId: string) => void;
}

/**
 * PERSON 4: Quiz builder dialog/modal
 *
 * Features needed:
 * - Topic selector (checkboxes, allow 1-20)
 * - Difficulty selector (intro/intermediate/exam-level)
 * - Question count input
 * - Question type toggles (MCQ/short/mix)
 * - Generate button → calls Claude API
 * - Loading state
 */
export function QuizBuilder({
  courseId,
  topics,
  onQuizGenerated,
}: QuizBuilderProps) {
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'intro' | 'intermediate' | 'exam-level'>('intermediate');
  const [questionCount, setQuestionCount] = useState(10);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(['mcq']);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleTopicToggle = (topicId: string) => {
    if (selectedTopicIds.includes(topicId)) {
      setSelectedTopicIds(selectedTopicIds.filter((id) => id !== topicId));
    } else if (selectedTopicIds.length < 20) {
      setSelectedTopicIds([...selectedTopicIds, topicId]);
    }
  };

  const handleTypeToggle = (type: QuestionType) => {
    if (questionTypes.includes(type)) {
      if (questionTypes.length > 1) {
        setQuestionTypes(questionTypes.filter((t) => t !== type));
      }
    } else {
      setQuestionTypes([...questionTypes, type]);
    }
  };

  const handleGenerate = async () => {
    if (selectedTopicIds.length === 0) return;

    setIsGenerating(true);

    // TODO: Call Claude API to generate quiz
    // This will be implemented by Person 2
    const request: ClaudeQuizRequest = {
      topicIds: selectedTopicIds,
      difficulty,
      questionCount,
      questionTypes,
      courseContext: '', // Add course context
    };

    console.log('Generating quiz with:', request);

    // Placeholder
    setTimeout(() => {
      setIsGenerating(false);
      // onQuizGenerated('quiz-id');
    }, 2000);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Quiz</h2>

      {/* Topic Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Topics (1-20)
        </label>
        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md p-3">
          <div className="space-y-2">
            {topics.map((topic) => (
              <label
                key={topic.id}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedTopicIds.includes(topic.id)}
                  onChange={() => handleTopicToggle(topic.id)}
                  disabled={
                    !selectedTopicIds.includes(topic.id) &&
                    selectedTopicIds.length >= 20
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{topic.title}</span>
              </label>
            ))}
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {selectedTopicIds.length} / 20 topics selected
        </p>
      </div>

      {/* Difficulty */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Difficulty
        </label>
        <div className="flex gap-2">
          {(['intro', 'intermediate', 'exam-level'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setDifficulty(level)}
              className={`px-4 py-2 rounded-md font-medium ${
                difficulty === level
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Question Count */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Questions
        </label>
        <input
          type="number"
          min="1"
          max="50"
          value={questionCount}
          onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Question Types */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question Types
        </label>
        <div className="flex gap-2">
          {(['mcq', 'short-answer', 'true-false'] as const).map((type) => (
            <button
              key={type}
              onClick={() => handleTypeToggle(type)}
              className={`px-4 py-2 rounded-md font-medium ${
                questionTypes.includes(type)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type === 'mcq'
                ? 'MCQ'
                : type === 'short-answer'
                ? 'Short Answer'
                : 'True/False'}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={selectedTopicIds.length === 0 || isGenerating}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
      >
        {isGenerating ? 'Generating Quiz...' : 'Generate Quiz'}
      </button>
    </div>
  );
}
