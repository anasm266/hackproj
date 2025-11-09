import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface MarkdownRendererProps {
  content: string;
  isUser?: boolean;
}

export default function MarkdownRenderer({ content, isUser }: MarkdownRendererProps) {
  // Custom components for beautiful rendering
  const components: Components = {
    // Headings - make them bold and slightly larger
    h1: ({ children }) => (
      <h1 className="text-xl font-bold mb-2 mt-4">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-base font-bold mb-1 mt-2">{children}</h3>
    ),

    // Paragraphs - proper spacing
    p: ({ children }) => (
      <p className="mb-2 last:mb-0">{children}</p>
    ),

    // Lists - styled with proper spacing
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="ml-2">{children}</li>
    ),

    // Bold and italic
    strong: ({ children }) => (
      <strong className="font-semibold">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic">{children}</em>
    ),

    // Code blocks - inline and block
    code: ({ inline, className, children }) => {
      if (inline) {
        return (
          <code className="px-1.5 py-0.5 bg-gray-800 text-gray-100 rounded text-sm font-mono">
            {children}
          </code>
        );
      }
      return (
        <pre className="bg-gray-800 text-gray-100 rounded-lg p-3 overflow-x-auto my-2">
          <code className="text-sm font-mono">{children}</code>
        </pre>
      );
    },

    // Blockquotes
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-2 italic text-gray-700">
        {children}
      </blockquote>
    ),

    // Links
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline"
      >
        {children}
      </a>
    ),

    // Horizontal rules
    hr: () => <hr className="my-3 border-gray-300" />,
  };

  return (
    <div className={`prose prose-sm max-w-none ${isUser ? "text-white" : "text-gray-900"}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
