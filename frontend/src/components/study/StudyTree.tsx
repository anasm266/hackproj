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

const caretClasses =
  "h-5 w-5 rounded-full border border-slate-300 flex items-center justify-center text-xs text-slate-500";

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
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [expandedSubTopics, setExpandedSubTopics] = useState<Record<string, boolean>>({});
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [pendingAdd, setPendingAdd] = useState<{
    level: AddNodeInput["level"];
    parentTopicId?: string;
    parentSubTopicId?: string;
  } | null>(null);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [newNodeDescription, setNewNodeDescription] = useState("");

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

  const beginAdd = (context: {
    level: AddNodeInput["level"];
    parentTopicId?: string;
    parentSubTopicId?: string;
  }) => {
    if (!onAddNode) return;
    setPendingAdd(context);
    setNewNodeTitle("");
    setNewNodeDescription("");
  };

  const cancelAdd = () => {
    setPendingAdd(null);
    setNewNodeTitle("");
    setNewNodeDescription("");
  };

  const submitAdd = () => {
    if (!pendingAdd || !onAddNode) return;
    const title = newNodeTitle.trim();
    if (!title) return;
    onAddNode({
      ...pendingAdd,
      title,
      description: newNodeDescription.trim() || undefined
    });
    cancelAdd();
  };

  const isAdding = (
    level: AddNodeInput["level"],
    parentTopicId?: string,
    parentSubTopicId?: string
  ) =>
    pendingAdd &&
    pendingAdd.level === level &&
    pendingAdd.parentTopicId === parentTopicId &&
    pendingAdd.parentSubTopicId === parentSubTopicId;

  const AddForm = ({
    titlePlaceholder = "Title",
    descriptionPlaceholder = "Description (optional)"
  }: {
    titlePlaceholder?: string;
    descriptionPlaceholder?: string;
  }) => (
    <form
      className="mt-3 space-y-2 rounded-xl border border-dashed border-slate-300 bg-white p-3"
      onSubmit={(event) => {
        event.preventDefault();
        submitAdd();
      }}
    >
      <input
        value={newNodeTitle}
        onChange={(event) => setNewNodeTitle(event.target.value)}
        placeholder={titlePlaceholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <textarea
        value={newNodeDescription}
        onChange={(event) => setNewNodeDescription(event.target.value)}
        placeholder={descriptionPlaceholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        rows={2}
      />
      <div className="flex gap-2 text-xs">
        <button
          type="submit"
          className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white disabled:opacity-50"
          disabled={!newNodeTitle.trim()}
        >
          Add
        </button>
        <button
          type="button"
          onClick={cancelAdd}
          className="rounded-full border border-slate-200 px-3 py-1 text-slate-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );

  const renderMicroTopics = (topic: Topic, subTopic: Topic["subTopics"][number]) => {
    const microTopics = filteredMicroTopics(subTopic.microTopics);

    if (!microTopics.length) {
      return (
        <>
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-500">
            No microtopics match the current filter.
          </div>
          {editable && onAddNode && (
            <div className="pt-2">
              {isAdding("micro", topic.id, subTopic.id) ? (
                <AddForm titlePlaceholder="Microtopic title" />
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    beginAdd({
                      level: "micro",
                      parentTopicId: topic.id,
                      parentSubTopicId: subTopic.id
                    })
                  }
                  className="text-xs font-semibold text-blue-600"
                >
                  + Add microtopic
                </button>
              )}
            </div>
          )}
        </>
      );
    }

    return (
      <>
        {microTopics.map((micro, microIndex) => (
          <label
            key={micro.id}
            className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-sm ${
              selectedNodeId === micro.id ? "border-blue-500 bg-blue-50" : "border-transparent bg-white"
            }`}
          >
            {showCheckboxes && (
              <input
                type="checkbox"
                checked={micro.completed}
                onChange={() => onToggleMicroTopic?.(micro.id)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            )}
            <div className="flex-1 cursor-pointer" onClick={() => onSelect?.({ type: "micro", data: micro })}>
              {editingNode === micro.id ? (
                <input
                  value={editingValue}
                  onChange={(event) => setEditingValue(event.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(event) => event.key === "Enter" && commitEdit()}
                  className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
                  autoFocus
                />
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2 text-slate-800">
                    {micro.title}
                    {editable && (
                      <>
                        <button
                          className="text-xs text-slate-400"
                          onClick={(event) => {
                            event.stopPropagation();
                            startEditing(micro.id, micro.title);
                          }}
                        >
                          Edit
                        </button>
                        {onReorderNode && (
                          <div className="flex gap-1 text-[10px] uppercase text-slate-400">
                            <button
                              type="button"
                              disabled={microIndex === 0}
                              className="disabled:opacity-40"
                              onClick={(event) => {
                                event.stopPropagation();
                                onReorderNode({
                                  level: "micro",
                                  nodeId: micro.id,
                                  direction: "up",
                                  parentTopicId: topic.id,
                                  parentSubTopicId: subTopic.id
                                });
                              }}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              disabled={microIndex === microTopics.length - 1}
                              className="disabled:opacity-40"
                              onClick={(event) => {
                                event.stopPropagation();
                                onReorderNode({
                                  level: "micro",
                                  nodeId: micro.id,
                                  direction: "down",
                                  parentTopicId: topic.id,
                                  parentSubTopicId: subTopic.id
                                });
                              }}
                            >
                              ↓
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{micro.description}</p>
                </div>
              )}
            </div>
          </label>
        ))}
        {editable && onAddNode && (
          <div className="pt-1">
            {isAdding("micro", topic.id, subTopic.id) ? (
              <AddForm titlePlaceholder="Microtopic title" />
            ) : (
              <button
                type="button"
                onClick={() =>
                  beginAdd({
                    level: "micro",
                    parentTopicId: topic.id,
                    parentSubTopicId: subTopic.id
                  })
                }
                className="text-xs font-semibold text-blue-600"
              >
                + Add microtopic
              </button>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-4">
      {editable && onAddNode && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-3 text-sm text-slate-600">
          {isAdding("topic") ? (
            <AddForm titlePlaceholder="Topic title" />
          ) : (
            <button
              type="button"
              className="font-semibold text-blue-600"
              onClick={() => beginAdd({ level: "topic" })}
            >
              + Add topic
            </button>
          )}
        </div>
      )}
      {topics.map((topic, topicIndex) => {
        const expanded = expandedTopics[topic.id] ?? true;
        const progress = topicProgress(topic);
        const isFirstTopic = topicIndex === 0;
        const isLastTopic = topicIndex === topics.length - 1;

        return (
          <div key={topic.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <button
                className="flex w-full items-center gap-3 text-left"
                onClick={() => {
                  toggleTopic(topic.id);
                  onSelect?.({ type: "topic", data: topic });
                }}
              >
                <span className={caretClasses}>{expanded ? "-" : "+"}</span>
                <div className="flex-1">
                  {editingNode === topic.id ? (
                    <input
                      value={editingValue}
                      onChange={(event) => setEditingValue(event.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(event) => event.key === "Enter" && commitEdit()}
                      className="w-full rounded-md border border-slate-200 px-2 py-1 text-base font-semibold"
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">{topic.title}</h3>
                      {editable && (
                        <button
                          className="text-xs text-slate-400"
                          onClick={(event) => {
                            event.stopPropagation();
                            startEditing(topic.id, topic.title);
                          }}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-slate-500">{topic.description}</p>
                </div>
                <div className="text-xs font-semibold text-blue-600">{progress.percent}%</div>
              </button>
              {editable && onReorderNode && (
                <div className="flex gap-1 pt-2 text-[10px] uppercase text-slate-400">
                  <button
                    type="button"
                    disabled={isFirstTopic}
                    className="disabled:opacity-40"
                    onClick={() =>
                      onReorderNode({
                        level: "topic",
                        nodeId: topic.id,
                        direction: "up"
                      })
                    }
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={isLastTopic}
                    className="disabled:opacity-40"
                    onClick={() =>
                      onReorderNode({
                        level: "topic",
                        nodeId: topic.id,
                        direction: "down"
                      })
                    }
                  >
                    ↓
                  </button>
                </div>
              )}
            </div>

            {expanded && (
              <div className="mt-4 space-y-3 pl-8">
                {topic.subTopics.map((subTopic, subIndex) => {
                  const expandedSub = expandedSubTopics[subTopic.id] ?? true;
                  const isFirstSub = subIndex === 0;
                  const isLastSub = subIndex === topic.subTopics.length - 1;

                  return (
                    <div key={subTopic.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-start gap-2">
                        <button
                          className="flex w-full items-center gap-2 text-left"
                          onClick={() => {
                            toggleSubTopic(subTopic.id);
                            onSelect?.({ type: "subtopic", data: subTopic });
                          }}
                        >
                          <span className={caretClasses}>{expandedSub ? "-" : "+"}</span>
                          <div className="flex-1">
                            {editingNode === subTopic.id ? (
                              <input
                                value={editingValue}
                                onChange={(event) => setEditingValue(event.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={(event) => event.key === "Enter" && commitEdit()}
                                className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm font-semibold"
                                autoFocus
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-slate-800">{subTopic.title}</p>
                                {editable && (
                                  <button
                                    className="text-xs text-slate-400"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      startEditing(subTopic.id, subTopic.title);
                                    }}
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                            )}
                            <p className="text-xs text-slate-500">{subTopic.description}</p>
                          </div>
                        </button>
                        {editable && onReorderNode && (
                          <div className="flex gap-1 pt-1 text-[10px] uppercase text-slate-400">
                            <button
                              type="button"
                              disabled={isFirstSub}
                              className="disabled:opacity-40"
                              onClick={() =>
                                onReorderNode({
                                  level: "subtopic",
                                  nodeId: subTopic.id,
                                  direction: "up",
                                  parentTopicId: topic.id
                                })
                              }
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              disabled={isLastSub}
                              className="disabled:opacity-40"
                              onClick={() =>
                                onReorderNode({
                                  level: "subtopic",
                                  nodeId: subTopic.id,
                                  direction: "down",
                                  parentTopicId: topic.id
                                })
                              }
                            >
                              ↓
                            </button>
                          </div>
                        )}
                      </div>

                      {expandedSub && (
                        <div className="mt-3 space-y-2">{renderMicroTopics(topic, subTopic)}</div>
                      )}
                    </div>
                  );
                })}

                {editable && onAddNode && (
                  <div className="pt-2">
                    {isAdding("subtopic", topic.id) ? (
                      <AddForm titlePlaceholder="Subtopic title" />
                    ) : (
                      <button
                        type="button"
                        className="text-xs font-semibold text-blue-600"
                        onClick={() => beginAdd({ level: "subtopic", parentTopicId: topic.id })}
                      >
                        + Add subtopic
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StudyTree;
