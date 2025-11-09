import { useState, KeyboardEvent } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Ask me anything about your course..."
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex gap-2 items-end">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed max-h-32 overflow-y-auto"
          style={{
            minHeight: "48px",
            maxHeight: "128px"
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "48px";
            target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
          }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          title="Send message (Enter)"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="mt-2 text-xs text-gray-500 px-1">
        Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded">Enter</kbd> to
        send, <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded">Shift+Enter</kbd> for
        new line
      </div>
    </div>
  );
}
