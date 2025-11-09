import { beforeEach, describe, expect, it } from "vitest";
import { useStudyPlanStore } from "../useStudyPlanStore";
import { createSampleStudyMap } from "../../testUtils/sampleStudyMap";

describe("useStudyPlanStore", () => {
  beforeEach(() => {
    const state = useStudyPlanStore.getState();
    useStudyPlanStore.setState({
      ...state,
      courses: {},
      courseOrder: [],
      activeCourseId: undefined
    });
  });

  it("persists microtopic completion after hydration", () => {
    const studyMap = createSampleStudyMap();
    const { ingestStudyMap, toggleMicroTopic, hydrateFromServer } = useStudyPlanStore.getState();
    ingestStudyMap(studyMap);

    const courseId = studyMap.course.id;
    const microId = studyMap.topics[0].subTopics[0].microTopics[0].id;
    toggleMicroTopic(courseId, microId);

    const toggled = useStudyPlanStore
      .getState()
      .courses[courseId].studyMap.topics[0].subTopics[0].microTopics[0];
    expect(toggled.completed).toBe(true);

    const snapshot = useStudyPlanStore.getState();
    hydrateFromServer({
      courses: snapshot.courses,
      courseOrder: snapshot.courseOrder
    });

    const hydrated = useStudyPlanStore
      .getState()
      .courses[courseId].studyMap.topics[0].subTopics[0].microTopics[0];
    expect(hydrated.completed).toBe(true);
  });
});

