import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import CourseMapPage from "../CourseMapPage";
import { useStudyPlanStore } from "../../store/useStudyPlanStore";
import { createSampleStudyMap } from "../../testUtils/sampleStudyMap";

const hydrateStore = (payload: StudyMapPayload) => {
  useStudyPlanStore.setState({
    courses: {
      [payload.course.id]: {
        studyMap: payload,
        lastUpdated: new Date().toISOString(),
        quizHistory: []
      }
    },
    courseOrder: [payload.course.id],
    activeCourseId: payload.course.id,
    ingestStudyMap: useStudyPlanStore.getState().ingestStudyMap,
    setActiveCourse: useStudyPlanStore.getState().setActiveCourse,
    toggleMicroTopic: useStudyPlanStore.getState().toggleMicroTopic,
    updateNodeTitle: useStudyPlanStore.getState().updateNodeTitle,
    upsertQuiz: useStudyPlanStore.getState().upsertQuiz
  });
};

describe("CourseMapPage", () => {
  beforeEach(() => {
    const payload = createSampleStudyMap();
    hydrateStore(payload);
  });

  it("renders study map content without crashing", async () => {
    render(
      <MemoryRouter initialEntries={["/courses/course-test/map"]}>
        <Routes>
          <Route path="/courses/:courseId/map" element={<CourseMapPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Course Map/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Foundations/)[0]).toBeInTheDocument();
  });
});
