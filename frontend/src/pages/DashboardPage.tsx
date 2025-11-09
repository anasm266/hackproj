import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Clock,
  Target,
} from "lucide-react";
import { courseProgress } from "../lib/progress";
import { useStudyPlanStore } from "../store/useStudyPlanStore";
import {
  calculateCourseAnalytics,
  calculateOverallAnalytics,
  calculateExamReadiness,
  calculateQuizAnalytics,
} from "../lib/analytics";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { courses, courseOrder } = useStudyPlanStore((state) => ({
    courses: state.courses,
    courseOrder: state.courseOrder
  }));

  // Show empty state if no courses exist
  if (courseOrder.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-card">
          <Award className="mx-auto h-16 w-16 text-slate-300" />
          <h2 className="mt-4 text-2xl font-semibold text-slate-900">No Courses Yet</h2>
          <p className="mt-2 text-slate-500">
            Upload your first syllabus to get started with your personalized study dashboard!
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Create Your First Study Plan
          </button>
        </div>
      </div>
    );
  }

  const overallAnalytics = useMemo(
    () => calculateOverallAnalytics(courses, courseOrder),
    [JSON.stringify(courseOrder)]
  );

  const courseAnalytics = useMemo(
    () => courseOrder.map((id) => calculateCourseAnalytics(id, courses[id])).filter(Boolean),
    [JSON.stringify(courseOrder)]
  );

  const allExamReadiness = useMemo(() => {
    return courseOrder.flatMap((id) => {
      const readiness = calculateExamReadiness(courses[id]);
      return readiness.map((r) => ({
        ...r,
        courseName: courses[id].studyMap.course.name,
      }));
    });
  }, [JSON.stringify(courseOrder)]);

  // Prepare data for charts
  const courseProgressData = courseAnalytics.map((c) => ({
    name: c.courseNumber || c.courseName.substring(0, 15),
    progress: c.progressPercent,
    quizAvg: c.quizAverage,
    examReady: c.examReadiness,
  }));

  const quizTrendData = courseAnalytics.flatMap((c) => {
    const course = courses[c.courseId];
    return calculateQuizAnalytics(course.quizResults).trend.map((t) => ({
      ...t,
      course: c.courseNumber || c.courseName.substring(0, 10),
    }));
  });

  const topicCompletionData = courseAnalytics.map((c) => ({
    subject: c.courseNumber || c.courseName.substring(0, 15),
    completion: c.progressPercent,
    quizPerformance: c.quizAverage,
    examReadiness: c.examReadiness,
  }));

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wide text-blue-500">Academic Dashboard</p>
        <h1 className="text-3xl font-semibold text-slate-900">Your Study Analytics</h1>
        <p className="text-sm text-slate-500">
          Track your progress across {courseOrder.length} {courseOrder.length === 1 ? 'course' : 'courses'} with real-time insights
        </p>
      </header>

      {/* Overall Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600">Overall Progress</p>
              {overallAnalytics.totalTopics > 0 ? (
                <>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {overallAnalytics.overallProgress}%
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {overallAnalytics.totalTopicsCompleted} / {overallAnalytics.totalTopics} topics
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-400 italic">
                  Start marking topics complete! ✨
                </p>
              )}
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600">Quiz Average</p>
              {overallAnalytics.totalQuizzesTaken > 0 ? (
                <>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {overallAnalytics.averageQuizScore}%
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {overallAnalytics.totalQuizzesTaken} quizzes taken
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-400 italic">
                  Take a quiz to see your scores! 📝
                </p>
              )}
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <Award className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600">Upcoming Deadlines</p>
              {overallAnalytics.upcomingDeadlinesCount > 0 ? (
                <>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {overallAnalytics.upcomingDeadlinesCount}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Next 2 weeks</p>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-400 italic">
                  No upcoming deadlines! 🎉
                </p>
              )}
            </div>
            <div className="rounded-full bg-orange-100 p-3">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Study Hours/Week</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {overallAnalytics.totalStudyHours}h
              </p>
              <p className="mt-1 text-xs text-slate-500">Recommended</p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Course Progress Comparison Chart */}
      {courseProgressData.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Course Comparison</h2>
            <p className="text-sm text-slate-500">Progress, Quiz Performance, and Exam Readiness</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={courseProgressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="progress" fill="#3b82f6" name="Progress %" />
              <Bar dataKey="quizAvg" fill="#10b981" name="Quiz Avg %" />
              <Bar dataKey="examReady" fill="#f59e0b" name="Exam Ready %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quiz Performance Trend */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">Quiz Performance Trend</h2>
          <p className="text-sm text-slate-500">Your quiz scores over time</p>
          <ResponsiveContainer width="100%" height={200} className="mt-4">
            {quizTrendData.length > 0 ? (
              <LineChart data={quizTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 3 }}
                />
              </LineChart>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No quiz data yet. Take quizzes to see trends!
              </div>
            )}
          </ResponsiveContainer>
        </div>

        {/* Performance Radar */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">Multi-dimensional View</h2>
          <p className="text-sm text-slate-500">Completion, Quiz, and Exam Readiness</p>
          <ResponsiveContainer width="100%" height={200} className="mt-4">
            <RadarChart data={topicCompletionData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Radar
                name="Progress"
                dataKey="completion"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
              />
              <Radar
                name="Quiz"
                dataKey="quizPerformance"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.3}
              />
              <Radar
                name="Exam"
                dataKey="examReadiness"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.3}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Exam Readiness */}
      {allExamReadiness.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-900">Exam Readiness</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">How prepared you are for upcoming exams</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allExamReadiness.map((exam, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border-2 p-4 ${
                  exam.status === "excellent"
                    ? "border-green-200 bg-green-50"
                    : exam.status === "good"
                    ? "border-blue-200 bg-blue-50"
                    : exam.status === "needs-work"
                    ? "border-orange-200 bg-orange-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-600">{exam.courseName}</p>
                    <h3 className="mt-1 font-semibold text-slate-900">{exam.examTitle}</h3>
                    {exam.daysUntilExam !== undefined && (
                      <p className="mt-1 text-xs text-slate-500">
                        {exam.daysUntilExam > 0
                          ? `${exam.daysUntilExam} days away`
                          : exam.daysUntilExam === 0
                          ? "Today!"
                          : "Past"}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-2xl font-bold ${
                        exam.status === "excellent"
                          ? "text-green-600"
                          : exam.status === "good"
                          ? "text-blue-600"
                          : exam.status === "needs-work"
                          ? "text-orange-600"
                          : "text-red-600"
                      }`}
                    >
                      {exam.readinessPercent}%
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-2 rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${
                        exam.status === "excellent"
                          ? "bg-green-500"
                          : exam.status === "good"
                          ? "bg-blue-500"
                          : exam.status === "needs-work"
                          ? "bg-orange-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${exam.readinessPercent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    {exam.topicsCovered} / {exam.totalTopics} topics
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Cards with Actions */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Your Courses</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {courseOrder.map((courseId) => {
            const course = courses[courseId];
            if (!course) return null;
            const progress = courseProgress(course.studyMap.topics);
            const analytics = courseAnalytics.find((c) => c.courseId === courseId);
            const nextUpcoming = [...course.studyMap.assignments]
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

            return (
              <div key={courseId} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{course.studyMap.course.name}</h3>
                    <p className="text-sm text-slate-500">
                      {course.studyMap.course.courseNumber} · {course.studyMap.course.term}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(course.lastUpdated), { addSuffix: true })}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Progress</p>
                    <p className="text-lg font-bold text-blue-600">{progress.percent}%</p>
                  </div>
                  <div className="text-center border-x border-slate-200">
                    <p className="text-xs text-slate-500">Quiz Avg</p>
                    <p className="text-lg font-bold text-green-600">
                      {analytics?.quizAverage || 0}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Exam Ready</p>
                    <p className="text-lg font-bold text-orange-600">
                      {analytics?.examReadiness || 0}%
                    </p>
                  </div>
                </div>

                {analytics && analytics.needsImprovement && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <p className="text-xs font-medium text-orange-700">
                      Needs {analytics.recommendedStudyHours}h/week study time
                    </p>
                  </div>
                )}

                {nextUpcoming && (
                  <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase text-slate-500">Next Deadline</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{nextUpcoming.title}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(nextUpcoming.dueDate).toLocaleDateString()} · {nextUpcoming.type}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
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
                    Quiz
                  </button>
                  <button
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600"
                    onClick={() => navigate("/")}
                  >
                    + Syllabus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Needs Attention / Strong Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-orange-200 bg-orange-50/50 p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-slate-900">Needs Improvement</h3>
          </div>
          <div className="mt-3 space-y-2">
            {courseAnalytics
              .filter((c) => c.needsImprovement)
              .slice(0, 3)
              .map((course, idx) => (
                <div key={idx} className="rounded-xl border border-orange-200 bg-white p-3">
                  <p className="font-semibold text-slate-900">{course.courseName}</p>
                  <p className="text-xs text-slate-600">
                    {course.progressPercent}% done · {course.quizAverage}% quiz avg
                  </p>
                  {course.weakAreas.length > 0 && (
                    <p className="mt-1 text-xs text-orange-700">
                      Focus on: {course.weakAreas.slice(0, 2).join(", ")}
                    </p>
                  )}
                </div>
              ))}
            {courseAnalytics.filter((c) => c.needsImprovement).length === 0 && (
              <div className="rounded-xl bg-white p-6 text-center">
                <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
                <p className="mt-2 text-sm font-medium text-slate-700">All good!</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-green-200 bg-green-50/50 p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-slate-900">Strong Performance</h3>
          </div>
          <div className="mt-3 space-y-2">
            {courseAnalytics
              .filter((c) => !c.needsImprovement)
              .slice(0, 3)
              .map((course, idx) => (
                <div key={idx} className="rounded-xl border border-green-200 bg-white p-3">
                  <p className="font-semibold text-slate-900">{course.courseName}</p>
                  <p className="text-xs text-slate-600">
                    {course.progressPercent}% done · {course.quizAverage}% quiz avg
                  </p>
                  {course.strongAreas.length > 0 && (
                    <p className="mt-1 text-xs text-green-700">
                      Strong: {course.strongAreas.slice(0, 2).join(", ")}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
