import Anthropic from "@anthropic-ai/sdk";
import {
  ChatContext,
  ChatMessage,
  ExamScope,
  QuizQuestion,
  QuizQuestionChoice,
  QuizRequestPayload,
  QuizResponsePayload,
  QuizTopicSelection,
  ResourceItem,
  StudyMapPayload,
  Topic,
  UpcomingItem
} from "@studymap/types";

const anthropicClient = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export const claudeAvailable = Boolean(anthropicClient);

const HEALTH_TTL_MS = 1000 * 60 * 5;
type ClaudeHealthSnapshot = {
  available: boolean;
  checkedAt: number;
  error?: string;
};
let lastHealthCheck: ClaudeHealthSnapshot | null = null;

const mixArray = <T,>(items: T[]): T[] => {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
};

export type ClaudeHealthStatus = ClaudeHealthSnapshot;

const microTopicPool = (topics: QuizTopicSelection[]) =>
  topics.flatMap((topic) =>
    topic.microTopics.map((micro) => ({
      ...micro,
      topicTitle: topic.title
    }))
  );

const buildChoices = (microTitle: string): QuizQuestionChoice[] => {
  const distractors = [
    "Enforces amortized constant time via banking tokens.",
    "Guarantees logarithmic depth rotations regardless of inserts.",
    "Uses divide-and-conquer to shrink problem inputs geometrically."
  ];

  const answers = mixArray([`Focuses on ${microTitle}.`, ...distractors]).map(
    (text, idx) => ({
      id: `choice-${idx}`,
      label: text,
      correct: idx === 0
    })
  );

  return answers;
};

const fallbackQuestions = (
  topics: QuizTopicSelection[],
  desiredLength: number,
  type: QuizRequestPayload["questionType"]
): QuizQuestion[] => {
  const pool = microTopicPool(topics);
  if (!pool.length) {
    return [
      {
        id: "quiz-empty",
        prompt: "Which concept from the recent syllabus upload would you like to review first?",
        type: "mcq",
        choices: [
          { id: "choice-a", label: "All topics seem clear", correct: true },
          { id: "choice-b", label: "Need more context", correct: false },
          { id: "choice-c", label: "Require additional examples", correct: false },
          { id: "choice-d", label: "Looking for practice problems", correct: false }
        ],
        explanation: "Selecting at least one topic will unlock tailored quizzes.",
        relatedMicroTopicIds: [],
        topicId: topics[0]?.id || "unknown"
      }
    ];
  }

  const limited = Array.from({ length: desiredLength }, (_, idx) => {
    const candidate = pool[idx % pool.length];
    const parentTopic = topics.find(t => 
      t.microTopics.some(mt => mt.id === candidate.id)
    );

    return {
      id: `quiz-mcq-${candidate.id}-${idx}`,
      prompt: `Which statement best explains ${candidate.title}?`,
      type: "mcq" as const,
      choices: buildChoices(candidate.title),
      explanation: `The core idea of ${candidate.title} ties directly to ${candidate.description}.`,
      relatedMicroTopicIds: [candidate.id],
      topicId: parentTopic?.id || topics[0]?.id || "unknown"
    };
  });

  return limited;
};

const normalizeTopics = (topics?: Topic[]): Topic[] => {
  if (!topics) return [];
  return topics.map((topic) => ({
    ...topic,
    tags: topic.tags ?? [],
    subTopics: topic.subTopics.map((subTopic) => ({
      ...subTopic,
      microTopics: subTopic.microTopics.map((micro) => ({
        ...micro,
        tags: micro.tags ?? [],
        examScopeIds: micro.examScopeIds ?? [],
        completed: Boolean(micro.completed)
      }))
    }))
  }));
};

export class ClaudeService {
  async checkAvailability(force = false): Promise<ClaudeHealthStatus> {
    const now = Date.now();
    if (!anthropicClient) {
      const snapshot: ClaudeHealthStatus = {
        available: false,
        checkedAt: now,
        error: "ANTHROPIC_API_KEY not configured."
      };
      lastHealthCheck = snapshot;
      return snapshot;
    }

    if (!force && lastHealthCheck && now - lastHealthCheck.checkedAt < HEALTH_TTL_MS) {
      return lastHealthCheck;
    }

    try {
      const response = await anthropicClient.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 8,
        temperature: 0,
        system: "You are a readiness probe. Reply only with OK.",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Respond with OK" }]
          }
        ]
      });

      const ok = response.content.some(
        (block) => block.type === "text" && block.text.trim().toUpperCase().startsWith("OK")
      );

      lastHealthCheck = ok
        ? { available: true, checkedAt: now }
        : { available: false, checkedAt: now, error: "Unexpected Claude response." };
    } catch (error) {
      lastHealthCheck = {
        available: false,
        checkedAt: now,
        error: error instanceof Error ? error.message : "Claude readiness probe failed."
      };
    }

    return lastHealthCheck;
  }

  async generateStudyMap(payload: {
    course: StudyMapPayload["course"];
    syllabusText?: string;
    syllabusPdf?: Buffer;
    deadlineSummary?: string;
  }): Promise<{
    topics: Topic[];
    assignments?: UpcomingItem[];
    resources?: Record<string, ResourceItem[]>;
    exams?: ExamScope[];
  }> {
    if (!anthropicClient) {
      throw new Error("Claude client unavailable.");
    }

    const deadlineHint = payload.deadlineSummary?.trim()
      ? `Known deadlines:\n${payload.deadlineSummary}\n\n`
      : "";

    const courseInfo = `Course: ${payload.course.name} (${payload.course.courseNumber ?? "n/a"})
Term: ${payload.course.term ?? "unspecified"}
${deadlineHint}`;

    const jsonSchema = `Return JSON with:
{
  "topics": [
    {
      "id": "topic-...",
      "title": "...",
      "description": "...",
      "tags": ["exam-1", "project-1"],
      "rationale": "...",
      "subTopics": [
        {
          "id": "subtopic-...",
          "title": "...",
          "description": "...",
          "rationale": "...",
          "microTopics": [
            {
              "id": "micro-...",
              "title": "...",
              "description": "...",
              "tags": ["analysis"],
              "examScopeIds": ["exam-1"],
              "completed": false,
              "rationale": "..."
            }
          ]
        }
      ]
    }
  ],
  "assignments": [
    {
      "id": "assignment-...",
      "title": "...",
      "description": "...",
      "dueDate": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "type": "exam|project|assignment|misc",
      "relatedTopicIds": ["topic-..."],
      "scopeText": "..."
    }
  ],
  "resources": {
    "topic-id": [
      {
        "id": "resource-...",
        "title": "...",
        "url": "https://",
        "summary": "...",
        "type": "video|article|doc|interactive",
        "duration": "optional"
      }
    ]
  },
  "exams": [
    {
      "id": "exam-1",
      "title": "...",
      "description": "...",
      "date": "YYYY-MM-DD",
      "relatedTopicIds": ["topic-..."],
      "uncertainty": "optional note"
    }
  ]
}`;

    // Build content array - either with PDF document or text
    const content: Array<{ type: string; source?: { type: string; media_type: string; data: string }; text?: string }> = [];
    
    if (payload.syllabusPdf) {
      // Send PDF directly to Claude
      content.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: payload.syllabusPdf.toString("base64")
        }
      });
      content.push({
        type: "text",
        text: `${courseInfo}\n\nAnalyze the uploaded syllabus PDF and extract all course content.\n\n${jsonSchema}`
      });
    } else if (payload.syllabusText) {
      // Fallback to text if no PDF
      const truncated = payload.syllabusText.slice(0, 15000);
      content.push({
        type: "text",
        text: `${courseInfo}\n\nSyllabus excerpt:\n"""${truncated}"""\n\n${jsonSchema}`
      });
    } else {
      throw new Error("No syllabus content provided");
    }

    const response = await anthropicClient.messages.create(
      {
        model: "claude-haiku-4-5",
        max_tokens: 16384, // Increased to handle larger syllabi without truncation
        temperature: 0.2,
        system:
          "You convert university syllabi into structured study maps. " +
          "Respond with ONLY valid, minified JSON matching the schema described. " +
          "Do NOT include any markdown formatting, code blocks, or explanatory text. " +
          "Ensure all property names and string values use double quotes. " +
          "Do NOT use trailing commas. " +
          "IDs should be kebab-case (topic-graph-basics, subtopic-shortest-paths, micro-dijkstra). " +
          "Every microtopic must include tags, examScopeIds, and completed=false. " +
          "Resources should only include trusted URLs. " +
          "Extract ALL topics, assignments, exams, and dates from the document.",
        messages: [
          {
            role: "user",
            content: content as any
          }
        ]
      },
      {
        timeout: 90000 // 90 seconds timeout
      }
    );

    const textBlock = response.content.find(
      (item) => item.type === "text"
    ) as { text: string } | undefined;
    if (!textBlock?.text) {
      throw new Error("Claude response missing text payload.");
    }

    console.log("=== Raw Claude Response ===");
    console.log("Length:", textBlock.text.length);
    console.log("First 500 chars:", textBlock.text.substring(0, 500));
    console.log("Last 500 chars:", textBlock.text.substring(Math.max(0, textBlock.text.length - 500)));

    // Clean up Claude's response - remove markdown code blocks and extra text
    let sanitized = textBlock.text.trim();
    
    // Remove markdown code blocks
    sanitized = sanitized.replace(/```json\s*/gi, "").replace(/```\s*/g, "");
    
    console.log("=== After removing markdown ===");
    console.log("Length:", sanitized.length);
    
    // Find the JSON object - look for opening and closing braces
    const firstBrace = sanitized.indexOf("{");
    const lastBrace = sanitized.lastIndexOf("}");
    
    if (firstBrace === -1 || lastBrace === -1) {
      console.error("Claude response:", sanitized.substring(0, 500));
      throw new Error("No valid JSON object found in Claude response");
    }
    
    console.log(`Found JSON from position ${firstBrace} to ${lastBrace}`);
    sanitized = sanitized.substring(firstBrace, lastBrace + 1);
    
    // Check if response was likely truncated (stops detecting stop reason)
    const wasTruncated = response.stop_reason === "max_tokens";
    if (wasTruncated) {
      console.warn("⚠️  Claude response was truncated due to max_tokens limit");
      
      // Try to fix truncated JSON by adding closing brackets
      // Count open vs closed braces and brackets
      let openBraces = 0;
      let openBrackets = 0;
      let inString = false;
      let escapeNext = false;
      
      for (let i = 0; i < sanitized.length; i++) {
        const char = sanitized[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !inString) {
          inString = true;
        } else if (char === '"' && inString) {
          inString = false;
        }
        
        if (!inString) {
          if (char === '{') openBraces++;
          if (char === '}') openBraces--;
          if (char === '[') openBrackets++;
          if (char === ']') openBrackets--;
        }
      }
      
      console.log(`Unclosed braces: ${openBraces}, unclosed brackets: ${openBrackets}`);
      
      // Close any unclosed structures
      if (openBrackets > 0 || openBraces > 0) {
        // Remove any trailing commas first
        sanitized = sanitized.trimEnd();
        if (sanitized.endsWith(',')) {
          sanitized = sanitized.slice(0, -1);
        }
        
        // Close brackets and braces
        for (let i = 0; i < openBrackets; i++) {
          sanitized += ']';
        }
        for (let i = 0; i < openBraces; i++) {
          sanitized += '}';
        }
        
        console.log("✓ Added closing brackets/braces to fix truncated JSON");
      }
    }
    
    // Try to fix common JSON issues
    // 1. Remove trailing commas before closing braces/brackets
    const beforeCommaFix = sanitized.length;
    sanitized = sanitized.replace(/,(\s*[}\]])/g, "$1");
    console.log(`Removed ${beforeCommaFix - sanitized.length} chars from trailing commas`);
    
    // 2. Remove any control characters that might break JSON
    const beforeControlFix = sanitized.length;
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");
    console.log(`Removed ${beforeControlFix - sanitized.length} control characters`);
    
    console.log("=== Cleaned JSON ===");
    console.log("Final length:", sanitized.length);
    console.log("First 1000 chars:", sanitized.substring(0, 1000));
    
    let parsed: {
      topics?: Topic[];
      assignments?: UpcomingItem[];
      resources?: Record<string, ResourceItem[]>;
      exams?: ExamScope[];
    };
    
    try {
      parsed = JSON.parse(sanitized);
      console.log("✓ JSON parsed successfully!");
      console.log("Topics:", parsed.topics?.length ?? 0);
      console.log("Assignments:", parsed.assignments?.length ?? 0);
      console.log("Exams:", parsed.exams?.length ?? 0);
    } catch (parseError) {
      console.error("=== Failed to parse Claude response ===");
      console.error("Parse error:", parseError);
      
      // Try to find the problematic position
      if (parseError instanceof SyntaxError) {
        const match = parseError.message.match(/position (\d+)/);
        if (match) {
          const pos = parseInt(match[1]);
          const start = Math.max(0, pos - 200);
          const end = Math.min(sanitized.length, pos + 200);
          console.error("\n=== Context around error position ===");
          console.error(sanitized.substring(start, end));
          console.error(" ".repeat(Math.min(200, pos - start)) + "^ ERROR HERE");
        }
      }
      
      console.error("\n=== Full sanitized response ===");
      console.error(sanitized);
      
      throw new Error(`Invalid JSON from Claude: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
    }

    return {
      topics: normalizeTopics(parsed.topics),
      assignments: parsed.assignments,
      resources: parsed.resources,
      exams: parsed.exams
    };
  }

  async generateQuiz(
    payload: QuizRequestPayload
  ): Promise<QuizResponsePayload> {
    console.log("=== generateQuiz called ===");
    console.log("Topics:", payload.topics.length);
    console.log("Difficulty:", payload.difficulty);
    console.log("Length:", payload.length);
    console.log("Question type:", payload.questionType);
    
    if (!anthropicClient) {
      console.log("No Claude client, returning fallback questions");
      return {
        quizId: `quiz-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        questions: fallbackQuestions(payload.topics, payload.length, payload.questionType),
        topics: payload.topics
      };
    }

    const topicSummary = payload.topics
      .map(
        (topic) => `Topic: ${topic.title} (ID: ${topic.id})
Microtopics:
${topic.microTopics
  .map((micro) => `- ID: ${micro.id}, Title: ${micro.title}, Description: ${micro.description}`)
  .join("\n")}
`
      )
      .join("\n");

    console.log("Calling Claude API for quiz generation...");
    const response = await anthropicClient.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4096, // Increased from 1200 to handle larger quizzes
      temperature: payload.difficulty === "exam" ? 0.3 : 0.6,
      system:
        "You are a study coach that writes fair but rigorous multiple choice quizzes. " +
        "ALWAYS provide exactly 4 choices with ONLY ONE correct answer for every question. " +
        "Use 'mcq' as the type for all questions. " +
        "Use the EXACT microtopic IDs provided in the user message for relatedMicroTopicIds field. " +
        "For each question, assign ONE topicId from the topics provided - this helps identify weak spots. " +
        "Return ONLY valid JSON array with no markdown or explanation.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Generate ${payload.length} multiple choice (MCQ) questions for course ${payload.courseId}.

Difficulty: ${payload.difficulty}
Topics:
${topicSummary}

IMPORTANT FORMAT RULES:
- ALL questions must be type "mcq"
- Provide exactly 4 choices as strings like ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"]
- Include an "answer" field with the correct letter (e.g., "A", "B", "C", or "D") - ONLY ONE correct answer per question
- Every question must have an "explanation" field
- Every question must have "relatedMicroTopicIds" array using the EXACT IDs from the microtopics list above (e.g., ["micro-qualitative-data", "micro-hypothesis-testing"])
- Every question must have a "topicId" field with the ID of the ONE main topic it belongs to (choose from the Topic IDs listed above)

Return JSON array: [{id,prompt,type:"mcq",choices:["A) ...","B) ...","C) ...","D) ..."],answer:"A",explanation,relatedMicroTopicIds:["micro-..."],topicId:"topic-..."}]`
            }
          ]
        }
      ]
    });

    console.log("Claude API response received");
    console.log("Response ID:", response.id);
    console.log("Stop reason:", response.stop_reason);

    const textBlock = response.content.find(
      (item) => item.type === "text"
    ) as { text: string } | undefined;

    if (!textBlock?.text) {
      console.error("No text block in Claude response");
      throw new Error("Claude response missing text payload.");
    }

    console.log("Claude response text length:", textBlock.text.length);
    console.log("First 500 chars:", textBlock.text.substring(0, 500));

    // Clean up Claude's response - remove markdown code blocks
    let sanitized = textBlock.text.trim();
    sanitized = sanitized.replace(/```json\s*/gi, "").replace(/```\s*/g, "");
    
    console.log("After removing markdown, length:", sanitized.length);
    
    // Check if response was truncated
    const wasTruncated = response.stop_reason === "max_tokens";
    if (wasTruncated) {
      console.warn("⚠️  Quiz response was truncated due to max_tokens limit");
      
      // Find the array boundaries
      const firstBracket = sanitized.indexOf("[");
      const lastBracket = sanitized.lastIndexOf("]");
      
      if (firstBracket !== -1) {
        // Extract just the array content
        if (lastBracket !== -1) {
          sanitized = sanitized.substring(firstBracket, lastBracket + 1);
        } else {
          sanitized = sanitized.substring(firstBracket);
        }
        
        // Count open vs closed braces and brackets
        let openBraces = 0;
        let openBrackets = 0;
        let inString = false;
        let escapeNext = false;
        
        for (let i = 0; i < sanitized.length; i++) {
          const char = sanitized[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"' && !inString) {
            inString = true;
          } else if (char === '"' && inString) {
            inString = false;
          }
          
          if (!inString) {
            if (char === '{') openBraces++;
            if (char === '}') openBraces--;
            if (char === '[') openBrackets++;
            if (char === ']') openBrackets--;
          }
        }
        
        console.log(`Unclosed braces: ${openBraces}, unclosed brackets: ${openBrackets}`);
        
        // Close any unclosed structures
        if (openBraces > 0 || openBrackets > 0) {
          // Remove any trailing commas or incomplete data
          sanitized = sanitized.trimEnd();
          if (sanitized.endsWith(',')) {
            sanitized = sanitized.slice(0, -1);
          }
          
          // Close braces first, then brackets
          for (let i = 0; i < openBraces; i++) {
            sanitized += '}';
          }
          for (let i = 0; i < openBrackets; i++) {
            sanitized += ']';
          }
          
          console.log("✓ Added closing brackets/braces to fix truncated JSON");
        }
      }
    }
    
    // Remove trailing commas
    sanitized = sanitized.replace(/,(\s*[}\]])/g, "$1");

    const parsed = JSON.parse(sanitized) as QuizQuestion[];
    
    console.log("✓ Quiz parsed successfully, questions:", parsed.length);
    
    // Log the raw parsed response to see what Claude returned
    console.log("=== Raw parsed questions ===");
    parsed.forEach((q, idx) => {
      console.log(`Q${idx + 1}:`, {
        id: q.id,
        type: q.type,
        hasChoices: !!q.choices,
        choicesCount: q.choices?.length,
        firstChoice: q.choices?.[0],
        answer: (q as any).answer,
        topicId: q.topicId,
        hasTopicId: !!q.topicId
      });
    });
    
    // Normalize the quiz response format - ALL questions must be MCQ
    const normalizedQuestions = parsed.map((question) => {
      // Force all questions to be MCQ type
      let type = "mcq";
      
      // If it has string choices, convert to proper format
      if (question.choices) {
        // Check if choices are already in the correct format
        const firstChoice = question.choices[0];
        if (typeof firstChoice === "string") {
          // Claude returned choices as strings like ["A) ...", "B) ..."]
          // We need to find which one is correct based on the answer field
          const answerKey = (question as any).answer; // "A", "B", "C", "D"
          
          const normalizedChoices = (question.choices as unknown as string[]).map((choiceText: string, idx: number) => {
            // Extract the letter prefix (A, B, C, D)
            let letter: string;
            let label: string;
            
            const letterMatch = choiceText.match(/^([A-D])\)/);
            if (letterMatch) {
              letter = letterMatch[1];
              label = choiceText.replace(/^[A-D]\)\s*/, "");
            } else {
              // Fallback: assign letters A, B, C, D
              letter = String.fromCharCode(65 + idx); // A=65 in ASCII
              label = choiceText;
            }
            
            // Determine if this choice is correct
            let isCorrect = false;
            if (answerKey) {
              // Check if answerKey matches the letter or the full text
              isCorrect = letter === answerKey || 
                         choiceText.toLowerCase().includes(answerKey.toLowerCase()) ||
                         label.toLowerCase() === answerKey.toLowerCase();
            }
            
            return {
              id: `choice-${letter.toLowerCase()}`,
              label: label,
              correct: isCorrect
            };
          });
          
          // If no choice was marked correct and we have an answer, try to match by content
          if (!normalizedChoices.some(c => c.correct) && answerKey) {
            console.warn(`No choice matched answer "${answerKey}", trying content match`);
            normalizedChoices.forEach(choice => {
              if (choice.label.toLowerCase().includes(answerKey.toLowerCase())) {
                choice.correct = true;
              }
            });
          }
          
          // Ensure exactly one correct answer
          const correctCount = normalizedChoices.filter(c => c.correct).length;
          if (correctCount > 1) {
            console.warn(`Question ${question.id} has ${correctCount} correct answers, keeping only the first one`);
            let foundFirst = false;
            normalizedChoices.forEach(choice => {
              if (choice.correct && !foundFirst) {
                foundFirst = true;
              } else if (choice.correct) {
                choice.correct = false;
              }
            });
          } else if (correctCount === 0) {
            console.warn(`Question ${question.id} has no correct answer, marking first choice as correct`);
            normalizedChoices[0].correct = true;
          }
          
          return {
            ...question,
            type: "mcq" as const,
            choices: normalizedChoices,
            answer: undefined // Remove answer field since we moved it to choices
          };
        }
      }
      
      // If somehow there are no choices, create fallback choices
      if (!question.choices || question.choices.length === 0) {
        console.error(`Question ${question.id} has no choices! Creating fallback MCQ choices.`);
        const answer = (question as any).answer || "Unable to determine answer";
        return {
          ...question,
          type: "mcq" as const,
          choices: [
            { id: "choice-a", label: answer, correct: true },
            { id: "choice-b", label: "This option is incorrect", correct: false },
            { id: "choice-c", label: "This option is also incorrect", correct: false },
            { id: "choice-d", label: "This option is not correct", correct: false }
          ]
        };
      }
      
      return {
        ...question,
        type: "mcq" as const
      };
    });

    console.log("=== Normalized questions ===");
    normalizedQuestions.forEach((q, idx) => {
      console.log(`Q${idx + 1}:`, {
        id: q.id,
        type: q.type,
        hasChoices: !!q.choices,
        choicesCount: q.choices?.length,
        choices: q.choices?.map(c => ({ id: c.id, label: c.label.substring(0, 50), correct: c.correct })),
        topicId: q.topicId,
        hasTopicId: !!q.topicId,
        relatedMicroTopicIds: q.relatedMicroTopicIds
      });
    });

    return {
      quizId: response.id ?? `quiz-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      questions: normalizedQuestions,
      topics: payload.topics
    };
  }

  async findResources(payload: {
    courseTitle: string;
    topicTitle: string;
    topicDescription?: string;
    resourceType: "learn" | "practice" | "both";
    maxResults?: number;
  }): Promise<{
    resources: Array<{
      url: string;
      title: string;
      summary: string;
      resourceType: string;
      quality: "high" | "medium" | "low";
      contentType: string;
    }>;
    searchQuality: "excellent" | "good" | "poor";
    message?: string;
  }> {
    console.log("=== findResources called ===");
    console.log("Course:", payload.courseTitle);
    console.log("Topic:", payload.topicTitle);
    console.log("Resource Type:", payload.resourceType);
    
    if (!anthropicClient) {
      throw new Error("Claude client unavailable.");
    }

    const typeInstruction = 
      payload.resourceType === "learn"
        ? "Find DIRECT learning resources like YouTube tutorials/lectures, blog posts with explanations, interactive demos, Khan Academy lessons, educational websites with examples and visualizations. AVOID generic course homepages or syllabi."
        : payload.resourceType === "practice"
          ? "Find DIRECT practice resources like coding challenge sites, interactive problem sets, practice worksheets with solutions, simulation tools, online calculators/tools. AVOID generic course homepages."
          : "Find DIRECT educational resources - both explanatory content (videos, tutorials, examples) and hands-on practice (exercises, interactive tools). AVOID generic course homepages.";

    const query = `Find specific, actionable ${payload.resourceType === "both" ? "learning and practice" : payload.resourceType} resources for "${payload.topicTitle}" in "${payload.courseTitle}". ${payload.topicDescription ? `Context: ${payload.topicDescription}. ` : ""}${typeInstruction}

IMPORTANT: Each resource must be DIRECTLY usable by students - a video they can watch, an article they can read, a tool they can use, or problems they can solve. DO NOT include:
- Generic course homepages or syllabi
- University course catalog pages
- Textbook purchase pages without free content
- Login-required content

ONLY include resources where students can immediately learn or practice the topic.`;

    console.log("Search query:", query);

    try {
      const response = await anthropicClient.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 4096,
        temperature: 0.3,
        system: 
          "You are an expert educational resource curator. Find SPECIFIC, DIRECTLY USABLE learning materials. " +
          "Good examples: YouTube tutorials, Khan Academy videos, interactive demos, blog posts with code examples, practice problem sites. " +
          "BAD examples: University course homepages, textbook purchase pages, generic course catalogs. " +
          "Each resource must be something a student can immediately use to learn or practice. " +
          "Return ONLY a JSON object with no extra text. " +
          "Format: {\"resources\": [{\"url\": \"...\", \"title\": \"...\", \"summary\": \"1-2 sentences explaining what student will learn/do\", \"resourceType\": \"learn\", \"quality\": \"high\", \"contentType\": \"video\"}], \"searchQuality\": \"excellent\", \"message\": \"Found X resources\"}",
        messages: [
          {
            role: "user",
            content: query + "\n\nIMPORTANT: Return ONLY the JSON object, no other text."
          }
        ],
        tools: [
          {
            type: "web_search_20250305" as any,
            name: "web_search",
            max_uses: 3
          }
        ]
      });

      console.log("Claude response received");
      console.log("Stop reason:", response.stop_reason);

      // Extract text content and tool use results
      let searchResults: any[] = [];
      let textResponse = "";

      for (const block of response.content) {
        if (block.type === "text") {
          textResponse += block.text;
        } else if (block.type === "tool_use" && block.name === "web_search") {
          console.log("Web search tool used:", block.input);
          // The actual search results will be in the next interaction
          // For now, we'll process what we have
        }
      }

      console.log("Text response length:", textResponse.length);
      console.log("First 500 chars:", textResponse.substring(0, 500));
      console.log("Full response:", textResponse);

      // If Claude needs to use the tool, we need to follow up
      if (response.stop_reason === "tool_use") {
        console.log("Claude requested tool use, making follow-up call...");
        
        // Make a follow-up request to get Claude's analysis of search results
        const followUpResponse = await anthropicClient.messages.create({
          model: "claude-haiku-4-5",
          max_tokens: 4096,
          temperature: 0.3,
          system:
            "You are an expert educational resource curator. Filter search results to find ONLY directly usable learning materials. " +
            "INCLUDE: YouTube tutorials, interactive websites, blog posts with explanations/examples, practice problem sites, educational tools. " +
            "EXCLUDE: Generic course homepages, university catalogs, textbook stores, paywalled content, login-required sites. " +
            "Each resource must provide immediate value - something to watch, read, interact with, or practice on. " +
            "Return ONLY this JSON structure with NO markdown: " +
            "{\"resources\": [{\"url\": \"direct link\", \"title\": \"specific title\", \"summary\": \"what student learns/does here\", \"resourceType\": \"learn\", \"quality\": \"high\", \"contentType\": \"video\"}], \"searchQuality\": \"excellent\", \"message\": \"Found X actionable resources\"}",
          messages: [
            {
              role: "user",
              content: query
            },
            {
              role: "assistant",
              content: response.content
            },
            {
              role: "user",
              content: "Based on the search results, provide a list of DIRECTLY USABLE educational resources. Each must be something students can immediately watch, read, use, or practice with. Filter out any generic course pages or catalogs. Return only the JSON object."
            }
          ]
        });

        console.log("Follow-up response received");
        
        const followUpText = followUpResponse.content
          .filter((block) => block.type === "text")
          .map((block) => (block as any).text)
          .join("");

        console.log("Follow-up text length:", followUpText.length);
        textResponse = followUpText;
      }

      // Parse the JSON response
      let sanitized = textResponse.trim();
      
      // Remove markdown code blocks and extra text
      sanitized = sanitized.replace(/```json\s*/gi, "").replace(/```\s*/g, "");
      
      // Try to find JSON by looking for the pattern that starts with { and ends with }
      // Claude might include text before/after the JSON
      let jsonStart = sanitized.indexOf('{"resources"');
      if (jsonStart === -1) {
        jsonStart = sanitized.indexOf('{ "resources"');
      }
      if (jsonStart === -1) {
        jsonStart = sanitized.indexOf('{\n  "resources"');
      }
      if (jsonStart === -1) {
        // Try any object that might contain resources
        jsonStart = sanitized.indexOf("{");
      }
      
      if (jsonStart === -1) {
        console.error("No JSON object found in response");
        console.error("Response was:", sanitized.substring(0, 1000));
        return {
          resources: [],
          searchQuality: "poor",
          message: "Failed to find JSON in response"
        };
      }
      
      // Find the matching closing brace
      let braceCount = 0;
      let jsonEnd = -1;
      for (let i = jsonStart; i < sanitized.length; i++) {
        if (sanitized[i] === '{') braceCount++;
        if (sanitized[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            jsonEnd = i + 1;
            break;
          }
        }
      }
      
      if (jsonEnd === -1) {
        console.error("Could not find closing brace for JSON");
        return {
          resources: [],
          searchQuality: "poor",
          message: "Incomplete JSON response"
        };
      }
      
      sanitized = sanitized.substring(jsonStart, jsonEnd);
      
      console.log("Parsing JSON response...");
      console.log("Sanitized length:", sanitized.length);
      console.log("JSON to parse:", sanitized.substring(0, 500));
      
      let parsed;
      try {
        parsed = JSON.parse(sanitized);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("Failed to parse:", sanitized.substring(0, 1000));
        return {
          resources: [],
          searchQuality: "poor",
          message: "Failed to parse search results"
        };
      }

      // Validate and normalize the parsed data
      if (!parsed.resources || !Array.isArray(parsed.resources)) {
        console.error("Invalid resources array:", parsed);
        return {
          resources: [],
          searchQuality: "poor",
          message: "No valid resources found"
        };
      }

      console.log("Raw resources count:", parsed.resources.length);

      // Filter and validate each resource - be more flexible with field names
      const validResources = parsed.resources
        .filter((r: any) => {
          const hasUrl = r && (r.url || r.link || r.href);
          const hasTitle = r && (r.title || r.name);
          const hasSummary = r && (r.summary || r.description || r.desc);
          
          if (!hasUrl || !hasTitle || !hasSummary) {
            console.log("Skipping invalid resource:", JSON.stringify(r).substring(0, 100));
          }
          
          return hasUrl && hasTitle && hasSummary;
        })
        .map((r: any) => ({
          url: r.url || r.link || r.href,
          title: r.title || r.name,
          summary: r.summary || r.description || r.desc,
          resourceType: r.resourceType || payload.resourceType,
          quality: r.quality || "medium",
          contentType: r.contentType || r.type || "article"
        }))
        .slice(0, payload.maxResults || 10);

      console.log("✓ Valid resources found:", validResources.length);
      console.log("Search quality:", parsed.searchQuality);

      return {
        resources: validResources,
        searchQuality: parsed.searchQuality || (validResources.length > 5 ? "good" : validResources.length > 0 ? "poor" : "poor"),
        message: parsed.message || (validResources.length > 0 ? `Found ${validResources.length} resource${validResources.length !== 1 ? "s" : ""}` : "No resources found")
      };

    } catch (error) {
      console.error("Error finding resources:", error);
      throw new Error(
        `Failed to find resources: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async chat(payload: {
    conversationHistory: ChatMessage[];
    context: ChatContext;
    topicContext?: ChatMessage["topicContext"];
  }): Promise<{
    content: string;
    suggestedActions?: Array<{
      type: string;
      label: string;
      payload: Record<string, any>;
    }>;
  }> {
    console.log("=== chat called ===");
    console.log("Conversation history length:", payload.conversationHistory.length);
    console.log("Topic context:", payload.topicContext);

    if (!anthropicClient) {
      return {
        content: "I'm currently unavailable. Please configure the ANTHROPIC_API_KEY to enable the chatbot.",
        suggestedActions: []
      };
    }

    // Build context summary for the system prompt
    const completedCount = payload.context.completedMicroTopicIds.length;
    const totalMicroTopics = payload.context.topics.reduce(
      (sum, topic) =>
        sum +
        topic.subTopics.reduce((subSum, sub) => subSum + sub.microTopics.length, 0),
      0
    );
    const progressPercent =
      totalMicroTopics > 0 ? Math.round((completedCount / totalMicroTopics) * 100) : 0;

    const upcomingDeadlines = payload.context.upcomingDeadlines
      .slice(0, 5)
      .map((d) => `- ${d.title} (${d.type}) - Due: ${d.dueDate}`)
      .join("\n");

    const weakTopics = payload.context.quizHistory?.weakTopicIds || [];
    const weakTopicTitles = payload.context.topics
      .filter((t) => weakTopics.includes(t.id))
      .map((t) => t.title)
      .join(", ");

    const topicsList = payload.context.topics
      .map(
        (topic) =>
          `- ${topic.title} (ID: ${topic.id}): ${topic.description}\n  Subtopics: ${topic.subTopics.map((s) => s.title).join(", ")}`
      )
      .join("\n");

    const recentScores = payload.context.quizHistory?.recentScores || [];
    const avgScore = recentScores.length > 0
      ? Math.round(recentScores.reduce((a, b) => a + b, 0) / recentScores.length)
      : null;

    const systemPrompt = `You are an **advanced AI study assistant** for the course "${payload.context.courseName}". You have extensive capabilities to help students succeed.

## 📚 COURSE STRUCTURE
${topicsList}

## 📊 STUDENT ANALYTICS
- **Overall Progress**: ${progressPercent}% (${completedCount}/${totalMicroTopics} microtopics completed)
- **Weak Topics** (from quiz failures): ${weakTopicTitles || "None identified yet"}
- **Recent Quiz Performance**: ${avgScore !== null ? `${avgScore}% average` : "No quizzes taken yet"}
- **Total Quizzes**: ${recentScores.length}

## 📅 UPCOMING DEADLINES
${upcomingDeadlines || "No upcoming deadlines"}

## 🎯 YOUR CORE CAPABILITIES

### **1. Intelligent Question Answering**
- Provide clear, educational explanations with examples
- Break down complex concepts into digestible parts
- Reference specific topics, subtopics, and microtopics from the study map
- Use **markdown formatting** for better readability (bold, italic, lists, code blocks)
- Add strategic emojis (📚 for learning, 💡 for insights, ⚠️ for warnings, ✅ for success)

### **2. Weak Spot Coaching** 📈
When students struggle with topics (failed quiz questions):
- Identify their weak topics automatically
- Offer targeted explanations for those specific concepts
- Create personalized practice questions
- Suggest additional resources
- Track improvement over time

### **3. Study Planning & Time Management** 🗓️
- Create customized study schedules (e.g., "Create a study plan for next week")
- Prioritize topics based on deadlines, difficulty, and progress
- Break large topics into daily/weekly goals
- Suggest optimal study session lengths
- Account for exam preparation time

### **4. Progress Insights & Motivation** 💪
- Analyze "Why am I stuck?" situations
- Identify learning patterns and blockers
- Celebrate milestones and achievements
- Provide encouragement during difficult topics
- Suggest when to take breaks or change strategies

### **5. Deadline Management** ⏰
- Answer questions like "What's due next week?" or "When is the midterm?"
- Remind students of upcoming exams and assignments
- Help prioritize based on deadline urgency
- Suggest study timelines for major assessments

### **6. Concept Connections** 🔗
- Explain relationships between topics (e.g., "How does X relate to Y?")
- Show prerequisite knowledge chains
- Connect theory to practical applications
- Highlight common themes across subtopics

### **7. Exam Preparation Mode** 🎓
When exams are approaching:
- Create comprehensive review plans
- Generate practice questions covering all exam topics
- Identify critical high-priority concepts
- Suggest study strategies (active recall, spaced repetition)
- Provide exam-taking tips

### **8. Interactive Practice** ✏️
- Generate quiz questions on demand
- Create problems with step-by-step solutions
- Offer hints without giving away answers
- Adapt difficulty based on performance

### **9. Resource Recommendations** 📖
- Suggest learning materials for specific topics
- Recommend videos, articles, interactive demos
- Point to relevant textbook sections
- Curate practice problem sources

## 🎨 RESPONSE FORMATTING GUIDELINES

**Use markdown for beautiful, readable responses:**

1. **Bold** for emphasis and key terms
2. *Italic* for subtle emphasis or definitions
3. Use headings (##, ###) for section organization
4. Create numbered lists for steps or sequences
5. Create bullet points for related ideas
6. Use \`code\` for formulas, syntax, or technical terms
7. Use code blocks for longer code examples
8. Add strategic emojis to enhance understanding (not excessive)

**Example of good formatting:**
## Understanding Algorithms

**Algorithms** are *step-by-step procedures* for solving problems. Think of them as recipes! 📚

**Key characteristics:**
- **Deterministic**: Same input → same output
- **Finite**: Must terminate eventually ✅
- **Well-defined**: Clear, unambiguous steps

Let's analyze **binary search** as an example:
\`\`\`python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
    return -1
\`\`\`

💡 **Pro tip**: Binary search requires a *sorted array* - this is crucial!

## 🎯 ACTION CAPABILITIES

You can suggest these actions to students:
- **Navigate to topics**: Reference topic IDs like "${payload.context.topics[0]?.id || "topic-id"}"
- **Generate quizzes**: Suggest when practice would help
- **Mark complete**: Recommend marking mastered topics as done
- **Add resources**: Suggest finding external materials
- **Create subtopics**: Break down complex topics further

## 🧠 CONVERSATION CONTEXT
${payload.topicContext ? `The student is currently viewing **"${payload.topicContext.topicTitle}"** (${payload.topicContext.level})` : "General course discussion"}

## 💬 YOUR PERSONALITY
- Encouraging and supportive 💪
- Clear and concise (avoid overwhelming explanations)
- Patient and understanding
- Proactive (suggest next steps, anticipate needs)
- Adaptable (match the student's knowledge level)

Remember: You're not just answering questions - you're **coaching students toward mastery**!`;

    // Convert conversation history to Claude message format
    const messages: Array<{ role: "user" | "assistant"; content: string }> = payload.conversationHistory.map(
      (msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      })
    );

    console.log("Calling Claude API for chat...");
    const response = await anthropicClient.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages
    });

    console.log("Chat response received");
    console.log("Stop reason:", response.stop_reason);

    const textBlock = response.content.find(
      (item) => item.type === "text"
    ) as { text: string } | undefined;

    if (!textBlock?.text) {
      throw new Error("Claude response missing text content.");
    }

    const content = textBlock.text.trim();
    const lowerContent = content.toLowerCase();
    const userMessage = payload.conversationHistory[payload.conversationHistory.length - 1]?.content.toLowerCase() || "";

    // Analyze response for suggested actions (advanced keyword detection)
    const suggestedActions: Array<{
      type: string;
      label: string;
      payload: Record<string, any>;
    }> = [];

    // 1. Quiz/Practice Detection
    if (lowerContent.includes("quiz") || lowerContent.includes("test yourself") ||
        lowerContent.includes("practice questions") || userMessage.includes("quiz me")) {
      suggestedActions.push({
        type: "generate_quiz",
        label: "📝 Generate Quiz",
        payload: {}
      });
    }

    // 2. Study Planning Detection
    if (userMessage.includes("study plan") || userMessage.includes("schedule") ||
        userMessage.includes("study schedule") || userMessage.includes("plan for") ||
        lowerContent.includes("create a plan") || lowerContent.includes("study schedule") ||
        lowerContent.includes("weekly plan")) {
      suggestedActions.push({
        type: "study_planner",
        label: "🗓️ View Study Plan",
        payload: { context: "generated_plan" }
      });
    }

    // 3. Weak Spot Coaching Detection
    if (userMessage.includes("struggling") || userMessage.includes("weak") ||
        userMessage.includes("difficult") || userMessage.includes("help with") ||
        userMessage.includes("don't understand") ||
        (payload.context.quizHistory?.weakTopicIds && payload.context.quizHistory.weakTopicIds.length > 0 &&
         (lowerContent.includes("weak topic") || lowerContent.includes("struggle")))) {
      const weakTopics = payload.context.quizHistory?.weakTopicIds || [];
      if (weakTopics.length > 0) {
        suggestedActions.push({
          type: "weak_spot_coach",
          label: "💪 Practice Weak Topics",
          payload: { weakTopicIds: weakTopics }
        });
      }
    }

    // 4. Exam Prep Mode Detection
    if (userMessage.includes("exam") || userMessage.includes("midterm") ||
        userMessage.includes("final") || userMessage.includes("test prep") ||
        lowerContent.includes("exam prep") || lowerContent.includes("prepare for") ||
        payload.context.upcomingDeadlines.some(d => d.type === "exam")) {
      const upcomingExams = payload.context.upcomingDeadlines.filter(d => d.type === "exam");
      if (upcomingExams.length > 0) {
        suggestedActions.push({
          type: "exam_prep",
          label: "🎓 Exam Preparation Mode",
          payload: { examId: upcomingExams[0].id }
        });
      }
    }

    // 5. Resource Finding Detection
    if (lowerContent.includes("resource") || lowerContent.includes("video") ||
        lowerContent.includes("article") || lowerContent.includes("learning material") ||
        lowerContent.includes("practice problem") || userMessage.includes("find") ||
        userMessage.includes("learn more")) {
      suggestedActions.push({
        type: "add_resource",
        label: "📚 Find Resources",
        payload: {}
      });
    }

    // 6. Deadline Management Detection
    if (userMessage.includes("due") || userMessage.includes("deadline") ||
        userMessage.includes("when is") || userMessage.includes("upcoming")) {
      suggestedActions.push({
        type: "view_deadlines",
        label: "⏰ View All Deadlines",
        payload: {}
      });
    }

    // 7. Topic Navigation Detection - Check if Claude is referencing specific topics
    const topicMentions = payload.context.topics.filter((topic) =>
      content.toLowerCase().includes(topic.title.toLowerCase())
    );
    if (topicMentions.length > 0 && topicMentions.length <= 3) {
      topicMentions.forEach((topic) => {
        suggestedActions.push({
          type: "navigate",
          label: `🗺️ Go to ${topic.title}`,
          payload: { topicId: topic.id }
        });
      });
    }

    // 8. Concept Connections Detection
    if (userMessage.includes("relate") || userMessage.includes("connection") ||
        userMessage.includes("relationship") || userMessage.includes("how does") ||
        userMessage.includes("difference between")) {
      // Extract potential topic pairs from the question
      const mentionedTopics = payload.context.topics.filter(t =>
        userMessage.includes(t.title.toLowerCase())
      );
      if (mentionedTopics.length >= 2) {
        suggestedActions.push({
          type: "concept_map",
          label: "🔗 Explore Concept Connections",
          payload: { topicIds: mentionedTopics.map(t => t.id) }
        });
      }
    }

    // 9. Progress Check Detection
    if (userMessage.includes("progress") || userMessage.includes("how am i doing") ||
        userMessage.includes("stuck") || userMessage.includes("struggling")) {
      suggestedActions.push({
        type: "view_progress",
        label: "📊 View Progress Dashboard",
        payload: {}
      });
    }

    // Remove duplicate actions based on type
    const uniqueActions = Array.from(
      new Map(suggestedActions.map(action => [action.type, action])).values()
    );

    console.log("Chat response length:", content.length);
    console.log("Suggested actions:", uniqueActions.length);

    return {
      content,
      suggestedActions: uniqueActions
    };
  }

  // Streaming version of chat for real-time responses
  async *chatStream(payload: {
    conversationHistory: ChatMessage[];
    context: ChatContext;
    topicContext?: ChatMessage["topicContext"];
  }): AsyncGenerator<string, void, unknown> {
    console.log("=== chatStream called ===");
    console.log("Conversation history length:", payload.conversationHistory.length);

    if (!anthropicClient) {
      yield "I'm currently unavailable. Please configure the ANTHROPIC_API_KEY to enable the chatbot.";
      return;
    }

    // Build the same context as the regular chat method
    const completedCount = payload.context.completedMicroTopicIds.length;
    const totalMicroTopics = payload.context.topics.reduce(
      (sum, topic) =>
        sum +
        topic.subTopics.reduce((subSum, sub) => subSum + sub.microTopics.length, 0),
      0
    );
    const progressPercent =
      totalMicroTopics > 0 ? Math.round((completedCount / totalMicroTopics) * 100) : 0;

    const upcomingDeadlines = payload.context.upcomingDeadlines
      .slice(0, 5)
      .map((d) => `- ${d.title} (${d.type}) - Due: ${d.dueDate}`)
      .join("\n");

    const weakTopics = payload.context.quizHistory?.weakTopicIds || [];
    const weakTopicTitles = payload.context.topics
      .filter((t) => weakTopics.includes(t.id))
      .map((t) => t.title)
      .join(", ");

    const topicsList = payload.context.topics
      .map(
        (topic) =>
          `- ${topic.title} (ID: ${topic.id}): ${topic.description}\n  Subtopics: ${topic.subTopics.map((s) => s.title).join(", ")}`
      )
      .join("\n");

    const recentScores = payload.context.quizHistory?.recentScores || [];
    const avgScore = recentScores.length > 0
      ? Math.round(recentScores.reduce((a, b) => a + b, 0) / recentScores.length)
      : null;

    const systemPrompt = `You are an **advanced AI study assistant** for the course "${payload.context.courseName}". You have extensive capabilities to help students succeed.

## 📚 COURSE STRUCTURE
${topicsList}

## 📊 STUDENT ANALYTICS
- **Overall Progress**: ${progressPercent}% (${completedCount}/${totalMicroTopics} microtopics completed)
- **Weak Topics** (from quiz failures): ${weakTopicTitles || "None identified yet"}
- **Recent Quiz Performance**: ${avgScore !== null ? `${avgScore}% average` : "No quizzes taken yet"}
- **Total Quizzes**: ${recentScores.length}

## 📅 UPCOMING DEADLINES
${upcomingDeadlines || "No upcoming deadlines"}

## 🎯 YOUR CORE CAPABILITIES

### **1. Intelligent Question Answering**
- Provide clear, educational explanations with examples
- Break down complex concepts into digestible parts
- Reference specific topics, subtopics, and microtopics from the study map
- Use **markdown formatting** for better readability (bold, italic, lists, code blocks)
- Add strategic emojis (📚 for learning, 💡 for insights, ⚠️ for warnings, ✅ for success)

### **2. Weak Spot Coaching** 📈
When students struggle with topics (failed quiz questions):
- Identify their weak topics automatically
- Offer targeted explanations for those specific concepts
- Create personalized practice questions
- Suggest additional resources
- Track improvement over time

### **3. Study Planning & Time Management** 🗓️
- Create customized study schedules (e.g., "Create a study plan for next week")
- Prioritize topics based on deadlines, difficulty, and progress
- Break large topics into daily/weekly goals
- Suggest optimal study session lengths
- Account for exam preparation time

### **4. Progress Insights & Motivation** 💪
- Analyze "Why am I stuck?" situations
- Identify learning patterns and blockers
- Celebrate milestones and achievements
- Provide encouragement during difficult topics
- Suggest when to take breaks or change strategies

### **5. Deadline Management** ⏰
- Answer questions like "What's due next week?" or "When is the midterm?"
- Remind students of upcoming exams and assignments
- Help prioritize based on deadline urgency
- Suggest study timelines for major assessments

### **6. Concept Connections** 🔗
- Explain relationships between topics (e.g., "How does X relate to Y?")
- Show prerequisite knowledge chains
- Connect theory to practical applications
- Highlight common themes across subtopics

### **7. Exam Preparation Mode** 🎓
When exams are approaching:
- Create comprehensive review plans
- Generate practice questions covering all exam topics
- Identify critical high-priority concepts
- Suggest study strategies (active recall, spaced repetition)
- Provide exam-taking tips

### **8. Interactive Practice** ✏️
- Generate quiz questions on demand
- Create problems with step-by-step solutions
- Offer hints without giving away answers
- Adapt difficulty based on performance

### **9. Resource Recommendations** 📖
- Suggest learning materials for specific topics
- Recommend videos, articles, interactive demos
- Point to relevant textbook sections
- Curate practice problem sources

## 🎨 RESPONSE FORMATTING GUIDELINES

**Use markdown for beautiful, readable responses:**

1. **Bold** for emphasis and key terms
2. *Italic* for subtle emphasis or definitions
3. Use headings (##, ###) for section organization
4. Create numbered lists for steps or sequences
5. Create bullet points for related ideas
6. Use \`code\` for formulas, syntax, or technical terms
7. Use code blocks for longer code examples
8. Add strategic emojis to enhance understanding (not excessive)

**Example of good formatting:**
## Understanding Algorithms

**Algorithms** are *step-by-step procedures* for solving problems. Think of them as recipes! 📚

**Key characteristics:**
- **Deterministic**: Same input → same output
- **Finite**: Must terminate eventually ✅
- **Well-defined**: Clear, unambiguous steps

Let's analyze **binary search** as an example:
\`\`\`python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
    return -1
\`\`\`

💡 **Pro tip**: Binary search requires a *sorted array* - this is crucial!

## 🎯 ACTION CAPABILITIES

You can suggest these actions to students:
- **Navigate to topics**: Reference topic IDs like "${payload.context.topics[0]?.id || "topic-id"}"
- **Generate quizzes**: Suggest when practice would help
- **Mark complete**: Recommend marking mastered topics as done
- **Add resources**: Suggest finding external materials
- **Create subtopics**: Break down complex topics further

## 🧠 CONVERSATION CONTEXT
${payload.topicContext ? `The student is currently viewing **"${payload.topicContext.topicTitle}"** (${payload.topicContext.level})` : "General course discussion"}

## 💬 YOUR PERSONALITY
- Encouraging and supportive 💪
- Clear and concise (avoid overwhelming explanations)
- Patient and understanding
- Proactive (suggest next steps, anticipate needs)
- Adaptable (match the student's knowledge level)

Remember: You're not just answering questions - you're **coaching students toward mastery**!`;

    const messages: Array<{ role: "user" | "assistant"; content: string }> = payload.conversationHistory.map(
      (msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      })
    );

    console.log("Calling Claude API with streaming...");
    const stream = anthropicClient.messages.stream({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        yield chunk.delta.text;
      }
    }

    console.log("Streaming complete");
  }
}

export const claudeService = new ClaudeService();
