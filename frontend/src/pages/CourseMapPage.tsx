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
  const [isEditing, setIsEditing] = useState(false);
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
  const navigate = useNavigate();

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

  const overallProgress = courseProgress(course.studyMap.topics);
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

  const topicResources = selectedTopicId ? course.studyMap.resources[selectedTopicId] : undefined;
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
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-500">Course Map</p>
            <h1 className="text-3xl font-semibold text-slate-900">{course.studyMap.course.name}</h1>
            <p className="text-sm text-slate-500">{course.studyMap.course.term}</p>
          </div>
          <div className="ml-auto flex flex-col justify-center">
            <p className="text-xs text-slate-500">Overall progress</p>
            <div className="flex items-center gap-3">
              <div className="h-2 w-48 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${overallProgress.percent}%` }}
                />
              </div>
              <span className="text-xl font-semibold text-slate-900">
                {overallProgress.completed}/{overallProgress.total}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          <input
            placeholder="Search microtopics"
            className="rounded-2xl border border-slate-200 px-4 py-3"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveScope("all")}
              className={`rounded-full px-4 py-2 text-sm ${
                activeScope === "all"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 text-slate-600"
              }`}
            >
              All topics
            </button>
            {course.studyMap.exams.map((exam) => (
              <button
                key={exam.id}
                onClick={() => setActiveScope(exam.id)}
                className={`rounded-full px-4 py-2 text-sm ${
                  activeScope === exam.id ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600"
                }`}
              >
                {exam.title}
              </button>
            ))}
          </div>
        <p className="rounded-2xl border border-slate-200 px-4 py-3 text-xs text-slate-500">
          Hover over pills to see completion formula. Microtopics drive every calculation.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setIsEditing((prev) => !prev)}
          className={`rounded-full px-4 py-2 text-xs font-semibold ${
            isEditing ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600"
          }`}
        >
          {isEditing ? "Done editing" : "Edit structure"}
        </button>
        {isEditing && (
          <span className="text-xs text-slate-500">
            Rename, reorder, or add topics/subtopics/microtopics inline below.
          </span>
        )}
      </div>
      {uncertainScope && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Scope uncertain — review/edit scope text.
          </div>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <StudyTree
          topics={course.studyMap.topics}
          selectedNodeId={selectedNode?.data.id}
          onSelect={setSelectedNode}
          editable={isEditing}
          onTitleChange={handleTitleChange}
          showCheckboxes
          onToggleMicroTopic={handleToggleMicroTopic}
          microTopicFilter={scopeFilter}
          onReorderNode={handleReorderNode}
          onAddNode={handleAddNode}
        />
        <DetailsPanel
          selectedNode={selectedNode}
          resources={topicResources}
          relatedAssignments={relatedAssignments}
          examScopes={course.studyMap.exams}
        />
      </div>
    </div>
  );
};

export default CourseMapPage;
