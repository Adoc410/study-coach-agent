import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Subject inference (mirrors ProgressDashboard logic) ──────────────────────
const SUBJECT_KEYWORDS = {
  "Mathematics":      ["math","algebra","geometry","calculus","trigonometry","statistics","arithmetic","number","equation","fraction","probability","quadratic","polynomial","logarithm"],
  "Biology":          ["biology","cell","photosynthesis","respiration","genetics","dna","ecosystem","evolution","organism","mitosis","meiosis","enzyme","digestion","reproduction","osmosis"],
  "Chemistry":        ["chemistry","atom","molecule","periodic","element","reaction","acid","base","bond","compound","oxidation","electrolysis","titration","mole","solubility"],
  "Physics":          ["physics","force","motion","energy","wave","light","electricity","magnetism","gravity","newton","velocity","acceleration","momentum","optics","thermodynamics"],
  "History":          ["history","war","revolution","independence","colonialism","empire","treaty","ancient","medieval","civilization","democracy","constitution","president","kingdom"],
  "Geography":        ["geography","map","climate","weather","population","migration","continent","ocean","river","mountain","erosion","urbanisation","vegetation","latitude","longitude"],
  "English":          ["english","grammar","essay","poem","novel","shakespeare","vocabulary","comprehension","literature","tense","clause","narrative","metaphor","simile"],
  "Computer Science": ["computer","programming","algorithm","software","hardware","database","network","internet","python","javascript","binary","cpu","operating system"],
  "Economics":        ["economics","supply","demand","market","inflation","gdp","trade","budget","fiscal","monetary","microeconomics","macroeconomics","elasticity"],
  "CRE":              ["cre","christian","bible","gospel","faith","church","religion","god","jesus","prayer","commandment","sacrament"],
  "Agriculture":      ["agriculture","farming","crop","soil","irrigation","fertiliser","livestock","pest","harvest","plant","seed","agroforestry"],
};

function inferSubject(topic = "") {
  const lower = topic.toLowerCase();
  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return subject;
  }
  return "General";
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { topic, difficulty = "intermediate", num_questions = 5, subject = "" } = body;

    if (!topic || typeof topic !== "string") {
      return Response.json({ error: "topic is required" }, { status: 400 });
    }

    const count = Math.min(Math.max(parseInt(num_questions) || 5, 1), 50);

    // Resolve subject — use explicitly passed subject, or infer from topic
    const resolvedSubject = subject || inferSubject(topic);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "You are a quiz generator. You ONLY output valid JSON. Never output any text outside the JSON object.",
        },
        {
          role: "user",
          content: `Generate a ${count}-question multiple choice quiz about "${topic}" at ${difficulty} difficulty.

Return ONLY this JSON structure:
{
  "topic": "${topic}",
  "subject": "${resolvedSubject}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct_answer": "B",
      "explanation": "Why B is correct."
    }
  ]
}

Rules: exactly ${count} questions, 4 options each (A/B/C/D), one correct answer, explanations 1-2 sentences.`,
        },
      ],
    });

    const quizData = JSON.parse(response.choices[0].message.content);

    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      throw new Error("LLM returned invalid quiz structure");
    }

    // Strip answers from questions sent to the student
    const questionsForStudent = quizData.questions.map((q) => ({
      id:       q.id,
      question: q.question,
      options:  q.options,
    }));

    // Answer key kept separate
    const answerKey = quizData.questions.map((q) => ({
      id:             q.id,
      question:       q.question,
      correct_answer: q.correct_answer,
      explanation:    q.explanation,
    }));

    return Response.json({
      topic:      quizData.topic,
      subject:    quizData.subject || resolvedSubject,
      difficulty: quizData.difficulty,
      questions:  questionsForStudent,
      answerKey,
    });

  } catch (error) {
    console.error("[Quiz Generation Error]", error);
    return Response.json(
      {
        error:  "Failed to generate quiz. Please try again.",
        detail: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}