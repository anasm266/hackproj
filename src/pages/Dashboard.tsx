// ============================================
// PERSON 1: COURSE DASHBOARD PAGE
// ============================================

import React from 'react';
import { Link } from 'react-router-dom';
import type { Course } from '../types';

/**
 * PERSON 1: Dashboard showing all courses
 *
 * Features needed:
 * - List of all courses (cards)
 * - Show progress, next deadline, last activity for each
 * - CTAs: Open course, Add syllabus, Create quiz
 * - Empty state if no courses
 */
export function Dashboard() {
  // TODO: Get courses from storage/state
  const courses: Course[] = [];

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          No Courses Yet
        </h2>
        <p className="text-gray-600 mb-6">
          Get started by creating your first course planner.
        </p>
        <Link
          to="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
        >
          Create Course Planner
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
        <Link
          to="/"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
        >
          + New Course
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {course.name}
            </h3>
            {course.courseNumber && (
              <p className="text-sm text-gray-600 mb-1">{course.courseNumber}</p>
            )}
            {course.term && (
              <p className="text-sm text-gray-600 mb-4">{course.term}</p>
            )}

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{course.overallProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${course.overallProgress}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Link
                to={`/course/${course.id}`}
                className="flex-1 text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                Open
              </Link>
              <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium">
                Quiz
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
