import type { CourseRecord, QuizResult } from "../store/useStudyPlanStore";
import type { Topic, MicroTopic, SubTopic } from "@studymap/types";

export interface CourseAnalytics {
  courseId: string;
  courseName: string;
  courseNumber: string;
  totalTopics: number;
  completedTopics: number;
  totalMicroTopics: number;
  completedMicroTopics: number;
  progressPercent: number;
  examReadiness: number;
  quizAverage: number;
  quizzesTaken: number;
  weakAreas: string[];
  strongAreas: string[];
  upcomingDeadlines: number;
  studyStreak: number;
  lastActivity: string;
  needsImprovement: boolean;
  recommendedStudyHours: number;
}

export interface OverallAnalytics {
  totalCourses: number;
  overallProgress: number;
  totalQuizzesTaken: number;
  averageQuizScore: number;
  totalTopicsCompleted: number;
  totalTopics: number;
  upcomingDeadlinesCount: number;
  coursesNeedingAttention: string[];
  strongestCourse: string;
  weakestCourse: string;
  studyStreak: number;
  totalStudyHours: number;
}

export interface ExamReadiness {
  examId: string;
  examTitle: string;
  examDate?: string;
  topicsCovered: number;
  totalTopics: number;
  readinessPercent: number;
  weakTopics: string[];
  daysUntilExam?: number;
  status: "excellent" | "good" | "needs-work" | "critical";
}

// Calculate micro topics completion
const getMicroTopicStats = (topics: Topic[]) => {
  let total = 0;
  let completed = 0;

  topics.forEach((topic) => {
    topic.subTopics.forEach((sub) => {
      sub.microTopics.forEach((micro) => {
        total++;
        if (micro.completed) completed++;
      });
    });
  });

  return { total, completed };
};

// Calculate exam readiness for a course
export const calculateExamReadiness = (
  course: CourseRecord
): ExamReadiness[] => {
  const exams = course.studyMap.exams || [];

  return exams.map((exam) => {
    const relatedMicroTopics: MicroTopic[] = [];
    let completedMicroTopics = 0;

    course.studyMap.topics.forEach((topic) => {
      if (exam.relatedTopicIds.includes(topic.id)) {
        topic.subTopics.forEach((sub) => {
          sub.microTopics.forEach((micro) => {
            if (micro.examScopeIds.includes(exam.id)) {
              relatedMicroTopics.push(micro);
              if (micro.completed) completedMicroTopics++;
            }
          });
        });
      }
    });

    const totalTopics = relatedMicroTopics.length;
    const readinessPercent = totalTopics > 0
      ? Math.round((completedMicroTopics / totalTopics) * 100)
      : 0;

    const weakTopics = relatedMicroTopics
      .filter((m) => !m.completed)
      .map((m) => m.title)
      .slice(0, 5);

    let daysUntilExam: number | undefined;
    if (exam.date) {
      const examDate = new Date(exam.date);
      const today = new Date();
      daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    let status: "excellent" | "good" | "needs-work" | "critical";
    if (readinessPercent >= 80) status = "excellent";
    else if (readinessPercent >= 60) status = "good";
    else if (readinessPercent >= 40) status = "needs-work";
    else status = "critical";

    return {
      examId: exam.id,
      examTitle: exam.title,
      examDate: exam.date,
      topicsCovered: completedMicroTopics,
      totalTopics,
      readinessPercent,
      weakTopics,
      daysUntilExam,
      status,
    };
  });
};

// Calculate quiz performance analytics
export const calculateQuizAnalytics = (
  quizResults: QuizResult[]
) => {
  if (quizResults.length === 0) {
    return {
      average: 0,
      total: 0,
      byDifficulty: {},
      trend: [],
      weakTopics: [],
    };
  }

  const totalScore = quizResults.reduce((sum, r) => {
    return sum + (r.score / r.totalQuestions) * 100;
  }, 0);

  const average = Math.round(totalScore / quizResults.length);

  const byDifficulty = quizResults.reduce((acc, r) => {
    if (!acc[r.difficulty]) {
      acc[r.difficulty] = { total: 0, count: 0 };
    }
    acc[r.difficulty].total += (r.score / r.totalQuestions) * 100;
    acc[r.difficulty].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const trend = quizResults
    .slice(-10)
    .map((r) => ({
      date: new Date(r.completedAt).toLocaleDateString(),
      score: Math.round((r.score / r.totalQuestions) * 100),
    }));

  const topicPerformance: Record<string, { total: number; count: number }> = {};
  quizResults.forEach((r) => {
    const score = (r.score / r.totalQuestions) * 100;
    r.topicIds.forEach((topicId) => {
      if (!topicPerformance[topicId]) {
        topicPerformance[topicId] = { total: 0, count: 0 };
      }
      topicPerformance[topicId].total += score;
      topicPerformance[topicId].count += 1;
    });
  });

  const weakTopics = Object.entries(topicPerformance)
    .map(([topicId, stats]) => ({
      topicId,
      average: stats.total / stats.count,
    }))
    .filter((t) => t.average < 70)
    .sort((a, b) => a.average - b.average)
    .slice(0, 5)
    .map((t) => t.topicId);

  return {
    average,
    total: quizResults.length,
    byDifficulty,
    trend,
    weakTopics,
  };
};

// Calculate comprehensive course analytics
export const calculateCourseAnalytics = (
  courseId: string,
  course: CourseRecord
): CourseAnalytics => {
  const microStats = getMicroTopicStats(course.studyMap.topics);
  const progressPercent = microStats.total > 0
    ? Math.round((microStats.completed / microStats.total) * 100)
    : 0;

  const quizAnalytics = calculateQuizAnalytics(course.quizResults);
  const examReadiness = calculateExamReadiness(course);
  const avgExamReadiness = examReadiness.length > 0
    ? Math.round(
        examReadiness.reduce((sum, e) => sum + e.readinessPercent, 0) / examReadiness.length
      )
    : progressPercent;

  const upcomingDeadlines = course.studyMap.assignments.filter((a) => {
    const dueDate = new Date(a.dueDate);
    const now = new Date();
    const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 14;
  }).length;

  // Determine weak areas (topics with <50% completion)
  const weakAreas: string[] = [];
  const strongAreas: string[] = [];

  course.studyMap.topics.forEach((topic) => {
    const microStats = { total: 0, completed: 0 };
    topic.subTopics.forEach((sub) => {
      sub.microTopics.forEach((micro) => {
        microStats.total++;
        if (micro.completed) microStats.completed++;
      });
    });

    const topicProgress = microStats.total > 0
      ? (microStats.completed / microStats.total) * 100
      : 0;

    if (topicProgress < 50 && microStats.total > 0) {
      weakAreas.push(topic.title);
    } else if (topicProgress >= 80 && microStats.total > 0) {
      strongAreas.push(topic.title);
    }
  });

  // Calculate recommended study hours based on progress
  let recommendedStudyHours = 0;
  if (progressPercent < 30) recommendedStudyHours = 10;
  else if (progressPercent < 60) recommendedStudyHours = 7;
  else if (progressPercent < 80) recommendedStudyHours = 5;
  else recommendedStudyHours = 3;

  // Add extra hours for upcoming exams
  const urgentExams = examReadiness.filter(
    (e) => e.daysUntilExam !== undefined && e.daysUntilExam <= 7 && e.readinessPercent < 70
  );
  recommendedStudyHours += urgentExams.length * 3;

  const needsImprovement = progressPercent < 60 || quizAnalytics.average < 70;

  return {
    courseId,
    courseName: course.studyMap.course.name,
    courseNumber: course.studyMap.course.courseNumber || "",
    totalTopics: course.studyMap.topics.length,
    completedTopics: course.studyMap.topics.filter((t) => {
      const microStats = { total: 0, completed: 0 };
      t.subTopics.forEach((sub) => {
        sub.microTopics.forEach((micro) => {
          microStats.total++;
          if (micro.completed) microStats.completed++;
        });
      });
      return microStats.completed === microStats.total && microStats.total > 0;
    }).length,
    totalMicroTopics: microStats.total,
    completedMicroTopics: microStats.completed,
    progressPercent,
    examReadiness: avgExamReadiness,
    quizAverage: quizAnalytics.average,
    quizzesTaken: quizAnalytics.total,
    weakAreas: weakAreas.slice(0, 3),
    strongAreas: strongAreas.slice(0, 3),
    upcomingDeadlines,
    studyStreak: 0, // Can be enhanced with timestamp tracking
    lastActivity: course.lastUpdated,
    needsImprovement,
    recommendedStudyHours,
  };
};

// Calculate overall analytics across all courses
export const calculateOverallAnalytics = (
  courses: Record<string, CourseRecord>,
  courseOrder: string[]
): OverallAnalytics => {
  const courseAnalytics = courseOrder
    .map((id) => calculateCourseAnalytics(id, courses[id]))
    .filter(Boolean);

  if (courseAnalytics.length === 0) {
    return {
      totalCourses: 0,
      overallProgress: 0,
      totalQuizzesTaken: 0,
      averageQuizScore: 0,
      totalTopicsCompleted: 0,
      totalTopics: 0,
      upcomingDeadlinesCount: 0,
      coursesNeedingAttention: [],
      strongestCourse: "",
      weakestCourse: "",
      studyStreak: 0,
      totalStudyHours: 0,
    };
  }

  const totalMicroTopics = courseAnalytics.reduce((sum, c) => sum + c.totalMicroTopics, 0);
  const completedMicroTopics = courseAnalytics.reduce((sum, c) => sum + c.completedMicroTopics, 0);
  const overallProgress = totalMicroTopics > 0
    ? Math.round((completedMicroTopics / totalMicroTopics) * 100)
    : 0;

  const totalQuizzesTaken = courseAnalytics.reduce((sum, c) => sum + c.quizzesTaken, 0);
  const totalQuizScore = courseAnalytics.reduce((sum, c) => sum + c.quizAverage * c.quizzesTaken, 0);
  const averageQuizScore = totalQuizzesTaken > 0
    ? Math.round(totalQuizScore / totalQuizzesTaken)
    : 0;

  const upcomingDeadlinesCount = courseAnalytics.reduce((sum, c) => sum + c.upcomingDeadlines, 0);

  const coursesNeedingAttention = courseAnalytics
    .filter((c) => c.needsImprovement)
    .map((c) => c.courseName);

  const strongest = courseAnalytics.reduce((prev, curr) =>
    curr.progressPercent > prev.progressPercent ? curr : prev
  );

  const weakest = courseAnalytics.reduce((prev, curr) =>
    curr.progressPercent < prev.progressPercent ? curr : prev
  );

  const totalStudyHours = courseAnalytics.reduce((sum, c) => sum + c.recommendedStudyHours, 0);

  return {
    totalCourses: courseAnalytics.length,
    overallProgress,
    totalQuizzesTaken,
    averageQuizScore,
    totalTopicsCompleted: completedMicroTopics,
    totalTopics: totalMicroTopics,
    upcomingDeadlinesCount,
    coursesNeedingAttention,
    strongestCourse: strongest.courseName,
    weakestCourse: weakest.courseName,
    studyStreak: 0,
    totalStudyHours,
  };
};
