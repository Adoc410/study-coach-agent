/**
 * Uganda Education Sources
 * Fetches content from UNEB, NCDC, and MoES
 */

import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Official Uganda education sources
export const UGANDA_SOURCES = {
  UNEB: {
    name: "Uganda National Examinations Board",
    url: "https://www.uneb.ac.ug",
    description: "Sets all national exams: PLE, UCE, UACE. Past papers and marking guides.",
    searchUrl: "https://www.uneb.ac.ug",
    pastPapersUrl: "https://www.uneb.ac.ug/index.php/past-papers",
  },
  NCDC: {
    name: "National Curriculum Development Centre",
    url: "https://www.ncdc.go.ug",
    description: "Official syllabi for Primary, O-Level, A-Level",
    searchUrl: "https://www.ncdc.go.ug",
  },
  MOES: {
    name: "Ministry of Education and Sports",
    url: "https://www.education.go.ug",
    description: "Education policy and approved textbook lists",
    searchUrl: "https://www.education.go.ug",
  },
};

// Map exam levels to their details
export const UGANDA_LEVELS = {
  PLE: {
    name: "Primary Leaving Examinations",
    level: "Primary",
    subjects: ["English Language", "Mathematics", "Science", "Social Studies"],
    body: "UNEB",
  },
  UCE: {
    name: "Uganda Certificate of Education",
    level: "O-Level (S1-S4)",
    subjects: [
      "English Language", "Mathematics", "Physics", "Chemistry", "Biology",
      "History", "Geography", "Commerce", "Computer Studies", "Fine Art",
      "Agriculture", "Literature in English", "Religious Education",
    ],
    body: "UNEB",
  },
  UACE: {
    name: "Uganda Advanced Certificate of Education",
    level: "A-Level (S5-S6)",
    subjects: [
      "Mathematics", "Physics", "Chemistry", "Biology", "Economics",
      "History", "Geography", "General Paper", "Computer Science",
      "Entrepreneurship", "Art", "Literature", "Divinity",
    ],
    body: "UNEB",
  },
};

// Fetch content from a URL with timeout
async function fetchWithTimeout(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) StudyCoachApp/1.0 (educational)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// Extract readable text from HTML
function extractText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim()
    .slice(0, 8000);
}

// Search a Uganda education website and extract relevant content
async function searchEducationSite(baseUrl, query) {
  // Try common search patterns
  const searchUrls = [
    `${baseUrl}/search?q=${encodeURIComponent(query)}`,
    `${baseUrl}/?s=${encodeURIComponent(query)}`,
    `${baseUrl}/index.php?search=${encodeURIComponent(query)}`,
  ];

  for (const url of searchUrls) {
    try {
      const res = await fetchWithTimeout(url, 10000);
      if (res.ok) {
        const html = await res.text();
        const text = extractText(html);
        if (text.length > 200) return { url, text, success: true };
      }
    } catch { continue; }
  }

  // Fallback: fetch homepage
  try {
    const res = await fetchWithTimeout(baseUrl, 10000);
    if (res.ok) {
      const html = await res.text();
      return { url: baseUrl, text: extractText(html), success: true };
    }
  } catch { /* ignore */ }

  return { success: false };
}

// Use GPT to answer questions using Uganda curriculum context
async function answerWithUgandaContext(query, context, sources) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1000,
    messages: [
      {
        role: "system",
        content: `You are an expert on Uganda's education system. You help students with:
- UNEB examinations (PLE, UCE, UACE)
- NCDC syllabi and curriculum
- Uganda O-Level and A-Level subjects
- Past paper questions and marking guides

When answering, always reference the specific Uganda curriculum context.
If providing information about exams, mention the specific exam body (UNEB) and level.
Format answers clearly for students preparing for Uganda national exams.`,
      },
      {
        role: "user",
        content: `Student query: "${query}"

Context from Uganda education sources:
${context}

Sources checked: ${sources.join(", ")}

Please provide a helpful, curriculum-aligned answer. If the context doesn't fully answer the question, use your knowledge of Uganda's education system to fill gaps.`,
      },
    ],
  });

  return response.choices[0].message.content;
}

// Main function: query Uganda education sources
export async function queryUgandaSources(query) {
  const results = [];
  const sourcesChecked = [];

  // Detect which sources are most relevant
  const queryLower = query.toLowerCase();
  const isExamRelated = /exam|past paper|marking|uneb|ple|uce|uace|question|paper/i.test(query);
  const isSyllabusRelated = /syllabus|curriculum|topic|subject|ncdc|scheme/i.test(query);
  const isPolicyRelated = /policy|ministry|education|textbook|school/i.test(query);

  // Determine priority sources
  const prioritySources = [];
  if (isExamRelated) prioritySources.push("UNEB");
  if (isSyllabusRelated) prioritySources.push("NCDC");
  if (isPolicyRelated) prioritySources.push("MOES");
  if (prioritySources.length === 0) prioritySources.push("UNEB", "NCDC");

  // Fetch from priority sources
  for (const sourceKey of prioritySources) {
    const source = UGANDA_SOURCES[sourceKey];
    try {
      console.log(`[Uganda] Fetching from ${source.name}...`);
      const result = await searchEducationSite(source.url, query);
      if (result.success && result.text) {
        results.push(`=== ${source.name} (${source.url}) ===\n${result.text.slice(0, 3000)}`);
        sourcesChecked.push(source.name);
        console.log(`[Uganda] Got content from ${source.name}`);
      }
    } catch (e) {
      console.log(`[Uganda] ${source.name} failed: ${e.message}`);
    }
  }

  // Build context from fetched content
  const context = results.length > 0
    ? results.join("\n\n")
    : `No live content retrieved. Using knowledge of Uganda's education system.`;

  // Answer using GPT with Uganda context
  const answer = await answerWithUgandaContext(query, context, sourcesChecked);

  return {
    answer,
    sourcesChecked,
    liveDataFetched: results.length > 0,
    relevantLinks: prioritySources.map(key => ({
      name: UGANDA_SOURCES[key].name,
      url: UGANDA_SOURCES[key].url,
    })),
  };
}

// Get curriculum info for a specific subject and level
export function getUgandaCurriculumInfo(subject, level) {
  const examLevel = Object.values(UGANDA_LEVELS).find(l =>
    l.level.toLowerCase().includes(level?.toLowerCase() || "") ||
    l.name.toLowerCase().includes(level?.toLowerCase() || "")
  );

  if (!examLevel) return null;

  const subjectMatch = examLevel.subjects.find(s =>
    s.toLowerCase().includes(subject?.toLowerCase() || "")
  );

  return {
    examLevel: examLevel.name,
    level: examLevel.level,
    subjectFound: subjectMatch || null,
    allSubjects: examLevel.subjects,
    examBody: examLevel.body,
    curriculumSource: "NCDC",
  };
}