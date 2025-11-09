import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import CourseMapPage from "./pages/CourseMapPage";
import UpcomingPage from "./pages/UpcomingPage";
import ResourcesPage from "./pages/ResourcesPage";
import QuizCenterPage from "./pages/QuizCenterPage";
import ChatPage from "./pages/ChatPage";
import AppLayout from "./components/layout/AppLayout";
import { studyApi } from "./lib/api";
import { useStudyPlanStore } from "./store/useStudyPlanStore";

const queryClient = new QueryClient();

function App() {
  const hydrate = useStudyPlanStore((state) => state.hydrateFromServer);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await studyApi.fetchCourses();
        hydrate(data);
      } catch (error) {
        console.error("Failed to hydrate courses", error);
      }
    };
    loadCourses();
  }, [hydrate]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/courses/:courseId/map" element={<CourseMapPage />} />
            <Route path="/courses/:courseId/upcoming" element={<UpcomingPage />} />
            <Route path="/courses/:courseId/resources" element={<ResourcesPage />} />
            <Route path="/courses/:courseId/quiz" element={<QuizCenterPage />} />
            <Route path="/courses/:courseId/chat" element={<ChatPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}

export default App;
