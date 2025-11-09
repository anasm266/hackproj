import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { parseCourseSyllabus, generateQuiz, findResources } from './claude.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

/**
 * POST /api/parse-syllabus
 * Parse syllabus PDF and extract structured data
 */
app.post('/api/parse-syllabus', upload.array('files', 5), async (req, res) => {
  try {
    const { courseName, courseNumber, term } = req.body
    const files = req.files

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' })
    }

    if (!courseName) {
      return res.status(400).json({ error: 'Course name is required' })
    }

    console.log(`Parsing syllabus for: ${courseName}`)

    // Convert files to base64 for Claude API
    const pdfData = files.map((file) => ({
      data: file.buffer.toString('base64'),
      media_type: 'application/pdf',
      filename: file.originalname,
    }))

    // Call Claude to parse the syllabus
    const result = await parseCourseSyllabus(pdfData, courseName, courseNumber, term)

    res.json(result)
  } catch (error) {
    console.error('Error parsing syllabus:', error)
    res.status(500).json({
      error: 'Failed to parse syllabus',
      message: error.message,
    })
  }
})

/**
 * POST /api/generate-quiz
 * Generate quiz questions for selected topics
 */
app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { topics, difficulty, questionCount, questionTypes } = req.body

    if (!topics || topics.length === 0) {
      return res.status(400).json({ error: 'Topics are required' })
    }

    console.log(`Generating quiz for ${topics.length} topics`)

    const quiz = await generateQuiz(topics, difficulty, questionCount, questionTypes)

    res.json(quiz)
  } catch (error) {
    console.error('Error generating quiz:', error)
    res.status(500).json({
      error: 'Failed to generate quiz',
      message: error.message,
    })
  }
})

/**
 * POST /api/find-resources
 * Find learning resources for a topic
 */
app.post('/api/find-resources', async (req, res) => {
  try {
    const { topicTitle, topicDescription, courseName } = req.body

    if (!topicTitle) {
      return res.status(400).json({ error: 'Topic title is required' })
    }

    console.log(`Finding resources for: ${topicTitle}`)

    const resources = await findResources(topicTitle, topicDescription, courseName)

    res.json({ resources })
  } catch (error) {
    console.error('Error finding resources:', error)
    res.status(500).json({
      error: 'Failed to find resources',
      message: error.message,
    })
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  })
})

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
