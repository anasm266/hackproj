// ============================================
// PERSON 3: COLLAPSIBLE TREE COMPONENT
// ============================================

import React, { useState } from 'react';
import type { Topic, Subtopic, Microtopic } from '../../types';

interface StudyMapTreeProps {
  topics: Topic[];
  onToggleCompletion: (microtopicId: string) => void;
  onSelectNode: (nodeId: string, type: 'topic' | 'subtopic' | 'microtopic') => void;
}

/**
 * PERSON 3: Main tree component for study map
 *
 * Features needed:
 * - Collapsible topics → subtopics → microtopics
 * - Checkboxes at microtopic level
 * - Progress pills for each topic/subtopic
 * - Click to select and show details
 */
export function StudyMapTree({
  topics,
  onToggleCompletion,
  onSelectNode,
}: StudyMapTreeProps) {
  return (
    <div className="space-y-2">
      {topics.map((topic) => (
        <TopicNode
          key={topic.id}
          topic={topic}
          onToggleCompletion={onToggleCompletion}
          onSelectNode={onSelectNode}
        />
      ))}
    </div>
  );
}

function TopicNode({
  topic,
  onToggleCompletion,
  onSelectNode,
}: {
  topic: Topic;
  onToggleCompletion: (microtopicId: string) => void;
  onSelectNode: (nodeId: string, type: 'topic' | 'subtopic' | 'microtopic') => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-md">
      {/* Topic header */}
      <div
        className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
        onClick={() => onSelectNode(topic.id, 'topic')}
      >
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          <span className="font-semibold text-gray-900">{topic.title}</span>
        </div>

        {/* Progress pill */}
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
            {topic.progress}%
          </div>
        </div>
      </div>

      {/* Subtopics */}
      {isExpanded && (
        <div className="pl-6 pb-2">
          {topic.subtopics.map((subtopic) => (
            <SubtopicNode
              key={subtopic.id}
              subtopic={subtopic}
              onToggleCompletion={onToggleCompletion}
              onSelectNode={onSelectNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubtopicNode({
  subtopic,
  onToggleCompletion,
  onSelectNode,
}: {
  subtopic: Subtopic;
  onToggleCompletion: (microtopicId: string) => void;
  onSelectNode: (nodeId: string, type: 'topic' | 'subtopic' | 'microtopic') => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-2 border-l-2 border-gray-200 pl-3">
      {/* Subtopic header */}
      <div
        className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer rounded"
        onClick={() => onSelectNode(subtopic.id, 'subtopic')}
      >
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          <span className="font-medium text-gray-800">{subtopic.title}</span>
        </div>

        {/* Progress pill */}
        <div className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
          {subtopic.progress}%
        </div>
      </div>

      {/* Microtopics */}
      {isExpanded && (
        <div className="pl-6 mt-1 space-y-1">
          {subtopic.microtopics.map((microtopic) => (
            <MicrotopicNode
              key={microtopic.id}
              microtopic={microtopic}
              onToggleCompletion={onToggleCompletion}
              onSelectNode={onSelectNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MicrotopicNode({
  microtopic,
  onToggleCompletion,
  onSelectNode,
}: {
  microtopic: Microtopic;
  onToggleCompletion: (microtopicId: string) => void;
  onSelectNode: (nodeId: string, type: 'topic' | 'subtopic' | 'microtopic') => void;
}) {
  return (
    <div
      className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer rounded"
      onClick={() => onSelectNode(microtopic.id, 'microtopic')}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={microtopic.completed}
        onChange={(e) => {
          e.stopPropagation();
          onToggleCompletion(microtopic.id);
        }}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <span
        className={`text-sm ${
          microtopic.completed ? 'line-through text-gray-500' : 'text-gray-700'
        }`}
      >
        {microtopic.title}
      </span>

      {/* Tags for exams/projects */}
      {(microtopic.examIds.length > 0 || microtopic.projectIds.length > 0) && (
        <div className="ml-auto flex gap-1">
          {microtopic.examIds.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
              Exam
            </span>
          )}
          {microtopic.projectIds.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
              Project
            </span>
          )}
        </div>
      )}
    </div>
  );
}
