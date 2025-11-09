import crypto from "node:crypto";
import type {
  CourseMetadata,
  ExamScope,
  ResourceItem,
  StudyMapPayload,
  Topic,
  UpcomingItem
} from "@studymap/types";

const createBaseCourse = (): CourseMetadata => ({
  id: "course-sample",
  name: "Algorithms & Data Structures",
  courseNumber: "CS 201",
  term: "Fall 2025",
  createdAt: new Date().toISOString()
});

const baseTopics: Topic[] = [
  {
    id: "topic-foundations",
    title: "Algorithm Foundations",
    description:
      "Complexity analysis, proof techniques, and problem-solving frameworks to reason about algorithmic efficiency.",
    tags: ["fundamentals", "exam-1"],
    rationale:
      "Students need a strong intuition for how time and space behave before diving into specific data structures.",
    subTopics: [
      {
        id: "subtopic-big-o",
        title: "Complexity Analysis",
        description:
          "Measuring and comparing algorithmic efficiency using asymptotic notation.",
        rationale: "Ensures a consistent vocabulary for later trade-off discussions.",
        microTopics: [
          {
            id: "micro-big-o",
            title: "Big-O / Big-Theta / Big-Omega",
            description: "Master the formal bounds and when to apply each.",
            tags: ["notation", "analysis"],
            examScopeIds: ["exam-1"],
            completed: false,
            rationale: "Appears in every quiz and exam introduction."
          },
          {
            id: "micro-amortized",
            title: "Amortized Analysis",
            description: "Aggregate method, accounting, and potential techniques.",
            tags: ["analysis"],
            examScopeIds: ["exam-1"],
            completed: false,
            rationale:
              "Key for explaining why dynamic arrays and disjoint set unions are fast in practice."
          }
        ]
      },
      {
        id: "subtopic-recursions",
        title: "Recurrences",
        description: "Mastery of recurrence solving strategies.",
        rationale: "Needed for divide-and-conquer reasoning.",
        microTopics: [
          {
            id: "micro-master",
            title: "Master Theorem cases",
            description: "Map recurrence parameters to canonical cases.",
            tags: ["divide-and-conquer"],
            examScopeIds: ["exam-1"],
            completed: false
          },
          {
            id: "micro-tree-method",
            title: "Recursion tree method",
            description: "Visualize contribution per level and sum the series.",
            tags: ["visual"],
            examScopeIds: ["exam-1"],
            completed: false
          }
        ]
      }
    ]
  },
  {
    id: "topic-structures",
    title: "Core Data Structures",
    description:
      "Priority queues, balanced trees, and hashing strategies applied to real project prompts.",
    tags: ["project-1", "exam-2"],
    rationale: "Most programming assignments pull from this toolkit.",
    subTopics: [
      {
        id: "subtopic-heaps",
        title: "Heaps & Priority Queues",
        description:
          "Binary heaps, d-heaps, binomial heaps, and implementation tradeoffs.",
        rationale: "Examines linking between trees and arrays.",
        microTopics: [
          {
            id: "micro-heapify",
            title: "Heapify strategies",
            description: "Bottom-up vs incremental construction runtimes.",
            tags: ["heap"],
            examScopeIds: ["exam-2", "project-1"],
            completed: false
          },
          {
            id: "micro-heap-apps",
            title: "Applications of priority queues",
            description: "Scheduling, streaming medians, Dijkstra revisit.",
            tags: ["graphs", "applications"],
            examScopeIds: ["project-1"],
            completed: false
          }
        ]
      },
      {
        id: "subtopic-balanced",
        title: "Balanced Search Trees",
        description: "AVL vs Red-Black vs B-Trees, rotations and invariants.",
        rationale: "Core exam content.",
        microTopics: [
          {
            id: "micro-rb",
            title: "Red-Black Tree cases",
            description: "Insertion and deletion fix-up sequences.",
            tags: ["trees"],
            examScopeIds: ["exam-2"],
            completed: false
          },
          {
            id: "micro-btree",
            title: "B-Tree operations",
            description: "Node splitting, merging, and disk-aware branching.",
            tags: ["storage"],
            examScopeIds: ["exam-2", "project-1"],
            completed: false
          }
        ]
      }
    ]
  },
  {
    id: "topic-graphs",
    title: "Graph Algorithms",
    description:
      "Traversal, shortest paths, min-cut / max-flow, and advanced trees for contest-style prep.",
    tags: ["graphs", "exam-2"],
    rationale: "Exam 2 focuses heavily on these microtopics.",
    subTopics: [
      {
        id: "subtopic-traversals",
        title: "Traversals & Connectivity",
        description: "DFS/BFS variants, strongly connected components.",
        rationale: "Underpins later algorithms.",
        microTopics: [
          {
            id: "micro-kosaraju",
            title: "Kosaraju & Tarjan",
            description: "Two-pass vs stack-based SCC derivations.",
            tags: ["graphs"],
            examScopeIds: ["exam-2"],
            completed: false
          },
          {
            id: "micro-toposort",
            title: "Topological ordering",
            description: "Kahn vs DFS and cycle detection hooks.",
            tags: ["dag"],
            examScopeIds: ["exam-2"],
            completed: false
          }
        ]
      },
      {
        id: "subtopic-shortest-paths",
        title: "Shortest Paths",
        description: "Dijkstra, Bellman-Ford, Floyd-Warshall comparison.",
        rationale: "Project milestone features routing heuristics.",
        microTopics: [
          {
            id: "micro-dijkstra",
            title: "Heap-optimized Dijkstra",
            description: "Lazy vs eager updates, adjacency data-structures.",
            tags: ["graphs", "heap"],
            examScopeIds: ["exam-2", "project-1"],
            completed: false
          },
          {
            id: "micro-bellman",
            title: "Negative cycles & Bellman-Ford",
            description: "Detecting arbitrage-like structures.",
            tags: ["graphs"],
            examScopeIds: ["project-1"],
            completed: false
          }
        ]
      }
    ]
  }
];

const baseResources: Record<string, ResourceItem[]> = {
  "topic-foundations": [
    {
      id: "yt-big-o",
      title: "Visually explaining Big-O notation",
      url: "https://www.youtube.com/watch?v=ei-A_wy5Yxw",
      summary: "10 minute visualization that mirrors lecture slides.",
      duration: "10m",
      thumbnail: "https://img.youtube.com/vi/ei-A_wy5Yxw/hqdefault.jpg",
      type: "video"
    },
    {
      id: "doc-master-theorem",
      title: "Master Theorem decision chart",
      url: "https://assets.studymap.dev/master-theorem.pdf",
      summary: "One-page printable chart used on Exam 1.",
      type: "doc"
    }
  ],
  "topic-structures": [
    {
      id: "yt-heaps",
      title: "Binary heap operations deep dive",
      url: "https://www.youtube.com/watch?v=t0Cq6tVNRBA",
      summary: "Top-rated explanation with interactive examples.",
      duration: "24m",
      thumbnail: "https://img.youtube.com/vi/t0Cq6tVNRBA/hqdefault.jpg",
      type: "video"
    },
    {
      id: "article-red-black",
      title: "Red-Black Trees: insert & delete animations",
      url: "https://visualgo.net/en/rbtre",
      summary: "Step-by-step rotations with color invariants.",
      type: "interactive"
    }
  ],
  "topic-graphs": [
    {
      id: "doc-dijkstra-cheatsheet",
      title: "Shortest paths cheat-sheet",
      url: "https://assets.studymap.dev/dijkstra-cheatsheet.pdf",
      summary: "Edge cases, runtime discussion, and pseudocode.",
      type: "doc"
    },
    {
      id: "yt-maxflow",
      title: "Ford-Fulkerson w/ animations",
      url: "https://www.youtube.com/watch?v=Tl90tNtKvxs",
      summary: "Explains residual graphs and augmenting paths.",
      duration: "17m",
      thumbnail: "https://img.youtube.com/vi/Tl90tNtKvxs/hqdefault.jpg",
      type: "video"
    }
  ]
};

const baseUpcoming: UpcomingItem[] = [
  {
    id: "exam-1-deadline",
    title: "Exam 1: Algorithm Foundations",
    description: "Covers lectures 1-6 plus workshop problems.",
    dueDate: "2025-10-02T14:00:00.000Z",
    type: "exam",
    relatedTopicIds: ["topic-foundations"],
    scopeText: "Complexity analysis, recursion solving, amortized analysis."
  },
  {
    id: "proj-smart-nav",
    title: "Project: Smart Navigator prototype",
    description: "Implements graphs + heaps to power routing.",
    dueDate: "2025-10-18T23:59:00.000Z",
    type: "project",
    relatedTopicIds: ["topic-structures", "topic-graphs"],
    scopeText: "Priority queues, Dijkstra variants, negative-cycle guards."
  },
  {
    id: "exam-2-deadline",
    title: "Exam 2: Trees & Graphs",
    description: "Lectures 7-12 with emphasis on balanced trees + flows.",
    dueDate: "2025-11-09T15:00:00.000Z",
    type: "exam",
    relatedTopicIds: ["topic-structures", "topic-graphs"],
    scopeText: "Heaps, balanced trees, SCC, shortest paths."
  }
];

const baseExams: ExamScope[] = [
  {
    id: "exam-1",
    title: "Exam 1",
    description: "Lectures 1–6: complexity, recursion, amortized analysis.",
    date: "2025-10-02",
    relatedTopicIds: ["topic-foundations"]
  },
  {
    id: "project-1",
    title: "Smart Navigator Project",
    description: "Milestones cover heaps + graphs integrations.",
    date: "2025-10-18",
    relatedTopicIds: ["topic-structures", "topic-graphs"]
  },
  {
    id: "exam-2",
    title: "Exam 2",
    description: "Lectures 7–12: balanced trees, flows, shortest paths.",
    date: "2025-11-09",
    relatedTopicIds: ["topic-structures", "topic-graphs"],
    uncertainty:
      "Draft scope from syllabus; confirm once instructors publish final blueprint."
  }
];

const clone = <T,>(value: T): T => structuredClone(value);

export const buildSampleStudyMap = (
  overrides: Partial<CourseMetadata>
): StudyMapPayload => {
  const course = {
    ...createBaseCourse(),
    ...overrides,
    id: overrides.id ?? `course-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString()
  };

  const payload: StudyMapPayload = {
    course,
    topics: clone(baseTopics),
    resources: clone(baseResources),
    assignments: clone(baseUpcoming),
    exams: clone(baseExams)
  };

  return payload;
};
