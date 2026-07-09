/**
 * userStorage.js
 * Drop-in helpers that namespace ALL student data under their email.
 * Import these in page.js to replace direct localStorage calls.
 *
 * Usage:
 *   import { getUserChats, saveUserChats, getUserThreadId, setUserThreadId } from "../lib/userStorage";
 */

// ─── Per-user key helper ──────────────────────────────────────────────────────
export function userKey(email, suffix) {
  return `sca_u_${btoa(email.toLowerCase().trim())}_${suffix}`;
}

// ─── Chat history ─────────────────────────────────────────────────────────────
export function getUserChats(email) {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(userKey(email, "chats")) || "[]"); } catch { return []; }
}

export function saveUserChats(email, chats) {
  if (typeof window === "undefined") return;
  localStorage.setItem(userKey(email, "chats"), JSON.stringify(chats));
}

// ─── Progress records ─────────────────────────────────────────────────────────
export function getUserProgress(email) {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(userKey(email, "progress")) || "[]"); } catch { return []; }
}

export function saveUserProgress(email, records) {
  if (typeof window === "undefined") return;
  localStorage.setItem(userKey(email, "progress"), JSON.stringify(records));
}

export function appendUserProgress(email, record) {
  const existing = getUserProgress(email);
  existing.push(record);
  saveUserProgress(email, existing.slice(-500));
  window.dispatchEvent(new Event("sca_progress_updated"));
}

export function clearUserProgress(email) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(userKey(email, "progress"));
  window.dispatchEvent(new Event("sca_progress_updated"));
}

// ─── Quiz attempts (daily limit) ──────────────────────────────────────────────
export function getUserAttemptData(email) {
  if (typeof window === "undefined") return { count: 0, resetAt: null };
  try {
    const raw = localStorage.getItem(userKey(email, "attempts"));
    if (!raw) return { count: 0, resetAt: null };
    const data = JSON.parse(raw);
    if (data.resetAt && Date.now() > data.resetAt) {
      localStorage.removeItem(userKey(email, "attempts"));
      return { count: 0, resetAt: null };
    }
    return data;
  } catch { return { count: 0, resetAt: null }; }
}

export function incrementUserAttempt(email) {
  const data = getUserAttemptData(email);
  const updated = {
    count: (data.count || 0) + 1,
    resetAt: data.resetAt || (Date.now() + 24 * 60 * 60 * 1000),
  };
  localStorage.setItem(userKey(email, "attempts"), JSON.stringify(updated));
  return updated;
}

export function getUserRemainingAttempts(email) {
  const { count } = getUserAttemptData(email);
  return Math.max(0, 10 - count);
}

// ─── Thread ID (per user per session) ────────────────────────────────────────
export function getUserThreadId(email) {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(userKey(email, "thread")) || "";
}

export function setUserThreadId(email, threadId) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(userKey(email, "thread"), threadId);
}

export function clearUserThreadId(email) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(userKey(email, "thread"));
}

// ─── Delete ALL data for a user (self-service account deletion) ───────────────
export function deleteAllUserData(email) {
  if (typeof window === "undefined") return;
  const prefix = `sca_u_${btoa(email.toLowerCase().trim())}_`;
  const keysToDelete = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) keysToDelete.push(k);
  }
  keysToDelete.forEach(k => localStorage.removeItem(k));
}