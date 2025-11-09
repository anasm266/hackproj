// ============================================
// PERSON 4: UPCOMING DEADLINES PAGE
// ============================================

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Deadline } from '../types';
import { formatDateTime, isUpcoming, isOverdue, sortByDate } from '../utils/helpers';

/**
 * PERSON 4: Upcoming deadlines page
 *
 * Features needed:
 * - Chronological list of exams/assignments/projects
 * - Group by date or show timeline
 * - Each item links to filtered study map
 * - Visual indicators for upcoming/overdue
 * - Empty state with "Add deadline" CTA
 */
export function Upcoming() {
  const { courseId } = useParams();

  // TODO: Load deadlines from storage/state
  const deadlines: Deadline[] = [];

  const sortedDeadlines = sortByDate(deadlines);

  if (deadlines.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          No Deadlines Found
        </h2>
        <p className="text-gray-600 mb-6">
          No deadlines were extracted from your syllabus.
        </p>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium">
          Add Deadline Manually
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Upcoming Deadlines
      </h1>

      <div className="space-y-4">
        {sortedDeadlines.map((deadline) => (
          <DeadlineCard key={deadline.id} deadline={deadline} />
        ))}
      </div>
    </div>
  );
}

function DeadlineCard({ deadline }: { deadline: Deadline }) {
  const upcoming = isUpcoming(deadline.dueDate);
  const overdue = isOverdue(deadline.dueDate);

  const typeColors = {
    exam: 'bg-red-100 text-red-700',
    assignment: 'bg-blue-100 text-blue-700',
    project: 'bg-purple-100 text-purple-700',
  };

  const borderColor = overdue
    ? 'border-red-500'
    : upcoming
    ? 'border-yellow-500'
    : 'border-gray-200';

  return (
    <div
      className={`bg-white shadow-md rounded-lg p-5 border-l-4 ${borderColor} hover:shadow-lg transition-shadow`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">
              {deadline.title}
            </h3>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                typeColors[deadline.type]
              }`}
            >
              {deadline.type}
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-1">
            Due: {formatDateTime(deadline.dueDate)}
          </p>

          {deadline.description && (
            <p className="text-sm text-gray-700 mt-2">{deadline.description}</p>
          )}

          {deadline.scope && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Scope:</span> {deadline.scope}
              </p>
            </div>
          )}
        </div>

        {/* Link to study map */}
        <Link
          to={`/course/${deadline.courseId}/map?filter=${deadline.id}`}
          className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          View Topics
        </Link>
      </div>

      {/* Status indicator */}
      {overdue && (
        <div className="mt-3 text-sm text-red-600 font-medium">
          ⚠️ Overdue
        </div>
      )}
      {upcoming && !overdue && (
        <div className="mt-3 text-sm text-yellow-600 font-medium">
          ⏰ Coming up soon
        </div>
      )}
    </div>
  );
}
