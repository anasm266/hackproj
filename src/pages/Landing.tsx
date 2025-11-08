// ============================================
// PERSON 1: LANDING PAGE
// ============================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CreateCourseFormData } from '../types';

/**
 * PERSON 1: Landing page with "Create Course Planner" form
 *
 * Features needed:
 * - Form with: Course Name (required), Course Number, Term, Upload PDF(s)
 * - Multi-file upload support
 * - Submit button triggers parsing flow
 * - Show loading state during parsing
 */
export function Landing() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateCourseFormData>({
    name: '',
    courseNumber: '',
    term: '',
    syllabusFiles: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Call Claude API to parse syllabus
    // This will be implemented by Person 2
    console.log('Submitting:', formData);

    // Placeholder: navigate to review screen
    setTimeout(() => {
      navigate('/review');
    }, 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({
        ...formData,
        syllabusFiles: Array.from(e.target.files),
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Turn Your Syllabus Into a Study Map
        </h1>
        <p className="text-lg text-gray-600">
          Upload your course syllabus and get an interactive study plan with
          topics, deadlines, and quizzes.
        </p>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-6">Create Course Planner</h2>

        <form onSubmit={handleSubmit}>
          {/* Course Name */}
          <div className="mb-4">
            <label
              htmlFor="courseName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Course Name *
            </label>
            <input
              type="text"
              id="courseName"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Data Structures and Algorithms"
            />
          </div>

          {/* Course Number */}
          <div className="mb-4">
            <label
              htmlFor="courseNumber"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Course Number (Optional)
            </label>
            <input
              type="text"
              id="courseNumber"
              value={formData.courseNumber}
              onChange={(e) =>
                setFormData({ ...formData, courseNumber: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., CS 201"
            />
          </div>

          {/* Term */}
          <div className="mb-4">
            <label
              htmlFor="term"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Term (Optional)
            </label>
            <input
              type="text"
              id="term"
              value={formData.term}
              onChange={(e) =>
                setFormData({ ...formData, term: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Fall 2025"
            />
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label
              htmlFor="syllabusFiles"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Upload Syllabus PDF(s) *
            </label>
            <input
              type="file"
              id="syllabusFiles"
              required
              multiple
              accept=".pdf"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formData.syllabusFiles.length > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                {formData.syllabusFiles.length} file(s) selected
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? 'Parsing Syllabus...' : 'Create Course Planner'}
          </button>
        </form>

        {isLoading && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="text-blue-700 text-center">
              Extracting dates and building study map...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
