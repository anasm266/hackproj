import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import Checkbox from '../ui/Checkbox'
import ProgressBar from '../ui/ProgressBar'

/**
 * Collapsible tree component for Topics → Subtopics → Microtopics
 * Person 3's responsibility
 */
export default function TopicTree({
  topics,
  onMicrotopicToggle,
  onNodeSelect,
  selectedNodeId,
  filterExamId,
  filterProjectId,
}) {
  return (
    <div className="space-y-2">
      {topics.map((topic) => (
        <TopicNode
          key={topic.id}
          topic={topic}
          onMicrotopicToggle={onMicrotopicToggle}
          onNodeSelect={onNodeSelect}
          selectedNodeId={selectedNodeId}
          filterExamId={filterExamId}
          filterProjectId={filterProjectId}
        />
      ))}
    </div>
  )
}

function TopicNode({
  topic,
  onMicrotopicToggle,
  onNodeSelect,
  selectedNodeId,
  filterExamId,
  filterProjectId,
}) {
  const [isExpanded, setIsExpanded] = useState(true)

  const handleClick = () => {
    onNodeSelect?.(topic.id, 'topic')
  }

  const isSelected = selectedNodeId === topic.id

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div
        className={clsx(
          'flex items-center gap-3 p-3 cursor-pointer transition-colors',
          isSelected ? 'bg-primary-50 border-l-4 border-l-primary-600' : 'hover:bg-gray-50'
        )}
        onClick={handleClick}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
          className="flex-shrink-0 text-gray-500 hover:text-gray-700"
        >
          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{topic.title}</h3>
          <div className="mt-2">
            <ProgressBar progress={topic.progress} size="sm" />
          </div>
        </div>

        <div className="text-sm font-medium text-primary-600">
          {Math.round(topic.progress)}%
        </div>
      </div>

      {isExpanded && (
        <div className="bg-gray-50 p-3 space-y-2">
          {topic.subtopics.map((subtopic) => (
            <SubtopicNode
              key={subtopic.id}
              subtopic={subtopic}
              topicId={topic.id}
              onMicrotopicToggle={onMicrotopicToggle}
              onNodeSelect={onNodeSelect}
              selectedNodeId={selectedNodeId}
              filterExamId={filterExamId}
              filterProjectId={filterProjectId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SubtopicNode({
  subtopic,
  topicId,
  onMicrotopicToggle,
  onNodeSelect,
  selectedNodeId,
  filterExamId,
  filterProjectId,
}) {
  const [isExpanded, setIsExpanded] = useState(true)

  const handleClick = () => {
    onNodeSelect?.(subtopic.id, 'subtopic')
  }

  const isSelected = selectedNodeId === subtopic.id

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div
        className={clsx(
          'flex items-center gap-3 p-2 cursor-pointer transition-colors',
          isSelected ? 'bg-primary-50 border-l-4 border-l-primary-600' : 'hover:bg-gray-50'
        )}
        onClick={handleClick}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
          className="flex-shrink-0 text-gray-500 hover:text-gray-700"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-800 text-sm">{subtopic.title}</h4>
          <div className="mt-1">
            <ProgressBar progress={subtopic.progress} size="sm" />
          </div>
        </div>

        <div className="text-xs font-medium text-primary-600">
          {Math.round(subtopic.progress)}%
        </div>
      </div>

      {isExpanded && (
        <div className="p-2 space-y-1">
          {subtopic.microtopics.map((microtopic) => {
            // Filter by exam/project if specified
            if (filterExamId && !microtopic.examIds?.includes(filterExamId)) {
              return null
            }
            if (filterProjectId && !microtopic.projectIds?.includes(filterProjectId)) {
              return null
            }

            return (
              <MicrotopicNode
                key={microtopic.id}
                microtopic={microtopic}
                topicId={topicId}
                subtopicId={subtopic.id}
                onToggle={onMicrotopicToggle}
                onSelect={onNodeSelect}
                isSelected={selectedNodeId === microtopic.id}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function MicrotopicNode({
  microtopic,
  topicId,
  subtopicId,
  onToggle,
  onSelect,
  isSelected,
}) {
  const handleToggle = (e) => {
    e.stopPropagation()
    onToggle(topicId, subtopicId, microtopic.id)
  }

  const handleClick = () => {
    onSelect?.(microtopic.id, 'microtopic')
  }

  return (
    <div
      className={clsx(
        'flex items-start gap-2 p-2 rounded hover:bg-gray-50 transition-colors cursor-pointer',
        isSelected && 'bg-primary-50'
      )}
      onClick={handleClick}
    >
      <Checkbox
        checked={microtopic.completed}
        onChange={handleToggle}
      />
      <span
        className={clsx(
          'text-sm flex-1',
          microtopic.completed ? 'text-gray-500 line-through' : 'text-gray-700'
        )}
      >
        {microtopic.title}
      </span>
    </div>
  )
}
