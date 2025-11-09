// ============================================
// PERSON 3: PROGRESS BAR COMPONENT
// ============================================

import React from 'react';
import { getProgressColor, getProgressTextColor } from '../../utils/progress';

interface ProgressBarProps {
  progress: number; // 0-100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * PERSON 3: Reusable progress bar component
 *
 * Used for:
 * - Overall course progress
 * - Topic progress
 * - Subtopic progress
 */
export function ProgressBar({
  progress,
  showLabel = true,
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const height = size === 'sm' ? 'h-1' : size === 'md' ? 'h-2' : 'h-3';
  const colorClass = getProgressColor(progress);
  const textColorClass = getProgressTextColor(progress);

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600">Progress</span>
          <span className={`text-xs font-medium ${textColorClass}`}>
            {progress}%
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${height}`}>
        <div
          className={`${colorClass} ${height} rounded-full transition-all duration-300`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
