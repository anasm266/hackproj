import { format, parseISO } from "date-fns";
import { useNavigate, useParams } from "react-router-dom";
import { useStudyPlanStore } from "../store/useStudyPlanStore";

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

  const grouped = course.studyMap.assignments.reduce<Record<string, typeof course.studyMap.assignments>>(
    (acc, item) => {
      const key = item.dueDate ? format(parseISO(item.dueDate), "yyyy-MM-dd") : "unscheduled";
      acc[key] = acc[key] ? [...acc[key], item] : [item];
      return acc;
    },
    {}
  );

  const sortedKeys = Object.keys(grouped).sort();

  if (!sortedKeys.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-600">
        <p className="text-lg font-semibold text-slate-900">No dates found</p>
        <p className="mt-2 text-sm">Upcoming shows an empty state with CTA “Add deadline”.</p>
        <button
          className="mt-4 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
          onClick={() => navigate(`/courses/${courseId}/map`)}
        >
          Add deadline
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wide text-blue-500">Timeline</p>
        <h1 className="text-3xl font-semibold text-slate-900">Upcoming exams, projects, assignments</h1>
        <p className="text-sm text-slate-500">Click any item to jump to the related Study Map filter.</p>
      </header>

      <div className="space-y-4">
        {sortedKeys.map((key) => (
          <div key={key} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <p className="text-sm font-semibold text-slate-600">
                {key === "unscheduled" ? "Date TBD" : format(parseISO(key), "EEEE, MMM d")}
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {grouped[key].map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {item.type}
                      </span>
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                    </div>
                    <p className="text-xs text-slate-500">{item.scopeText ?? "Scope uncertain — review/edit scope text."}</p>
                  </div>
                  <button
                    className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                    onClick={() =>
                      navigate(`/courses/${courseId}/map?topic=${item.relatedTopicIds[0] ?? ""}`)
                    }
                  >
                    View related topics
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingPage;
