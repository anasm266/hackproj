// ============================================
// LOCAL STORAGE API
// ============================================
// Simple storage for demo purposes
// Can be replaced with a real backend later

import type { Course, StudyMap, Deadline, Resource, Quiz } from '../types';

const STORAGE_KEYS = {
  COURSES: 'studymap_courses',
  STUDY_MAPS: 'studymap_study_maps',
  DEADLINES: 'studymap_deadlines',
  RESOURCES: 'studymap_resources',
  QUIZZES: 'studymap_quizzes',
};

// Courses
export function saveCourse(course: Course): void {
  const courses = getCourses();
  const index = courses.findIndex(c => c.id === course.id);
  if (index >= 0) {
    courses[index] = course;
  } else {
    courses.push(course);
  }
  localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
}

export function getCourses(): Course[] {
  const data = localStorage.getItem(STORAGE_KEYS.COURSES);
  return data ? JSON.parse(data) : [];
}

export function getCourse(id: string): Course | null {
  const courses = getCourses();
  return courses.find(c => c.id === id) || null;
}

export function deleteCourse(id: string): void {
  const courses = getCourses().filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
}

// Study Maps
export function saveStudyMap(studyMap: StudyMap): void {
  const studyMaps = getStudyMaps();
  const index = studyMaps.findIndex(sm => sm.courseId === studyMap.courseId);
  if (index >= 0) {
    studyMaps[index] = studyMap;
  } else {
    studyMaps.push(studyMap);
  }
  localStorage.setItem(STORAGE_KEYS.STUDY_MAPS, JSON.stringify(studyMaps));
}

export function getStudyMaps(): StudyMap[] {
  const data = localStorage.getItem(STORAGE_KEYS.STUDY_MAPS);
  return data ? JSON.parse(data) : [];
}

export function getStudyMap(courseId: string): StudyMap | null {
  const studyMaps = getStudyMaps();
  return studyMaps.find(sm => sm.courseId === courseId) || null;
}

// Deadlines
export function saveDeadlines(courseId: string, deadlines: Deadline[]): void {
  const allDeadlines = getDeadlines();
  const filtered = allDeadlines.filter(d => d.courseId !== courseId);
  const updated = [...filtered, ...deadlines];
  localStorage.setItem(STORAGE_KEYS.DEADLINES, JSON.stringify(updated));
}

export function getDeadlines(courseId?: string): Deadline[] {
  const data = localStorage.getItem(STORAGE_KEYS.DEADLINES);
  const deadlines: Deadline[] = data ? JSON.parse(data) : [];
  return courseId ? deadlines.filter(d => d.courseId === courseId) : deadlines;
}

// Resources
export function saveResources(topicId: string, resources: Resource[]): void {
  const allResources = getResources();
  const filtered = allResources.filter(r => r.topicId !== topicId);
  const updated = [...filtered, ...resources];
  localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(updated));
}

export function getResources(topicId?: string): Resource[] {
  const data = localStorage.getItem(STORAGE_KEYS.RESOURCES);
  const resources: Resource[] = data ? JSON.parse(data) : [];
  return topicId ? resources.filter(r => r.topicId === topicId) : resources;
}

// Quizzes
export function saveQuiz(quiz: Quiz): void {
  const quizzes = getQuizzes();
  quizzes.push(quiz);
  localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
}

export function getQuizzes(courseId?: string): Quiz[] {
  const data = localStorage.getItem(STORAGE_KEYS.QUIZZES);
  const quizzes: Quiz[] = data ? JSON.parse(data) : [];
  return courseId ? quizzes.filter(q => q.courseId === courseId) : quizzes;
}
