import type { StudyMapPayload } from "@studymap/types";

export const createSampleStudyMap = (): StudyMapPayload => ({
  course: {
    id: "course-test",
    name: "Algorithms",
    courseNumber: "CS 201",
    term: "Fall 2025",
    createdAt: new Date().toISOString()
  },
  topics: [
    {
      id: "topic-a",
      title: "Foundations",
      description: "Core fundamentals",
      tags: ["exam-1"],
      rationale: "Needed for everything else.",
      subTopics: [
        {
          id: "subtopic-a1",
          title: "Big-O",
          description: "Notation review",
          microTopics: [
            {
              id: "micro-a1",
              title: "Notation",
              description: "Upper / lower bounds",
              completed: false,
              tags: [],
              examScopeIds: ["exam-1"]
            }
          ]
        }
      ]
    }
  ],
  assignments: [],
  resources: {
    "topic-a": []
  },
  exams: [
    {
      id: "exam-1",
      title: "Exam 1",
      description: "Weeks 1-3",
      relatedTopicIds: ["topic-a"]
    }
  ]
});

