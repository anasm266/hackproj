import axios from "axios";
import type {
  ChatContext,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ParseSyllabusResponse,
  QuizRequestPayload,
  QuizResponsePayload,
  ResourceItem,
  ResourceSearchRequest,
  ResourceSearchResponse,
  StudyMapPayload,
  Topic
} from "@studymap/types";
import type { CourseRecord, QuizResult } from "../store/useStudyPlanStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000 // 2 minutes for Claude API calls
});

export type HealthResponse = {
  status: string;
  timestamp: string;
  claudeEnabled: boolean;
  claudeConfigured: boolean;
  claudeLastChecked: string;
  claudeError?: string | null;
};

export const studyApi = {
  async parseSyllabus(payload: {
    courseName: string;
    courseNumber?: string;
    term?: string;
    files: File[];
  }): Promise<ParseSyllabusResponse> {
    const formData = new FormData();
    formData.append("courseName", payload.courseName);
    if (payload.courseNumber) formData.append("courseNumber", payload.courseNumber);
    if (payload.term) formData.append("term", payload.term);
    payload.files.forEach((file) => formData.append("syllabi", file));

    const { data } = await client.post<ParseSyllabusResponse>("/syllabus/parse", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return data;
  },
  async generateQuiz(payload: QuizRequestPayload): Promise<QuizResponsePayload> {
    const { data } = await client.post<QuizResponsePayload>("/quiz", payload);
    return data;
  },
  async health(): Promise<HealthResponse> {
    const { data } = await client.get<HealthResponse>("/health");
    return data;
  },
  async fetchCourses(): Promise<{ courses: Record<string, CourseRecord>; courseOrder: string[] }> {
    const { data } = await client.get<{ courses: Record<string, CourseRecord>; courseOrder: string[] }>(
      "/courses"
    );
    return data;
  },
  async saveCourse(studyMap: StudyMapPayload): Promise<void> {
    await client.post("/courses", { studyMap });
  },
  async persistTopics(courseId: string, topics: Topic[]): Promise<void> {
    await client.patch(`/courses/${courseId}/topics`, { topics });
  },
  async recordQuizHistory(courseId: string, quiz: QuizResponsePayload): Promise<void> {
    await client.post(`/courses/${courseId}/quizzes`, { quiz });
  },
  async searchResources(payload: ResourceSearchRequest): Promise<ResourceSearchResponse> {
    const { data } = await client.post<ResourceSearchResponse>("/resources/search", payload, {
      timeout: 90000 // 90 seconds for web search + AI analysis
    });
    return data;
  },

  async addResourceToCourse(
    courseId: string,
    topicId: string,
    resource: Omit<ResourceItem, "id"> & { id?: string }
  ): Promise<{ success: boolean; resource?: ResourceItem; error?: string }> {
    const { data } = await client.post(`/courses/${courseId}/resources`, {
      topicId,
      resource
    });
    return data;
  },

  async saveQuizResult(courseId: string, result: QuizResult): Promise<{ success: boolean; course?: CourseRecord }> {
    const { data } = await client.post(`/courses/${courseId}/quiz-results`, result);
    return data;
  },

  async deleteQuiz(courseId: string, quizId: string): Promise<{ success: boolean; course?: CourseRecord }> {
    const { data } = await client.delete(`/courses/${courseId}/quizzes/${quizId}`);
    return data;
  },

  async deleteQuizResult(courseId: string, resultId: string): Promise<{ success: boolean; course?: CourseRecord }> {
    const { data } = await client.delete(`/courses/${courseId}/quiz-results/${resultId}`);
    return data;
  },

  async sendChatMessage(payload: {
    courseId: string;
    conversationId?: string;
    message: string;
    conversationHistory: ChatMessage[];
    context: ChatContext;
    topicContext?: ChatMessage["topicContext"];
  }): Promise<ChatResponse> {
    const { data } = await client.post<ChatResponse>("/chat", payload, {
      timeout: 60000 // 60 seconds for chat responses
    });
    return data;
  },

  async streamChatMessage(payload: {
    courseId: string;
    conversationId?: string;
    message: string;
    conversationHistory: ChatMessage[];
    context: ChatContext;
    topicContext?: ChatMessage["topicContext"];
  }): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...payload,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`Chat stream failed: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("No response body for chat stream");
    }

    return response.body;
  }
};
