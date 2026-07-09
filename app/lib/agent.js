import { StateGraph, END, START } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { SystemMessage } from "@langchain/core/messages";
import { StudyAgentState } from "./state.js";
import { shortTermMemory } from "./memory.js";
import { ALL_TOOLS } from "./tools.js";
import { buildLanguageSystemPrompt } from "./languageManager.js";

// ─── Supported models ─────────────────────────────────────────────────────────
export const SUPPORTED_MODELS = {
  "gpt-4o":       { label: "GPT-4o (Best)",         provider: "openai" },
  "gpt-4o-mini":  { label: "GPT-4o Mini (Fast)",    provider: "openai" },
  "gpt-3.5-turbo":{ label: "GPT-3.5 Turbo (Cheap)", provider: "openai" },
};

// ─── System prompt ────────────────────────────────────────────────────────────
function buildSystemPrompt(state, userMemory, moduleInstructions) {
  const { topics_studied, weak_areas, language } = state;
  const {
    topics_mastered,
    weak_areas_history,
    preferred_difficulty,
    total_sessions,
  } = userMemory || {};

  const lang = language || "English";
  const languageDirective = buildLanguageSystemPrompt(lang);

  return `${languageDirective}You are an expert, encouraging Study Coach AI for Ugandan students. Your mission is to help students learn effectively through clear explanations, engaging quizzes, and personalised guidance.

${moduleInstructions || ""}

## Your Tools
- **generate_quiz**: Creates a structured JSON quiz (questions only, no answers shown to student)
- **grade_quiz**: Grades the quiz after the student submits all answers — computes score and explains corrections
- **fetch_topic_summary**: Fetches accurate Wikipedia info before explaining any topic
- **track_study_progress**: Call this after explaining a topic OR after grading a quiz (only if Progress Tracking is ON)
- **get_study_recommendations**: Use when student asks "what next?" or "how am I doing?" (only if Study Recommendations is ON)

## QUIZ GENERATION
- Only generate quizzes if Quiz Mode is ON (see module settings above)
- When quiz is requested and Quiz Mode is ON → call generate_quiz immediately
- Quiz questions, options, and explanations must be in the active language: ${lang}

### Quiz Flow:
1. Receive quiz request → call generate_quiz immediately
2. App displays questions interactively (student clicks answers in UI)
3. When student submits answers → call grade_quiz
4. After grading → call track_study_progress with the score (if Progress Tracking ON)
5. Give encouraging summary with corrections — in ${lang}

## Behaviour Guidelines
1. Always be encouraging — learning is hard, celebrate progress
2. Adapt complexity to the student's apparent level
3. If a student scores below 60%, mark struggled=true in track_study_progress
4. Follow ALL module settings strictly — they override default behaviour

## Current Session Context
- Topics studied this session: ${topics_studied?.length > 0 ? topics_studied.join(", ") : "none yet"}
- Struggling with: ${weak_areas?.length > 0 ? weak_areas.join(", ") : "nothing flagged yet"}

## Long-Term Memory (Across Sessions)
- Total sessions: ${total_sessions ?? 0}
- Topics previously mastered: ${topics_mastered?.length > 0 ? topics_mastered.join(", ") : "none yet"}
- Historical weak areas: ${weak_areas_history?.length > 0 ? weak_areas_history.join(", ") : "none"}
- Preferred difficulty: ${preferred_difficulty ?? "beginner"}

Use the long-term memory to personalise — reference past progress when relevant.`;
}

// ─── Node: Main agent (LLM reasoning) ────────────────────────────────────────
function createAgentNode(userMemory, moduleInstructions) {
  return async function agentNode(state) {
    const { messages, current_model, language } = state;

    const modelName =
      current_model && SUPPORTED_MODELS[current_model]
        ? current_model
        : "gpt-4o";

    const llm = new ChatOpenAI({
      modelName,
      temperature: 0.7,
      streaming: false,
    }).bindTools(ALL_TOOLS);

    const systemPrompt = buildSystemPrompt(state, userMemory, moduleInstructions);

    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      ...messages,
    ]);

    return { messages: [response] };
  };
}

// ─── Routing logic ────────────────────────────────────────────────────────────
function routeAfterAgent(state) {
  const { messages } = state;
  const last = messages[messages.length - 1];
  if (last?.tool_calls?.length > 0) return "tools";
  return END;
}

// ─── Build the agent graph ────────────────────────────────────────────────────
export function buildStudyAgent(userMemory, moduleInstructions = "") {
  const agentNode = createAgentNode(userMemory, moduleInstructions);
  const toolNode  = new ToolNode(ALL_TOOLS);

  const graph = new StateGraph(StudyAgentState)
    .addNode("agent", agentNode)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", routeAfterAgent, {
      tools: "tools",
      [END]: END,
    })
    .addEdge("tools", "agent");

  return graph.compile({ checkpointer: shortTermMemory });
}