/**
 * Adaptive Learning Engine
 * Tracks performance over time and adjusts difficulty automatically
 */

// In-memory adaptive profiles: userId -> profile
const adaptiveProfiles = new Map();

const DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced"];

function getProfile(userId) {
  if (!adaptiveProfiles.has(userId)) {
    adaptiveProfiles.set(userId, {
      userId,
      topicHistory: {}, // topic -> [{ score, difficulty, timestamp }]
      sessionCount: 0,
      totalQuestionsAttempted: 0,
      totalCorrect: 0,
      weakTopics: [],
      strongTopics: [],
      recommendedDifficulty: "beginner",
      lastUpdated: new Date().toISOString(),
    });
  }
  return adaptiveProfiles.get(userId);
}

// Record a quiz result and update adaptive profile
export function recordQuizResult(userId, topic, score, difficulty, numQuestions) {
  const profile = getProfile(userId);
  const correct = Math.round((score / 100) * numQuestions);

  if (!profile.topicHistory[topic]) {
    profile.topicHistory[topic] = [];
  }

  profile.topicHistory[topic].push({
    score,
    difficulty,
    correct,
    total: numQuestions,
    timestamp: new Date().toISOString(),
  });

  profile.totalQuestionsAttempted += numQuestions;
  profile.totalCorrect += correct;

  // Update weak/strong topics
  const topicScores = profile.topicHistory[topic];
  const avgScore = topicScores.reduce((s, r) => s + r.score, 0) / topicScores.length;

  if (avgScore < 60 && !profile.weakTopics.includes(topic)) {
    profile.weakTopics.push(topic);
    profile.strongTopics = profile.strongTopics.filter(t => t !== topic);
  } else if (avgScore >= 80) {
    profile.strongTopics.push(topic);
    profile.weakTopics = profile.weakTopics.filter(t => t !== topic);
    profile.strongTopics = [...new Set(profile.strongTopics)];
  }

  // Recalculate recommended difficulty
  const overallAvg = profile.totalCorrect / profile.totalQuestionsAttempted * 100;
  if (overallAvg >= 80) profile.recommendedDifficulty = "advanced";
  else if (overallAvg >= 60) profile.recommendedDifficulty = "intermediate";
  else profile.recommendedDifficulty = "beginner";

  profile.lastUpdated = new Date().toISOString();
  return profile;
}

// Get recommended difficulty for a topic
export function getRecommendedDifficulty(userId, topic) {
  const profile = getProfile(userId);

  // If we have history for this specific topic, use it
  if (profile.topicHistory[topic]?.length > 0) {
    const recent = profile.topicHistory[topic].slice(-3);
    const avgScore = recent.reduce((s, r) => s + r.score, 0) / recent.length;
    const currentDifficulty = recent[recent.length - 1].difficulty;
    const currentIdx = DIFFICULTY_LEVELS.indexOf(currentDifficulty);

    if (avgScore >= 80 && currentIdx < 2) {
      return DIFFICULTY_LEVELS[currentIdx + 1]; // Level up
    } else if (avgScore < 50 && currentIdx > 0) {
      return DIFFICULTY_LEVELS[currentIdx - 1]; // Level down
    }
    return currentDifficulty;
  }

  return profile.recommendedDifficulty;
}

// Get full adaptive profile
export function getAdaptiveProfile(userId) {
  return getProfile(userId);
}

// Get topic-specific analytics
export function getTopicAnalytics(userId, topic) {
  const profile = getProfile(userId);
  const history = profile.topicHistory[topic] || [];

  if (history.length === 0) return null;

  const scores = history.map(h => h.score);
  const avg = scores.reduce((s, n) => s + n, 0) / scores.length;
  const trend = history.length > 1
    ? scores[scores.length - 1] - scores[0]
    : 0;

  return {
    attempts: history.length,
    averageScore: Math.round(avg),
    bestScore: Math.max(...scores),
    latestScore: scores[scores.length - 1],
    trend: trend > 0 ? "improving" : trend < 0 ? "declining" : "stable",
    recommendedDifficulty: getRecommendedDifficulty(userId, topic),
  };
}

// Calculate exam readiness (0-100)
export function calculateExamReadiness(userId, topics = []) {
  const profile = getProfile(userId);

  if (topics.length === 0) {
    // Use all studied topics
    topics = Object.keys(profile.topicHistory);
  }

  if (topics.length === 0) return 0;

  let totalScore = 0;
  let coveredTopics = 0;

  for (const topic of topics) {
    const analytics = getTopicAnalytics(userId, topic);
    if (analytics) {
      totalScore += analytics.averageScore;
      coveredTopics++;
    }
  }

  const coverageScore = (coveredTopics / topics.length) * 100;
  const performanceScore = coveredTopics > 0 ? totalScore / coveredTopics : 0;

  return Math.round((coverageScore * 0.3) + (performanceScore * 0.7));
}