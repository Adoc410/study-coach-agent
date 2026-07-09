import { Annotation } from "@langchain/langgraph";
import { messagesStateReducer } from "@langchain/langgraph";

export const StudyAgentState = Annotation.Root({
  // Full conversation history
  messages: Annotation({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  // Topics studied this session (deduped)
  topics_studied: Annotation({
    reducer: (current = [], update = []) => {
      const combined = [...current, ...update];
      const seen = new Set();
      return combined.filter((t) => {
        const key = t.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    default: () => [],
  }),

  // Quiz scores per topic
  quiz_scores: Annotation({
    reducer: (current = {}, update = {}) => ({ ...current, ...update }),
    default: () => ({}),
  }),

  // Weak areas (deduped)
  weak_areas: Annotation({
    reducer: (current = [], update = []) => [...new Set([...current, ...update])],
    default: () => [],
  }),

  // Selected model
  current_model: Annotation({
    reducer: (_, update) => update,
    default: () => "gpt-4o",
  }),

  // Response language
  language: Annotation({
    reducer: (_, update) => update,
    default: () => "English",
  }),
});