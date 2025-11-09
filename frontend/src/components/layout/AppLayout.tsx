import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { StudyMapPayload, Topic } from "@studymap/types";
import { courseProgress } from "../../lib/progress";
import { useStudyPlanStore } from "../../store/useStudyPlanStore";
import { studyApi } from "../../lib/api";
import CreatePlannerForm from "../planner/CreatePlannerForm";
import StudyMapReview from "../planner/StudyMapReview";

type ClaudeStatusState = {
  state: "checking" | "ready" | "configured" | "offline";
  message?: string;
  checkedAt?: string;
};

const AppLayout = () => {
  const navigate = useNavigate();
  const params = useParams();
  const courseIdFromRoute = params.courseId;
  
  // Modal state for creating new planner
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<StudyMapPayload | null>(null);
  const [warnings, setWarnings] = useState<string[] | undefined>(undefined);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  
  // Custom dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Fixed: Use separate selectors to avoid infinite loop
  const activeCourseId = useStudyPlanStore((state) => state.activeCourseId);
  const courses = useStudyPlanStore((state) => state.courses);
  const courseOrder = useStudyPlanStore((state) => state.courseOrder);
  const setActiveCourse = useStudyPlanStore((state) => state.setActiveCourse);
  const ingestStudyMap = useStudyPlanStore((state) => state.ingestStudyMap);
  
  const { activeCourse, courseList } = useMemo(() => {
    const mapped = courseOrder
      .map((id) => courses[id])
      .filter(Boolean);
    return {
      courseList: mapped,
      activeCourse: activeCourseId ? courses[activeCourseId] : undefined
    };
  }, [courses, courseOrder, activeCourseId]);
  
  // Handlers for creating new planner
  const handleDraftReady = (payload: StudyMapPayload, warningMessages?: string[]) => {
    setDraft(payload);
    setWarnings(warningMessages);
    setShowForm(false);
  };

  const updateDraftNode = (nodeId: string, title: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const updateTopic = (topic: Topic): Topic => {
        if (topic.id === nodeId) {
          return { ...topic, title };
        }
        const updatedSubTopics = topic.subTopics.map((subTopic) => {
          if (subTopic.id === nodeId) {
            return { ...subTopic, title };
          }
          const updatedMicro = subTopic.microTopics.map((micro) =>
            micro.id === nodeId ? { ...micro, title } : micro
          );
          return { ...subTopic, microTopics: updatedMicro };
        });
        return { ...topic, subTopics: updatedSubTopics };
      };
      return {
        ...prev,
        topics: prev.topics.map(updateTopic)
      };
    });
  };

  const acceptDraft = async () => {
    if (!draft) return;
    setIsSavingDraft(true);
    try {
      await studyApi.saveCourse(draft);
      ingestStudyMap(draft);
      toast.success("Course planner saved.");
      await new Promise(resolve => setTimeout(resolve, 100));
      navigate(`/courses/${draft.course.id}/map`);
      setDraft(null);
    } catch (error) {
      console.error("Failed to save course", error);
      toast.error("Unable to save course planner. Please try again.");
    } finally {
      setIsSavingDraft(false);
    }
  };
  
  const [claudeStatus, setClaudeStatus] = useState<ClaudeStatusState>({
    state: "checking"
  });
  const claudeBadge = useMemo(() => {
    switch (claudeStatus.state) {
      case "ready":
        return { className: "bg-emerald-100 text-emerald-700", label: "Claude live" };
      case "configured":
        return { className: "bg-amber-100 text-amber-700", label: "Claude configured" };
      case "offline":
        return { className: "bg-rose-100 text-rose-700", label: "Claude offline" };
      default:
        return { className: "bg-slate-100 text-slate-600", label: "Claude checking..." };
    }
  }, [claudeStatus.state]);

  useEffect(() => {
    if (courseIdFromRoute) {
      setActiveCourse(courseIdFromRoute);
    }
  }, [courseIdFromRoute, setActiveCourse]);

  useEffect(() => {
    let mounted = true;
    const checkClaude = async () => {
      try {
        const status = await studyApi.health();
        if (!mounted) return;
        if (status.claudeEnabled) {
          setClaudeStatus({
            state: "ready",
            checkedAt: status.claudeLastChecked
          });
        } else if (status.claudeConfigured) {
          setClaudeStatus({
            state: "configured",
            message: status.claudeError ?? "Claude reachable? Check API logs.",
            checkedAt: status.claudeLastChecked
          });
        } else {
          setClaudeStatus({
            state: "offline",
            message: "Claude API key missing on backend."
          });
        }
      } catch {
        if (mounted) {
          setClaudeStatus({
            state: "offline",
            message: "Health endpoint unreachable."
          });
        }
      }
    };
    void checkClaude();
    const interval = setInterval(checkClaude, 5 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const progress = activeCourse ? courseProgress(activeCourse.studyMap.topics) : undefined;

  const navItems = [
    { label: "Dashboard", path: "/dashboard", disabled: !courseList.length },
    {
      label: "Study Map",
      path: activeCourseId ? `/courses/${activeCourseId}/map` : "#",
      disabled: !activeCourse
    },
    {
      label: "Upcoming",
      path: activeCourseId ? `/courses/${activeCourseId}/upcoming` : "#",
      disabled: !activeCourse
    },
    {
      label: "Resources",
      path: activeCourseId ? `/courses/${activeCourseId}/resources` : "#",
      disabled: !activeCourse
    },
    {
      label: "Quiz Center",
      path: activeCourseId ? `/courses/${activeCourseId}/quiz` : "#",
      disabled: !activeCourse
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur shadow-sm">
        {/* Single Row Layout */}
        <div className="mx-auto max-w-6xl px-6 py-3">
          <div className="flex items-center justify-between gap-6">
            {/* Left: Brand */}
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
                StudyMap
              </span>
              {/* Compact Claude Status - just a colored dot */}
              <div
                className={`w-2 h-2 rounded-full ${
                  claudeStatus.state === "ready" 
                    ? "bg-emerald-500" 
                    : claudeStatus.state === "configured" 
                    ? "bg-amber-500" 
                    : "bg-slate-400"
                }`}
                title={
                  claudeStatus.message
                    ? claudeStatus.checkedAt
                      ? `${claudeBadge.label}: ${claudeStatus.message} (last check ${new Date(
                          claudeStatus.checkedAt
                        ).toLocaleTimeString()})`
                      : `${claudeBadge.label}: ${claudeStatus.message}`
                    : claudeStatus.checkedAt
                      ? `${claudeBadge.label} (last check ${new Date(claudeStatus.checkedAt).toLocaleTimeString()})`
                      : claudeBadge.label
                }
              />
            </div>

            {/* Center: Navigation */}
            <nav className="flex gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  className={({ isActive }) =>
                    [
                      "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                      item.disabled ? "pointer-events-none opacity-50" : "",
                      isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Right: Actions & Course Selector */}
            <div className="flex items-center gap-3">
              {progress && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Progress:</span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-16 rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                    <span className="font-semibold text-slate-700 min-w-[32px]">{progress.percent}%</span>
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowForm(true)}
                className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                + New
              </button>
              
              {/* Custom Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 rounded-full border border-slate-300 bg-white pl-4 pr-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-sm min-w-[140px]"
                >
                  <span className="flex-1 text-left truncate">
                    {activeCourseId 
                      ? courseList.find(c => c.studyMap.course.id === activeCourseId)?.studyMap.course.name || "Select course..."
                      : "Select course..."}
                  </span>
                  <svg 
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    
                    {/* Menu */}
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50">
                      {courseList.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-slate-500 text-center">
                          No courses yet
                        </div>
                      ) : (
                        courseList.map((course) => (
                          <button
                            key={course.studyMap.course.id}
                            onClick={() => {
                              setActiveCourse(course.studyMap.course.id);
                              navigate(`/courses/${course.studyMap.course.id}/map`);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-2 text-xs transition-all rounded-lg ${
                              activeCourseId === course.studyMap.course.id
                                ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-medium shadow-sm"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <div className="font-medium truncate">{course.studyMap.course.name}</div>
                            {course.studyMap.course.term && (
                              <div className={`text-[10px] mt-0.5 truncate ${
                                activeCourseId === course.studyMap.course.id ? "text-blue-600" : "text-slate-500"
                              }`}>
                                {course.studyMap.course.term}
                              </div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8 pt-[72px]">
        <Outlet />
      </main>

      {/* Modal for Create Planner Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Create Course Planner</h2>
              <button 
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CreatePlannerForm onDraftReady={handleDraftReady} />
          </div>
        </div>
      )}

      {draft && (
        <StudyMapReview
          draft={draft}
          warnings={warnings}
          onClose={() => setDraft(null)}
          onAccept={acceptDraft}
          onTitleChange={updateDraftNode}
          isSaving={isSavingDraft}
        />
      )}
    </div>
  );
};

export default AppLayout;
