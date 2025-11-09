/**
 * @typedef {Object} Microtopic
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {boolean} completed
 * @property {string[]} examIds - IDs of exams this microtopic is relevant for
 * @property {string[]} projectIds - IDs of projects this microtopic is relevant for
 */

/**
 * @typedef {Object} Subtopic
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {Microtopic[]} microtopics
 * @property {number} progress - Calculated progress percentage (0-100)
 */

/**
 * @typedef {Object} Topic
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {Subtopic[]} subtopics
 * @property {number} progress - Calculated progress percentage (0-100)
 */

/**
 * @typedef {Object} Deadline
 * @property {string} id
 * @property {string} title
 * @property {string} type - 'exam' | 'assignment' | 'project'
 * @property {Date} dueDate
 * @property {string} description
 * @property {string} scope - What topics/lectures this covers
 * @property {string[]} relatedTopicIds
 */

/**
 * @typedef {Object} Resource
 * @property {string} id
 * @property {string} title
 * @property {string} url
 * @property {string} type - 'video' | 'article' | 'docs' | 'tutorial'
 * @property {string} summary
 * @property {number} [duration] - Duration in minutes (for videos)
 * @property {string} [thumbnail] - Thumbnail URL (for videos)
 */

/**
 * @typedef {Object} Course
 * @property {string} id
 * @property {string} name
 * @property {string} [courseNumber]
 * @property {string} [term]
 * @property {Topic[]} topics
 * @property {Deadline[]} deadlines
 * @property {Object.<string, Resource[]>} resources - Keyed by topic ID
 * @property {number} progress - Overall course progress (0-100)
 * @property {Date} createdAt
 * @property {Date} lastActivity
 * @property {string} status - 'parsing' | 'draft' | 'active' | 'completed'
 */

/**
 * @typedef {Object} QuizQuestion
 * @property {string} id
 * @property {string} type - 'mcq' | 'short' | 'true-false'
 * @property {string} question
 * @property {string[]} [options] - For MCQ questions
 * @property {string} answer
 * @property {string} explanation
 * @property {string} topicId
 */

/**
 * @typedef {Object} Quiz
 * @property {string} id
 * @property {string} courseId
 * @property {string[]} topicIds
 * @property {QuizQuestion[]} questions
 * @property {string} difficulty - 'intro' | 'intermediate' | 'exam'
 * @property {Date} createdAt
 */

/**
 * @typedef {Object} ParseResult
 * @property {Topic[]} topics
 * @property {Deadline[]} deadlines
 * @property {string} rationale
 */

export {}
