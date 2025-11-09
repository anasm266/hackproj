import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import type { MicroTopic } from "@studymap/types";
import StudyTree from "../components/study/StudyTree";
import DetailsPanel from "../components/study/DetailsPanel";
import type { StudyNode } from "../components/study/types";
import { courseProgress } from "../lib/progress";
import { useStudyPlanStore } from "../store/useStudyPlanStore";
import type { AddNodeInput, ReorderNodeInput } from "../types/studyActions";
import { studyApi } from "../lib/api";

const CourseMapPage = () => {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const scopeParam = searchParams.get("scope");
  const topicParam = searchParams.get("topic");
  const [selectedNode, setSelectedNode] = useState<StudyNode | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeScope, setActiveScope] = useState<string | "all">(scopeParam ?? "all");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const course = useStudyPlanStore((state) =>
    courseId ? state.courses[courseId] : undefined
  );
  
  // Debug logging
  console.log("CourseMapPage render:", { 
    courseId, 
    hasCourse: !!course,
    courseName: course?.studyMap.course.name,
    topicsCount: course?.studyMap.topics.length 
  });
  
  const toggleMicroTopic = useStudyPlanStore((state) => state.toggleMicroTopic);
  const updateNodeTitle = useStudyPlanStore((state) => state.updateNodeTitle);
  const reorderNode = useStudyPlanStore((state) => state.reorderNode);
  const addNode = useStudyPlanStore((state) => state.addNode);
  const deleteNode = useStudyPlanStore((state) => state.deleteNode);
  const navigate = useNavigate();

  // Calculate filtered progress based on active exam scope - MUST be before early return
  const overallProgress = course ? courseProgress(course.studyMap.topics) : { completed: 0, total: 0, percent: 0 };
  
  const filteredProgress = useMemo(() => {
    if (!course || activeScope === "all") {
      return overallProgress;
    }
    
    // Calculate progress only for microtopics in the selected exam scope
    const allMicro = course.studyMap.topics.flatMap(topic =>
      topic.subTopics.flatMap(sub => sub.microTopics)
    );
    const scopedMicro = allMicro.filter(micro => 
      micro.examScopeIds.includes(activeScope)
    );
    const completed = scopedMicro.filter(micro => micro.completed).length;
    const total = scopedMicro.length || 1;
    
    return {
      completed,
      total,
      percent: Math.round((completed / total) * 100)
    };
  }, [course, activeScope, overallProgress]);

  const activeExam = (course && activeScope !== "all") 
    ? course.studyMap.exams.find(exam => exam.id === activeScope)
    : null;

  useEffect(() => {
    if (scopeParam) {
      setActiveScope(scopeParam);
    }
  }, [scopeParam]);

  useEffect(() => {
    if (topicParam && course) {
      const topic = course.studyMap.topics.find((current) => current.id === topicParam);
      if (topic) {
        setSelectedNode({ type: "topic", data: topic });
      }
    }
  }, [topicParam, course]);

  useEffect(() => {
    if (!selectedNode && course?.studyMap.topics[0]) {
      setSelectedNode({ type: "topic", data: course.studyMap.topics[0] });
    }
  }, [course, selectedNode]);

  // Intersection Observer for auto-switching details panel on scroll
  useEffect(() => {
    if (!course || isEditing || userInteracted) return; // Don't auto-switch when editing or after user interaction

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry with the highest intersection ratio that's actually intersecting
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length === 0) return;

        const mostVisible = visibleEntries.reduce((prev, current) => 
          current.intersectionRatio > prev.intersectionRatio ? current : prev
        );

        if (mostVisible.intersectionRatio > 0.3) { // Only switch if at least 30% visible
          const topicId = mostVisible.target.getAttribute('data-topic-id');
          
          // Only auto-switch for topics, not subtopics or microtopics
          if (topicId) {
            const topic = course.studyMap.topics.find(t => t.id === topicId);
            if (topic) {
              // Only update if the current selection is not a subtopic or microtopic of this topic
              // This prevents overriding manual subtopic/microtopic selections
              const isCurrentSelectionInTopic = 
                selectedNode?.type === "subtopic" || selectedNode?.type === "micro";
              
              if (!isCurrentSelectionInTopic || selectedNode.data.id !== topicId) {
                setSelectedNode({ type: "topic", data: topic });
              }
            }
          }
        }
      },
      {
        threshold: [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1],
        rootMargin: '-20% 0px -20% 0px' // Focus on the middle 60% of the viewport
      }
    );

    // Only observe topic-level elements (those that have data-topic-id but NOT data-subtopic-id or data-micro-id)
    const topicElements = document.querySelectorAll('[data-topic-id]:not([data-subtopic-id]):not([data-micro-id])');
    topicElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [course, isEditing, userInteracted, selectedNode]);

  const searchHits = useMemo(() => {
    if (!course || !searchTerm) return null;
    const needle = searchTerm.toLowerCase();
    const set = new Set<string>();
    course.studyMap.topics.forEach((topic) => {
      const topicMatch = topic.title.toLowerCase().includes(needle);
      topic.subTopics.forEach((subTopic) => {
        const subMatch = topicMatch || subTopic.title.toLowerCase().includes(needle);
        subTopic.microTopics.forEach((micro) => {
          const microMatch =
            subMatch ||
            micro.title.toLowerCase().includes(needle) ||
            micro.description.toLowerCase().includes(needle);
          if (microMatch) {
            set.add(micro.id);
          }
        });
      });
    });
    return set;
  }, [course, searchTerm]);

  const uncertainScope = useMemo(() => {
    if (!course || activeScope === "all") return undefined;
    return course.studyMap.exams.find((exam) => exam.id === activeScope && exam.uncertainty);
  }, [activeScope, course]);

  if (!course || !courseId) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-600">
        No course selected. Head back to the{" "}
        <button className="text-blue-600 underline" onClick={() => navigate("/")}>
          Landing page
        </button>{" "}
        to create a planner.
      </div>
    );
  }

  const persistTopics = async () => {
    if (!courseId) return;
    const latest = useStudyPlanStore.getState().courses[courseId];
    if (!latest) return;
    try {
      await studyApi.persistTopics(courseId, latest.studyMap.topics);
    } catch (error) {
      console.error("Failed to sync topics", error);
      toast.error("Unable to sync course changes.");
    }
  };

  const handleTitleChange = (nodeId: string, value: string) => {
    if (!courseId) return;
    updateNodeTitle(courseId, nodeId, value);
    void persistTopics();
  };

  const handleReorderNode = (payload: ReorderNodeInput) => {
    if (!courseId) return;
    reorderNode(courseId, payload);
    void persistTopics();
  };

  const handleAddNode = (payload: AddNodeInput) => {
    if (!courseId) return;
    addNode(courseId, payload);
    void persistTopics();
  };

  const handleDeleteNode = (payload: { level: "topic" | "subtopic" | "micro"; nodeId: string; parentTopicId?: string; parentSubTopicId?: string }) => {
    if (!courseId) return;
    if (!confirm("Are you sure you want to delete this item? This cannot be undone.")) return;
    deleteNode(courseId, payload);
    // Clear selection if the deleted node was selected
    if (selectedNode?.data.id === payload.nodeId) {
      setSelectedNode(null);
    }
    void persistTopics();
  };

  const handleToggleMicroTopic = (microId: string) => {
    if (!courseId) return;
    toggleMicroTopic(courseId, microId);
    void persistTopics();
  };
  const selectedTopicId =
    selectedNode?.type === "topic"
      ? selectedNode.data.id
      : selectedNode?.type === "subtopic"
        ? course.studyMap.topics.find((topic) =>
            topic.subTopics.some((subTopic) => subTopic.id === selectedNode.data.id)
          )?.id
        : selectedNode?.type === "micro"
          ? course.studyMap.topics.find((topic) =>
              topic.subTopics.some((subTopic) =>
                subTopic.microTopics.some((micro) => micro.id === selectedNode.data.id)
              )
            )?.id
          : undefined;

  const topicResources = selectedTopicId ? course.studyMap.resources[selectedTopicId] || [] : [];
  const relatedAssignments = selectedTopicId
    ? course.studyMap.assignments.filter((assignment) =>
        assignment.relatedTopicIds.includes(selectedTopicId)
      )
    : [];

  const scopeFilter = (micro: MicroTopic) => {
    const matchesScope = activeScope === "all" || micro.examScopeIds.includes(activeScope);
    const matchesSearch = searchHits ? searchHits.has(micro.id) : true;
    return matchesScope && matchesSearch;
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-8 px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1 flex flex-col gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-3">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                </svg>
                Study Map
              </div>
              <h1 className="text-slate-900 text-5xl font-extrabold leading-tight tracking-tight mb-2">
                {course.studyMap.course.name}
              </h1>
              {course.studyMap.course.term && (
                <p className="text-base text-slate-600 font-medium">
                  {course.studyMap.course.term}
                </p>
              )}
            </div>

            {/* Compact Search Bar */}
            <div className="relative max-w-xl">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <svg className={`h-4 w-4 transition-colors duration-200 ${
                  isSearchFocused ? "text-blue-500" : "text-slate-400"
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                className={`w-full h-11 pl-11 pr-11 text-slate-900 placeholder:text-slate-400 bg-white rounded-xl text-sm font-normal leading-normal focus:outline-none transition-all duration-200 ${
                  isSearchFocused || searchTerm
                    ? "border-2 border-blue-500 shadow-md shadow-blue-500/20 ring-2 ring-blue-500/10"
                    : "border border-slate-300 shadow-sm hover:border-slate-400"
                }`}
                placeholder="Search topics, subtopics, or microtopics..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <div className="p-1 rounded-full hover:bg-slate-100 transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </button>
              )}
            </div>
          </div>
          <div className="w-full md:w-auto md:min-w-[360px] p-6 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-xl border border-white/20 backdrop-blur-sm">
            <div className="flex flex-col gap-4">
                {activeExam && (
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="h-4 w-4 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-white text-sm font-bold">{activeExam.title}</p>
                    {activeExam.date && (
                      <span className="ml-auto text-white/80 text-xs">
                        {new Date(activeExam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex gap-6 justify-between items-center">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-white/90 text-sm font-semibold">
                      {activeScope === "all" ? "Overall Progress" : "Exam Progress"}
                    </p>
                  </div>
                  <p className="text-white text-xl font-bold">
                    {filteredProgress.completed}/{filteredProgress.total}
                  </p>
                </div>
                <div className="rounded-full bg-white/20 p-0.5 backdrop-blur-sm">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-white to-blue-100 shadow-sm transition-all duration-500"
                    style={{ width: `${filteredProgress.percent}%` }}
                  />
                </div>
                <p className="text-white/80 text-xs">
                  {filteredProgress.percent}% of {activeScope === "all" ? "all" : "exam"} microtopics completed
                </p>
              </div>
            </div>
        </header>

        {/* Exam Filter Bar */}
        <div className="flex items-center gap-3 p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
          <span className="text-sm font-semibold text-slate-600 whitespace-nowrap">Filter by:</span>
          <div className="flex items-center gap-2 flex-nowrap">
            <div
              onClick={() => setActiveScope("all")}
              className={`flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-xl px-5 cursor-pointer transition-all duration-200 ${
                activeScope === "all"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]"
                  : "bg-white border border-slate-300 text-slate-700 hover:border-blue-400 hover:bg-blue-50"
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <p className="text-sm font-semibold leading-normal whitespace-nowrap">All Topics</p>
            </div>
            {course.studyMap.exams.map((exam) => {
              const examDate = exam.date ? new Date(exam.date) : null;
              const formattedDate = examDate 
                ? examDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : null;
              
              return (
                <div
                  key={exam.id}
                  onClick={() => setActiveScope(exam.id)}
                  className={`flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-xl px-5 cursor-pointer transition-all duration-200 ${
                    activeScope === exam.id
                      ? "bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-lg shadow-slate-500/30 scale-[1.02]"
                      : "bg-white border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex flex-col items-start gap-0">
                    <p className="text-sm font-semibold leading-tight">{exam.title}</p>
                    {formattedDate && (
                      <p className={`text-xs leading-tight ${
                        activeScope === exam.id ? 'text-white/80' : 'text-slate-500'
                      }`}>
                        {formattedDate}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="ml-auto flex-shrink-0">
            <button
              onClick={() => setIsEditing((prev) => !prev)}
              className={`flex w-full lg:w-auto min-w-[160px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-6 gap-2.5 text-sm font-semibold leading-normal transition-all duration-200 ${
                isEditing
                  ? "bg-slate-800 text-white shadow-lg"
                  : "bg-white border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isEditing ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                )}
              </svg>
              <span className="truncate">{isEditing ? "Done Editing" : "Edit Structure"}</span>
            </button>
          </div>
        </div>

        {/* Active Exam Info Banner */}
        {activeExam && (
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 border border-indigo-200/60 shadow-sm">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md flex-shrink-0">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-bold text-slate-900">{activeExam.title}</h3>
                {activeExam.date && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(activeExam.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
              {activeExam.description && (
                <p className="text-sm text-slate-700 leading-relaxed">{activeExam.description}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs font-medium text-slate-600">
                  Showing {filteredProgress.total} topic{filteredProgress.total !== 1 ? 's' : ''} for this exam
                </span>
                <button
                  onClick={() => setActiveScope("all")}
                  className="ml-auto text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  View all topics →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Warning Banner */}
        {uncertainScope && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-sm">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100">
              <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-amber-900 text-sm font-semibold">AI couldn't determine exam scope from syllabus</p>
              <p className="text-amber-700 text-xs mt-1">The topics covered by this exam may be incomplete or incorrect. Review your syllabus to verify.</p>
            </div>
          </div>
        )}

        {/* Main Content: Two-column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column: Study Tree */}
          <div className="lg:col-span-3 flex flex-col">
            <StudyTree
              topics={course.studyMap.topics}
              selectedNodeId={selectedNode?.data.id}
              onSelect={(node) => {
                setSelectedNode(node);
                setUserInteracted(true);
                // Reset after 3 seconds to allow auto-scroll again
                setTimeout(() => setUserInteracted(false), 3000);
              }}
              editable={isEditing}
              onTitleChange={handleTitleChange}
              showCheckboxes
              onToggleMicroTopic={handleToggleMicroTopic}
              microTopicFilter={scopeFilter}
              onReorderNode={handleReorderNode}
              onAddNode={handleAddNode}
              onDeleteNode={handleDeleteNode}
            />
          </div>
          {/* Right Column: Details Panel */}
          <div className="lg:col-span-2">
          <div className="sticky top-[88px] max-h-[calc(100vh-104px)] overflow-y-auto custom-scrollbar pr-2">
            <DetailsPanel
                selectedNode={selectedNode}
                resources={topicResources}
                relatedAssignments={relatedAssignments}
                examScopes={course.studyMap.exams}
                courseTitle={course.studyMap.course.name}
                onResourceAdd={(resource) => {
                // Add resource logic here
                console.log("Adding resource:", resource);
                toast.success("Resource added successfully!");
              }}
            />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseMapPage;
