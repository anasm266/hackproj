import { format, parseISO } from "date-fns";
import { useNavigate, useParams } from "react-router-dom";
import { useStudyPlanStore } from "../store/useStudyPlanStore";
import { getExamProgress } from "../lib/analytics";

const UpcomingPage = () => {
  const { courseId } = useParams();
  const course = useStudyPlanStore((state) =>
    courseId ? state.courses[courseId] : undefined
  );
  const navigate = useNavigate();

  if (!course || !courseId) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-600">
        No course selected. Upload a syllabus to populate upcoming items.
      </div>
    );
  }

  // Get exams with dates from the studyMap.exams array
  const examsWithDates = course.studyMap.exams
    .filter(exam => exam.date)
    .map(exam => ({
      ...exam,
      progress: getExamProgress(course, exam.id),
      daysUntil: exam.date ? Math.ceil((new Date(exam.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : undefined
    }))
    .sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  // Get other assignments (non-exam assignments) - only those with dates
  const otherAssignments = course.studyMap.assignments.filter(a => a.type !== "exam" && a.dueDate);

  const grouped = otherAssignments.reduce<Record<string, typeof otherAssignments>>(
    (acc, item) => {
      const key = format(parseISO(item.dueDate!), "yyyy-MM-dd");
      acc[key] = acc[key] ? [...acc[key], item] : [item];
      return acc;
    },
    {}
  );

  const sortedKeys = Object.keys(grouped).sort();
  const hasContent = examsWithDates.length > 0 || sortedKeys.length > 0;

  if (!hasContent) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-600">
        <p className="text-lg font-semibold text-slate-900">No upcoming items found</p>
        <p className="mt-2 text-sm">No exams or assignments with dates were found in your syllabus.</p>
        <button
          className="mt-4 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
          onClick={() => navigate(`/courses/${courseId}/map`)}
        >
          Go to Study Map
        </button>
      </div>
    );
  }

  const getReadinessStatus = (percent: number) => {
    if (percent >= 80) return { label: "Excellent", color: "emerald", icon: "✓" };
    if (percent >= 60) return { label: "Good", color: "blue", icon: "→" };
    if (percent >= 40) return { label: "Needs Work", color: "amber", icon: "!" };
    return { label: "Critical", color: "red", icon: "⚠" };
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-wide text-blue-500 font-semibold">Timeline</p>
        <h1 className="text-4xl font-bold text-slate-900 mt-1">Upcoming Exams & Assignments</h1>
        <p className="text-sm text-slate-600 mt-2">Track your exam readiness and upcoming deadlines</p>
      </header>

      {/* Exams Section */}
      {examsWithDates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-2xl font-bold text-slate-900">Exams</h2>
            <span className="ml-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {examsWithDates.length}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {examsWithDates.map((exam) => {
              const status = getReadinessStatus(exam.progress.percent);
              const isUrgent = exam.daysUntil !== undefined && exam.daysUntil <= 7 && exam.daysUntil >= 0;
              const isPast = exam.daysUntil !== undefined && exam.daysUntil < 0;

              return (
                <div
                  key={exam.id}
                  className={`group rounded-2xl border-2 p-6 transition-all duration-200 hover:shadow-lg cursor-pointer ${
                    isPast
                      ? "border-slate-200 bg-slate-50/50 opacity-60"
                      : isUrgent
                      ? "border-red-200 bg-gradient-to-br from-red-50 to-orange-50 shadow-md"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                  onClick={() => navigate(`/courses/${courseId}/map?scope=${exam.id}`)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {isUrgent && !isPast && (
                          <span className="flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                        )}
                        <h3 className="text-lg font-bold text-slate-900">{exam.title}</h3>
                      </div>
                      {exam.date && (
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium text-slate-700">
                            {format(new Date(exam.date), "EEEE, MMMM d, yyyy")}
                          </span>
                        </div>
                      )}
                    </div>
                    {exam.daysUntil !== undefined && (
                      <div className={`flex flex-col items-end ${isPast ? "opacity-50" : ""}`}>
                        <span className={`text-2xl font-bold ${
                          isPast ? "text-slate-400" : isUrgent ? "text-red-600" : "text-slate-700"
                        }`}>
                          {Math.abs(exam.daysUntil)}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {isPast ? "days ago" : "days left"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {exam.description && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{exam.description}</p>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-600">Preparation Progress</span>
                      <span className="text-xs font-bold text-slate-900">{exam.progress.percent}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          status.color === "emerald" ? "bg-gradient-to-r from-emerald-500 to-green-500" :
                          status.color === "blue" ? "bg-gradient-to-r from-blue-500 to-indigo-500" :
                          status.color === "amber" ? "bg-gradient-to-r from-amber-500 to-orange-500" :
                          "bg-gradient-to-r from-red-500 to-rose-500"
                        }`}
                        style={{ width: `${exam.progress.percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                        status.color === "emerald" ? "bg-emerald-100 text-emerald-700" :
                        status.color === "blue" ? "bg-blue-100 text-blue-700" :
                        status.color === "amber" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        <span>{status.icon}</span>
                        {status.label}
                      </span>
                      <span className="text-xs text-slate-500">
                        {exam.progress.completed}/{exam.progress.total} topics
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600 group-hover:text-slate-900 transition-colors">
                      <span className="text-xs font-semibold">Study</span>
                      <svg className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  {isUrgent && !isPast && (
                    <div className="mt-4 pt-4 border-t border-red-200">
                      <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Exam is coming up soon!
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Other Assignments Section */}
      {sortedKeys.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="text-2xl font-bold text-slate-900">Assignments & Projects</h2>
          </div>

          <div className="space-y-4">
            {sortedKeys.map((key) => (
              <div key={key} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                  <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-bold text-slate-700">
                    {format(parseISO(key), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
                <div className="space-y-3">
                  {grouped[key].map((item) => (
                    <div
                      key={item.id}
                      className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer md:flex-row md:items-center md:justify-between"
                      onClick={() => navigate(`/courses/${courseId}/map?topic=${item.relatedTopicIds[0] ?? ""}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.type === "project" ? "bg-purple-100 text-purple-700" :
                            item.type === "assignment" ? "bg-blue-100 text-blue-700" :
                            "bg-slate-100 text-slate-700"
                          }`}>
                            {item.type}
                          </span>
                          <p className="text-sm font-bold text-slate-900">{item.title}</p>
                        </div>
                        {item.description && (
                          <p className="text-xs text-slate-600 ml-1">{item.description}</p>
                        )}
                      </div>
                      <button
                        className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors group-hover:scale-105"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/courses/${courseId}/map?topic=${item.relatedTopicIds[0] ?? ""}`);
                        }}
                      >
                        View topics
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingPage;
