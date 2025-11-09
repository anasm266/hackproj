import type { CourseRecord, QuizResult } from "../store/useStudyPlanStore";
import type { MicroTopic } from "@studymap/types";

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

// Calculate exam readiness based on assignments and completed topics
export const calculateExamReadiness = (
  course: CourseRecord
): ExamReadiness[] => {
  const exams = course.studyMap.assignments.filter((a) => a.type === "exam");

  return exams.map((exam) => {
    // Find all microtopics related to this exam
    const allMicroTopics: MicroTopic[] = [];
    const completedMicroTopics: MicroTopic[] = [];
    const weakTopics: string[] = [];

    course.studyMap.topics.forEach((topic) => {
      topic.subTopics.forEach((sub) => {
        sub.microTopics.forEach((micro) => {
          allMicroTopics.push(micro);
          if (micro.completed) {
            completedMicroTopics.push(micro);
          }
        });
      });

      // Check if topic is weak (less than 50% completion)
      const topicMicroTopics = topic.subTopics.flatMap((s) => s.microTopics);
      const topicCompleted = topicMicroTopics.filter((m) => m.completed).length;
      const topicTotal = topicMicroTopics.length;
      if (topicTotal > 0 && topicCompleted / topicTotal < 0.5) {
        weakTopics.push(topic.title);
      }
    });

    const totalTopics = allMicroTopics.length;
    const readinessPercent =
      totalTopics > 0
        ? Math.round((completedMicroTopics.length / totalTopics) * 100)
        : 0;

    let daysUntilExam: number | undefined;
    if (exam.dueDate) {
      const examDate = new Date(exam.dueDate);
      const now = new Date();
      daysUntilExam = Math.ceil(
        (examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    let status: "excellent" | "good" | "needs-work" | "critical";
    if (readinessPercent >= 80) status = "excellent";
    else if (readinessPercent >= 60) status = "good";
    else if (readinessPercent >= 40) status = "needs-work";
    else status = "critical";

    return {
      examId: exam.id,
      examTitle: exam.title,
      examDate: exam.dueDate,
      topicsCovered: completedMicroTopics.length,
      totalTopics,
      readinessPercent,
      weakTopics,
      daysUntilExam,
      status,
    };
  });
};

// Calculate quiz performance analytics
export const calculateQuizAnalytics = (quizResults: QuizResult[]) => {
  if (quizResults.length === 0) {
    return {
      average: 0,
      total: 0,
      byDifficulty: {},
      trend: [],
      weakTopics: [],
    };
  }

  const total = quizResults.length;
  const average = Math.round(
    quizResults.reduce((sum, q) => sum + q.score, 0) / total
  );

  // Group by difficulty
  const byDifficulty: Record<string, { count: number; avgScore: number }> = {};
  quizResults.forEach((q) => {
    const diff = q.difficulty || "medium";
    if (!byDifficulty[diff]) {
      byDifficulty[diff] = { count: 0, avgScore: 0 };
    }
    byDifficulty[diff].count++;
    byDifficulty[diff].avgScore += q.score;
  });
  Object.keys(byDifficulty).forEach((key) => {
    byDifficulty[key].avgScore = Math.round(
      byDifficulty[key].avgScore / byDifficulty[key].count
    );
  });

  // Get trend over time (last 10 quizzes)
  const trend = quizResults
    .slice(-10)
    .map((q) => ({
      date: new Date(q.completedAt).toLocaleDateString(),
      score: q.score,
    }));

  // Identify weak topics (topics with <60% average score)
  const topicScores: Record<string, { total: number; sum: number }> = {};
  quizResults.forEach((q) => {
    q.topicIds.forEach((topicId: string) => {
      if (!topicScores[topicId]) {
        topicScores[topicId] = { total: 0, sum: 0 };
      }
      topicScores[topicId].total++;
      topicScores[topicId].sum += q.score;
    });
  });

  const weakTopics = Object.entries(topicScores)
    .map(([topic, stats]) => ({
      topic,
      avgScore: Math.round(stats.sum / stats.total),
    }))
    .filter((t) => t.avgScore < 60)
    .map((t) => t.topic);

  return {
    average,
    total,
    byDifficulty,
    trend,
    weakTopics,
  };
};

// Calculate analytics for a single course
export const calculateCourseAnalytics = (
  courseId: string,
  course: CourseRecord,
  examFilter?: string // Optional exam ID to filter microtopics
): CourseAnalytics => {
  // Helper function to check if a microtopic matches the exam filter
  const matchesExamFilter = (micro: MicroTopic): boolean => {
    if (!examFilter || examFilter === "all") return true;
    return micro.examScopeIds.includes(examFilter);
  };

  // Compute micro-topic stats (filtered by exam if specified)
  const microStats = { total: 0, completed: 0 };
  course.studyMap.topics.forEach((topic) => {
    topic.subTopics.forEach((sub) => {
      sub.microTopics.forEach((micro) => {
        if (matchesExamFilter(micro)) {
          microStats.total++;
          if (micro.completed) microStats.completed++;
        }
      });
    });
  });

  const progressPercent =
    microStats.total > 0
      ? Math.round((microStats.completed / microStats.total) * 100)
      : 0;

  // Calculate quiz analytics
  const quizAnalytics = calculateQuizAnalytics(course.quizResults);

  // Calculate exam readiness
  const examReadiness = calculateExamReadiness(course);
  const avgExamReadiness =
    examReadiness.length > 0
      ? Math.round(
          examReadiness.reduce((sum, e) => sum + e.readinessPercent, 0) /
            examReadiness.length
        )
      : progressPercent;

  const upcomingDeadlines = course.studyMap.assignments.filter((a) => {
    const dueDate = new Date(a.dueDate);
    const now = new Date();
    const daysUntil = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntil >= 0 && daysUntil <= 14;
  }).length;

  // Determine weak areas (topics with <50% completion) - filtered by exam
  const weakAreas: string[] = [];
  const strongAreas: string[] = [];

  course.studyMap.topics.forEach((topic) => {
    const microStats = { total: 0, completed: 0 };
    topic.subTopics.forEach((sub) => {
      sub.microTopics.forEach((micro) => {
        if (matchesExamFilter(micro)) {
          microStats.total++;
          if (micro.completed) microStats.completed++;
        }
      });
    });

    const topicProgress =
      microStats.total > 0
        ? (microStats.completed / microStats.total) * 100
        : 0;

    if (topicProgress < 50 && microStats.total > 0) {
      weakAreas.push(topic.title);
    } else if (topicProgress >= 80 && microStats.total > 0) {
      strongAreas.push(topic.title);
    }
  });

  // Calculate recommended study hours
  let recommendedStudyHours = 0;
  if (progressPercent < 60) recommendedStudyHours += 5;
  else if (progressPercent < 80) recommendedStudyHours += 3;
  else recommendedStudyHours += 2;

  // Add extra hours for weak quiz performance
  if (quizAnalytics.average < 70) recommendedStudyHours += 2;

  // Add extra hours for urgent exams
  const urgentExams = examReadiness.filter(
    (e) =>
      e.daysUntilExam !== undefined &&
      e.daysUntilExam <= 7 &&
      e.readinessPercent < 70
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
          if (matchesExamFilter(micro)) {
            microStats.total++;
            if (micro.completed) microStats.completed++;
          }
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
    weakAreas,
    strongAreas,
    upcomingDeadlines,
    studyStreak: 0,
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

  const totalMicroTopics = courseAnalytics.reduce(
    (sum, c) => sum + c.totalMicroTopics,
    0
  );
  const completedMicroTopics = courseAnalytics.reduce(
    (sum, c) => sum + c.completedMicroTopics,
    0
  );
  const overallProgress =
    totalMicroTopics > 0
      ? Math.round((completedMicroTopics / totalMicroTopics) * 100)
      : 0;

  const totalQuizzesTaken = courseAnalytics.reduce(
    (sum, c) => sum + c.quizzesTaken,
    0
  );
  const totalQuizScore = courseAnalytics.reduce(
    (sum, c) => sum + c.quizAverage * c.quizzesTaken,
    0
  );
  const averageQuizScore =
    totalQuizzesTaken > 0 ? Math.round(totalQuizScore / totalQuizzesTaken) : 0;

  const upcomingDeadlinesCount = courseAnalytics.reduce(
    (sum, c) => sum + c.upcomingDeadlines,
    0
  );

  const coursesNeedingAttention = courseAnalytics
    .filter((c) => c.needsImprovement)
    .map((c) => c.courseName);

  const strongest = courseAnalytics.reduce((prev, curr) =>
    curr.progressPercent > prev.progressPercent ? curr : prev
  );

  const weakest = courseAnalytics.reduce((prev, curr) =>
    curr.progressPercent < prev.progressPercent ? curr : prev
  );

  const totalStudyHours = courseAnalytics.reduce(
    (sum, c) => sum + c.recommendedStudyHours,
    0
  );

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

// Helper function to calculate exam-specific analytics
export const calculateExamAnalytics = (
  courseId: string,
  course: CourseRecord,
  examId: string
): CourseAnalytics => {
  return calculateCourseAnalytics(courseId, course, examId);
};

// Helper function to get progress for a specific exam
export const getExamProgress = (
  course: CourseRecord,
  examId: string
): { completed: number; total: number; percent: number } => {
  let completed = 0;
  let total = 0;

  course.studyMap.topics.forEach((topic) => {
    topic.subTopics.forEach((sub) => {
      sub.microTopics.forEach((micro) => {
        if (micro.examScopeIds.includes(examId)) {
          total++;
          if (micro.completed) completed++;
        }
      });
    });
  });

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent };
};
