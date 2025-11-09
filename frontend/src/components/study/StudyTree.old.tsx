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
  onAddNode
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

  const renderMicroTopics = (topic: Topic, subTopic: Topic["subTopics"][number]) => {
    const microTopics = filteredMicroTopics(subTopic.microTopics);

    if (!microTopics.length) {
      return (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-100/70 p-3 text-xs text-slate-500">
          No microtopics match the current filter.
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2 pl-4">
        {microTopics.map((micro) => (
          <label
            key={micro.id}
            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition ${
              selectedNodeId === micro.id
                ? "bg-blue-100 ring-2 ring-blue-500"
                : "hover:bg-slate-100"
            }`}
            onClick={() => onSelect?.({ type: "micro", data: micro })}
          >
            {showCheckboxes && (
              <input
                type="checkbox"
                checked={micro.completed}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleMicroTopic?.(micro.id);
                }}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            )}
            <span className={`flex-1 ${selectedNodeId === micro.id ? "text-slate-900 font-medium" : "text-slate-800"}`}>
              {micro.title}
            </span>
          </label>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {topics.map((topic) => {
        const expanded = expandedTopics[topic.id] ?? true;
        const progress = topicProgress(topic);
        const isTopicSelected = selectedNodeId === topic.id;

        return (
          <div
            key={topic.id}
            className="p-4 bg-white rounded-xl shadow-sm border border-slate-200"
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="flex-1 text-left"
                onClick={() => {
                  toggleTopic(topic.id);
                  onSelect?.({ type: "topic", data: topic });
                }}
              >
                <div className={isTopicSelected ? "ring-2 ring-blue-500 ring-opacity-50 rounded-lg p-2 -m-2" : ""}>
                  {editingNode === topic.id ? (
                    <input
                      value={editingValue}
                      onChange={(event) => setEditingValue(event.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(event) => event.key === "Enter" && commitEdit()}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-lg font-bold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      autoFocus
                    />
                  ) : (
                    <>
                      <h3 className="font-bold text-lg text-slate-900">{topic.title}</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {progress.completed}/{progress.total} completed
                      </p>
                    </>
                  )}
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTopic(topic.id);
                }}
                className="text-slate-500 cursor-pointer ml-2"
              >
                <svg
                  className={`h-6 w-6 transition-transform ${expanded ? "" : "-rotate-90"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {expanded && (
              <div className="flex flex-col gap-2 mt-4">
                {topic.subTopics.map((subTopic) => {
                  const expandedSub = expandedSubTopics[subTopic.id] ?? true;
                  const isSubTopicSelected = selectedNodeId === subTopic.id;

                  return (
                    <div
                      key={subTopic.id}
                      className="p-3 bg-slate-100 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          className="flex-1 text-left"
                          onClick={() => {
                            toggleSubTopic(subTopic.id);
                            onSelect?.({ type: "subtopic", data: subTopic });
                          }}
                        >
                          <div className={isSubTopicSelected ? "ring-2 ring-blue-500 ring-opacity-50 rounded-lg p-2 -m-2" : ""}>
                            {editingNode === subTopic.id ? (
                              <input
                                value={editingValue}
                                onChange={(event) => setEditingValue(event.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={(event) => event.key === "Enter" && commitEdit()}
                                className="w-full rounded-lg border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                autoFocus
                              />
                            ) : (
                              <h4 className="font-semibold text-slate-700">{subTopic.title}</h4>
                            )}
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSubTopic(subTopic.id);
                          }}
                          className="text-slate-500 cursor-pointer ml-2"
                        >
                          <svg
                            className={`h-5 w-5 transition-transform ${expandedSub ? "" : "-rotate-90"}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {expandedSub && (
                        <div className="mt-3">
                          {renderMicroTopics(topic, subTopic)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StudyTree;
