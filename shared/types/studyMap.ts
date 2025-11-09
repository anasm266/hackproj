export type DeadlineType = "exam" | "assignment" | "project" | "misc";

export interface CourseMetadata {
  id: string;
  name: string;
  courseNumber?: string;
  term?: string;
  createdAt: string;
}

export interface MicroTopic {
  id: string;
  title: string;
  description: string;
  tags: string[];
  examScopeIds: string[];
  completed: boolean;
  rationale?: string;
}

export interface SubTopic {
  id: string;
  title: string;
  description: string;
  microTopics: MicroTopic[];
  rationale?: string;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  subTopics: SubTopic[];
  tags: string[];
  rationale?: string;
}

export interface StudyMapPayload {
  course: CourseMetadata;
  topics: Topic[];
  assignments: UpcomingItem[];
  resources: Record<string, ResourceItem[]>;
  exams: ExamScope[];
}

export interface ExamScope {
  id: string;
  title: string;
  description: string;
  date?: string;
  relatedTopicIds: string[];
  uncertainty?: string;
}

export interface UpcomingItem {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  type: DeadlineType;
  relatedTopicIds: string[];
  scopeText?: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  url: string;
  summary: string;
  type: "video" | "article" | "doc" | "interactive";
  duration?: string;
  thumbnail?: string;
  // AI-sourced metadata
  aiGenerated?: boolean;
  aiSearchQuery?: string;
  aiQuality?: "high" | "medium" | "low";
  addedAt?: string;
}

export type QuestionType = "mcq" | "short" | "mix";

export interface QuizQuestionChoice {
  id: string;
  label: string;
  correct: boolean;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  type: QuestionType;
  choices?: QuizQuestionChoice[];
  answer?: string;
  explanation: string;
  relatedMicroTopicIds: string[];
  topicId?: string; // Main topic this question belongs to (for weak spot analysis)
}

export interface QuizTopicSelection {
  id: string;
  title: string;
  microTopics: Array<Pick<MicroTopic, "id" | "title" | "description" | "examScopeIds">>;
}

export interface QuizRequestPayload {
  courseId: string;
  topics: QuizTopicSelection[];
  difficulty: "auto" | "intro" | "exam";
  length: number;
  questionType: QuestionType;
}

export interface QuizResponsePayload {
  quizId: string;
  generatedAt: string;
  questions: QuizQuestion[];
  topics?: QuizTopicSelection[]; // Topics used to generate the quiz
}

export interface ParseSyllabusRequest {
  courseName: string;
  courseNumber?: string;
  term?: string;
}

export interface ParseSyllabusResponse {
  studyMap: StudyMapPayload;
  message: string;
  warnings?: string[];
}

// Resource Search Types
export type ResourceType = "learn" | "practice" | "both";

export type ResourceContentType = "video" | "article" | "tutorial" | "interactive" | "documentation" | "exercise" | "simulation";

export type ResourceQuality = "high" | "medium" | "low";

export type SearchQuality = "excellent" | "good" | "poor";

export interface ResourceSearchRequest {
  courseTitle: string;
  topicTitle: string;
  topicDescription?: string;
  resourceType: ResourceType;
  maxResults?: number;
}

export interface ResourceSearchResult {
  url: string;
  title: string;
  summary: string;
  resourceType: string;
  quality: ResourceQuality;
  contentType: string;
}

export interface ResourceSearchResponse {
  success: boolean;
  resources: ResourceSearchResult[];
  searchQuality: SearchQuality;
  message?: string;
  error?: string;
  details?: string;
}

// Chat Types
export type ChatMessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp: string;
  topicContext?: {
    topicId: string;
    topicTitle: string;
    level: "topic" | "subtopic" | "microtopic";
  };
  metadata?: {
    suggestedActions?: ChatAction[];
    relatedTopics?: string[];
    resourceSuggestions?: ResourceSearchResult[];
  };
}

export interface ChatAction {
  type: "navigate" | "add_resource" | "mark_complete" | "generate_quiz" | "create_subtopic";
  label: string;
  payload: Record<string, any>;
}

export interface ChatConversation {
  id: string;
  courseId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatContext {
  courseId: string;
  courseName: string;
  topics: Topic[];
  completedMicroTopicIds: string[];
  upcomingDeadlines: UpcomingItem[];
  quizHistory?: {
    weakTopicIds: string[];
    recentScores: number[];
  };
  syllabusText?: string;
}

export interface ChatRequest {
  courseId: string;
  conversationId?: string;
  message: string;
  context: ChatContext;
  topicContext?: ChatMessage["topicContext"];
}

export interface ChatResponse {
  conversationId: string;
  message: ChatMessage;
  suggestedActions?: ChatAction[];
}
