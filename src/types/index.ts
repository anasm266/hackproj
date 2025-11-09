// ============================================
// SHARED TYPES FOR ALL TEAM MEMBERS
// ============================================

// Course & Study Map Types
export interface Course {
  id: string;
  name: string;
  courseNumber?: string;
  term?: string;
  createdAt: Date;
  updatedAt: Date;
  overallProgress: number; // 0-100
  syllabusFiles: string[]; // PDF URLs or paths
}

export interface Microtopic {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  examIds: string[]; // IDs of exams this microtopic is related to
  projectIds: string[]; // IDs of projects this microtopic is related to
  order: number;
}

export interface Subtopic {
  id: string;
  title: string;
  description?: string;
  microtopics: Microtopic[];
  progress: number; // 0-100, calculated from microtopics
  order: number;
}

export interface Topic {
  id: string;
  title: string;
  description?: string;
  subtopics: Subtopic[];
  progress: number; // 0-100, calculated from subtopics
  order: number;
}

export interface StudyMap {
  courseId: string;
  topics: Topic[];
  lastUpdated: Date;
}

// Deadline & Calendar Types
export type DeadlineType = 'exam' | 'assignment' | 'project';

export interface Deadline {
  id: string;
  courseId: string;
  title: string;
  type: DeadlineType;
  dueDate: Date;
  description?: string;
  scope?: string; // e.g., "Covers Lectures 8-12: Trees, Heaps"
  relatedTopicIds: string[]; // Topics covered in this exam/project
  relatedMicrotopicIds: string[]; // Specific microtopics covered
}

// Resource Types
export type ResourceType = 'video' | 'article' | 'docs' | 'tutorial';

export interface Resource {
  id: string;
  topicId: string;
  title: string;
  url: string;
  type: ResourceType;
  summary?: string;
  duration?: string; // e.g., "15 min", "3 hours"
  thumbnailUrl?: string; // For YouTube videos
  order: number;
}

// Quiz Types
export type QuestionType = 'mcq' | 'short-answer' | 'true-false';

export interface QuizQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[]; // For MCQ
  correctAnswer: string;
  explanation?: string;
  topicId: string;
  microtopicId?: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  topicIds: string[]; // Topics selected for this quiz
  questions: QuizQuestion[];
  createdAt: Date;
}

export interface QuizAttempt {
  quizId: string;
  answers: Record<string, string>; // questionId -> user's answer
  score: number; // 0-100
  completedAt: Date;
}

// Claude API Types
export interface ClaudeParseRequest {
  pdfFiles: File[] | string[]; // Can be File objects or URLs
  courseName: string;
  courseNumber?: string;
  term?: string;
}

export interface ClaudeParseResponse {
  studyMap: StudyMap;
  deadlines: Deadline[];
  rationale?: string; // Claude's explanation of how it parsed
  success: boolean;
  error?: string;
}

export interface ClaudeResourceRequest {
  topicId: string;
  topicTitle: string;
  courseContext: string;
}

export interface ClaudeResourceResponse {
  resources: Resource[];
  success: boolean;
  error?: string;
}

export interface ClaudeQuizRequest {
  topicIds: string[];
  difficulty?: 'intro' | 'intermediate' | 'exam-level';
  questionCount: number;
  questionTypes: QuestionType[];
  courseContext: string;
}

export interface ClaudeQuizResponse {
  questions: QuizQuestion[];
  success: boolean;
  error?: string;
}

// UI State Types
export interface FilterState {
  examId?: string;
  projectId?: string;
  searchQuery?: string;
}

export interface ProgressCalculation {
  completed: number;
  total: number;
  percentage: number;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

// Form Types
export interface CreateCourseFormData {
  name: string;
  courseNumber?: string;
  term?: string;
  syllabusFiles: File[];
}

export interface EditNodeFormData {
  title: string;
  description?: string;
}
