import { create } from "zustand";
import type {
  QuizResponsePayload,
  StudyMapPayload,
  Topic,
  ResourceItem,
  ResourceSearchResult
} from "@studymap/types";
import type { AddNodeInput, ReorderNodeInput } from "../types/studyActions";

export type QuizResult = {
  id: string;
  quizId: string;
  completedAt: string;
  score: number;
  totalQuestions: number;
  difficulty: "auto" | "intro" | "exam";
  topicIds: string[];
  topicTitles: string[];
  weakTopicIds?: string[]; // Topic IDs where student performed poorly
};

export type CourseRecord = {
  studyMap: StudyMapPayload;
  lastUpdated: string;
  quizHistory: QuizResponsePayload[];
  quizResults: QuizResult[];
};

interface StudyPlanState {
  courses: Record<string, CourseRecord>;
  courseOrder: string[];
  activeCourseId?: string;
  ingestStudyMap: (payload: StudyMapPayload) => void;
  hydrateFromServer: (payload: { courses: Record<string, CourseRecord>; courseOrder: string[] }) => void;
  setActiveCourse: (courseId: string) => void;
  toggleMicroTopic: (courseId: string, microTopicId: string) => void;
  updateNodeTitle: (courseId: string, nodeId: string, title: string) => void;
  reorderNode: (courseId: string, payload: ReorderNodeInput) => void;
  addNode: (courseId: string, payload: AddNodeInput) => void;
  addResource: (courseId: string, topicId: string, resource: ResourceSearchResult) => void;
  upsertQuiz: (courseId: string, quiz: QuizResponsePayload) => void;
  deleteQuiz: (courseId: string, quizId: string) => void;
  saveQuizResult: (courseId: string, result: QuizResult) => void;
  deleteQuizResult: (courseId: string, resultId: string) => void;
}

const updateTopicNode = (
  topic: Topic,
  nodeId: string,
  updater: (value: { title: string; completed?: boolean }) => Partial<{
    title: string;
    completed: boolean;
  }>
): Topic => {
  if (topic.id === nodeId) {
    return { ...topic, ...updater({ title: topic.title }) };
  }

  const updatedSubTopics = topic.subTopics.map((sub) => {
    if (sub.id === nodeId) {
      return { ...sub, ...updater({ title: sub.title }) };
    }

    const updatedMicro = sub.microTopics.map((micro) => {
      if (micro.id === nodeId) {
        return { ...micro, ...updater({ title: micro.title, completed: micro.completed }) };
      }
      return micro;
    });

    return { ...sub, microTopics: updatedMicro };
  });

  return { ...topic, subTopics: updatedSubTopics };
};

const moveItem = <T,>(items: T[], index: number, direction: "up" | "down"): T[] => {
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= items.length) return items;
  const copy = [...items];
  const [item] = copy.splice(index, 1);
  copy.splice(targetIndex, 0, item);
  return copy;
};

const createId = (prefix: string) => {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 9);
  return `${prefix}-${random}`;
};

const withUpdatedCourse = (
  state: StudyPlanState,
  courseId: string,
  updater: (record: CourseRecord) => CourseRecord | null
): StudyPlanState => {
  const course = state.courses[courseId];
  if (!course) return state;
  const updated = updater(course);
  if (!updated) return state;
  return {
    ...state,
    courses: {
      ...state.courses,
      [courseId]: {
        ...updated,
        lastUpdated: new Date().toISOString()
      }
    }
  };
};

export const useStudyPlanStore = create<StudyPlanState>((set) => ({
  courses: {},
  courseOrder: [],
  activeCourseId: undefined,
  hydrateFromServer: ({ courses, courseOrder }) =>
    set((state) => {
      const nextActive =
        state.activeCourseId && courses[state.activeCourseId]
          ? state.activeCourseId
          : courseOrder[0];
      // Ensure all courses have quizResults array
      const coursesWithResults = Object.fromEntries(
        Object.entries(courses).map(([id, course]) => [
          id,
          {
            ...course,
            quizResults: course.quizResults ?? []
          }
        ])
      );
      return {
        courses: coursesWithResults,
        courseOrder,
        activeCourseId: nextActive
      };
    }),
  ingestStudyMap: (payload) =>
    set((state) => {
      const exists = Boolean(state.courses[payload.course.id]);
      return {
        courses: {
          ...state.courses,
          [payload.course.id]: {
            studyMap: payload,
            lastUpdated: new Date().toISOString(),
            quizHistory: state.courses[payload.course.id]?.quizHistory ?? [],
            quizResults: state.courses[payload.course.id]?.quizResults ?? []
          }
        },
        activeCourseId: payload.course.id,
        courseOrder: exists
          ? state.courseOrder
          : [...state.courseOrder, payload.course.id]
      };
    }),
  setActiveCourse: (courseId) =>
    set(() => ({
      activeCourseId: courseId
    })),
  toggleMicroTopic: (courseId, microTopicId) =>
    set((state) => {
      const course = state.courses[courseId];
      if (!course) return state;

      const updatedTopics = course.studyMap.topics.map((topic) =>
        updateTopicNode(topic, microTopicId, ({ completed = false }) => ({
          completed: !completed
        }))
      );

      return {
        courses: {
          ...state.courses,
          [courseId]: {
            ...course,
            studyMap: {
              ...course.studyMap,
              topics: updatedTopics
            },
            lastUpdated: new Date().toISOString()
          }
        }
      };
    }),
  updateNodeTitle: (courseId, nodeId, title) =>
    set((state) => {
      return withUpdatedCourse(state, courseId, (course) => ({
        ...course,
        studyMap: {
          ...course.studyMap,
          topics: course.studyMap.topics.map((topic) =>
            updateTopicNode(topic, nodeId, () => ({ title }))
          )
        }
      }));
    }),
  reorderNode: (courseId, payload) =>
    set((state) =>
      withUpdatedCourse(state, courseId, (course) => {
        if (payload.level === "topic") {
          const index = course.studyMap.topics.findIndex(
            (topic) => topic.id === payload.nodeId
          );
          if (index === -1) return null;
          return {
            ...course,
            studyMap: {
              ...course.studyMap,
              topics: moveItem(course.studyMap.topics, index, payload.direction)
            }
          };
        }

        if (payload.level === "subtopic" && payload.parentTopicId) {
          return {
            ...course,
            studyMap: {
              ...course.studyMap,
              topics: course.studyMap.topics.map((topic) => {
                if (topic.id !== payload.parentTopicId) return topic;
                const index = topic.subTopics.findIndex(
                  (subTopic) => subTopic.id === payload.nodeId
                );
                if (index === -1) return topic;
                return {
                  ...topic,
                  subTopics: moveItem(topic.subTopics, index, payload.direction)
                };
              })
            }
          };
        }

        if (
          payload.level === "micro" &&
          payload.parentTopicId &&
          payload.parentSubTopicId
        ) {
          return {
            ...course,
            studyMap: {
              ...course.studyMap,
              topics: course.studyMap.topics.map((topic) => {
                if (topic.id !== payload.parentTopicId) return topic;
                return {
                  ...topic,
                  subTopics: topic.subTopics.map((subTopic) => {
                    if (subTopic.id !== payload.parentSubTopicId) return subTopic;
                    const index = subTopic.microTopics.findIndex(
                      (micro) => micro.id === payload.nodeId
                    );
                    if (index === -1) return subTopic;
                    return {
                      ...subTopic,
                      microTopics: moveItem(
                        subTopic.microTopics,
                        index,
                        payload.direction
                      )
                    };
                  })
                };
              })
            }
          };
        }

        return null;
      })
    ),
  addNode: (courseId, payload) =>
    set((state) =>
      withUpdatedCourse(state, courseId, (course) => {
        if (payload.level === "topic") {
          const topicId = createId("topic");
          const newTopic: Topic = {
            id: topicId,
            title: payload.title,
            description: payload.description ?? "Description pending.",
            tags: [],
            rationale: undefined,
            subTopics: []
          };
          return {
            ...course,
            studyMap: {
              ...course.studyMap,
              topics: [...course.studyMap.topics, newTopic],
              resources: {
                ...course.studyMap.resources,
                [topicId]: []
              }
            }
          };
        }

        if (payload.level === "subtopic" && payload.parentTopicId) {
          return {
            ...course,
            studyMap: {
              ...course.studyMap,
              topics: course.studyMap.topics.map((topic) => {
                if (topic.id !== payload.parentTopicId) return topic;
                return {
                  ...topic,
                  subTopics: [
                    ...topic.subTopics,
                    {
                      id: createId("subtopic"),
                      title: payload.title,
                      description: payload.description ?? "Details to follow.",
                      microTopics: [],
                      rationale: undefined
                    }
                  ]
                };
              })
            }
          };
        }

        if (
          payload.level === "micro" &&
          payload.parentTopicId &&
          payload.parentSubTopicId
        ) {
          return {
            ...course,
            studyMap: {
              ...course.studyMap,
              topics: course.studyMap.topics.map((topic) => {
                if (topic.id !== payload.parentTopicId) return topic;
                return {
                  ...topic,
                  subTopics: topic.subTopics.map((subTopic) => {
                    if (subTopic.id !== payload.parentSubTopicId) return subTopic;
                    return {
                      ...subTopic,
                      microTopics: [
                        ...subTopic.microTopics,
                        {
                          id: createId("micro"),
                          title: payload.title,
                          description: payload.description ?? "Keep a brief summary here.",
                          tags: [],
                          examScopeIds: [],
                          completed: false
                        }
                      ]
                    };
                  })
                };
              })
            }
          };
        }

        return null;
      })
    ),
  addResource: (courseId, topicId, resource) =>
    set((state) => {
      const course = state.courses[courseId];
      if (!course) return state;

      // Convert ResourceSearchResult to ResourceItem
      const newResource: ResourceItem = {
        id: createId("resource"),
        title: resource.title,
        url: resource.url,
        summary: resource.summary,
        type: resource.contentType === "video" ? "video" : 
              resource.contentType === "interactive" ? "interactive" : 
              "article",
        aiGenerated: true,
        aiQuality: resource.quality,
        addedAt: new Date().toISOString()
      };

      // Call backend API asynchronously (fire and forget)
      import("../lib/api").then(({ studyApi }) => {
        studyApi.addResourceToCourse(courseId, topicId, newResource).catch(err => {
          console.error("Failed to persist resource to backend:", err);
        });
      });

      // Update local state immediately
      return {
        courses: {
          ...state.courses,
          [courseId]: {
            ...course,
            studyMap: {
              ...course.studyMap,
              resources: {
                ...course.studyMap.resources,
                [topicId]: [
                  ...(course.studyMap.resources[topicId] || []),
                  newResource
                ]
              }
            },
            lastUpdated: new Date().toISOString()
          }
        }
      };
    }),
  upsertQuiz: (courseId, quiz) =>
    set((state) => {
      const course = state.courses[courseId];
      if (!course) return state;
      const withoutExisting = course.quizHistory.filter(
        (q) => q.quizId !== quiz.quizId
      );
      return {
        courses: {
          ...state.courses,
          [courseId]: {
            ...course,
            quizHistory: [quiz, ...withoutExisting].slice(0, 5),
            lastUpdated: new Date().toISOString()
          }
        }
      };
    }),
  deleteQuiz: (courseId, quizId) =>
    set((state) => {
      const course = state.courses[courseId];
      if (!course) return state;
      return {
        courses: {
          ...state.courses,
          [courseId]: {
            ...course,
            quizHistory: course.quizHistory.filter((q) => q.quizId !== quizId),
            lastUpdated: new Date().toISOString()
          }
        }
      };
    }),
  saveQuizResult: (courseId, result) =>
    set((state) => {
      const course = state.courses[courseId];
      if (!course) return state;
      return {
        courses: {
          ...state.courses,
          [courseId]: {
            ...course,
            quizResults: [result, ...course.quizResults],
            lastUpdated: new Date().toISOString()
          }
        }
      };
    }),
  deleteQuizResult: (courseId, resultId) =>
    set((state) => {
      const course = state.courses[courseId];
      if (!course) return state;
      return {
        courses: {
          ...state.courses,
          [courseId]: {
            ...course,
            quizResults: course.quizResults.filter((r) => r.id !== resultId),
            lastUpdated: new Date().toISOString()
          }
        }
      };
    })
}));

export const selectActiveCourse = () => {
  const state = useStudyPlanStore.getState();
  if (!state.activeCourseId) return undefined;
  return state.courses[state.activeCourseId];
};
