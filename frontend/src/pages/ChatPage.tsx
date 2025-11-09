import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChatBubbleLeftRightIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { useStudyPlanStore } from "../store/useStudyPlanStore";
import { studyApi } from "../lib/api";
import ChatMessage from "../components/chat/ChatMessage";
import ChatInput from "../components/chat/ChatInput";
import toast from "react-hot-toast";

// Inline types until shared types are rebuilt
type ChatMessageType = {
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
    suggestedActions?: any[];
    [key: string]: any;
  };
};

type ChatAction = {
  type: string;
  label: string;
  payload: {
    topicId?: string;
    weakTopicIds?: string[];
    [key: string]: any;
  };
};

type ChatContext = {
  courseId: string;
  courseName: string;
  topics: any[];
  completedMicroTopicIds: string[];
  upcomingDeadlines: any[];
  quizHistory?: {
    weakTopicIds: string[];
    recentScores: number[];
  };
};

export default function ChatPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const courses = useStudyPlanStore((state) => state.courses);
  const course = courseId ? courses[courseId] : null;

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Give time for courses to load before checking
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Redirect if course not found after initialization
  useEffect(() => {
    if (!isInitializing && (!courseId || !course)) {
      console.log("Course not found:", { courseId, course, allCourses: Object.keys(courses) });
      toast.error("Course not found");
      navigate("/dashboard");
    }
  }, [courseId, course, navigate, isInitializing, courses]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!courseId || !course) {
    return null;
  }

  // Build context for the chatbot
  const buildContext = (): ChatContext => {
    const completedMicroTopicIds: string[] = [];
    course.studyMap.topics.forEach((topic) => {
      topic.subTopics.forEach((subTopic) => {
        subTopic.microTopics.forEach((micro) => {
          if (micro.completed) {
            completedMicroTopicIds.push(micro.id);
          }
        });
      });
    });

    // Get weak topics from quiz results
    const weakTopicIds: string[] = [];
    const recentScores: number[] = [];

    if (course.quizResults) {
      course.quizResults.forEach((result) => {
        recentScores.push(result.score);

        // Add weak topics from quiz results (topics with lower scores)
        if (result.weakTopicIds && result.weakTopicIds.length > 0) {
          result.weakTopicIds.forEach((topicId) => {
            if (!weakTopicIds.includes(topicId)) {
              weakTopicIds.push(topicId);
            }
          });
        }
      });
    }

    return {
      courseId: course.studyMap.course.id,
      courseName: course.studyMap.course.name,
      topics: course.studyMap.topics,
      completedMicroTopicIds,
      upcomingDeadlines: course.studyMap.assignments || [],
      quizHistory: {
        weakTopicIds,
        recentScores: recentScores.slice(-5)
      }
    };
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);

    // Add user message immediately
    const userMessage: ChatMessageType = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const context = buildContext();

      // Use non-streaming for simplicity (can switch to streaming later)
      const response = await studyApi.sendChatMessage({
        courseId,
        conversationId,
        message,
        conversationHistory: messages,
        context
      });

      setConversationId(response.conversationId);
      setMessages((prev) => [...prev, response.message]);
    } catch (error) {
      console.error("Failed to send chat message:", error);
      toast.error("Failed to send message. Please try again.");

      // Add error message
      const errorMessage: ChatMessageType = {
        id: `msg-error-${Date.now()}`,
        role: "assistant",
        content: "I'm sorry, I encountered an error processing your message. Please try again.",
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: ChatAction) => {
    console.log("Action clicked:", action);

    switch (action.type) {
      case "navigate":
        if (action.payload.topicId) {
          navigate(`/courses/${courseId}/map?topic=${action.payload.topicId}`);
        }
        break;
      case "generate_quiz":
        navigate(`/courses/${courseId}/quiz`);
        break;
      case "add_resource":
        navigate(`/courses/${courseId}/resources`);
        break;
      case "mark_complete":
        toast.success("Topic marked as complete!");
        break;
      case "study_planner":
        toast("Study planner feature - coming soon!");
        // In a full implementation, this would open a modal or navigate to a study planner view
        break;
      case "weak_spot_coach":
        // Navigate to quiz with weak topics pre-selected
        const weakTopicIds = action.payload.weakTopicIds?.join(",") || "";
        navigate(`/courses/${courseId}/quiz?weakTopics=${weakTopicIds}`);
        toast("Generating quiz for your weak topics...");
        break;
      case "exam_prep":
        toast("Exam preparation mode activated!");
        navigate(`/courses/${courseId}/quiz?mode=exam`);
        break;
      case "view_deadlines":
        navigate(`/courses/${courseId}/upcoming`);
        break;
      case "concept_map":
        toast("Concept map feature - explore topic relationships!");
        navigate(`/courses/${courseId}/map`);
        break;
      case "view_progress":
        navigate(`/courses/${courseId}/map`);
        toast("View your progress on the study map!");
        break;
      default:
        console.log("Unknown action type:", action.type);
        toast(`Action: ${action.label}`);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(undefined);
    toast.success("Started new conversation");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Study Assistant</h1>
            <p className="text-sm text-gray-600">{course.studyMap.course.name}</p>
          </div>
        </div>

        <button
          onClick={handleNewConversation}
          disabled={messages.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4" />
          New Conversation
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to your Study Assistant!
            </h2>
            <p className="text-gray-600 mb-6 max-w-md">
              Ask me anything about your course topics, get study tips, practice questions, or help
              with understanding concepts.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
              <button
                onClick={() => handleSendMessage("What topics should I focus on first?")}
                className="px-4 py-3 text-sm text-left bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <span className="font-medium text-gray-900">What should I study first?</span>
                <p className="text-xs text-gray-500 mt-1">Get personalized study recommendations</p>
              </button>
              <button
                onClick={() => handleSendMessage("Quiz me on a random topic")}
                className="px-4 py-3 text-sm text-left bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <span className="font-medium text-gray-900">Quiz me</span>
                <p className="text-xs text-gray-500 mt-1">Practice with quick questions</p>
              </button>
              <button
                onClick={() => handleSendMessage("Explain the most difficult topics")}
                className="px-4 py-3 text-sm text-left bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <span className="font-medium text-gray-900">Explain difficult topics</span>
                <p className="text-xs text-gray-500 mt-1">Break down complex concepts</p>
              </button>
              <button
                onClick={() => handleSendMessage("How should I prepare for exams?")}
                className="px-4 py-3 text-sm text-left bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <span className="font-medium text-gray-900">Exam preparation</span>
                <p className="text-xs text-gray-500 mt-1">Get study strategies</p>
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onActionClick={handleActionClick}
              />
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="inline-block px-4 py-3 rounded-lg bg-gray-100 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={isLoading}
        placeholder={
          messages.length === 0
            ? "Ask me anything about your course..."
            : "Continue the conversation..."
        }
      />
    </div>
  );
}
