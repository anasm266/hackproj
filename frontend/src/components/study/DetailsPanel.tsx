import type { ExamScope, MicroTopic, ResourceItem, Topic, UpcomingItem } from "@studymap/types";
import type { StudyNode } from "./types";
import { useState } from "react";
import ResourceSearchModal from "../resources/ResourceSearchModal";

type DetailsPanelProps = {
  selectedNode: StudyNode | null;
  resources?: ResourceItem[];
  relatedAssignments?: UpcomingItem[];
  examScopes?: ExamScope[];
  courseTitle?: string;
  onResourceAdd?: (resource: any) => void;
};

const DetailsPanel = ({
  selectedNode,
  resources = [],
  relatedAssignments = [],
  examScopes = [],
  courseTitle = "",
  onResourceAdd
}: DetailsPanelProps) => {
  const [showResourceSearch, setShowResourceSearch] = useState(false);
  if (!selectedNode) {
    return (
      <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/80">
        <div className="flex h-full flex-col items-center justify-center text-center py-12">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1.5">No Selection</h3>
          <p className="text-xs text-slate-500 max-w-md">
            Select any topic, subtopic, or microtopic from the tree on the left to view details, rationale, and linked resources.
          </p>
        </div>
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

  // Debug logging
  console.log("DetailsPanel resources:", {
    resources,
    length: resources.length,
    hasResources: resources.length > 0
  });

  return (
    <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/80">
      <div className="flex flex-col gap-6">
        {/* Badge and Title */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className={`flex h-7 shrink-0 items-center justify-center gap-x-2 rounded-full px-3.5 ${
              type === "topic" 
                ? "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700"
                : type === "subtopic"
                  ? "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700"
                  : "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700"
            }`}>
              <p className="text-[10px] font-bold uppercase tracking-wider">{type}</p>
            </div>
            {type === "micro" && (data as MicroTopic).completed && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-[10px] font-bold">Completed</span>
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">{title}</h2>
        </div>

        {/* Description */}
        {description && (
          <div className="space-y-2 p-4 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border border-slate-200/60">
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xs font-semibold text-slate-700">Description</h3>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{description}</p>
          </div>
        )}

        {/* Claude Rationale */}
        {rationale && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center gap-1.5 mb-2">
                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="text-xs font-bold text-blue-900">AI-Generated Rationale</h3>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">{rationale}</p>
            </div>
          </div>
        )}

        {/* Exam Scope */}
        {relevantExams.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <h3 className="text-xs font-semibold text-slate-700">Exam Scope</h3>
            </div>
            <div className="flex gap-2 flex-wrap">
              {relevantExams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex h-8 items-center justify-center gap-x-2 rounded-lg bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200 px-3 shadow-sm"
                >
                  <p className="text-slate-800 text-xs font-semibold">{exam.title}</p>
                </div>
              ))}
            </div>
            {relevantExams.some((exam) => exam.uncertainty) && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                <svg className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-amber-800 text-[10px] font-medium">
                  Scope uncertain — review/edit scope text
                </p>
              </div>
            )}
          </div>
        )}

        {/* Linked Deadlines */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xs font-semibold text-slate-700">Linked Deadlines</h3>
          </div>
          {relatedAssignments.length ? (
            <ul className="space-y-2">
              {relatedAssignments.map((item) => (
                <li key={item.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/60">
                  <div className="w-1 h-1 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 text-xs">{item.title}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{item.scopeText}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center p-4 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50">
              <p className="text-[10px] text-slate-400 font-medium">No linked deadlines yet</p>
            </div>
          )}
        </div>

        {/* Top 3 Resources */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-xs font-semibold text-slate-700">Top Resources</h3>
          </div>
          {resources.length ? (
            <div className="flex flex-col gap-2">
              {resources.slice(0, 3).map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div className={`flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 ${
                    resource.type === "video" 
                      ? "bg-red-100 text-red-600" 
                      : resource.type === "article" 
                        ? "bg-blue-100 text-blue-600"
                        : "bg-purple-100 text-purple-600"
                  }`}>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {resource.type === "video" ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      ) : resource.type === "article" ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      )}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 font-semibold text-xs group-hover:text-blue-700 transition-colors line-clamp-1">{resource.title}</p>
                    <p className="text-[10px] text-slate-500 capitalize mt-0.5">{resource.type}</p>
                  </div>
                  <svg className="h-4 w-4 text-slate-400 flex-shrink-0 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 rounded-xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/20">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mx-auto mb-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-sm text-slate-600 font-semibold mb-1">No resources yet</p>
              <p className="text-xs text-slate-500 mb-4">Discover learning materials with AI</p>
              <button
                onClick={() => {
                  console.log("Find Resources button clicked!");
                  setShowResourceSearch(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find Resources
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Resource Search Modal */}
      {selectedNode && (
        <ResourceSearchModal
          isOpen={showResourceSearch}
          onClose={() => setShowResourceSearch(false)}
          courseTitle={courseTitle}
          topicId={selectedNode.data.id}
          topicTitle={
            selectedNode.type === "topic"
              ? (selectedNode.data as Topic).title
              : selectedNode.type === "subtopic"
                ? (selectedNode.data as Topic["subTopics"][number]).title
                : (selectedNode.data as MicroTopic).title
          }
          topicDescription={
            selectedNode.type === "topic"
              ? (selectedNode.data as Topic).description
              : selectedNode.type === "subtopic"
                ? (selectedNode.data as Topic["subTopics"][number]).description
                : (selectedNode.data as MicroTopic).description
          }
          onResourceSelect={(resource) => {
            onResourceAdd?.(resource);
            setShowResourceSearch(false);
          }}
        />
      )}
    </div>
  );
};

export default DetailsPanel;
