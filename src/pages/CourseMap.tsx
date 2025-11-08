// ============================================
// PERSON 1 & PERSON 3: COURSE MAP PAGE (Main study map view)
// ============================================

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { StudyMap, FilterState } from '../types';

/**
 * PERSON 1: Page structure and layout
 * PERSON 3: Tree component integration and progress display
 *
 * Features needed:
 * - Left: Collapsible tree (Person 3's component)
 * - Right: Details panel
 * - Top: Progress bar + filter chips
 * - Search bar
 */
export function CourseMap() {
  const { courseId } = useParams();
  const [filter, setFilter] = useState<FilterState>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // TODO: Load study map from storage/state
  const studyMap: StudyMap | null = null;

  if (!studyMap) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading study map...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header with progress and filters */}
      <div className="bg-white shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Study Map</h1>

          {/* TODO: Overall progress bar */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Overall Progress</span>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }} />
            </div>
            <span className="text-sm font-medium">0%</span>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search topics..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            onChange={(e) => setFilter({ ...filter, searchQuery: e.target.value })}
          />

          {/* TODO: Filter chips for exams/projects */}
          <button className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200">
            All Topics
          </button>
        </div>
      </div>

      {/* Main content: Tree + Details */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left: Tree view - PERSON 3 will implement the tree component */}
        <div className="w-1/2 bg-white rounded-lg shadow-md p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Topics</h2>
          {/* TODO: PERSON 3 - Insert StudyMapTree component here */}
          <p className="text-gray-500">Tree component will go here (Person 3)</p>
        </div>

        {/* Right: Details panel */}
        <div className="w-1/2 bg-white rounded-lg shadow-md p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Details</h2>
          {selectedNodeId ? (
            <div>
              {/* TODO: Show details for selected topic/subtopic/microtopic */}
              <p className="text-gray-600">Node details will appear here</p>
            </div>
          ) : (
            <p className="text-gray-500">Select a topic to view details</p>
          )}
        </div>
      </div>
    </div>
  );
}
