# StudyMap

Claude-powered syllabus ingestor that turns messy PDFs into an interactive study plan: topics -> subtopics -> microtopics, auto-tracked progress, upcoming timeline, curated resources, and on-demand quizzes.

## Features
- **Landing + Planner Flow**: Upload one or more syllabi, watch parsing status, and review/edit the generated tree before accepting it.
- **Course Dashboard**: Cards per course with progress, next deadline, and quick actions (open, add syllabus, build quiz).
- **Course Map**: Collapsible topic tree with microtopic checkboxes, search, exam/project filters, per-topic pills, and a rich details panel.
- **Upcoming Timeline**: Chronological view of assignments/exams/projects with CTA to jump back into the related Study Map filter.
- **Resources Hub**: Topic tabs with curated links, video/document badges, “Find More” fallback, and manual add form.
- **Quiz Center**: Builder (select topics, difficulty, length, type) plus a quiz player with scoring, explanations, and weak-spot review.
- **Backend APIs**: Next.js routes for health, `POST /api/syllabus/parse` (PDF parsing + Claude JSON), and `POST /api/quiz` (Claude or deterministic fallback).

## Tech Stack
- Frontend: React + Vite + TypeScript, React Router v7, Tailwind CSS, Zustand, React Query, React Dropzone, React Hot Toast.
- Backend: Next.js App Router (API routes only), Zod validation, pdf-parse, optional Anthropic SDK.
- Shared: Monorepo with npm workspaces and shared type definitions in `shared/types`.

## Project Structure
```
.
├── backend          # Next.js API service
├── frontend         # Vite React SPA
├── shared/types     # TypeScript contracts shared via path aliases
├── README.md
└── TODO.md
```

## Getting Started
1. **Install dependencies** (workspace-aware):
   ```bash
   npm install          # root (installs shared deps + hoists)
   npm install --workspace frontend
   npm install --workspace backend
   ```
2. **Environment variables** (Backend):
   - `ANTHROPIC_API_KEY` – optional, enables real Claude calls for quiz + syllabus parsing. Without it, mocked-but-structured responses are returned.
3. **Development servers**:
   ```bash
   npm run dev:backend   # Next.js API on :3000
   npm run dev:frontend  # Vite dev server on :5173 (proxying /api to backend)
   ```
4. **Build**:
   ```bash
   npm run build:frontend
   npm run build:backend
   ```

## API Overview
| Route | Method | Description |
|-------|--------|-------------|
| `/api/health` | GET | Returns uptime status plus a cached Claude readiness probe (with last check + error details). |
| `/api/syllabus/parse` | POST (multipart) | Accepts `courseName`, optional metadata, and one or more `syllabi` PDF files. Returns structured study map JSON plus any parsing warnings. |
| `/api/quiz` | POST (JSON) | Accepts selected topics + quiz preferences and returns quiz questions with explanations. Uses Claude if available, otherwise the deterministic fallback. |

## Frontend Highlights
- Zustand store keeps per-course study maps, completion states, quiz history, and ordering.
- Shared `StudyNode` types drive both the tree and the details panel, ensuring consistent data shape.
- Landing review modal lets you inline-edit node titles before committing a course.
- Upcoming view gracefully handles empty states (“Add deadline” CTA).
- Resources page surfaces placeholders + manual add flow when Claude can’t find trusted links.
- Quiz player supports MCQ + short answers, immediate feedback, and “Review weak spots” navigation back into the Course Map.

## Testing / Verification
- `npm run test` (Vitest suites for both workspaces + persistence checks).
- `npm run build:frontend` (Vite + TypeScript) - sanity run.
- `npm run build:backend` (Next.js build + lint/type check) - sanity run.

## Next Steps
See `TODO.md` for the active checklist, remaining enhancements, and change log entries.
