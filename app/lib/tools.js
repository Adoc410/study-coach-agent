import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const generateQuiz = tool(
  async ({ topic, difficulty, num_questions }) => {
    return JSON.stringify({
      __action: "GENERATE_QUIZ",
      topic,
      difficulty: difficulty ?? "intermediate",
      num_questions: num_questions ?? 5,
    });
  },
  {
    name: "generate_quiz",
    description: "Signals that a quiz should be generated. Use when the user asks to be tested or quizzed.",
    schema: z.object({
      topic: z.string().describe("The topic to quiz the student on"),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional().nullable(),
      num_questions: z.number().min(1).max(50).optional().nullable(),
    }),
  }
);

export const gradeQuiz = tool(
  async ({ topic, questions_with_answers }) => {
    let correct = 0;
    const results = questions_with_answers.map((q) => {
      const isCorrect = q.student_answer?.toUpperCase() === q.correct_answer?.toUpperCase();
      if (isCorrect) correct++;
      return { id: q.id, question: q.question, student_answer: q.student_answer, correct_answer: q.correct_answer, is_correct: isCorrect, explanation: q.explanation };
    });
    const total = questions_with_answers.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    return JSON.stringify({ topic, score, correct, total, results, passed: score >= 60 });
  },
  {
    name: "grade_quiz",
    description: "Grades a completed quiz after the student submits answers.",
    schema: z.object({
      topic: z.string(),
      questions_with_answers: z.array(z.object({
        id: z.number(),
        question: z.string(),
        student_answer: z.string(),
        correct_answer: z.string(),
        explanation: z.string(),
      })),
    }),
  }
);

export const generateImage = tool(
  async ({ prompt, topic, dimension }) => {
    return JSON.stringify({
      __action: "GENERATE_IMAGE",
      prompt,
      topic: topic ?? prompt,
      dimension: dimension ?? "2D",
    });
  },
  {
    name: "generate_image",
    description: "Generates a labeled educational diagram or illustration. Use when the student asks to see, visualize, illustrate, or get an image.",
    schema: z.object({
      prompt: z.string().describe("Detailed description of what to illustrate"),
      topic: z.string().optional().nullable(),
      dimension: z.enum(["1D", "2D", "3D"]).optional().nullable(),
    }),
  }
);

export const fetchTopicSummary = tool(
  async ({ topic }) => {
    try {
      const encoded = encodeURIComponent(topic.trim());
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
      const res = await fetch(url, { headers: { "User-Agent": "StudyCoachAgent/1.0" } });
      if (!res.ok) {
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encoded}&limit=1&format=json&origin=*`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        if (searchData[1]?.length > 0) {
          const firstResult = encodeURIComponent(searchData[1][0]);
          const fallbackRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${firstResult}`, { headers: { "User-Agent": "StudyCoachAgent/1.0" } });
          if (fallbackRes.ok) {
            const d = await fallbackRes.json();
            return JSON.stringify({ title: d.title, summary: d.extract, url: d.content_urls?.desktop?.page });
          }
        }
        return JSON.stringify({ error: true, message: `No Wikipedia article found for "${topic}".` });
      }
      const data = await res.json();
      return JSON.stringify({ title: data.title, summary: data.extract, url: data.content_urls?.desktop?.page });
    } catch (err) {
      return JSON.stringify({ error: true, message: "Wikipedia lookup failed." });
    }
  },
  {
    name: "fetch_topic_summary",
    description: "Fetches a factual Wikipedia summary for a topic before explaining it.",
    schema: z.object({ topic: z.string() }),
  }
);

export const trackStudyProgress = tool(
  async ({ topic, quiz_score, struggled, activity_type }) => {
    return JSON.stringify({
      tracked: true, topic,
      quiz_score: quiz_score ?? null,
      struggled: struggled ?? false,
      activity_type: activity_type ?? "study",
      timestamp: new Date().toISOString(),
    });
  },
  {
    name: "track_study_progress",
    description: "Records a topic the user studied or was quizzed on. Always call after explaining a topic or grading a quiz.",
    schema: z.object({
      topic: z.string(),
      quiz_score: z.number().min(0).max(100).optional().nullable(),
      struggled: z.boolean().optional().nullable(),
      activity_type: z.enum(["study", "quiz", "review"]).optional().nullable(),
    }),
  }
);

export const getStudyRecommendations = tool(
  async ({ topics_studied, weak_areas, goal }) => {
    return JSON.stringify({
      action: "recommend", topics_studied, weak_areas,
      goal: goal ?? "general improvement",
      instruction: `Based on this student's session:
- Topics studied: ${topics_studied.join(", ") || "none yet"}
- Weak areas: ${weak_areas.join(", ") || "none identified"}
- Goal: ${goal ?? "general improvement"}
Provide: 1) What to review first 2) What to study next 3) Suggested approach 4) Encouraging message`,
    });
  },
  {
    name: "get_study_recommendations",
    description: "Generates personalised study recommendations. Use when student asks 'what should I study next?' or 'how am I doing?'",
    schema: z.object({
      topics_studied: z.array(z.string()),
      weak_areas: z.array(z.string()),
      goal: z.string().optional().nullable(),
    }),
  }
);

export const queryUgandaEducation = tool(
  async ({ query, subject, level }) => {
    return JSON.stringify({
      __action: "QUERY_UGANDA",
      query,
      subject: subject ?? null,
      level: level ?? null,
    });
  },
  {
    name: "query_uganda_education",
    description: "Fetches information from official Uganda education sources: UNEB (past papers, marking guides, PLE/UCE/UACE exams), NCDC (official syllabi), and MoES (education policy). Use when student asks about Uganda curriculum, national exams, past papers, marking schemes, or O-Level/A-Level topics.",
    schema: z.object({
      query: z.string().describe("The specific question about Uganda education"),
      subject: z.string().optional().nullable().describe("Subject e.g. Mathematics, Biology"),
      level: z.string().optional().nullable().describe("Level: PLE, UCE, or UACE"),
    }),
  }
);

export const ALL_TOOLS = [
  generateQuiz,
  gradeQuiz,
  generateImage,
  fetchTopicSummary,
  trackStudyProgress,
  getStudyRecommendations,
  queryUgandaEducation,
];