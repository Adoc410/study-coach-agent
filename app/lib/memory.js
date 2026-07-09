/**
 * memory.js
 *
 * Manages both short-term and long-term memory for the Study Coach agent.
 *
 * SHORT-TERM: MemorySaver (in-memory checkpointer)
 *   - Persists state within a single server session
 *   - Tied to thread_id — same thread = same memory
 *   - Resets when the server restarts
 *
 * LONG-TERM: File-based JSON store
 *   - Persists user profiles across server restarts
 *   - Stores: topics mastered, weak areas, total sessions, preferred difficulty
 *   - Keyed by userId (passed from the frontend)
 */

import { MemorySaver } from "@langchain/langgraph";
import fs from "fs";
import path from "path";

// ─── Short-term memory (in-process checkpointer) ──────────────────────────────
// One shared instance across the whole app
export const shortTermMemory = new MemorySaver();

// ─── Long-term memory (file-based JSON store) ─────────────────────────────────
const MEMORY_DIR = path.join(process.cwd(), ".study-memory");

function ensureMemoryDir() {
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  }
}

function getUserMemoryPath(userId) {
  // Sanitise userId to prevent path traversal
  const safe = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(MEMORY_DIR, `${safe}.json`);
}

/**
 * Load a user's long-term memory profile.
 * Returns a default profile if none exists yet.
 */
export function loadUserMemory(userId) {
  ensureMemoryDir();
  const filePath = getUserMemoryPath(userId);

  if (!fs.existsSync(filePath)) {
    return createDefaultProfile(userId);
  }

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return createDefaultProfile(userId);
  }
}

/**
 * Save/update a user's long-term memory profile.
 */
export function saveUserMemory(userId, updates) {
  ensureMemoryDir();
  const filePath = getUserMemoryPath(userId);
  const current = loadUserMemory(userId);

  const updated = {
    ...current,
    ...updates,
    // Merge arrays intelligently
    topics_mastered: dedupeArray([
      ...(current.topics_mastered || []),
      ...(updates.topics_mastered || []),
    ]),
    weak_areas_history: dedupeArray([
      ...(current.weak_areas_history || []),
      ...(updates.weak_areas_history || []),
    ]),
    last_session: new Date().toISOString(),
    total_sessions: (current.total_sessions || 0) + 1,
  };

  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf-8");
  return updated;
}

/**
 * Merge session results into long-term memory at the end of a session.
 */
export function mergeSessionToLongTermMemory(userId, sessionState) {
  const { topics_studied, quiz_scores, weak_areas } = sessionState;

  // Topics with score >= 70% are considered "mastered"
  const mastered = Object.entries(quiz_scores || {})
    .filter(([, score]) => score >= 70)
    .map(([topic]) => topic);

  return saveUserMemory(userId, {
    topics_mastered: mastered,
    weak_areas_history: weak_areas || [],
    last_quiz_scores: quiz_scores || {},
    preferred_difficulty: inferPreferredDifficulty(quiz_scores || {}),
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createDefaultProfile(userId) {
  return {
    userId,
    created_at: new Date().toISOString(),
    last_session: null,
    total_sessions: 0,
    topics_mastered: [],
    weak_areas_history: [],
    last_quiz_scores: {},
    preferred_difficulty: "beginner",
  };
}

function dedupeArray(arr) {
  return [...new Set(arr.map((s) => s.toLowerCase()))].map(
    (s) => s.charAt(0).toUpperCase() + s.slice(1)
  );
}

function inferPreferredDifficulty(quizScores) {
  const scores = Object.values(quizScores);
  if (scores.length === 0) return "beginner";
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avg >= 80) return "advanced";
  if (avg >= 60) return "intermediate";
  return "beginner";
}
