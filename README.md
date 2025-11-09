# StudyMap - Syllabus to Interactive Study Planner

A web app powered by Claude that transforms messy course syllabi into clean, interactive study maps with progress tracking, deadlines, and AI-generated quizzes.

## Features

- 📄 PDF syllabus parsing and topic extraction
- 🗺️ Interactive study map (Topics → Subtopics → Microtopics)
- ✅ Progress tracking at microtopic granularity
- 📅 Upcoming deadlines and exam timeline
- 🎯 Exam/Project-focused study views
- 📚 Curated learning resources per topic
- 🧠 AI-generated quizzes on demand

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **State**: Zustand
- **Routing**: React Router
- **PDF**: react-pdf + pdfjs-dist
- **AI**: Claude API (Anthropic)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Anthropic API key

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd studymap-project
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Add your VITE_ANTHROPIC_API_KEY to .env
```

4. Start the development server
```bash
npm run dev
```

5. In a separate terminal, start the API server
```bash
node api/server.js
```

Visit `http://localhost:3000` to see the app.

## Project Structure

```
studymap-project/
├── src/
│   ├── components/
│   │   ├── ui/          # Reusable UI components
│   │   ├── layout/      # Layout components
│   │   └── features/    # Feature-specific components
│   ├── pages/           # Page components
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # External library configs
│   ├── types/           # Type definitions
│   ├── utils/           # Utility functions
│   └── styles/          # Global styles
├── api/                 # Backend API routes
└── public/              # Static assets
```

## Team Roles

- **Person 1**: Frontend Lead + Routing (Landing, Dashboard, Navigation)
- **Person 2**: Claude Integration + Backend (API, PDF parsing, Quiz generation)
- **Person 3**: UI Components + Progress System (Tree, Checkboxes, Progress)
- **Person 4**: Features + Quiz System (Upcoming, Resources, Quiz player)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## License

MIT
