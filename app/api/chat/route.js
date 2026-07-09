import { HumanMessage } from "@langchain/core/messages";
import { buildStudyAgent, SUPPORTED_MODELS } from "@/app/lib/agent";
import { loadUserMemory, mergeSessionToLongTermMemory } from "@/app/lib/memory";
import {
  wrapMessageWithLanguage,
  getQuizReadyMessage,
  getErrorMessage,
  LANGUAGE_CODES,
  DEFAULT_LANGUAGE,
} from "@/app/lib/languageManager";

export async function POST(request) {
  try {
    // ── 1. Parse and validate request ─────────────────────────────────────────
    const body = await request.json();
    const {
      message, threadId, userId, modelName, language,
      // Module toggles from frontend settings
      quizEnabled           = true,
      explanationsEnabled   = true,
      recommendationsEnabled= true,
      progressEnabled       = true,
      socraticMode          = false,
      difficulty            = "intermediate",
      preferredName         = "",
    } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return Response.json(
        { error: "Message is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    if (!threadId || typeof threadId !== "string") {
      return Response.json(
        { error: "threadId is required to maintain session memory." },
        { status: 400 }
      );
    }

    // ── 2. Validate and resolve active language ───────────────────────────────
    const activeLang = LANGUAGE_CODES.includes(language)
      ? language
      : DEFAULT_LANGUAGE;

    // ── 3. Load long-term memory ──────────────────────────────────────────────
    const safeUserId = userId || threadId;
    const userMemory = loadUserMemory(safeUserId);

    // ── 4. Build module instructions ──────────────────────────────────────────
    // These are injected into the system prompt so the AI respects the toggles
    const moduleInstructions = buildModuleInstructions({
      quizEnabled,
      explanationsEnabled,
      recommendationsEnabled,
      progressEnabled,
      socraticMode,
      difficulty,
      preferredName,
      lang: activeLang,
    });

    // ── 5. Build agent ────────────────────────────────────────────────────────
    const agent = buildStudyAgent(userMemory, moduleInstructions);
    const selectedModel =
      modelName && SUPPORTED_MODELS[modelName] ? modelName : "gpt-4o";

    // ── 6. Wrap the message with language enforcement ─────────────────────────
    const wrappedMessage = wrapMessageWithLanguage(message.trim(), activeLang);

    // ── 7. Invoke the agent ───────────────────────────────────────────────────
    const result = await agent.invoke(
      {
        messages: [new HumanMessage(wrappedMessage)],
        current_model: selectedModel,
        language: activeLang,
      },
      {
        configurable: { thread_id: threadId },
      }
    );

    // ── 8. Extract the final response ─────────────────────────────────────────
    const allMessages = result.messages;
    const lastMessage = allMessages[allMessages.length - 1];
    let responseText =
      typeof lastMessage?.content === "string"
        ? lastMessage.content
        : lastMessage?.content?.[0]?.text ??
          getErrorMessage(activeLang, "general");

    // ── 9. Detect quiz JSON ───────────────────────────────────────────────────
    let quizData = null;
    const jsonMatch = responseText.match(/\{[\s\S]*"questions"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.questions && Array.isArray(parsed.questions)) {
          quizData = parsed;
          responseText = getQuizReadyMessage(
            activeLang,
            parsed.topic,
            parsed.questions.length
          );
        }
      } catch {
        // Not valid JSON — leave responseText as-is
      }
    }

    // ── 10. Build session state ───────────────────────────────────────────────
    const updatedSessionState = {
      topics_studied: result.topics_studied ?? [],
      quiz_scores:    result.quiz_scores    ?? {},
      weak_areas:     result.weak_areas     ?? [],
    };

    // ── 11. Merge into long-term memory ───────────────────────────────────────
    const updatedLongTermMemory = mergeSessionToLongTermMemory(
      safeUserId,
      updatedSessionState
    );

    // ── 12. Token usage + cost ────────────────────────────────────────────────
    const usageMeta = lastMessage?.usage_metadata;
    const MODEL_PRICING = {
      "gpt-4o":       { input: 5,    output: 15  },
      "gpt-4o-mini":  { input: 0.15, output: 0.6 },
      "gpt-3.5-turbo":{ input: 0.5,  output: 1.5 },
    };
    const pricing = MODEL_PRICING[selectedModel] ?? MODEL_PRICING["gpt-4o"];
    const tokenUsage = usageMeta
      ? {
          input_tokens:      usageMeta.input_tokens  ?? 0,
          output_tokens:     usageMeta.output_tokens ?? 0,
          total_tokens:      usageMeta.total_tokens  ?? 0,
          estimated_cost_usd:(
            ((usageMeta.input_tokens  ?? 0) / 1_000_000) * pricing.input +
            ((usageMeta.output_tokens ?? 0) / 1_000_000) * pricing.output
          ).toFixed(6),
          model: selectedModel,
        }
      : null;

    // ── 13. Return response ───────────────────────────────────────────────────
    return Response.json({
      response: responseText,
      quizData,
      activeLang,
      sessionState: updatedSessionState,
      longTermMemory: {
        topics_mastered:      updatedLongTermMemory.topics_mastered,
        total_sessions:       updatedLongTermMemory.total_sessions,
        preferred_difficulty: updatedLongTermMemory.preferred_difficulty,
      },
      tokenUsage,
    });

  } catch (error) {
    console.error("[Study Agent Error]", error);

    let activeLang = DEFAULT_LANGUAGE;
    try {
      const body = await request.clone().json().catch(() => ({}));
      activeLang = LANGUAGE_CODES.includes(body.language)
        ? body.language
        : DEFAULT_LANGUAGE;
    } catch {}

    let userMessage = getErrorMessage(activeLang, "general");
    if (error.message?.includes("API key"))    userMessage = getErrorMessage(activeLang, "apiKey");
    if (error.message?.includes("rate limit")) userMessage = getErrorMessage(activeLang, "general");
    if (error.message?.includes("quota"))      userMessage = getErrorMessage(activeLang, "general");

    return Response.json(
      {
        error: userMessage,
        detail: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ─── Build module instruction string for the system prompt ───────────────────
function buildModuleInstructions({
  quizEnabled, explanationsEnabled, recommendationsEnabled,
  progressEnabled, socraticMode, difficulty, preferredName, lang,
}) {
  const lines = [];

  lines.push("## Active Module Settings (MUST follow these strictly)");

  if (!quizEnabled) {
    lines.push("- QUIZ MODE IS OFF: Do NOT generate quizzes under any circumstances. If the student asks for a quiz, politely explain that quizzes are currently disabled and suggest they enable Quiz Mode in settings.");
  } else {
    lines.push("- Quiz Mode: ON — generate quizzes when requested.");
  }

  if (!explanationsEnabled) {
    lines.push("- TOPIC EXPLANATIONS ARE OFF: Do not fetch Wikipedia summaries or give detailed topic explanations. Give only brief, direct answers.");
  } else {
    lines.push("- Topic Explanations: ON — fetch Wikipedia summaries and explain topics in detail.");
  }

  if (!recommendationsEnabled) {
    lines.push("- STUDY RECOMMENDATIONS ARE OFF: Do not suggest what to study next or give study plans.");
  } else {
    lines.push("- Study Recommendations: ON — proactively suggest next topics and study plans.");
  }

  if (!progressEnabled) {
    lines.push("- PROGRESS TRACKING IS OFF: Do not call track_study_progress tool.");
  } else {
    lines.push("- Progress Tracking: ON — always call track_study_progress after explaining a topic or grading a quiz.");
  }

  if (socraticMode) {
    lines.push("- SOCRATIC MODE IS ON: NEVER give direct answers. Instead, guide the student to the answer through thoughtful questions. Ask one question at a time. Only confirm when the student reaches the correct answer themselves.");
  } else {
    lines.push("- Socratic Mode: OFF — give clear, direct answers and explanations.");
  }

  lines.push(`- Difficulty level: ${difficulty}`);

  if (preferredName?.trim()) {
    lines.push(`- Address the student as: "${preferredName.trim()}"`);
  }

  return lines.join("\n");
}