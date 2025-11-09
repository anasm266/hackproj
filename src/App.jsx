import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import CourseMap from './pages/CourseMap'
import Upcoming from './pages/Upcoming'
import Resources from './pages/Resources'
import QuizBuilder from './pages/QuizBuilder'
import QuizPlayer from './pages/QuizPlayer'
import ReviewScreen from './pages/ReviewScreen'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/course/:courseId" element={<CourseMap />} />
        <Route path="/course/:courseId/upcoming" element={<Upcoming />} />
        <Route path="/course/:courseId/resources/:topicId" element={<Resources />} />
        <Route path="/course/:courseId/quiz/builder" element={<QuizBuilder />} />
        <Route path="/course/:courseId/quiz/:quizId" element={<QuizPlayer />} />
        <Route path="/course/:courseId/review" element={<ReviewScreen />} />
      </Route>
    </Routes>
  )
}

export default App
