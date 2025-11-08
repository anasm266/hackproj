# 🚀 Quick Start Guide for Team Members

## First Time Setup (Everyone)

1. **Get the code**
   ```bash
   # If using Git, clone the repo
   # Otherwise, everyone gets the syllabus-studymap folder
   ```

2. **Install dependencies**
   ```bash
   cd syllabus-studymap
   npm install
   ```

3. **Set up environment**
   ```bash
   # Copy the example env file
   cp .env.example .env

   # Edit .env and add your Claude API key
   # VITE_CLAUDE_API_KEY=sk-ant-...
   ```

4. **Start the dev server**
   ```bash
   npm run dev
   ```

   Visit `http://localhost:5173`

---

## 👤 Person 1: Getting Started

### Your Focus
- Page layouts and routing
- Form handling
- Integration of other team members' components

### Files You'll Work On
```
src/
├── components/person1-frontend/
│   └── Layout.tsx                 ← Edit this
├── pages/
│   ├── Landing.tsx                ← Edit this
│   ├── Dashboard.tsx              ← Edit this
│   └── CourseMap.tsx              ← Edit this (shared with Person 3)
└── App.tsx                        ← Routes are here
```

### Your First Tasks
1. Open `src/components/person1-frontend/Layout.tsx`
2. Add navigation links to the header
3. Test the Landing page form
4. Create a review screen component for study map approval

### Integration Points
- Import `StudyMapTree` from Person 3 into `CourseMap.tsx`
- Call `parseSyllabus()` from Person 2 when form is submitted
- Use storage helpers from `src/api/storage.ts`

---

## 🧠 Person 2: Getting Started

### Your Focus
- All Claude API calls
- PDF processing
- Generating study maps, resources, and quizzes

### Files You'll Work On
```
src/
└── api/
    └── claude.ts                  ← Edit this (main work here)
```

### Your First Tasks
1. Get Claude API key from https://console.anthropic.com/
2. Add key to `.env` file
3. Open `src/api/claude.ts`
4. Implement `parseSyllabus()` function first
5. Test with a sample PDF

### Example Implementation
```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
});

export async function parseSyllabus(request: ClaudeParseRequest) {
  // Convert PDF to base64 or use direct upload
  // Send to Claude with structured prompt
  // Parse response into StudyMap structure
  // Return ClaudeParseResponse
}
```

### Testing
- Create test PDFs or use sample syllabi
- Console.log the responses to verify structure
- Make sure your responses match the TypeScript types in `src/types/index.ts`

---

## 🎨 Person 3: Getting Started

### Your Focus
- Collapsible tree component
- Progress tracking system
- UI components

### Files You'll Work On
```
src/
├── components/person3-ui/
│   ├── StudyMapTree.tsx           ← Edit this (main component)
│   └── ProgressBar.tsx            ← Edit this
├── utils/
│   └── progress.ts                ← Already done, use these functions
└── pages/
    └── CourseMap.tsx              ← Edit this (shared with Person 1)
```

### Your First Tasks
1. Open `src/components/person3-ui/StudyMapTree.tsx`
2. The basic structure is there - enhance it with:
   - Smooth animations
   - Better styling
   - Filter functionality
3. Test with mock data in `CourseMap.tsx`

### Testing with Mock Data
Add this to `CourseMap.tsx` for testing:
```typescript
const mockStudyMap: StudyMap = {
  courseId: 'test-1',
  topics: [
    {
      id: '1',
      title: 'Introduction to Data Structures',
      description: 'Basic concepts',
      progress: 50,
      order: 1,
      subtopics: [
        {
          id: '1-1',
          title: 'Arrays and Lists',
          progress: 75,
          order: 1,
          microtopics: [
            {
              id: '1-1-1',
              title: 'Array Basics',
              completed: true,
              examIds: ['exam-1'],
              projectIds: [],
              order: 1,
            },
            {
              id: '1-1-2',
              title: 'Dynamic Arrays',
              completed: false,
              examIds: ['exam-1'],
              projectIds: [],
              order: 2,
            },
          ],
        },
      ],
    },
  ],
  lastUpdated: new Date(),
};
```

---

## 📝 Person 4: Getting Started

### Your Focus
- Upcoming deadlines page
- Resources display
- Quiz builder and player

### Files You'll Work On
```
src/
├── pages/
│   ├── Upcoming.tsx               ← Edit this
│   └── Resources.tsx              ← Edit this
└── components/person4-features/
    ├── QuizBuilder.tsx            ← Edit this
    └── QuizPlayer.tsx             ← Edit this
```

### Your First Tasks
1. Open `src/pages/Upcoming.tsx`
2. Test with mock deadline data
3. Style the deadline cards
4. Add sorting/filtering functionality

### Testing with Mock Data
```typescript
const mockDeadlines: Deadline[] = [
  {
    id: 'd1',
    courseId: 'test-1',
    title: 'Midterm Exam',
    type: 'exam',
    dueDate: new Date('2025-02-15'),
    description: 'Covers topics 1-5',
    scope: 'Lectures 1-10: Arrays, Trees, Heaps',
    relatedTopicIds: ['1', '2', '3'],
    relatedMicrotopicIds: [],
  },
  {
    id: 'd2',
    courseId: 'test-1',
    title: 'Project 1: Implement BST',
    type: 'project',
    dueDate: new Date('2025-02-20'),
    relatedTopicIds: ['2'],
    relatedMicrotopicIds: [],
  },
];
```

---

## 🔧 Common Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npx tsc --noEmit
```

---

## 🐛 Common Issues

### Port already in use
```bash
# Kill process on port 5173 or use different port
npm run dev -- --port 5174
```

### Module not found
```bash
npm install
# Restart dev server
```

### TypeScript errors
- Check import paths (use relative paths: `../types`)
- Make sure to use `import type` for types
- Check `src/types/index.ts` for correct interfaces

### Tailwind not applying
- Restart dev server
- Check `src/index.css` has the Tailwind directives
- Make sure your files are in `src/` folder

---

## 📁 Where to Find Things

| What you need | Where to find it |
|---------------|------------------|
| Types/Interfaces | `src/types/index.ts` |
| Storage functions | `src/api/storage.ts` |
| Progress calculations | `src/utils/progress.ts` |
| Helper functions | `src/utils/helpers.ts` |
| Claude API | `src/api/claude.ts` |
| Routes | `src/App.tsx` |

---

## 🎯 Integration Checklist

Before final integration, make sure:

- [ ] **Person 1**: All pages render without errors
- [ ] **Person 2**: Claude API functions return correct types
- [ ] **Person 3**: Tree component accepts topics array and callbacks
- [ ] **Person 4**: All feature pages handle empty states
- [ ] Everyone: Test with `npm run build` to catch type errors

---

## 💬 Questions?

1. Check the main [README.md](README.md)
2. Look at code comments in your files - they have TODOs
3. Check the TypeScript types in `src/types/index.ts`
4. Ask your team members

---

## 🎉 You're Ready!

Focus on your assigned components first. They're already set up with basic structure - just enhance and complete them!

Good luck with the hackathon! 🚀
