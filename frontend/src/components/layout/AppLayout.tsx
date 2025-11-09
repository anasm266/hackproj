import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { courseProgress } from "../../lib/progress";
import { useStudyPlanStore } from "../../store/useStudyPlanStore";
import { studyApi } from "../../lib/api";

type ClaudeStatusState = {
  state: "checking" | "ready" | "configured" | "offline";
  message?: string;
  checkedAt?: string;
};

const AppLayout = () => {
  const navigate = useNavigate();
  const params = useParams();
  const courseIdFromRoute = params.courseId;
  
  // Fixed: Use separate selectors to avoid infinite loop
  const activeCourseId = useStudyPlanStore((state) => state.activeCourseId);
  const courses = useStudyPlanStore((state) => state.courses);
  const courseOrder = useStudyPlanStore((state) => state.courseOrder);
  
  const { activeCourse, courseList } = useMemo(() => {
    const mapped = courseOrder
      .map((id) => courses[id])
      .filter(Boolean);
    return {
      courseList: mapped,
      activeCourse: activeCourseId ? courses[activeCourseId] : undefined
    };
  }, [courses, courseOrder, activeCourseId]);
  
  const setActiveCourse = useStudyPlanStore((state) => state.setActiveCourse);
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
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-4">
          <div className="flex flex-1 items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                StudyMap
              </span>
              <span className="text-sm text-slate-500">Claude hackathon build</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${claudeBadge.className}`}
                title={
                  claudeStatus.message
                    ? claudeStatus.checkedAt
                      ? `${claudeStatus.message} (last check ${new Date(
                          claudeStatus.checkedAt
                        ).toLocaleTimeString()})`
                      : claudeStatus.message
                    : claudeStatus.checkedAt
                      ? `Last check ${new Date(claudeStatus.checkedAt).toLocaleTimeString()}`
                      : undefined
                }
              >
                {claudeBadge.label}
              </span>
            </div>
            {progress ? (
              <div className="hidden items-center gap-3 rounded-full border border-slate-200 px-4 py-1 md:flex">
                <span className="text-xs font-medium text-slate-500">Course Progress</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-36 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{progress.percent}%</span>
                </div>
              </div>
            ) : (
              <div className="hidden text-sm text-slate-500 md:block">No active course yet</div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              + Create Planner
            </button>
            <select
              className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700"
              value={activeCourseId ?? ""}
              onChange={(event) => {
                const nextId = event.target.value;
                setActiveCourse(nextId);
                if (nextId) navigate(`/courses/${nextId}/map`);
              }}
            >
              <option value="">Select course</option>
              {courseList.map((course) => (
                <option key={course.studyMap.course.id} value={course.studyMap.course.id}>
                  {course.studyMap.course.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-3 px-6 pb-4">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                [
                  "rounded-full px-4 py-2 text-sm font-medium transition-all",
                  item.disabled ? "pointer-events-none opacity-50" : "",
                  isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
