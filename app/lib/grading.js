/**
 * Grading System — Uganda UNEB scale
 * Star-based rewards, grade boundaries, progress calculations
 */

export const GRADE_BOUNDARIES = [
  { grade: "A+", min: 90, stars: 5, color: "#f59e0b", label: "Distinction",  emoji: "🏆" },
  { grade: "A",  min: 80, stars: 4, color: "#f59e0b", label: "Excellent",    emoji: "⭐" },
  { grade: "B+", min: 70, stars: 3, color: "#22c55e", label: "Very Good",    emoji: "✅" },
  { grade: "B",  min: 60, stars: 3, color: "#22c55e", label: "Good",         emoji: "👍" },
  { grade: "C",  min: 50, stars: 2, color: "#3b82f6", label: "Credit",       emoji: "📘" },
  { grade: "D",  min: 40, stars: 1, color: "#f97316", label: "Pass",         emoji: "📗" },
  { grade: "E",  min: 30, stars: 0, color: "#94a3b8", label: "Borderline",   emoji: "⚠️"  },
  { grade: "F",  min: 0,  stars: 0, color: "#ef4444", label: "Failed",       emoji: "❌", failed: true },
];

export function getGrade(score) {
  for (const boundary of GRADE_BOUNDARIES) {
    if (score >= boundary.min) return boundary;
  }
  return GRADE_BOUNDARIES[GRADE_BOUNDARIES.length - 1];
}

export function hasPassed(score) {
  return score >= 40;
}

export function getWeekLabel(date = new Date()) {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return `Week of ${start.toLocaleDateString("en-UG", { month: "short", day: "numeric" })}`;
}

export function getMonthLabel(date = new Date()) {
  return date.toLocaleDateString("en-UG", { month: "long", year: "numeric" });
}

export function getTermLabel(date = new Date()) {
  const month = date.getMonth() + 1;
  if (month >= 2 && month <= 4) return `Term 1 ${date.getFullYear()}`;
  if (month >= 5 && month <= 8) return `Term 2 ${date.getFullYear()}`;
  return `Term 3 ${date.getFullYear()}`;
}

// ── Attempt counter (localStorage, resets every 24h) ─────────────────────────
const ATTEMPT_KEY = "sca_quiz_attempts";
const DAILY_LIMIT = 10;

export function getAttemptData() {
  if (typeof window === "undefined") return { count: 0, resetAt: null };
  try {
    const raw = localStorage.getItem(ATTEMPT_KEY);
    if (!raw) return { count: 0, resetAt: null };
    const data = JSON.parse(raw);
    if (data.resetAt && Date.now() > data.resetAt) {
      localStorage.removeItem(ATTEMPT_KEY);
      return { count: 0, resetAt: null };
    }
    return data;
  } catch {
    return { count: 0, resetAt: null };
  }
}

export function incrementAttempt() {
  if (typeof window === "undefined") return;
  const data = getAttemptData();
  const updated = {
    count: (data.count || 0) + 1,
    resetAt: data.resetAt || (Date.now() + 24 * 60 * 60 * 1000),
  };
  localStorage.setItem(ATTEMPT_KEY, JSON.stringify(updated));
  return updated;
}

export function getRemainingAttempts() {
  const { count } = getAttemptData();
  return Math.max(0, DAILY_LIMIT - count);
}

export function hasReachedLimit() {
  return getAttemptData().count >= DAILY_LIMIT;
}

export function aggregateProgress(records = []) {
  const buckets = { weekly: {}, monthly: {}, termly: {} };
  for (const r of records) {
    const d = new Date(r.date);
    const wk = getWeekLabel(d);
    const mo = getMonthLabel(d);
    const tm = getTermLabel(d);
    for (const [key, label] of [[wk, "weekly"], [mo, "monthly"], [tm, "termly"]]) {
      if (!buckets[label][key]) buckets[label][key] = { scores: [], topics: new Set() };
      buckets[label][key].scores.push(r.score);
      buckets[label][key].topics.add(r.topic);
    }
  }
  const flatten = (obj) =>
    Object.entries(obj).map(([period, v]) => ({
      period,
      avg: Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length),
      count: v.scores.length,
      topics: [...v.topics],
      grade: getGrade(Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length)),
    }));
  return {
    weekly:  flatten(buckets.weekly),
    monthly: flatten(buckets.monthly),
    termly:  flatten(buckets.termly),
  };
}

export function getCertificateEligibility(completedTopicIds, subjectTopics) {
  const completed = new Set(completedTopicIds);
  const byTerm = {};
  for (const topic of subjectTopics) {
    if (!byTerm[topic.term]) byTerm[topic.term] = { all: [], done: [] };
    byTerm[topic.term].all.push(topic.id);
    if (completed.has(topic.id)) byTerm[topic.term].done.push(topic.id);
  }
  const termCerts = Object.entries(byTerm)
    .filter(([, v]) => v.all.length > 0 && v.done.length === v.all.length)
    .map(([term]) => ({ type: "term", term: Number(term), label: `Term ${term}` }));
  const fullSyllabus = subjectTopics.length > 0 && subjectTopics.every((t) => completed.has(t.id));
  return {
    termCerts,
    fullSyllabusCert: fullSyllabus,
    topicCerts: [...completed].filter((id) => subjectTopics.find((t) => t.id === id)),
  };
}

// ── Prompt counter ────────────────────────────────────────────────────────────
const PROMPT_KEY = "sca_prompt_attempts";

export function getPromptData() {
  if (typeof window === "undefined") return { count: 0, resetAt: null };
  try {
    const raw = localStorage.getItem(PROMPT_KEY);
    if (!raw) return { count: 0, resetAt: null };
    const data = JSON.parse(raw);
    if (data.resetAt && Date.now() > data.resetAt) {
      localStorage.removeItem(PROMPT_KEY);
      return { count: 0, resetAt: null };
    }
    return data;
  } catch { return { count: 0, resetAt: null }; }
}

export function incrementPrompt() {
  if (typeof window === "undefined") return;
  const data = getPromptData();
  const updated = {
    count: (data.count || 0) + 1,
    resetAt: data.resetAt || (Date.now() + 24 * 60 * 60 * 1000),
  };
  localStorage.setItem(PROMPT_KEY, JSON.stringify(updated));
  return updated;
}

export function getRemainingPrompts() {
  const { count } = getPromptData();
  return Math.max(0, 10 - count);
}

export function hasReachedPromptLimit() {
  return getPromptData().count >= 10;
}