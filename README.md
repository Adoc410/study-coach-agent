🎓 AI Study Coach Agent

Capstone Project — AI Engineering Programme · Sprint 3 (Case 2: AI Agent for Task Automation)


Why I Built This
High school was rough for me.
I am an introvert. Asking a teacher to repeat something they had just explained — in front of 60 other students — felt impossible. So I stayed quiet. I nodded like I understood. I copied notes I did not follow. I went home and stared at textbooks alone, hoping things would click on their own.
Sometimes they did. Most times they did not.
I was not a bad student. I was a student without access. Without someone patient enough to explain the same concept five different ways until one of them landed. Without someone I could ask at 11pm when I was revising for an exam the next morning. Without someone who would not judge me for not knowing something I was supposed to already know.
That experience shaped how I see education. The problem was never the student. The problem was always access.
Uganda has over 15 million students in primary and secondary schools. Most of them are me — students who do not fully understand something in class but will never raise their hand to say so. Students in rural areas who go home to no textbooks, no tutors, no one to ask. Students who can afford the school fees but cannot afford the private tutoring that gives wealthier classmates an unfair advantage.
The gap between students who have access to good tutoring and those who do not is not a gap in intelligence. It is a gap in resources.

I built the AI Study Coach I wish I had in high school.

An AI that never gets tired of your questions. That will explain the same concept ten different ways without sighing. That does not judge you for not knowing something. That is available at 3am the night before your UACE exams. That knows exactly what UNEB will ask because it is built on the NCDC syllabus. That remembers you struggled with osmosis last week and checks in to make sure you have got it now.
This is not just a study app. This is what I needed when I was in S4, sitting alone in my room, too afraid to admit I did not understand photosynthesis.
If this helps even one student avoid the silence I chose — it is worth it.
— Joan Adoc

Project Overview
Goal: Students often struggle to study effectively on their own — they lack immediate feedback, don't know what to prioritise, and have no personalised guidance. The AI Study Coach solves this by acting as an always-available, intelligent tutor that explains concepts, tests understanding through interactive quizzes, and adapts its recommendations to each learner's history.
How it works: The user sends messages through a chat interface. A LangGraph-powered agent reasons about each message and autonomously decides which of five tools to call — fetching Wikipedia summaries for factual grounding, generating quizzes, grading submitted answers, tracking study progress, or producing personalised recommendations. State is maintained both within the session (LangGraph MemorySaver) and across sessions (file-based JSON store), so the coach remembers what each user has mastered and where they struggle over time.

SCR Summary
SituationLearners studying independently lack real-time feedback, adaptive quizzes, and personalised study plans — resources usually only available with a human tutor.ComplicationGeneric AI chatbots can answer questions but don't track progress, adapt difficulty, or proactively guide what to study next. They treat every conversation as a blank slate.ResolutionThe AI Study Coach is a stateful LangGraph agent with five purpose-built tools and a dual-memory system. It explains topics using grounded Wikipedia data, quizzes users interactively, grades responses, flags weak areas, and generates a personalised study plan — all within a clean Next.js UI.

Features
Core

🤖 Conversational AI agent powered by GPT-4o via LangChain
🔧 5 autonomous tools the agent calls based on context:

generate_quiz — creates multiple-choice quizzes at chosen difficulty
grade_quiz — grades submitted answers and explains corrections
fetch_topic_summary — grounds explanations in Wikipedia facts
track_study_progress — records topics studied, scores, and weak areas
get_study_recommendations — personalised "what to study next" advice


📊 LangGraph control flow with conditional edges and structured state
💻 Next.js 14 frontend with interactive chat UI and session dashboard

Bonus

💰 Token usage & cost tracking — per-response and session totals
🧠 Short-term memory — full session context via LangGraph MemorySaver
📚 Long-term memory — user profile persists across sessions (file-based JSON)
🔄 Model switcher — GPT-4o, GPT-4o Mini, or GPT-3.5 Turbo
📱 Responsive layout — panel overlay on mobile, side-by-side on desktop


Getting Started
Prerequisites

Node.js 18+
An OpenAI API key (get one here)

Installation
bash# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Open .env.local and add your OPENAI_API_KEY

# 3. Run the development server
       npm run dev
Open http://localhost:3000 in your browser.

Project Structure
study-coach-agent/
├── app/
│   ├── page.jsx                 # Main chat UI + state management
│   ├── layout.jsx               # Root layout + metadata
│   ├── globals.css              # Global styles + Tailwind
│   ├── components/
│   │   ├── StudyPanel.jsx       # Session dashboard (right panel)
│   │   ├── MessageBubble.jsx    # Individual message component
│   │   └── QuizCard.jsx         # Interactive quiz UI
│   └── api/
│       └── chat/
│           └── route.js         # Next.js API route → LangGraph agent
├── lib/
│   ├── agent.js                 # LangGraph graph definition + system prompt
│   ├── tools.js                 # All 5 tool definitions (Zod-validated)
│   ├── memory.js                # Short-term + long-term memory
│   └── state.js                 # Agent state schema (LangGraph Annotation)
├── ETHICS.md                    # Ethical considerations and mitigations
├── .env.local.example           # Environment variable template
└── package.json

Architecture
User types message
       ↓
page.jsx → POST /api/chat (message + threadId + userId + modelName)
       ↓
route.js → loads long-term memory → builds agent → invokes
       ↓
agent.js (LangGraph):
  START → agentNode (LLM reasons, tools bound)
       ↓
  Tool needed? → toolNode (executes tool)
       ↓
  track_study_progress called? → stateUpdaterNode (updates structured state)
       ↓
  agentNode again → final response
       ↓
route.js → merges session into long-term memory → returns response
       ↓
page.jsx → renders message + updates session dashboard
LangGraph Nodes
NodePurposeagentNodeLLM reasoning — decides what to do, calls toolstoolNodeExecutes whichever tool the LLM requestedstateUpdaterNodeParses track_study_progress calls → updates structured state
Routing logic:

After agentNode: tool calls present → toolNode; otherwise → END
After toolNode: track_study_progress was called → stateUpdaterNode; otherwise → agentNode
After stateUpdaterNode: always → agentNode (for final response)


Memory System
Short-term (within session)

LangGraph MemorySaver checkpointer, scoped to thread_id
Maintains full conversation history within one browser session
Resets when the server restarts

Long-term (across sessions)

File-based JSON store in .study-memory/ directory
Keyed by userId stored in browser localStorage
Persists: topics mastered, weak area history, total sessions, preferred difficulty
Difficulty is auto-inferred from quiz score history (avg ≥80% → advanced, ≥60% → intermediate)


Tools Deep Dive
generate_quiz
Returns a structured JSON quiz (questions only — correct answers are hidden from the student until submission). The frontend renders it as an interactive QuizCard component.
grade_quiz
Called after the student submits answers via the UI. Computes a percentage score and returns per-question corrections with explanations. Topics scoring below 60% are flagged as weak areas.
fetch_topic_summary
Calls the Wikipedia REST API (no key needed) before any explanation, grounding the agent's response in real facts. Falls back to an OpenSearch query if the exact title isn't found.
track_study_progress
Records study activity into LangGraph state. The stateUpdaterNode parses these calls and updates topics_studied, quiz_scores, and weak_areas.
get_study_recommendations
Generates a personalised study plan using the session's tracked topics and weak areas. Triggered when users ask "what should I study next?" or "how am I doing?".

Prompt Engineering
The system prompt is dynamically built each turn, injecting:

Current session context (topics_studied, weak_areas)
Long-term memory (topics_mastered, weak_areas_history, preferred_difficulty, total_sessions)
Explicit tool-use instructions and the quiz flow (generate → student answers → grade → track)
Ethical guardrails (academic honesty, encouraging tone, age-appropriate content)

This ensures the agent adapts its tone and recommendations to each user's history without manual prompt changes.

Evaluation & Testing
Manual demo flow

"Explain photosynthesis to me" → agent calls fetch_topic_summary → explains → calls track_study_progress → topic appears in dashboard
"Quiz me on photosynthesis" → generate_quiz → interactive QuizCard renders in chat
Submit answers → grade_quiz → score + corrections displayed → track_study_progress updates state
"What should I study next?" → get_study_recommendations → personalised plan
Reload page (new session) → agent references previously mastered topics from long-term memory

Verification checklist
CheckExpected resultWikipedia groundingAgent fetches summary before explaining; unknown topics fall back gracefullyQuiz answer hidingCorrect answers not visible in quizData until after submissionScore thresholdsScore <60% → struggled: true → topic appears in "Needs Review" panelLong-term persistenceAfter reload, topics_mastered and preferred_difficulty carry forwardCost trackingToken counts and USD estimates update after each responseModel switchingChanging model in dropdown affects the next requestInput validationEmpty or missing message/threadId returns a 400 error

Deployment (Vercel)
bashnpm install -g vercel
vercel
Add OPENAI_API_KEY in the Vercel dashboard under Settings → Environment Variables.

⚠️ Note: The file-based long-term memory (lib/memory.js) does not persist on Vercel's serverless functions. For production, replace it with a database such as Vercel KV, Supabase, or MongoDB Atlas.


Technologies Used
TechnologyPurposeNext.js 14 (App Router)Frontend + API routesLangChainLLM abstractions, tool definitionsLangGraphAgent graph, state management, checkpointingOpenAI GPT-4o / Mini / 3.5Language modelsWikipedia REST APIFree factual grounding (no key needed)ZodTool schema validationTailwind CSSStyling

Ethical Considerations
See ETHICS.md for a full discussion. Key points:

API keys are stored server-side and never exposed to the browser
User IDs are randomly generated — no personal data is collected
Long-term memory is stored locally by default — never sent to third parties
The agent is prompted to be encouraging and academically honest
Input length is validated server-side; .study-memory/ filenames are sanitised to prevent path traversal


Built as part of the AI Engineering Capstone — Sprint 3 · by Joan Adoc