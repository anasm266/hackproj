import Anthropic from '@anthropic-ai/sdk'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const require = createRequire(import.meta.url)
const PDFParser = require('pdf2json')

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY,
})

/**
 * Parse course syllabus using Claude
 */
export async function parseCourseSyllabus(pdfData, courseName, courseNumber, term) {
  // Extract text from all PDF files
  let syllabusText = ''

  for (const pdfFile of pdfData) {
    try {
      const buffer = Buffer.from(pdfFile.data, 'base64')

      // Use pdf2json to extract text
      const pdfParser = new PDFParser()

      const text = await new Promise((resolve, reject) => {
        pdfParser.on('pdfParser_dataError', (error) => reject(error))
        pdfParser.on('pdfParser_dataReady', (pdfData) => {
          let text = ''
          pdfData.Pages.forEach((page) => {
            page.Texts.forEach((textItem) => {
              try {
                // Try to decode, but fall back to raw text if it fails
                text += decodeURIComponent(textItem.R[0].T) + ' '
              } catch (e) {
                // If URI decoding fails, use the raw text
                text += textItem.R[0].T + ' '
              }
            })
            text += '\n'
          })
          resolve(text)
        })
        pdfParser.parseBuffer(buffer)
      })

      syllabusText += `\n\n--- ${pdfFile.filename} ---\n${text}\n`
    } catch (error) {
      console.error(`Error extracting text from PDF ${pdfFile.filename}:`, error)
      throw new Error(`Failed to extract text from PDF: ${pdfFile.filename}`)
    }
  }

  const prompt = `You are analyzing a course syllabus for: ${courseName}${courseNumber ? ` (${courseNumber})` : ''}${term ? ` - ${term}` : ''}.

Your task is to:
1. Extract all deadlines (exams, assignments, projects) with dates
2. Identify the main topics covered in the course
3. Break down each topic into subtopics
4. Break down each subtopic into microtopics (specific learning objectives)
5. Tag microtopics with exam/project IDs when the syllabus indicates what each exam/project covers

Return a JSON object with this structure:
{
  "topics": [
    {
      "id": "unique-id",
      "title": "Topic Title",
      "description": "Brief description",
      "subtopics": [
        {
          "id": "unique-id",
          "title": "Subtopic Title",
          "description": "Brief description",
          "microtopics": [
            {
              "id": "unique-id",
              "title": "Microtopic Title",
              "description": "Specific learning objective",
              "completed": false,
              "examIds": ["exam-1"],
              "projectIds": []
            }
          ]
        }
      ]
    }
  ],
  "deadlines": [
    {
      "id": "unique-id",
      "title": "Exam 1",
      "type": "exam",
      "dueDate": "2025-02-15T10:00:00Z",
      "description": "Midterm exam",
      "scope": "Covers lectures 1-10: Introduction, Data Structures, Algorithms",
      "relatedTopicIds": ["topic-1", "topic-2"]
    }
  ],
  "rationale": "Brief explanation of your decomposition approach"
}

Important guidelines:
- Generate unique IDs using format: topic-1, subtopic-1-1, micro-1-1-1, exam-1, etc.
- Parse dates carefully and convert to ISO format
- Each topic should have 2-5 subtopics
- Each subtopic should have 2-8 microtopics
- Microtopics should be specific, actionable learning objectives
- Link microtopics to exams/projects based on the scope described in syllabus
- If dates are ambiguous, make reasonable assumptions based on typical academic calendars
- Return ONLY valid JSON, no additional text

Here is the syllabus content:
${syllabusText}`

  const message = await client.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  // Extract JSON from response
  const responseText = message.content[0].text
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)

  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from Claude response')
  }

  const result = JSON.parse(jsonMatch[0])

  // Convert date strings to Date objects
  result.deadlines = result.deadlines.map((deadline) => ({
    ...deadline,
    dueDate: new Date(deadline.dueDate),
  }))

  return result
}

/**
 * Generate quiz questions using Claude
 */
export async function generateQuiz(topics, difficulty = 'intermediate', questionCount = 10, questionTypes = ['mcq', 'short']) {
  const topicsList = topics.map((t) => `- ${t.title}: ${t.description}`).join('\n')

  const prompt = `Generate a quiz with ${questionCount} questions based on these topics:

${topicsList}

Quiz parameters:
- Difficulty: ${difficulty}
- Question types: ${questionTypes.join(', ')}
- Distribute questions evenly across topics

Return a JSON object with this structure:
{
  "questions": [
    {
      "id": "q-1",
      "type": "mcq",
      "question": "What is...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option A",
      "explanation": "Brief explanation of the correct answer",
      "topicId": "topic-1"
    },
    {
      "id": "q-2",
      "type": "short",
      "question": "Explain...",
      "answer": "Sample answer",
      "explanation": "Key points to cover",
      "topicId": "topic-2"
    }
  ]
}

Guidelines:
- For MCQ: provide 4 options, mark correct answer
- For short answer: provide a sample correct answer
- Make questions challenging but fair for the difficulty level
- Include clear explanations
- Return ONLY valid JSON, no additional text`

  const message = await client.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const responseText = message.content[0].text
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)

  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from Claude response')
  }

  return JSON.parse(jsonMatch[0])
}

/**
 * Find learning resources for a topic using Claude
 */
export async function findResources(topicTitle, topicDescription, courseName) {
  const prompt = `Find 3-5 high-quality learning resources for this topic:

Topic: ${topicTitle}
Description: ${topicDescription}
Course context: ${courseName}

Return a JSON array with this structure:
[
  {
    "id": "resource-1",
    "title": "Resource Title",
    "url": "https://...",
    "type": "video",
    "summary": "Brief 1-2 sentence summary of what this resource covers",
    "duration": 30,
    "thumbnail": "https://img.youtube.com/vi/VIDEO_ID/mqdefault.jpg"
  }
]

Resource types: "video", "article", "docs", "tutorial"

Guidelines:
- Prioritize official documentation, trusted educational platforms (YouTube educational channels, Khan Academy, MIT OCW, etc.)
- For videos, extract YouTube video ID and include thumbnail URL
- Include duration in minutes for videos
- Focus on resources that directly teach this specific topic
- Ensure URLs are real and accessible
- Return ONLY valid JSON array, no additional text`

  const message = await client.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const responseText = message.content[0].text
  const jsonMatch = responseText.match(/\[[\s\S]*\]/)

  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from Claude response')
  }

  return JSON.parse(jsonMatch[0])
}
