// ============================================
// PERSON 1: MAIN LAYOUT COMPONENT
// ============================================

import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * PERSON 1: Main layout wrapper
 *
 * This should include:
 * - Header/Navigation
 * - Sidebar (optional)
 * - Main content area (using <Outlet /> from react-router-dom)
 * - Footer (optional)
 */
export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* TODO: Add navigation/header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">StudyMap</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
