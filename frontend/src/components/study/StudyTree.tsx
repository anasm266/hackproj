import { useState } from "react";
import type { MicroTopic, Topic } from "@studymap/types";
import { topicProgress } from "../../lib/progress";
import type { StudyNode } from "./types";
import type { AddNodeInput, ReorderNodeInput } from "../../types/studyActions";

type StudyTreeProps = {
  topics: Topic[];
  selectedNodeId?: string;
  onSelect?: (node: StudyNode) => void;
  editable?: boolean;
  onTitleChange?: (nodeId: string, value: string) => void;
  showCheckboxes?: boolean;
  onToggleMicroTopic?: (microTopicId: string) => void;
  microTopicFilter?: (micro: MicroTopic) => boolean;
  onReorderNode?: (payload: ReorderNodeInput) => void;
  onAddNode?: (payload: AddNodeInput) => void;
  onDeleteNode?: (payload: { level: "topic" | "subtopic" | "micro"; nodeId: string; parentTopicId?: string; parentSubTopicId?: string }) => void;
};

const StudyTree = ({
  topics,
  selectedNodeId,
  onSelect,
  editable,
  onTitleChange,
  showCheckboxes,
  onToggleMicroTopic,
  microTopicFilter,
  onReorderNode,
  onAddNode,
  onDeleteNode
}: StudyTreeProps) => {
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    topics.forEach(topic => { initial[topic.id] = true; });
    return initial;
  });
  const [expandedSubTopics, setExpandedSubTopics] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    topics.forEach(topic => {
      topic.subTopics.forEach(sub => { initial[sub.id] = true; });
    });
    return initial;
  });
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const toggleTopic = (id: string) => {
    setExpandedTopics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSubTopic = (id: string) => {
    setExpandedSubTopics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const startEditing = (nodeId: string, current: string) => {
    if (!editable) return;
    setEditingNode(nodeId);
    setEditingValue(current);
  };

  const commitEdit = () => {
    if (editingNode && editingValue.trim() && onTitleChange) {
      onTitleChange(editingNode, editingValue.trim());
    }
    setEditingNode(null);
    setEditingValue("");
  };

  const filteredMicroTopics = (microTopics: MicroTopic[]) =>
    microTopicFilter ? microTopics.filter(microTopicFilter) : microTopics;

  // Helper to check if a subtopic has any matching microtopics
  const hasMatchingMicroTopics = (subTopic: Topic["subTopics"][number]) => {
    const filtered = filteredMicroTopics(subTopic.microTopics);
    return filtered.length > 0;
  };

  // Helper to check if a topic has any matching subtopics/microtopics
  const hasMatchingContent = (topic: Topic) => {
    return topic.subTopics.some(hasMatchingMicroTopics);
  };

  // Calculate filtered progress for a topic (only counting filtered microtopics)
  const getFilteredTopicProgress = (topic: Topic) => {
    const allMicros = topic.subTopics.flatMap(sub => filteredMicroTopics(sub.microTopics));
    const completed = allMicros.filter(micro => micro.completed).length;
    const total = allMicros.length || 1;
    return {
      completed,
      total,
      percent: Math.round((completed / total) * 100)
    };
  };

  const renderMicroTopics = (topic: Topic, subTopic: Topic["subTopics"][number]) => {
    const microTopics = filteredMicroTopics(subTopic.microTopics);

    if (!microTopics.length) {
      return (
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white/50 p-4 text-center">
          <svg className="mx-auto h-8 w-8 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-xs text-slate-500 font-medium">No microtopics match the current filter</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        {microTopics.map((micro) => (
          <div 
            key={micro.id} 
            className="flex items-center gap-2"
            data-micro-id={micro.id}
            data-subtopic-id={subTopic.id}
            data-topic-id={topic.id}
          >
            <label
              className={`group flex-1 flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedNodeId === micro.id
                  ? "bg-slate-100 ring-2 ring-slate-700 shadow-sm"
                  : "bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-400 hover:shadow-sm"
              }`}
              onClick={() => onSelect?.({ type: "micro", data: micro })}
            >
              {showCheckboxes && (
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={micro.completed}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleMicroTopic?.(micro.id);
                    }}
                    className="h-5 w-5 rounded-md border-2 border-slate-300 text-slate-700 focus:ring-2 focus:ring-slate-500 focus:ring-offset-0 cursor-pointer transition-all"
                  />
                </div>
              )}
              <div className="flex-1 flex items-center gap-2">
                <div className={`w-1 h-1 rounded-full ${micro.completed ? 'bg-green-500' : 'bg-slate-300'} transition-colors`}></div>
                <span className={`text-sm transition-all ${
                  selectedNodeId === micro.id 
                    ? "text-slate-900 font-semibold" 
                    : micro.completed 
                      ? "text-slate-600" 
                      : "text-slate-800 font-medium"
                }`}>
                  {micro.title}
                </span>
              </div>
              {micro.completed && (
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </label>
            {editable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteNode?.({ 
                    level: "micro", 
                    nodeId: micro.id, 
                    parentTopicId: topic.id,
                    parentSubTopicId: subTopic.id
                  });
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                title="Delete microtopic"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {topics
        .filter(topic => !microTopicFilter || hasMatchingContent(topic))
        .map((topic, topicIndex) => {
        const expanded = expandedTopics[topic.id] ?? true;
        const progress = microTopicFilter ? getFilteredTopicProgress(topic) : topicProgress(topic);
        const isTopicSelected = selectedNodeId === topic.id;

        return (
          <div
            key={topic.id}
            data-topic-id={topic.id}
            className={`group rounded-2xl backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
              isTopicSelected 
                ? "bg-slate-50 border-2 border-slate-800" 
                : "bg-white border border-slate-200"
            }`}
          >
            <div className={`flex items-center justify-between p-5 ${
              isTopicSelected 
                ? "bg-slate-50" 
                : "bg-slate-50/50"
            }`}>
              {editable && (
                <div className="flex flex-col gap-1 mr-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (topicIndex > 0) {
                        onReorderNode?.({ nodeId: topic.id, direction: "up", level: "topic" });
                      }
                    }}
                    disabled={topicIndex === 0}
                    className={`p-1 rounded hover:bg-slate-200 transition-colors ${
                      topicIndex === 0 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="Move up"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (topicIndex < topics.length - 1) {
                        onReorderNode?.({ nodeId: topic.id, direction: "down", level: "topic" });
                      }
                    }}
                    disabled={topicIndex === topics.length - 1}
                    className={`p-1 rounded hover:bg-slate-200 transition-colors ${
                      topicIndex === topics.length - 1 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="Move down"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}
              <button
                type="button"
                className="flex-1 text-left"
                onClick={() => {
                  toggleTopic(topic.id);
                  onSelect?.({ type: "topic", data: topic });
                }}
              >
                <div className="transition-all duration-200">
                  {editingNode === topic.id ? (
                    <input
                      value={editingValue}
                      onChange={(event) => setEditingValue(event.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(event) => event.key === "Enter" && commitEdit()}
                      className="w-full rounded-xl border-2 border-slate-400 px-4 py-2 text-lg font-bold text-slate-900 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-200 bg-white shadow-sm"
                      autoFocus
                    />
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg text-white text-xs font-bold shadow-sm ${
                          isTopicSelected
                            ? "bg-slate-800"
                            : "bg-slate-700"
                        }`}>
                          {progress.percent}%
                        </div>
                        <h3 className={`font-bold text-lg tracking-tight ${
                          isTopicSelected ? "text-slate-900" : "text-slate-900"
                        }`}>{topic.title}</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`flex-1 h-2 rounded-full overflow-hidden ${
                          isTopicSelected ? "bg-slate-200" : "bg-slate-100"
                        }`}>
                          <div
                            className="h-full bg-slate-700 transition-all duration-500 rounded-full"
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                        <p className={`text-xs font-semibold whitespace-nowrap ${
                          isTopicSelected ? "text-slate-700" : "text-slate-500"
                        }`}>
                          {progress.completed}/{progress.total}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </button>
              <div className="flex items-center gap-1 ml-3">
                {editable && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(topic.id, topic.title);
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Edit title"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNode?.({ level: "topic", nodeId: topic.id });
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete topic"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTopic(topic.id);
                  }}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <svg
                    className={`h-5 w-5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {expanded && (
              <div className="flex flex-col gap-3 p-5 pt-0 animate-in slide-in-from-top-2 fade-in duration-300">
                {topic.subTopics
                  .filter(subTopic => !microTopicFilter || hasMatchingMicroTopics(subTopic))
                  .map((subTopic, subTopicIndex) => {
                  const expandedSub = expandedSubTopics[subTopic.id] ?? true;
                  const isSubTopicSelected = selectedNodeId === subTopic.id;

                  return (
                    <div
                      key={subTopic.id}
                      data-subtopic-id={subTopic.id}
                      data-topic-id={topic.id}
                      className={`rounded-xl border overflow-hidden hover:border-slate-400 transition-all duration-200 ${
                        isSubTopicSelected
                          ? "bg-slate-50 border-2 border-slate-700"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between p-4">
                        {editable && (
                          <div className="flex flex-col gap-1 mr-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (subTopicIndex > 0) {
                                  onReorderNode?.({ 
                                    nodeId: subTopic.id, 
                                    direction: "up", 
                                    level: "subtopic",
                                    parentTopicId: topic.id
                                  });
                                }
                              }}
                              disabled={subTopicIndex === 0}
                              className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${
                                subTopicIndex === 0 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:text-slate-900"
                              }`}
                              title="Move up"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (subTopicIndex < topic.subTopics.length - 1) {
                                  onReorderNode?.({ 
                                    nodeId: subTopic.id, 
                                    direction: "down", 
                                    level: "subtopic",
                                    parentTopicId: topic.id
                                  });
                                }
                              }}
                              disabled={subTopicIndex === topic.subTopics.length - 1}
                              className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${
                                subTopicIndex === topic.subTopics.length - 1 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:text-slate-900"
                              }`}
                              title="Move down"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          className="flex-1 text-left"
                          onClick={() => {
                            toggleSubTopic(subTopic.id);
                            onSelect?.({ type: "subtopic", data: subTopic });
                          }}
                        >
                          <div className="transition-all duration-200">
                            {editingNode === subTopic.id ? (
                              <input
                                value={editingValue}
                                onChange={(event) => setEditingValue(event.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={(event) => event.key === "Enter" && commitEdit()}
                                className="w-full rounded-lg border-2 border-slate-400 px-3 py-1.5 text-sm font-semibold text-slate-900 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-200 bg-white shadow-sm"
                                autoFocus
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-5 rounded-full ${
                                  isSubTopicSelected
                                    ? "bg-slate-800"
                                    : "bg-slate-600"
                                }`}></div>
                                <h4 className={`font-semibold ${
                                  isSubTopicSelected ? "text-slate-900" : "text-slate-800"
                                }`}>{subTopic.title}</h4>
                              </div>
                            )}
                          </div>
                        </button>
                        <div className="flex items-center gap-1 ml-2">
                          {editable && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(subTopic.id, subTopic.title);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                title="Edit title"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteNode?.({ level: "subtopic", nodeId: subTopic.id, parentTopicId: topic.id });
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete subtopic"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSubTopic(subTopic.id);
                            }}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 rounded-lg hover:bg-white transition-colors"
                          >
                            <svg
                              className={`h-4 w-4 transition-transform duration-300 ${expandedSub ? "rotate-180" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {expandedSub && (
                        <div className="pb-4 px-4 animate-in slide-in-from-top-1 fade-in duration-200">
                          {renderMicroTopics(topic, subTopic)}
                          {editable && (
                            <button
                              onClick={() => {
                                const title = prompt("Enter microtopic title:");
                                if (title?.trim()) {
                                  onAddNode?.({
                                    level: "micro",
                                    title: title.trim(),
                                    parentTopicId: topic.id,
                                    parentSubTopicId: subTopic.id
                                  });
                                }
                              }}
                              className="mt-3 w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-slate-300 bg-white hover:border-slate-500 hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition-all duration-200 group"
                            >
                              <svg className="h-4 w-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <span className="text-sm font-semibold">Add Microtopic</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {editable && (
                  <button
                    onClick={() => {
                      const title = prompt("Enter subtopic title:");
                      if (title?.trim()) {
                        onAddNode?.({
                          level: "subtopic",
                          title: title.trim(),
                          parentTopicId: topic.id
                        });
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-slate-300 bg-white/50 hover:border-slate-500 hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition-all duration-200 group"
                  >
                    <svg className="h-4 w-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm font-semibold">Add Subtopic</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
      
      {/* Show message when filter is active and hiding topics */}
      {microTopicFilter && topics.filter(topic => !hasMatchingContent(topic)).length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <svg className="h-5 w-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-blue-900">
            <span className="font-semibold">{topics.filter(topic => !hasMatchingContent(topic)).length} topic{topics.filter(topic => !hasMatchingContent(topic)).length !== 1 ? 's' : ''}</span> hidden by current exam filter
          </p>
        </div>
      )}
      
      {editable && (
        <button
          onClick={() => {
            const title = prompt("Enter topic title:");
            if (title?.trim()) {
              onAddNode?.({
                level: "topic",
                title: title.trim()
              });
            }
          }}
          className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl border-2 border-dashed border-slate-300 bg-white/80 hover:border-slate-600 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all duration-200 group shadow-sm hover:shadow-md"
        >
          <svg className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-base font-bold">Add Topic</span>
        </button>
      )}
    </div>
  );
};

export default StudyTree;
