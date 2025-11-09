import type { ChatMessage as ChatMessageType, ChatAction } from "@studymap/types";
import { UserIcon, SparklesIcon } from "@heroicons/react/24/outline";
import MarkdownRenderer from "./MarkdownRenderer";

interface ChatMessageProps {
  message: ChatMessageType;
  onActionClick?: (action: ChatAction) => void;
}

export default function ChatMessage({ message, onActionClick }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-blue-600" : "bg-purple-600"
        }`}
      >
        {isUser ? (
          <UserIcon className="w-5 h-5 text-white" />
        ) : (
          <SparklesIcon className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[75%] ${isUser ? "text-right" : "text-left"}`}>
        {/* Message Bubble */}
        <div
          className={`inline-block px-4 py-3 rounded-lg ${
            isUser
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-900 border border-gray-200"
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          ) : (
            <MarkdownRenderer content={message.content} isUser={isUser} />
          )}
        </div>

        {/* Topic Context */}
        {message.topicContext && (
          <div className="mt-1 text-xs text-gray-500 px-2">
            Context: {message.topicContext.topicTitle}
          </div>
        )}

        {/* Suggested Actions */}
        {!isUser && message.metadata?.suggestedActions && message.metadata.suggestedActions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.metadata.suggestedActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => onActionClick?.(action)}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className={`mt-1 text-xs text-gray-400 px-2 ${isUser ? "text-right" : "text-left"}`}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </div>
      </div>
    </div>
  );
}
