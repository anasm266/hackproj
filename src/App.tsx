import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/person1-frontend/Layout';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { CourseMap } from './pages/CourseMap';
import { Upcoming } from './pages/Upcoming';
import { Resources } from './pages/Resources';

/**
 * Main App Router
 * PERSON 1: Customize routes and add any additional pages
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Landing page */}
          <Route index element={<Landing />} />

          {/* Course dashboard */}
          <Route path="dashboard" element={<Dashboard />} />

          {/* Course-specific routes */}
          <Route path="course/:courseId">
            <Route path="map" element={<CourseMap />} />
            <Route path="upcoming" element={<Upcoming />} />
            <Route path="resources/:topicId" element={<Resources />} />
          </Route>

          {/* Add more routes as needed */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
