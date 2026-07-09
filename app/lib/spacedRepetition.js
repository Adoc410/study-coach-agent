/**
 * Spaced Repetition System (SRS)
 * Uses SM-2 algorithm — the same used by Anki
 * Intervals: 1 day → 3 days → 7 days → 21 days → 42 days
 */

// In-memory SRS store: userId -> { topic -> card }
const srsStore = new Map();

function getStore(userId) {
  if (!srsStore.has(userId)) srsStore.set(userId, {});
  return srsStore.get(userId);
}

// SM-2 algorithm: calculates next review interval
function sm2(quality, repetitions, easeFactor, interval) {
  // quality: 0-5 (0=blackout, 5=perfect)
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 3;
    else interval = Math.round(interval * easeFactor);
    repetitions++;
  }

  easeFactor = Math.max(1.3,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  return { repetitions, easeFactor, interval };
}

// Convert quiz score to SM-2 quality (0-5)
function scoreToQuality(score) {
  if (score >= 90) return 5;
  if (score >= 80) return 4;
  if (score >= 70) return 3;
  if (score >= 50) return 2;
  if (score >= 30) return 1;
  return 0;
}

// Add or update a topic in SRS
export function updateSRS(userId, topic, score) {
  const store = getStore(userId);
  const now = new Date();

  const existing = store[topic] || {
    topic,
    repetitions: 0,
    easeFactor: 2.5,
    interval: 1,
    lastReview: null,
    nextReview: null,
    history: [],
  };

  const quality = scoreToQuality(score);
  const { repetitions, easeFactor, interval } = sm2(
    quality,
    existing.repetitions,
    existing.easeFactor,
    existing.interval
  );

  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + interval);

  store[topic] = {
    ...existing,
    repetitions,
    easeFactor: Math.round(easeFactor * 100) / 100,
    interval,
    lastReview: now.toISOString(),
    nextReview: nextReview.toISOString(),
    history: [
      ...existing.history,
      { score, quality, date: now.toISOString() },
    ].slice(-10), // Keep last 10
  };

  return store[topic];
}

// Get topics due for review today
export function getDueTopics(userId) {
  const store = getStore(userId);
  const now = new Date();

  return Object.values(store)
    .filter(card => card.nextReview && new Date(card.nextReview) <= now)
    .sort((a, b) => new Date(a.nextReview) - new Date(b.nextReview));
}

// Get upcoming reviews (next 7 days)
export function getUpcomingReviews(userId) {
  const store = getStore(userId);
  const now = new Date();
  const week = new Date(now);
  week.setDate(week.getDate() + 7);

  return Object.values(store)
    .filter(card => {
      const next = card.nextReview ? new Date(card.nextReview) : null;
      return next && next > now && next <= week;
    })
    .sort((a, b) => new Date(a.nextReview) - new Date(b.nextReview))
    .map(card => ({
      topic: card.topic,
      nextReview: card.nextReview,
      daysUntil: Math.ceil((new Date(card.nextReview) - now) / (1000 * 60 * 60 * 24)),
      interval: card.interval,
    }));
}

// Get all SRS cards for a user
export function getAllCards(userId) {
  return Object.values(getStore(userId));
}

// Format due date nicely
export function formatDueDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

  if (diff <= 0) return "Due now!";
  if (diff === 1) return "Due tomorrow";
  if (diff <= 7) return `Due in ${diff} days`;
  return `Due ${date.toLocaleDateString()}`;
}