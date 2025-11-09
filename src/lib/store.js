import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Main application store using Zustand
 */
const useStore = create(
  persist(
    (set, get) => ({
      // Courses state
      courses: [],
      currentCourseId: null,

      // Add a new course
      addCourse: (course) =>
        set((state) => ({
          courses: [...state.courses, { ...course, createdAt: new Date(), lastActivity: new Date() }],
        })),

      // Update a course
      updateCourse: (courseId, updates) =>
        set((state) => ({
          courses: state.courses.map((course) =>
            course.id === courseId
              ? { ...course, ...updates, lastActivity: new Date() }
              : course
          ),
        })),

      // Delete a course
      deleteCourse: (courseId) =>
        set((state) => ({
          courses: state.courses.filter((course) => course.id !== courseId),
          currentCourseId: state.currentCourseId === courseId ? null : state.currentCourseId,
        })),

      // Set current course
      setCurrentCourse: (courseId) =>
        set({ currentCourseId: courseId }),

      // Get current course
      getCurrentCourse: () => {
        const state = get()
        return state.courses.find((c) => c.id === state.currentCourseId)
      },

      // Toggle microtopic completion
      toggleMicrotopic: (courseId, topicId, subtopicId, microtopicId) =>
        set((state) => {
          const courses = state.courses.map((course) => {
            if (course.id !== courseId) return course

            const topics = course.topics.map((topic) => {
              if (topic.id !== topicId) return topic

              const subtopics = topic.subtopics.map((subtopic) => {
                if (subtopic.id !== subtopicId) return subtopic

                const microtopics = subtopic.microtopics.map((micro) =>
                  micro.id === microtopicId
                    ? { ...micro, completed: !micro.completed }
                    : micro
                )

                // Recalculate subtopic progress
                const completedCount = microtopics.filter((m) => m.completed).length
                const progress = (completedCount / microtopics.length) * 100

                return { ...subtopic, microtopics, progress }
              })

              // Recalculate topic progress
              const totalMicros = subtopics.reduce((sum, st) => sum + st.microtopics.length, 0)
              const completedMicros = subtopics.reduce(
                (sum, st) => sum + st.microtopics.filter((m) => m.completed).length,
                0
              )
              const progress = totalMicros > 0 ? (completedMicros / totalMicros) * 100 : 0

              return { ...topic, subtopics, progress }
            })

            // Recalculate course progress
            const totalMicros = topics.reduce(
              (sum, t) =>
                sum + t.subtopics.reduce((s, st) => s + st.microtopics.length, 0),
              0
            )
            const completedMicros = topics.reduce(
              (sum, t) =>
                sum +
                t.subtopics.reduce(
                  (s, st) => s + st.microtopics.filter((m) => m.completed).length,
                  0
                ),
              0
            )
            const progress = totalMicros > 0 ? (completedMicros / totalMicros) * 100 : 0

            return { ...course, topics, progress, lastActivity: new Date() }
          })

          return { courses }
        }),

      // Add resources for a topic
      addResources: (courseId, topicId, resources) =>
        set((state) => ({
          courses: state.courses.map((course) =>
            course.id === courseId
              ? {
                  ...course,
                  resources: {
                    ...course.resources,
                    [topicId]: resources,
                  },
                }
              : course
          ),
        })),

      // Quizzes state
      quizzes: [],

      // Add a quiz
      addQuiz: (quiz) =>
        set((state) => ({
          quizzes: [...state.quizzes, { ...quiz, createdAt: new Date() }],
        })),

      // Get quizzes for a course
      getCourseQuizzes: (courseId) => {
        const state = get()
        return state.quizzes.filter((q) => q.courseId === courseId)
      },
    }),
    {
      name: 'studymap-storage',
      version: 1,
    }
  )
)

export default useStore
