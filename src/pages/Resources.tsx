// ============================================
// PERSON 4: RESOURCES PAGE
// ============================================

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Resource, Topic } from '../types';
import { getYouTubeThumbnail } from '../utils/helpers';

/**
 * PERSON 4: Topic resources page
 *
 * Features needed:
 * - Display 1-5 resources per topic
 * - Show: title, link, summary, duration, thumbnail (YouTube)
 * - Type badges (video/article/docs)
 * - "Find More" button if no resources
 * - Manual add resource option
 */
export function Resources() {
  const { topicId } = useParams();
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Load topic and resources from storage/state
  // For now using placeholder - Person 4 should load from actual storage
  const topic: Topic | null = topicId ? {
    id: topicId,
    title: 'Loading...',
    description: '',
    subtopics: [],
    progress: 0,
    order: 0
  } : null;
  const resources: Resource[] = [];

  const handleFindMore = async () => {
    setIsLoading(true);
    // TODO: Call Claude API to generate more resources
    // Implemented by Person 2
    setTimeout(() => setIsLoading(false), 2000);
  };

  if (!topic) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading resources...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{topic?.title || 'Resources'}</h1>
        <p className="text-gray-600">Curated learning resources</p>
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            No Resources Found
          </h2>
          <p className="text-gray-600 mb-6">
            No resources were found for this topic yet.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleFindMore}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium disabled:bg-gray-400"
            >
              {isLoading ? 'Searching...' : 'Find Resources'}
            </button>
            <button className="border border-gray-300 px-6 py-3 rounded-md hover:bg-gray-50 font-medium">
              Add Manually
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600">{resources.length} resources found</p>
            <button
              onClick={handleFindMore}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              + Find More
            </button>
          </div>

          <div className="space-y-4">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResourceCard({ resource }: { resource: Resource }) {
  const typeBadges = {
    video: { bg: 'bg-red-100', text: 'text-red-700', icon: '🎥' },
    article: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '📄' },
    docs: { bg: 'bg-green-100', text: 'text-green-700', icon: '📚' },
    tutorial: { bg: 'bg-purple-100', text: 'text-purple-700', icon: '🎓' },
  };

  const badge = typeBadges[resource.type];
  const thumbnail =
    resource.thumbnailUrl || getYouTubeThumbnail(resource.url);

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white shadow-md rounded-lg p-5 hover:shadow-lg transition-shadow"
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        {thumbnail && (
          <div className="flex-shrink-0">
            <img
              src={thumbnail}
              alt={resource.title}
              className="w-40 h-24 object-cover rounded"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 flex-1">
              {resource.title}
            </h3>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}
            >
              {badge.icon} {resource.type}
            </span>
          </div>

          {resource.summary && (
            <p className="text-sm text-gray-600 mb-2">{resource.summary}</p>
          )}

          {resource.duration && (
            <p className="text-xs text-gray-500">
              Duration: {resource.duration}
            </p>
          )}

          <div className="mt-3 text-sm text-blue-600 hover:text-blue-700">
            Open resource →
          </div>
        </div>
      </div>
    </a>
  );
}
