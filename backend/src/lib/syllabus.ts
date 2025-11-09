import { z } from "zod";
import type { ParseSyllabusResponse, UpcomingItem, StudyMapPayload } from "@studymap/types";
import { buildSampleStudyMap } from "./sampleData";
import { claudeAvailable, claudeService } from "./claude";

type PdfParser = (data: Buffer) => Promise<{ text: string }>;

let cachedPdfParser: PdfParser | null = null;

const getPdfParser = async (): Promise<PdfParser> => {
  if (cachedPdfParser) return cachedPdfParser;
  const mod = await import("pdf-parse");
  const parser =
    ((mod as { default?: PdfParser }).default ?? (mod as unknown as PdfParser)) as PdfParser;
  cachedPdfParser = parser;
  return parser;
};

const formSchema = z.object({
  courseName: z.string().min(2),
  courseNumber: z.string().optional(),
  term: z.string().optional()
});

const monthPattern =
  "(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sept?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
const naturalDateRegex = new RegExp(`${monthPattern}\\.?\\s+\\d{1,2}(?:,\\s*\\d{4})?`, "gi");
const slashDateRegex = /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g;

const keywordTopicMap: Record<string, string[]> = {
  "topic-foundations": ["complexity", "analysis", "recurrence", "proof"],
  "topic-structures": ["heap", "tree", "balanced", "priority", "structure"],
  "topic-graphs": ["graph", "shortest", "path", "flow", "network"]
};

const detectTopicIds = (line: string): string[] => {
  const normalized = line.toLowerCase();
  const hits = Object.entries(keywordTopicMap)
    .filter(([, keywords]) => keywords.some((word) => normalized.includes(word)))
    .map(([topicId]) => topicId);
  return hits.length ? hits : ["topic-foundations"];
};

const detectType = (line: string): UpcomingItem["type"] => {
  const normalized = line.toLowerCase();
  if (normalized.includes("exam") || normalized.includes("midterm")) return "exam";
  if (normalized.includes("project") || normalized.includes("capstone")) return "project";
  if (normalized.includes("assignment") || normalized.includes("hw")) return "assignment";
  return "misc";
};

const ensureYear = (raw: string, fallbackYear: number): string => {
  if (/\d{4}/.test(raw)) return raw;
  return `${raw} ${fallbackYear}`;
};

const parseDate = (raw: string): string | null => {
  const candidate = new Date(raw);
  return Number.isNaN(candidate.getTime()) ? null : candidate.toISOString();
};

const deriveYearFromTerm = (term?: string | null): number => {
  if (!term) return new Date().getUTCFullYear();
  const yearMatch = term.match(/(20\d{2})/);
  if (yearMatch) return Number(yearMatch[1]);
  return new Date().getUTCFullYear();
};

const aggregateText = async (files: File[]): Promise<string> => {
  const parser = await getPdfParser();
  const slices = await Promise.all(
    files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      try {
        const data = await parser(buffer);
        return data.text;
      } catch (error) {
        console.warn("Failed to parse pdf:", error);
        return "";
      }
    })
  );
  return slices.join("\n").trim();
};

const extractDeadlines = (
  text: string,
  fallbackYear: number
): { deadlines: UpcomingItem[]; warning?: string } => {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const deadlines: UpcomingItem[] = [];

  lines.forEach((line, idx) => {
    const naturalMatch = line.match(naturalDateRegex);
    const slashMatch = line.match(slashDateRegex);
    const dateStrings = naturalMatch ?? slashMatch;

    if (!dateStrings) return;

    const iso = parseDate(ensureYear(dateStrings[0], fallbackYear));
    if (!iso) return;

    deadlines.push({
      id: `deadline-${idx}`,
      title: line.replace(dateStrings[0], "").trim() || "Unnamed deadline",
      description: line,
      dueDate: iso,
      type: detectType(line),
      relatedTopicIds: detectTopicIds(line),
      scopeText: line
    });
  });

  const warning = deadlines.length ? undefined : "No explicit dates detected inside the syllabus.";
  return { deadlines, warning };
};

export const parseSyllabusPayload = async (
  request: Request
): Promise<ParseSyllabusResponse> => {
  const formData = await request.formData();
  
  // Debug logging
  console.log("=== Form Data Received ===");
  console.log("courseName:", formData.get("courseName"));
  console.log("courseNumber:", formData.get("courseNumber"));
  console.log("term:", formData.get("term"));
  console.log("syllabi files:", formData.getAll("syllabi").length);
  
  const validated = formSchema.parse({
    courseName: formData.get("courseName"),
    courseNumber: formData.get("courseNumber") ?? undefined,
    term: formData.get("term") ?? undefined
  });

  const files = formData
    .getAll("syllabi")
    .filter((file): file is File => file instanceof File && file.size > 0);

  // Create base course metadata without sample topics
  const baseCourse: StudyMapPayload["course"] = {
    id: `course-${Date.now()}`,
    name: validated.courseName,
    courseNumber: validated.courseNumber,
    term: validated.term,
    createdAt: new Date().toISOString()
  };

  const warningsList: string[] = [];

  let studyMap: StudyMapPayload = {
    course: baseCourse,
    topics: [],
    assignments: [],
    resources: {},
    exams: []
  };
  
  // If we have PDF files, send them directly to Claude
  if (files.length > 0 && claudeAvailable) {
    try {
      console.log(`Processing ${files.length} PDF file(s) with Claude...`);
      
      // For now, just use the first PDF file
      // TODO: Support multiple PDFs by combining them
      const firstFile = files[0];
      const pdfBuffer = Buffer.from(await firstFile.arrayBuffer());
      
      console.log(`PDF size: ${pdfBuffer.length} bytes`);
      console.log("Sending PDF directly to Claude...");
      
      const claudeMap = await claudeService.generateStudyMap({
        course: baseCourse,
        syllabusPdf: pdfBuffer
      });
      
      console.log("Claude study map generated successfully from PDF");
      studyMap = {
        course: baseCourse,
        topics: claudeMap.topics ?? [],
        exams: claudeMap.exams ?? [],
        resources: claudeMap.resources ?? {},
        assignments: claudeMap.assignments ?? []
      };
    } catch (error) {
      console.error("Claude PDF parsing failed.", error);
      warningsList.push(`Claude parse failed: ${error instanceof Error ? error.message : "Unknown error"}. Please try again with a different PDF or check the error logs.`);
      // Return empty study map on failure instead of sample data
      studyMap = {
        course: baseCourse,
        topics: [],
        assignments: [],
        resources: {},
        exams: []
      };
    }
  } else if (!files.length) {
    warningsList.push("No PDF files provided. Please upload a syllabus PDF.");
  } else if (!claudeAvailable) {
    warningsList.push("Claude API not configured. Please set ANTHROPIC_API_KEY.");
  }

  return {
    studyMap,
    message: "Draft study map generated",
    warnings: warningsList.length ? warningsList : undefined
  };
};

const mergeDeadlines = (
  existing: UpcomingItem[],
  extra: UpcomingItem[]
): UpcomingItem[] => {
  const record = new Map(existing.map((entry) => [entry.title.toLowerCase(), entry]));
  extra.forEach((item) => {
    const key = item.title.toLowerCase();
    if (!record.has(key)) {
      record.set(key, item);
    }
  });
  return Array.from(record.values()).sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
};
