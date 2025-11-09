import { useState } from "react";
import type { StudyMapPayload } from "@studymap/types";
import StudyTree from "../study/StudyTree";
import DetailsPanel from "../study/DetailsPanel";
import type { StudyNode } from "../study/types";

type Props = {
  draft: StudyMapPayload;
  warnings?: string[];
  onClose: () => void;
  onAccept: () => void;
  onTitleChange: (nodeId: string, title: string) => void;
  isSaving?: boolean;
};

const StudyMapReview = ({ draft, warnings, onClose, onAccept, onTitleChange, isSaving }: Props) => {
  const [selectedNode, setSelectedNode] = useState<StudyNode | null>(null);

  const selectedTopicId =
    selectedNode?.type === "topic"
      ? selectedNode.data.id
      : selectedNode?.type === "subtopic"
        ? draft.topics.find((topic) =>
            topic.subTopics.some((subTopic) => subTopic.id === selectedNode.data.id)
          )?.id
        : selectedNode?.type === "micro"
          ? draft.topics.find((topic) =>
              topic.subTopics.some((subTopic) =>
                subTopic.microTopics.some((micro) => micro.id === selectedNode.data.id)
              )
            )?.id
          : undefined;

  const topicResources = selectedTopicId ? draft.resources[selectedTopicId] : undefined;

  const relatedAssignments = selectedNode
    ? draft.assignments.filter((assignment) =>
        assignment.relatedTopicIds.includes(selectedTopicId ?? "")
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-6">
      <div className="flex h-full max-h-[90vh] w-full max-w-6xl flex-col gap-4 rounded-3xl bg-slate-50 p-6 shadow-2xl">
        <div className="flex flex-shrink-0 items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-500">Study Map Draft</p>
            <h2 className="text-2xl font-semibold text-slate-900">Looks good?</h2>
            <p className="text-sm text-slate-600">
              Rename, reorder, or delete anything you need. Claude keeps your inputs for retry.
            </p>
          </div>
          <button
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {warnings?.length ? (
          <div className="flex-shrink-0 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {warnings.map((warning) => (
              <p key={warning}>Warning: {warning}</p>
            ))}
          </div>
        ) : null}

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
          <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 flex-shrink-0 text-sm font-semibold text-slate-700">Course Topics</h3>
            <div className="min-h-0 flex-1 overflow-y-auto pr-2">
              <StudyTree
                topics={draft.topics}
                selectedNodeId={selectedNode?.data.id}
                onSelect={setSelectedNode}
                editable
                onTitleChange={onTitleChange}
              />
            </div>
          </div>
          <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 flex-shrink-0 text-sm font-semibold text-slate-700">Details</h3>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <DetailsPanel
                selectedNode={selectedNode}
                resources={topicResources}
                relatedAssignments={relatedAssignments}
                examScopes={draft.exams}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
          <div className="text-sm text-slate-500">
            Accept to move into the Study Map view. You can always edit later.
          </div>
          <div className="flex gap-3">
            <button
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
              onClick={onClose}
            >
              Start over
            </button>
            <button
              className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white"
              onClick={onAccept}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Accept & continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyMapReview;
