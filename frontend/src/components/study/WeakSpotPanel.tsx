import { useState } from "react";
import type { Topic, ResourceItem, QuizResponsePayload, ResourceSearchResult } from "@studymap/types";
import ResourceSearchModal from "../resources/ResourceSearchModal";

type WeakSpotPanelProps = {
  topic: Topic;
  resources: ResourceItem[];
  quizHistory: QuizResponsePayload[];
  courseTitle: string;
  onClose: () => void;
  onCreateQuiz: (topicId: string) => void;
  onAddResource: (resource: ResourceSearchResult) => void;
};

type TabType = "overview" | "resources" | "questions";

const WeakSpotPanel = ({ topic, resources, quizHistory, courseTitle, onClose, onCreateQuiz, onAddResource }: WeakSpotPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [showResourceSearch, setShowResourceSearch] = useState(false);

  // Extract all questions related to this topic from quiz history
  const topicQuestions = quizHistory.flatMap((quiz) =>
    quiz.questions.filter((q) => q.topicId === topic.id)
  );

  // Filter resources related to this topic
  const topicResources = resources.filter((r) => r.id.includes(topic.id) || r.summary.toLowerCase().includes(topic.title.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative flex h-[85vh] w-full max-w-3xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                🎯 Weak Spot
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{topic.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{topic.description}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            📚 Overview
          </button>
          <button
            onClick={() => setActiveTab("resources")}
            className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === "resources"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            🔗 Resources ({topicResources.length})
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === "questions"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            ❓ Past Questions ({topicQuestions.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Why focus on this?
                </h3>
                <p className="text-sm leading-relaxed text-slate-700">
                  This topic appeared in your recent quizzes and you struggled with some questions. 
                  Understanding <strong>{topic.title}</strong> is crucial for your exam preparation. 
                  Use the resources and review past questions to strengthen your knowledge.
                </p>
              </div>

              {topic.subTopics.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Key Subtopics
                  </h3>
                  <div className="space-y-2">
                    {topic.subTopics.map((subTopic) => (
                      <div
                        key={subTopic.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <h4 className="font-semibold text-slate-800">{subTopic.title}</h4>
                        <p className="mt-1 text-xs text-slate-600">{subTopic.description}</p>
                        {subTopic.microTopics.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {subTopic.microTopics.map((micro) => (
                              <span
                                key={micro.id}
                                className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                              >
                                {micro.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <h3 className="mb-2 text-sm font-semibold text-blue-900">💡 Study Tips</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Review the resources below to reinforce your understanding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Revisit past questions and understand the explanations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Create a focused quiz on this topic to test your improvement</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === "resources" && (
            <div className="space-y-4">
              {/* Find More Resources Button */}
              <button
                onClick={() => setShowResourceSearch(true)}
                className="w-full rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 p-4 text-sm font-semibold text-blue-700 hover:border-blue-400 hover:bg-blue-100 transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="text-xl">🔍</span>
                  <span>Find More Resources with AI</span>
                </span>
              </button>

              {topicResources.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                  <p className="text-sm text-slate-500">No resources found for this topic yet.</p>
                  <p className="mt-2 text-xs text-slate-400">
                    Click "Find More Resources with AI" above to discover helpful materials.
                  </p>
                </div>
              ) : (
                topicResources.map((resource) => (
                  <a
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      {resource.thumbnail && (
                        <img
                          src={resource.thumbnail}
                          alt={resource.title}
                          className="h-16 w-24 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-slate-900">{resource.title}</h4>
                          <span className="text-xs text-blue-600">↗</span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2">{resource.summary}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize text-slate-600">
                            {resource.type}
                          </span>
                          {resource.duration && (
                            <span className="text-xs text-slate-500">⏱️ {resource.duration}</span>
                          )}
                          {resource.aiGenerated && (
                            <span className="text-xs text-purple-600">✨ AI Found</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </a>
                ))
              )}
            </div>
          )}

          {/* Questions Tab */}
          {activeTab === "questions" && (
            <div className="space-y-4">
              {topicQuestions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                  <p className="text-sm text-slate-500">No past questions for this topic yet.</p>
                  <p className="mt-2 text-xs text-slate-400">
                    Take a quiz that includes this topic to see questions here.
                  </p>
                </div>
              ) : (
                topicQuestions.map((question, index) => (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Question {index + 1}
                      </span>
                      <span className="text-xs capitalize text-slate-500">{question.type}</span>
                    </div>
                    <p className="mb-4 text-sm font-medium text-slate-900">{question.prompt}</p>
                    
                    {question.type === "mcq" && question.choices && (
                      <div className="mb-4 space-y-2">
                        {question.choices.map((choice) => (
                          <div
                            key={choice.id}
                            className={`rounded-xl border px-4 py-2.5 text-sm ${
                              choice.correct
                                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                                : "border-slate-200 bg-slate-50 text-slate-700"
                            }`}
                          >
                            <span>{choice.label}</span>
                            {choice.correct && (
                              <span className="ml-2 text-xs font-semibold">✓ Correct</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {question.answer && question.type !== "mcq" && (
                      <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                        <p className="text-xs font-semibold text-emerald-900">Answer:</p>
                        <p className="mt-1 text-sm text-emerald-800">{question.answer}</p>
                      </div>
                    )}

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-700">Explanation:</p>
                      <p className="mt-1 text-sm text-slate-600">{question.explanation}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 p-6">
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            onClick={() => onCreateQuiz(topic.id)}
            className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            🎯 Create Quiz for This Topic
          </button>
        </div>
      </div>

      {/* Resource Search Modal */}
      <ResourceSearchModal
        isOpen={showResourceSearch}
        onClose={() => setShowResourceSearch(false)}
        courseTitle={courseTitle}
        topicId={topic.id}
        topicTitle={topic.title}
        topicDescription={topic.description}
        onResourceSelect={(resource) => {
          onAddResource(resource);
          // Don't close modal, allow user to add multiple resources
        }}
      />
    </div>
  );
};

export default WeakSpotPanel;
