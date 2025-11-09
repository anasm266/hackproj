# TODO & Change Log

## Completed
- [x] Monorepo scaffold with Vite + Tailwind frontend, Next.js API backend, and shared TypeScript contracts *(2025-11-08)*.
- [x] Landing planner flow with PDF uploads, Claude parsing states, and draft review modal.
- [x] Dashboard, Course Map (tree, filters, progress), Upcoming timeline, Resources hub, and Quiz builder/player UX.
- [x] Backend syllabus parsing (pdf-parse + Claude fallback), quiz generation service, and health endpoint.
- [x] Documentation + verification (`npm run build:frontend`, `npm run build:backend`).
- [x] Configure `ANTHROPIC_API_KEY` locally via `backend/.env.local` to enable live Claude calls *(2025-11-08)*.
- [x] Validate live Claude responses end-to-end via `/api/health` readiness pings + UI badge *(2025-11-08)*.
- [x] Enable post-accept editing (rename/reorder/add) directly on Course Map and cover it with store tests *(2025-11-08)*.
- [x] Persist study maps + completion states into the on-disk course store with env-overridable paths *(2025-11-08)*.
- [x] Add automated frontend + backend Vitest suites and wire them into CI *(2025-11-08)*.

## Up Next
- [ ] _(Backlog clear — add the next milestone here.)_

> Update this file whenever new work starts/completes so the team can see history + remaining scope at a glance.
