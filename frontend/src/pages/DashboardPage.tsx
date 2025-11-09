import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { courseProgress } from "../lib/progress";
import { useStudyPlanStore } from "../store/useStudyPlanStore";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { courses, courseOrder } = useStudyPlanStore((state) => ({
    courses: state.courses,
    courseOrder: state.courseOrder
  }));

  if (!courseOrder.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-600">
        <p className="text-lg font-semibold text-slate-900">No course planners yet.</p>
        <p className="mt-2 text-sm">Start from the landing page to upload a syllabus and generate the map.</p>
        <button
          className="mt-4 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
          onClick={() => navigate("/")}
        >
          Create Planner
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wide text-blue-500">Course dashboard</p>
        <h1 className="text-3xl font-semibold text-slate-900">All Courses</h1>
        <p className="text-sm text-slate-500">
          Cards show overall progress, next upcoming item, and quick quiz actions.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {courseOrder.map((courseId) => {
          const course = courses[courseId];
          if (!course) return null;
          const progress = courseProgress(course.studyMap.topics);
          const nextUpcoming = [...course.studyMap.assignments].sort(
            (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          )[0];

          return (
            <div key={courseId} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
              <div className="flex items-baseline justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">{course.studyMap.course.name}</h2>
                  <p className="text-sm text-slate-500">
                    {course.studyMap.course.courseNumber} · {course.studyMap.course.term}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  Updated {formatDistanceToNow(new Date(course.lastUpdated), { addSuffix: true })}
                </span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Overall progress</span>
                  <span className="font-semibold text-slate-900">{progress.percent}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Next upcoming</p>
                {nextUpcoming ? (
                  <>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{nextUpcoming.title}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(nextUpcoming.dueDate).toLocaleDateString()} · {nextUpcoming.type}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">No dates found. Add a deadline to keep tracking.</p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => navigate(`/courses/${courseId}/map`)}
                >
                  Open Map
                </button>
                <button
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600"
                  onClick={() => navigate(`/courses/${courseId}/quiz`)}
                >
                  Create Quiz
                </button>
                <button
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600"
                  onClick={() => navigate("/")}
                >
                  Add syllabus
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardPage;
