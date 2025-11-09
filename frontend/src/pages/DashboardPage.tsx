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
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { courseProgress } from "../lib/progress";
import { useStudyPlanStore } from "../store/useStudyPlanStore";
import {
  calculateCourseAnalytics,
  calculateOverallAnalytics,
  calculateQuizAnalytics,
} from "../lib/analytics";

const DashboardPage = () => {
  const navigate = useNavigate();
  const courses = useStudyPlanStore((state) => state.courses);
  const courseOrder = useStudyPlanStore((state) => state.courseOrder);

  // Memoize with courseOrder length as dependency - simpler and more stable
  const overallAnalytics = useMemo(
    () => calculateOverallAnalytics(courses, courseOrder),
    [courseOrder.length]
  );

  const courseAnalytics = useMemo(
    () => courseOrder.map((id) => calculateCourseAnalytics(id, courses[id])).filter(Boolean),
    [courseOrder.length]
  );

  // Prepare data for charts
  const courseProgressData = courseAnalytics.map((c) => ({
    name: c.courseNumber || c.courseName.substring(0, 15),
    progress: c.progressPercent,
    quizAvg: c.quizAverage,
  }));

  const quizTrendData = courseAnalytics.flatMap((c) => {
    const course = courses[c.courseId];
    return calculateQuizAnalytics(course.quizResults).trend.map((t) => ({
      ...t,
      course: c.courseNumber || c.courseName.substring(0, 10),
    }));
  });

  const topicCompletionData = courseAnalytics.map((c) => ({
    subject: c.courseNumber || c.courseName.substring(0, 12),
    completion: c.progressPercent,
    quizPerformance: c.quizAverage,
  }));

  // Early return AFTER all hooks have been called
  if (!courseOrder.length) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-card">
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

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wide text-blue-500">Your Study Dashboard</p>
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
      </div>

      {/* Course Progress Comparison Chart */}
      {courseProgressData.length > 0 && (
        <div className="rounded-3xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50/30 p-8 shadow-lg backdrop-blur-sm">
          {/* Header with gradient accent */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Course Performance</h2>
                <p className="text-sm text-slate-600 mt-0.5">Compare your progress and quiz performance across all courses</p>
              </div>
            </div>
          </div>

          {/* Legend with modern badges */}
          <div className="mb-6 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 border border-blue-100">
              <div className="h-3 w-3 rounded-full bg-blue-500 shadow-sm"></div>
              <span className="text-sm font-medium text-blue-900">Course Progress</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 border border-emerald-100">
              <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm"></div>
              <span className="text-sm font-medium text-emerald-900">Quiz Performance</span>
            </div>
          </div>

          {/* Enhanced Chart */}
          <div className="rounded-2xl bg-white p-4 shadow-inner border border-slate-100">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart 
                data={courseProgressData}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                barGap={12}
                barCategoryGap="25%"
              >
                <defs>
                  {/* Gradient definitions for bars */}
                  <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="quizGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e2e8f0" 
                  vertical={false}
                  strokeOpacity={0.5}
                />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: "#475569", fontSize: 13, fontWeight: 500 }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                  dx={-10}
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 12 } }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(148, 163, 184, 0.1)", radius: 8 }}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.98)",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    padding: "12px",
                  }}
                  labelStyle={{ 
                    color: "#0f172a", 
                    fontWeight: 600,
                    marginBottom: "8px",
                    fontSize: "14px"
                  }}
                  itemStyle={{ 
                    color: "#475569",
                    fontSize: "13px",
                    padding: "4px 0"
                  }}
                />
                <Bar 
                  dataKey="progress" 
                  fill="url(#progressGradient)"
                  name="Course Progress"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={80}
                />
                <Bar 
                  dataKey="quizAvg" 
                  fill="url(#quizGradient)"
                  name="Quiz Performance"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={80}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Performance indicators */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-blue-50/50 p-5 border border-blue-100/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Average Progress</span>
                <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-blue-900">
                  {Math.round(courseProgressData.reduce((sum, c) => sum + c.progress, 0) / courseProgressData.length)}%
                </span>
                <span className="text-sm text-blue-600">across {courseProgressData.length} course{courseProgressData.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="rounded-xl bg-emerald-50/50 p-5 border border-emerald-100/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Average Quiz Score</span>
                <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-emerald-900">
                  {Math.round(courseProgressData.reduce((sum, c) => sum + c.quizAvg, 0) / courseProgressData.length)}%
                </span>
                <span className="text-sm text-emerald-600">
                  {courseAnalytics.reduce((sum, c) => sum + c.quizzesTaken, 0)} quiz{courseAnalytics.reduce((sum, c) => sum + c.quizzesTaken, 0) !== 1 ? 'zes' : ''} taken
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Trend and Performance Radar */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quiz Performance Trend */}
        <div className="rounded-3xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50/30 p-8 shadow-lg backdrop-blur-sm">
          {/* Header with gradient accent */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Quiz Performance Trend</h2>
                <p className="text-sm text-slate-600 mt-0.5">Track your quiz scores over time</p>
              </div>
            </div>
          </div>

          {/* Enhanced Chart */}
          <div className="rounded-2xl bg-white p-4 shadow-inner border border-slate-100">
            <ResponsiveContainer width="100%" height={280}>
              {quizTrendData.length > 0 ? (
                <LineChart 
                  data={quizTrendData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#e2e8f0" 
                    vertical={false}
                    strokeOpacity={0.5}
                  />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={false}
                    dy={5}
                  />
                  <YAxis 
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={false}
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 11 } }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.98)",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                      padding: "12px",
                    }}
                    labelStyle={{ 
                      color: "#0f172a", 
                      fontWeight: 600,
                      marginBottom: "6px",
                      fontSize: "13px"
                    }}
                    itemStyle={{ 
                      color: "#10b981",
                      fontSize: "13px",
                      fontWeight: 600
                    }}
                    formatter={(value: number) => [`${value}%`, 'Score']}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="url(#lineGradient)"
                    strokeWidth={3}
                    dot={{ 
                      fill: "#10b981", 
                      strokeWidth: 3,
                      stroke: "#fff",
                      r: 5
                    }}
                    activeDot={{ 
                      r: 7,
                      strokeWidth: 3,
                      stroke: "#fff",
                      fill: "#10b981"
                    }}
                  />
                </LineChart>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-600">No quiz data yet</p>
                  <p className="text-xs text-slate-400">Take quizzes to see your performance trends</p>
                </div>
              )}
            </ResponsiveContainer>
          </div>

          {/* Stats Summary */}
          {quizTrendData.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4 border border-emerald-100/50">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Latest Score</span>
                </div>
                <div className="text-2xl font-bold text-emerald-900">
                  {quizTrendData[quizTrendData.length - 1]?.score || 0}%
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/50 p-4 border border-blue-100/50">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Average</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {Math.round(quizTrendData.reduce((sum, q) => sum + q.score, 0) / quizTrendData.length)}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Performance Radar */}
        <div className="rounded-3xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50/30 p-8 shadow-lg backdrop-blur-sm">
          {/* Header with gradient accent */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Multi-dimensional View</h2>
                <p className="text-sm text-slate-600 mt-0.5">Course progress and quiz performance across all subjects</p>
              </div>
            </div>
          </div>

          {/* Legend with modern badges */}
          <div className="mb-6 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 border border-blue-100">
              <div className="h-3 w-3 rounded-full bg-blue-500 shadow-sm"></div>
              <span className="text-sm font-medium text-blue-900">Course Completion</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 border border-emerald-100">
              <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm"></div>
              <span className="text-sm font-medium text-emerald-900">Quiz Performance</span>
            </div>
          </div>

          {/* Enhanced Radar Chart */}
          <div className="rounded-2xl bg-white p-6 shadow-inner border border-slate-100">
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={topicCompletionData}>
                <defs>
                  <linearGradient id="radarCompletionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="radarQuizGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <PolarGrid 
                  stroke="#cbd5e1" 
                  strokeWidth={1}
                  strokeOpacity={0.6}
                />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ 
                    fill: "#475569", 
                    fontSize: 12,
                    fontWeight: 600
                  }}
                  tickLine={false}
                />
                <PolarRadiusAxis 
                  domain={[0, 100]} 
                  tick={{ 
                    fill: "#64748b", 
                    fontSize: 11,
                    fontWeight: 500
                  }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickCount={6}
                  angle={90}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.98)",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    padding: "12px",
                  }}
                  labelStyle={{ 
                    color: "#0f172a", 
                    fontWeight: 600,
                    marginBottom: "8px",
                    fontSize: "14px"
                  }}
                  itemStyle={{ 
                    color: "#475569",
                    fontSize: "13px",
                    padding: "4px 0"
                  }}
                  formatter={(value: number) => `${value}%`}
                />
                <Radar
                  name="Course Completion"
                  dataKey="completion"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#radarCompletionGradient)"
                  fillOpacity={1}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
                <Radar
                  name="Quiz Performance"
                  dataKey="quizPerformance"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#radarQuizGradient)"
                  fillOpacity={1}
                  dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Insights */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-5 border border-blue-200/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 shadow-sm">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Best Progress</div>
                  <div className="text-lg font-bold text-blue-900">
                    {(() => {
                      const best = topicCompletionData.reduce((max, c) => c.completion > max.completion ? c : max, topicCompletionData[0]);
                      return `${best?.subject || 'N/A'} (${best?.completion || 0}%)`;
                    })()}
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 border border-emerald-200/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 shadow-sm">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Top Quiz Score</div>
                  <div className="text-lg font-bold text-emerald-900">
                    {(() => {
                      const best = topicCompletionData.reduce((max, c) => c.quizPerformance > max.quizPerformance ? c : max, topicCompletionData[0]);
                      return `${best?.subject || 'N/A'} (${best?.quizPerformance || 0}%)`;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Course Cards */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">Your Courses</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {courseOrder.map((courseId) => {
            const course = courses[courseId];
            if (!course) return null;
            const progress = courseProgress(course.studyMap.topics);
            const analytics = courseAnalytics.find((c) => c.courseId === courseId);

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
