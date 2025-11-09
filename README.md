# StudyMap - AI-Powered Course Study Planner

🎓 Transform your course syllabi into interactive study maps with advanced AI-powered features to help you master your coursework.

Built for the Claude AI Hackathon with **Anthropic Claude Haiku 4.5**

## 🌟 All Features

### Core Functionality
- **📄 PDF Syllabus Parsing**: Upload course syllabi and automatically generate structured study maps
- **🗺️ Interactive Study Map**: Hierarchical topic/subtopic/microtopic visualization with collapsible tree
- **✅ Progress Tracking**: Track completion at all levels with visual progress indicators
- **📅 Deadline Management**: Automatic extraction of exams, assignments, and project deadlines
- **📝 Quiz Generation**: AI-powered quiz creation based on course topics with weak spot analysis
- **📚 Resource Finding**: Intelligent web search for learning materials with quality filtering

### 🤖 Advanced AI Chatbot (NEW!)

#### Core Chat Capabilities
- **Context-Aware Conversations**: Full integration with study map, progress, quiz history, and deadlines
- **Beautiful Markdown Formatting**: Rich text rendering with bold, italic, code blocks, and strategic emojis
- **Conversation Persistence**: Save and resume chat history per course
- **Smart Action Suggestions**: 9 types of intelligent action buttons based on conversation context
- **Real-time Responses**: Streaming support for immediate feedback

#### 📈 Tier 2 - Enhanced Learning
- **Weak Spot Coaching** 💪: Identifies struggling topics from quiz failures and provides targeted help
- **Study Planning** 🗓️: Creates customized study schedules based on deadlines and progress
- **Progress Insights** 📊: Analyzes learning patterns and identifies blockers
- **Deadline Management** ⏰: Natural language queries for upcoming deadlines
- **Context Memory** 🧠: Remembers previous conversations within each course

#### 🎓 Tier 3 - Advanced Features
- **Concept Connections** 🔗: Explains relationships between topics and prerequisite chains
- **Exam Preparation Mode**: Comprehensive review plans for upcoming exams
- **Interactive Practice** ✏️: Generates practice questions with step-by-step solutions
- **Resource Recommendations** 📖: Suggests videos, articles, and practice materials
- **Adaptive Learning**: Adjusts difficulty and suggestions based on performance

### 9 Smart Action Types
The chatbot intelligently detects user intent and suggests contextual actions:
1. 📝 **Generate Quiz** - When practice is mentioned
2. 🗓️ **View Study Plan** - For scheduling requests
3. 💪 **Practice Weak Topics** - When struggling with topics
4. 🎓 **Exam Preparation** - For exam-related queries
5. 📚 **Find Resources** - When looking for learning materials
6. ⏰ **View Deadlines** - For deadline inquiries
7. 🗺️ **Navigate to Topics** - When specific topics are mentioned
8. 🔗 **Explore Connections** - For relationship questions
9. 📊 **View Progress** - For progress check requests

## 🚀 Tech Stack

### Frontend
- **React 18** + TypeScript for type-safe UI development
- **Vite** for blazing-fast development and HMR
- **React Router v7** for client-side routing
- **Zustand** for state management with persistence
- **TailwindCSS** for utility-first styling
- **React Query** for server state management
- **React Markdown** + remark-gfm for beautiful chat rendering
- **Heroicons** for consistent iconography
- **React Hot Toast** for notifications

### Backend
- **Next.js 14 App Router** (API routes only)
- **TypeScript** for type safety across the stack
- **Zod** for runtime validation
- **Anthropic Claude API** (claude-haiku-4-5) for all AI features
- **PDF2JSON** for syllabus parsing
- **File-based JSON storage** with Vercel-ready architecture

### AI Integration
- **Model**: Claude Haiku 4.5 (fast, efficient, cost-effective)
- **Context injection**: Study map structure, progress, quiz history, deadlines
- **Streaming support**: Infrastructure ready for real-time responses
- **Advanced prompting**: 9-tier capability system with examples
- **Rate limit handling**: Graceful degradation with informative messages

## 📦 Quick Start

### Prerequisites
- Node.js 20+ and npm
- Anthropic API key ([Get one here](https://console.anthropic.com))

### Installation

```bash
# Clone repository
git clone https://github.com/anasm266/hackproj.git
cd hackproj
git checkout production-deploy-v1

# Install all dependencies
npm install

# Configure backend environment
cd backend
echo "ANTHROPIC_API_KEY=your_api_key_here" > .env.local
cd ..

# Start development servers
npm run dev:backend  # Terminal 1 - http://localhost:3000
npm run dev:frontend # Terminal 2 - http://localhost:5173
```

Visit http://localhost:5173 to start using StudyMap!

## 🎯 Usage Guide

### 1. Creating a Study Map
1. Upload a PDF syllabus on the landing page
2. Enter course details (name, number, term)
3. Add optional deadline information
4. Wait for Claude AI to extract course structure
5. Review and interact with your personalized study map

### 2. Using the AI Chatbot 💬
Navigate to any course and click **"Chat"** in the navigation bar.

**Example conversations:**
- *"What topics should I focus on first?"* - Get personalized study recommendations
- *"Create a study plan for next week"* - Receive a customized schedule
- *"Quiz me on weak topics"* - Practice areas where you're struggling
- *"Explain the relationship between DFAs and NFAs"* - Understand concept connections
- *"How should I prepare for the upcoming exam?"* - Get exam preparation strategies
- *"What's due this week?"* - Check upcoming deadlines

The AI assistant provides context-aware responses with beautiful markdown formatting and actionable buttons.

### 3. Taking Quizzes 📝
1. Navigate to **"Quiz Center"**
2. Select topics, difficulty level, and question count
3. Answer questions with immediate feedback
4. Review results and identify weak spots
5. Use suggested actions to practice weak topics

### 4. Finding Resources 📚
1. Go to **"Resources"** page
2. Select a topic from your study map
3. Choose resource type (learn/practice/both)
4. AI searches for relevant videos, articles, and practice materials
5. Save useful resources for later

### 5. Tracking Progress 📊
- Check overall course progress in the header
- View detailed progress on the Study Map page
- Mark microtopics as complete by clicking checkboxes
- Filter by exam scope or project tags
- Use search to find specific topics

## 📊 Project Structure

```
studymap-project/
├── backend/                     # Next.js API backend
│   ├── src/
│   │   ├── app/api/            # API routes
│   │   │   ├── chat/           # 🆕 Chat endpoint
│   │   │   ├── courses/        # Course CRUD
│   │   │   ├── health/         # Health check
│   │   │   ├── quiz/           # Quiz generation
│   │   │   ├── resources/      # Resource finding
│   │   │   └── syllabus/       # Syllabus parsing
│   │   └── lib/
│   │       └── claude.ts       # 🆕 Enhanced Claude service
│   ├── storage/                # JSON file storage
│   └── vercel.json             # 🆕 Deployment config
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/          # 🆕 Chat components
│   │   │   │   ├── ChatMessage.tsx
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   └── MarkdownRenderer.tsx
│   │   │   └── layout/        # Layout components
│   │   ├── pages/
│   │   │   ├── ChatPage.tsx   # 🆕 Chat interface
│   │   │   ├── CourseMapPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── QuizCenterPage.tsx
│   │   │   ├── ResourcesPage.tsx
│   │   │   └── UpcomingPage.tsx
│   │   ├── store/
│   │   │   └── useStudyPlanStore.ts  # 🆕 With chat persistence
│   │   └── lib/
│   │       └── api.ts         # 🆕 Chat API methods
│   └── .env.example           # 🆕 Environment template
├── shared/
│   └── types/
│       ├── index.ts           # 🆕 Type exports
│       └── studyMap.ts        # 🆕 Chat types added
├── DEPLOYMENT.md              # 🆕 Deployment guide
└── README.md                  # This file
```

🆕 = New in this release

## 🔧 Configuration

### Environment Variables

**Backend** (`backend/.env.local`):
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**Frontend** (`frontend/.env`):
```env
# For local development (uses Vite proxy)
VITE_API_BASE_URL=/api

# For production (point to deployed backend)
# VITE_API_BASE_URL=https://your-backend.vercel.app/api
```

### Claude API Settings
- **Model**: claude-haiku-4-5 (fast, cost-effective)
- **Max tokens**: 2048 for chat, 4096-8192 for generation tasks
- **Temperature**: 0.7 for chat, 0.2-0.6 for structured outputs
- **Rate limits**: 4,000 output tokens/minute, 10,000 input tokens/minute

## 🚀 Deployment to Vercel

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for comprehensive deployment instructions.

**Quick Deploy Summary:**

### Option 1: Vercel Dashboard (Recommended)
1. Import GitHub repository to Vercel
2. Deploy **backend** (Next.js, root: `backend`)
   - Add env var: `ANTHROPIC_API_KEY`
3. Deploy **frontend** (Vite, root: `frontend`)
   - Add env var: `VITE_API_BASE_URL` (backend URL + `/api`)

### Option 2: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy backend
cd backend
vercel
vercel env add ANTHROPIC_API_KEY
vercel --prod

# Deploy frontend
cd ../frontend
vercel
vercel env add VITE_API_BASE_URL  # Use backend URL from above
vercel --prod
```

Both deployments support auto-deploy from GitHub branches.

## 📝 API Reference

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check + Claude availability |
| `/api/syllabus/parse` | POST | Parse PDF syllabus with Claude |
| `/api/courses` | GET | List all courses |
| `/api/courses` | POST | Create new course |
| `/api/courses/:id/topics` | PATCH | Update course topics |
| `/api/quiz` | POST | Generate quiz questions |
| `/api/resources/find` | POST | Find learning resources |
| `/api/chat` | POST | 🆕 Send chat message |

### Chat API Example

```typescript
POST /api/chat
{
  "courseId": "course-123",
  "conversationId": "chat-abc", // optional
  "message": "What should I study first?",
  "context": {
    "courseId": "course-123",
    "courseName": "Data Structures",
    "topics": [...],
    "completedMicroTopicIds": [...],
    "upcomingDeadlines": [...],
    "quizHistory": {
      "weakTopicIds": [...],
      "recentScores": [85, 90, 78]
    }
  },
  "conversationHistory": [...]
}

Response:
{
  "conversationId": "chat-abc",
  "message": {
    "id": "msg-123",
    "role": "assistant",
    "content": "Based on your progress...",
    "timestamp": "2025-11-09T10:00:00Z",
    "metadata": {
      "suggestedActions": [
        {
          "type": "navigate",
          "label": "🗺️ Go to Binary Trees",
          "payload": { "topicId": "topic-binary-trees" }
        }
      ]
    }
  }
}
```

## 🎨 Key Implementation Details

### Markdown Chat Rendering
- Uses `react-markdown` with `remark-gfm` for GitHub-flavored markdown
- Custom component renderers for beautiful styling
- Syntax highlighting for code blocks
- Strategic emoji placement for enhanced comprehension
- Clean rendering without raw markdown symbols

### Context-Aware AI Prompts
Every chat message includes comprehensive context:
- Complete course structure with topics/subtopics/microtopics
- Student progress percentage and completion tracking
- Weak topics identified from quiz failures
- Upcoming deadlines and exam schedules
- Recent quiz performance metrics
- Full conversation history

### Smart Action Detection
Advanced keyword detection system analyzes both:
- **User message**: Intent extraction from student's question
- **AI response**: Content analysis for suggested follow-ups
- **Context data**: Progress, deadlines, weak spots

9 different action types with deduplication and prioritization.

## 📈 Performance & Limits

### Response Times
- Chat messages: 2-8 seconds (depends on Claude API)
- Quiz generation: 5-15 seconds (varies with question count)
- Resource finding: 3-10 seconds (includes web search)
- Syllabus parsing: 30-60 seconds (depends on PDF size)

### Rate Limits
- **Claude API**: 4,000 output tokens/minute
- **Handling**: Graceful error messages with retry suggestions
- **Production**: Consider implementing request queuing

### Storage
- **Development**: File-based JSON storage
- **Production**: Migrate to Vercel KV, Postgres, or external DB
- **Note**: Vercel serverless functions are stateless

## 🐛 Known Limitations

1. **Storage**: File-based storage won't persist on Vercel (use database for production)
2. **Rate Limits**: Claude API has token/minute limits (implement queuing for production)
3. **File Size**: Large PDFs may hit Vercel body size limits (use Vercel Blob for production)
4. **Streaming**: Chat streaming UI infrastructure ready but not fully implemented

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev:backend    # Start backend on :3000
npm run dev:frontend   # Start frontend on :5173

# Building
npm run build:backend  # Build backend
npm run build:frontend # Build frontend

# Testing
npm run test           # Run all tests
```

### Adding New Features
1. Update types in `shared/types/`
2. Implement backend API in `backend/src/app/api/`
3. Create frontend UI in `frontend/src/`
4. Update Zustand store if needed
5. Add to this README!

## 🤝 Contributing

Built as a hackathon project for the Claude AI Hackathon. Contributions and feedback welcome!

## 📄 License

This project is for educational and demonstration purposes.

## 🙏 Acknowledgments

- **Anthropic** for Claude AI and the hackathon
- **Next.js** and **React** teams for excellent frameworks
- **Vercel** for hosting and deployment platform
- **Heroicons** for beautiful icons
- **TailwindCSS** for utility-first styling

---

**Built with ❤️ and Claude AI**

🤖 Generated with [Claude Code](https://claude.com/claude-code)

**Live Demo**: [Coming soon on Vercel]

**GitHub**: [anasm266/hackproj](https://github.com/anasm266/hackproj)
