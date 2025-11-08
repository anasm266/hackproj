# 📚 Syllabus → StudyMap

A web app that turns messy course syllabi (PDFs) into a clean, interactive study map with topics → subtopics → microtopics, auto-tracked progress, upcoming deadlines, exam-focused views, curated resources, and on-demand quizzes — powered by Claude.

Built for the **Claude Hackathon**

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Claude API key from Anthropic

### Installation

```bash
# Navigate to project directory
cd syllabus-studymap

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Add your Claude API key to .env
# VITE_CLAUDE_API_KEY=your_api_key_here

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the app.

---

## 📁 Project Structure

```
syllabus-studymap/
├── src/
│   ├── components/
│   │   ├── person1-frontend/      # PERSON 1: Layout & Navigation
│   │   ├── person2-backend/        # (unused - backend in api/)
│   │   ├── person3-ui/             # PERSON 3: Tree, Progress, UI Components
│   │   └── person4-features/       # PERSON 4: Quiz Builder & Player
│   ├── pages/
│   │   ├── Landing.tsx             # PERSON 1: Create Course form
│   │   ├── Dashboard.tsx           # PERSON 1: All courses view
│   │   ├── CourseMap.tsx           # PERSON 1 + 3: Main study map
│   │   ├── Upcoming.tsx            # PERSON 4: Deadlines timeline
│   │   └── Resources.tsx           # PERSON 4: Topic resources
│   ├── api/
│   │   ├── claude.ts               # PERSON 2: Claude API integration
│   │   └── storage.ts              # Local storage helpers
│   ├── types/
│   │   └── index.ts                # Shared TypeScript types
│   ├── utils/
│   │   ├── progress.ts             # PERSON 3: Progress calculations
│   │   └── helpers.ts              # Shared utility functions
│   ├── hooks/                      # Custom React hooks (create as needed)
│   ├── context/                    # React Context (create as needed)
│   └── App.tsx                     # Main router
├── public/                         # Static assets
└── server/                         # (Optional backend routes)
```

---

## 👥 Team Roles & Responsibilities

### 👤 Person 1: Frontend Lead + Routing

**Your files:**
- `src/components/person1-frontend/Layout.tsx`
- `src/pages/Landing.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/CourseMap.tsx` (shared with Person 3)
- `src/App.tsx`

**Your tasks:**
1. ✅ Set up main layout with header/navigation
2. ✅ Build landing page with "Create Course Planner" form
3. ✅ Create course dashboard (list view of all courses)
4. ✅ Set up routing structure
5. Add navigation between pages
6. Create review screen for study map draft
7. Integrate components from other team members

**Key features:**
- Multi-file PDF upload
- Form validation
- Loading states during parsing
- Course cards with progress display

---

### 🧠 Person 2: Claude Brain + Backend

**Your files:**
- `src/api/claude.ts`
- `src/api/storage.ts` (already has helpers)

**Your tasks:**
1. Implement `parseSyllabus()` function
   - Send PDF(s) to Claude API
   - Extract dates, topics, exam scope
   - Return structured JSON (StudyMap + Deadlines)
2. Implement `generateResources()` function
   - Generate 1-5 resources per topic
   - Include YouTube links with thumbnails
3. Implement `generateQuiz()` function
   - Generate quiz based on selected topics
   - Return questions with answers and explanations
4. Handle errors and timeouts gracefully

**Key APIs:**
- Anthropic SDK: `@anthropic-ai/sdk`
- Direct PDF support in Claude API
- See `src/types/index.ts` for request/response types

**Example:**
```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
});

// Your implementation here
```

---

### 🎨 Person 3: UI Components + Progress System

**Your files:**
- `src/components/person3-ui/StudyMapTree.tsx`
- `src/components/person3-ui/ProgressBar.tsx`
- `src/utils/progress.ts`
- `src/pages/CourseMap.tsx` (shared with Person 1)

**Your tasks:**
1. ✅ Build collapsible tree component
   - Topics → Subtopics → Microtopics
   - Checkboxes at microtopic level
   - Click to select and show details
2. ✅ Implement progress tracking
   - Calculate progress from microtopic completion
   - Update progress bars in real-time
   - Show progress pills on each node
3. Create filter chips (All / Exam X / Project Y)
4. Add search functionality for topics

**Key features:**
- Smooth expand/collapse animations
- Visual feedback on completion
- Color-coded progress indicators
- Integration with CourseMap page

**Progress calculation:**
```typescript
import { calculateTopicProgress, updateAllProgress } from '../utils/progress';

// After toggling a microtopic:
const updatedStudyMap = updateAllProgress(studyMap);
```

---

### 📝 Person 4: Features + Quiz System

**Your files:**
- `src/pages/Upcoming.tsx`
- `src/pages/Resources.tsx`
- `src/components/person4-features/QuizBuilder.tsx`
- `src/components/person4-features/QuizPlayer.tsx`

**Your tasks:**
1. ✅ Build Upcoming/Deadlines page
   - Timeline view of exams/assignments/projects
   - Link to filtered study map
   - Visual indicators for upcoming/overdue
2. ✅ Build Resources page
   - Display resources per topic
   - YouTube thumbnails
   - Type badges (video/article/docs)
3. ✅ Build Quiz Builder
   - Topic selector (1-20 topics)
   - Difficulty and question type options
   - Call Person 2's quiz API
4. ✅ Build Quiz Player
   - One question at a time
   - Show correct answers after submission
   - Final score and "Review weak spots" link

**Key features:**
- Sortable/filterable deadline list
- Resource cards with metadata
- Interactive quiz interface
- Score calculation and review mode

---

## 🔧 Tech Stack

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM v6
- **State:** React Context / Zustand (add if needed)
- **AI:** Anthropic Claude API
- **PDF:** Built-in Claude PDF support
- **Storage:** LocalStorage (for demo) → can upgrade to backend

---

## 📝 Shared Types

All TypeScript types are in `src/types/index.ts`. Key interfaces:

- `Course` - Course metadata
- `Topic`, `Subtopic`, `Microtopic` - Study map structure
- `Deadline` - Exams, assignments, projects
- `Resource` - Learning resources
- `Quiz`, `QuizQuestion` - Quiz system
- `ClaudeParseRequest/Response` - Claude API types

**Always import from types:**
```typescript
import type { Topic, StudyMap, Deadline } from '../types';
```

---

## 🛠 Utilities & Helpers

### Progress Calculations (`src/utils/progress.ts`)
```typescript
import { calculateTopicProgress, updateAllProgress } from '../utils/progress';
```

### General Helpers (`src/utils/helpers.ts`)
```typescript
import { formatDate, generateId, getYouTubeThumbnail } from '../utils/helpers';
```

### Storage (`src/api/storage.ts`)
```typescript
import { saveCourse, getCourses, saveStudyMap } from '../api/storage';
```

---

## 🎨 Tailwind CSS

Tailwind is already configured. Just use utility classes:

```tsx
<div className="bg-white shadow-md rounded-lg p-6">
  <h2 className="text-2xl font-bold text-gray-900 mb-4">Title</h2>
  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
    Button
  </button>
</div>
```

Common patterns:
- Cards: `bg-white shadow-md rounded-lg p-6`
- Buttons: `bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700`
- Input: `border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500`

---

## 🔄 Integration Guide

### Person 1 → Person 2
When user submits the form in Landing.tsx:
```typescript
import { parseSyllabus } from '../api/claude';

const result = await parseSyllabus({
  pdfFiles: formData.syllabusFiles,
  courseName: formData.name,
  courseNumber: formData.courseNumber,
  term: formData.term,
});

if (result.success) {
  // Save to storage and navigate to review screen
}
```

### Person 1 → Person 3
In CourseMap.tsx:
```typescript
import { StudyMapTree } from '../components/person3-ui/StudyMapTree';

<StudyMapTree
  topics={studyMap.topics}
  onToggleCompletion={(microtopicId) => {
    // Update completion status
  }}
  onSelectNode={(nodeId, type) => {
    // Show details in right panel
  }}
/>
```

### Person 3 → Progress Updates
After any microtopic toggle:
```typescript
import { updateAllProgress } from '../utils/progress';
import { saveStudyMap } from '../api/storage';

const updatedMap = updateAllProgress(studyMap);
saveStudyMap(updatedMap);
```

### Person 4 → Person 2
When generating quiz:
```typescript
import { generateQuiz } from '../api/claude';

const result = await generateQuiz({
  topicIds: selectedTopicIds,
  difficulty: 'exam-level',
  questionCount: 20,
  questionTypes: ['mcq', 'short-answer'],
  courseContext: course.name,
});
```

---

## 🧪 Testing Your Work

### Test Person 1 (Frontend)
```bash
npm run dev
# Visit http://localhost:5173
# Test: Fill form, upload PDF, submit
```

### Test Person 2 (Claude API)
```typescript
// Add console.logs to see Claude responses
console.log('Claude response:', response);
```

### Test Person 3 (UI Components)
```typescript
// Add test data in CourseMap.tsx
const testStudyMap: StudyMap = {
  courseId: 'test',
  topics: [/* ... */],
  lastUpdated: new Date(),
};
```

### Test Person 4 (Features)
```typescript
// Add test deadlines/resources
const testDeadlines: Deadline[] = [/* ... */];
```

---

## 📦 Build & Deploy

### Build for production
```bash
npm run build
# Output: dist/
```

### Deploy to Vercel (recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

---

## 🐛 Troubleshooting

### "Module not found" errors
```bash
npm install
# Restart dev server
```

### TypeScript errors
- Check `src/types/index.ts` for correct type definitions
- Use `type` imports: `import type { ... } from '...'`

### Tailwind not working
- Make sure `index.css` has the Tailwind directives
- Restart dev server

### Claude API errors
- Check API key in `.env`
- Verify `VITE_` prefix for Vite environment variables
- Check rate limits

---

## 📚 Resources

- [React Router Docs](https://reactrouter.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Vite Docs](https://vitejs.dev/)

---

## 🎯 Development Workflow

1. **Setup:** Everyone runs `npm install` and creates `.env`
2. **Development:** Each person works in their assigned files
3. **Testing:** Test your components independently
4. **Integration:** Person 1 integrates all components
5. **Demo:** Test full flow with real PDF upload
6. **Deploy:** Deploy to Vercel for presentation

---

## 🤝 Communication

- **File conflicts:** Use different files as much as possible
- **Shared files:** Coordinate on `CourseMap.tsx` (Person 1 + 3)
- **Types:** Don't modify `types/index.ts` without team discussion
- **Git:** Use branches if collaborating via Git

---

## ✅ Final Checklist

### Person 1
- [ ] Landing page form works
- [ ] Dashboard shows courses
- [ ] Navigation between pages
- [ ] Review screen for study map
- [ ] Integrated all components

### Person 2
- [ ] PDF parsing implemented
- [ ] Resources generation works
- [ ] Quiz generation works
- [ ] Error handling added

### Person 3
- [ ] Tree renders and expands/collapses
- [ ] Checkboxes toggle completion
- [ ] Progress bars update
- [ ] Filter chips work

### Person 4
- [ ] Upcoming page shows deadlines
- [ ] Resources page displays items
- [ ] Quiz builder allows topic selection
- [ ] Quiz player shows questions and scores

---

## 🎉 Good Luck!

Remember: Focus on your assigned components first, then help integrate. Communication is key!

For questions, check the code comments in your files - they have detailed TODOs and examples.
