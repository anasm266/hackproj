import type { Topic, UpcomingItem } from "./studyMap";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  topicContext?: {
    topicId: string;
    topicTitle: string;
    level: "topic" | "subtopic" | "microtopic";
  };
  metadata?: {
    suggestedActions?: ChatAction[];
    [key: string]: any;
  };
}

export interface ChatAction {
  type: string;
  label: string;
  payload: {
    topicId?: string;
    weakTopicIds?: string[];
    [key: string]: any;
  };
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
  conversationHistory: ChatMessage[];
  context: ChatContext;
  topicContext?: {
    topicId: string;
    topicTitle: string;
    level: "topic" | "subtopic" | "microtopic";
  };
  stream?: boolean;
}

export interface ChatResponse {
  conversationId: string;
  message: ChatMessage;
  suggestedActions?: ChatAction[];
}
