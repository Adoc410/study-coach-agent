import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const STORE_DIR = path.join(process.cwd(), ".study-memory", "rag");

function getStorePath(userId) {
  return path.join(STORE_DIR, `${userId}_rag.json`);
}

function loadStore(userId) {
  try {
    if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
    const p = getStorePath(userId);
    if (!fs.existsSync(p)) return [];
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch { return []; }
}

function saveStore(userId, entries) {
  try {
    if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
    fs.writeFileSync(getStorePath(userId), JSON.stringify(entries), "utf8");
  } catch (e) { console.error("[RAG] Save failed:", e.message); }
}

function chunkText(text, chunkSize = 500, overlap = 100) {
  const chunks = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      const words = current.split(" ");
      current = words.slice(-Math.floor(overlap / 5)).join(" ") + " " + sentence;
    } else {
      current += (current ? ". " : "") + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(c => c.length > 50);
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function addDocument(userId, text, sourceName) {
  const chunks = chunkText(text);
  if (chunks.length === 0) return { chunks: 0 };

  const embeddingRes = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: chunks,
  });

  const existing = loadStore(userId);
  const newEntries = chunks.map((chunkText, i) => ({
    text: chunkText,
    embedding: embeddingRes.data[i].embedding,
    source: sourceName,
    addedAt: new Date().toISOString(),
  }));

  saveStore(userId, [...existing, ...newEntries]);
  return { chunks: chunks.length, source: sourceName };
}

export async function searchKnowledge(userId, query, topK = 5) {
  const store = loadStore(userId);
  if (store.length === 0) return [];

  const queryEmb = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: [query],
  });
  const queryVec = queryEmb.data[0].embedding;

  return store
    .map(entry => ({ ...entry, score: cosineSimilarity(queryVec, entry.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter(e => e.score > 0.3);
}

export function getUserDocuments(userId) {
  const store = loadStore(userId);
  const sources = [...new Set(store.map(e => e.source))];
  return { sources, totalChunks: store.length };
}

export function clearKnowledge(userId) {
  try {
    const p = getStorePath(userId);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch (e) { console.error("[RAG] Clear failed:", e.message); }
}