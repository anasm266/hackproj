import { promises as fs } from "node:fs";
import path from "node:path";
import type { QuizResponsePayload, StudyMapPayload, Topic } from "@studymap/types";

export type QuizResult = {
  id: string;
  quizId: string;
  completedAt: string;
  score: number;
  totalQuestions: number;
  difficulty: "auto" | "intro" | "exam";
  topicIds: string[];
  topicTitles: string[];
  weakTopicIds?: string[];
};

type PersistedCourseRecord = {
  studyMap: StudyMapPayload;
  quizHistory: QuizResponsePayload[];
  quizResults?: QuizResult[];
  lastUpdated: string;
};

type CourseDatabase = {
  courses: Record<string, PersistedCourseRecord>;
  courseOrder: string[];
};

const EMPTY_DB: CourseDatabase = {
  courses: {},
  courseOrder: []
};

const resolvePaths = () => {
  const baseDir = process.env.STUDYMAP_DATA_DIR
    ? path.resolve(process.env.STUDYMAP_DATA_DIR)
    : path.join(process.cwd(), "storage");
  return {
    dir: baseDir,
    file: path.join(baseDir, "studymap.json")
  };
};

const ensureDbFile = async () => {
  const { dir, file } = resolvePaths();
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(file);
  } catch {
    await fs.writeFile(file, JSON.stringify(EMPTY_DB, null, 2), "utf-8");
  }
};

const readDb = async (): Promise<CourseDatabase> => {
  const { file } = resolvePaths();
  try {
    const content = await fs.readFile(file, "utf-8");
    return JSON.parse(content) as CourseDatabase;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      await ensureDbFile();
      return { ...EMPTY_DB };
    }
    throw error;
  }
};

const writeDb = async (data: CourseDatabase) => {
  const { dir, file } = resolvePaths();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
};

const timestamp = () => new Date().toISOString();

export const courseStore = {
  async list(): Promise<CourseDatabase> {
    await ensureDbFile();
    return readDb();
  },
  async saveCourse(studyMap: StudyMapPayload): Promise<PersistedCourseRecord> {
    const db = await readDb();
    const existing = db.courses[studyMap.course.id];
    const record: PersistedCourseRecord = existing
      ? {
          ...existing,
          studyMap,
          lastUpdated: timestamp()
        }
      : {
          studyMap,
          quizHistory: [],
          quizResults: [],
          lastUpdated: timestamp()
        };

    db.courses[studyMap.course.id] = record;
    if (!db.courseOrder.includes(studyMap.course.id)) {
      db.courseOrder.push(studyMap.course.id);
    }
    await writeDb(db);
    return record;
  },
  async replaceTopics(courseId: string, topics: Topic[]): Promise<PersistedCourseRecord> {
    const db = await readDb();
    const course = db.courses[courseId];
    if (!course) {
      throw new Error("Course not found");
    }
    course.studyMap = {
      ...course.studyMap,
      topics
    };
    course.lastUpdated = timestamp();
    await writeDb(db);
    return course;
  },
  async recordQuiz(courseId: string, quiz: QuizResponsePayload): Promise<PersistedCourseRecord> {
    const db = await readDb();
    const course = db.courses[courseId];
    if (!course) {
      throw new Error("Course not found");
    }
    course.quizHistory = [quiz, ...course.quizHistory].slice(0, 5);
    course.lastUpdated = timestamp();
    await writeDb(db);
    return course;
  },
  async saveQuizResult(courseId: string, result: QuizResult): Promise<PersistedCourseRecord> {
    const db = await readDb();
    const course = db.courses[courseId];
    if (!course) {
      throw new Error("Course not found");
    }
    if (!course.quizResults) {
      course.quizResults = [];
    }
    course.quizResults = [result, ...course.quizResults];
    course.lastUpdated = timestamp();
    await writeDb(db);
    return course;
  },
  async deleteQuiz(courseId: string, quizId: string): Promise<PersistedCourseRecord> {
    const db = await readDb();
    const course = db.courses[courseId];
    if (!course) {
      throw new Error("Course not found");
    }
    course.quizHistory = course.quizHistory.filter((q) => q.quizId !== quizId);
    course.lastUpdated = timestamp();
    await writeDb(db);
    return course;
  },
  async deleteQuizResult(courseId: string, resultId: string): Promise<PersistedCourseRecord> {
    const db = await readDb();
    const course = db.courses[courseId];
    if (!course) {
      throw new Error("Course not found");
    }
    if (course.quizResults) {
      course.quizResults = course.quizResults.filter((r) => r.id !== resultId);
    }
    course.lastUpdated = timestamp();
    await writeDb(db);
    return course;
  },
  async deleteCourse(courseId: string): Promise<boolean> {
    const db = await readDb();
    if (!db.courses[courseId]) {
      return false;
    }
    delete db.courses[courseId];
    db.courseOrder = db.courseOrder.filter((id) => id !== courseId);
    await writeDb(db);
    return true;
  }
};

export type { CourseDatabase, PersistedCourseRecord };
