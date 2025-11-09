import type { ExamScope, MicroTopic, ResourceItem, Topic, UpcomingItem } from "@studymap/types";
import type { StudyNode } from "./types";

type DetailsPanelProps = {
  selectedNode: StudyNode | null;
  resources?: ResourceItem[];
  relatedAssignments?: UpcomingItem[];
  examScopes?: ExamScope[];
};

const badgeClass =
  "rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600";

const DetailsPanel = ({
  selectedNode,
  resources = [],
  relatedAssignments = [],
  examScopes = []
}: DetailsPanelProps) => {
  if (!selectedNode) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-500">
        <p>Select any topic on the left to see details, rationale, and linked deadlines.</p>
      </div>
    );
  }

  const { data, type } = selectedNode;
  const title =
    type === "topic"
      ? (data as Topic).title
      : type === "subtopic"
        ? (data as Topic["subTopics"][number]).title
        : (data as MicroTopic).title;

  const description =
    type === "topic"
      ? (data as Topic).description
      : type === "subtopic"
        ? (data as Topic["subTopics"][number]).description
        : (data as MicroTopic).description;

  const rationale =
    type === "topic"
      ? (data as Topic).rationale
      : type === "subtopic"
        ? (data as Topic["subTopics"][number]).rationale
        : (data as MicroTopic).rationale;

  const relatedExamIds =
    type === "micro" ? (data as MicroTopic).examScopeIds : type === "topic" ? (data as Topic).tags : [];

  const relevantExams = examScopes.filter((exam) =>
    relatedExamIds?.some((id) => exam.id === id)
  );

  return (
    <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
      <div>
        <p className="text-xs uppercase tracking-wide text-blue-500">{type}</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">{description}</p>
      </div>

      {rationale && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900">
          <p className="font-semibold">Claude rationale</p>
          <p>{rationale}</p>
        </div>
      )}

      {relevantExams.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Exam / Project scope</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {relevantExams.map((exam) => (
              <span key={exam.id} className={badgeClass}>
                {exam.title}
              </span>
            ))}
          </div>
          {relevantExams.some((exam) => exam.uncertainty) && (
            <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Scope uncertain — review/edit scope text.
            </p>
          )}
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase text-slate-500">Linked deadlines</p>
        {relatedAssignments.length ? (
          <div className="mt-3 space-y-2">
            {relatedAssignments.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-500">{item.scopeText}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-400">No linked deadlines yet.</p>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase text-slate-500">Resources</p>
        {resources.length ? (
          <div className="mt-3 space-y-3">
            {resources.slice(0, 3).map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"
              >
                <p className="text-sm font-semibold text-slate-800">{resource.title}</p>
                <p className="text-xs text-slate-500">{resource.summary}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                  <span className={badgeClass}>{resource.type}</span>
                  {resource.duration && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">{resource.duration}</span>
                  )}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-400">Resources will appear here once added.</p>
        )}
      </div>
    </div>
  );
};

export default DetailsPanel;
