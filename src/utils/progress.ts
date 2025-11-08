// ============================================
// PERSON 3: PROGRESS CALCULATION UTILITIES
// ============================================

import type {
  Topic,
  Subtopic,
  Microtopic,
  StudyMap,
  ProgressCalculation,
} from '../types';

/**
 * Calculate progress for a single topic based on its subtopics
 */
export function calculateTopicProgress(topic: Topic): number {
  if (topic.subtopics.length === 0) return 0;

  const totalProgress = topic.subtopics.reduce(
    (sum, subtopic) => sum + calculateSubtopicProgress(subtopic),
    0
  );

  return Math.round(totalProgress / topic.subtopics.length);
}

/**
 * Calculate progress for a subtopic based on its microtopics
 */
export function calculateSubtopicProgress(subtopic: Subtopic): number {
  if (subtopic.microtopics.length === 0) return 0;

  const completedCount = subtopic.microtopics.filter(
    (mt) => mt.completed
  ).length;

  return Math.round((completedCount / subtopic.microtopics.length) * 100);
}

/**
 * Calculate overall course progress based on all topics
 */
export function calculateCourseProgress(studyMap: StudyMap): number {
  if (studyMap.topics.length === 0) return 0;

  const totalProgress = studyMap.topics.reduce(
    (sum, topic) => sum + calculateTopicProgress(topic),
    0
  );

  return Math.round(totalProgress / studyMap.topics.length);
}

/**
 * Get detailed progress calculation with counts
 */
export function getProgressDetails(
  microtopics: Microtopic[]
): ProgressCalculation {
  const total = microtopics.length;
  const completed = microtopics.filter((mt) => mt.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
}

/**
 * Update all progress values in a study map
 * PERSON 3: Call this after any completion toggle
 */
export function updateAllProgress(studyMap: StudyMap): StudyMap {
  const updatedTopics = studyMap.topics.map((topic) => ({
    ...topic,
    subtopics: topic.subtopics.map((subtopic) => ({
      ...subtopic,
      progress: calculateSubtopicProgress(subtopic),
    })),
    progress: calculateTopicProgress(topic),
  }));

  return {
    ...studyMap,
    topics: updatedTopics,
  };
}

/**
 * Get progress color class for Tailwind
 */
export function getProgressColor(percentage: number): string {
  if (percentage === 0) return 'bg-gray-300';
  if (percentage < 30) return 'bg-red-500';
  if (percentage < 60) return 'bg-yellow-500';
  if (percentage < 100) return 'bg-blue-500';
  return 'bg-green-500';
}

/**
 * Get progress text color class for Tailwind
 */
export function getProgressTextColor(percentage: number): string {
  if (percentage === 0) return 'text-gray-600';
  if (percentage < 30) return 'text-red-600';
  if (percentage < 60) return 'text-yellow-600';
  if (percentage < 100) return 'text-blue-600';
  return 'text-green-600';
}
