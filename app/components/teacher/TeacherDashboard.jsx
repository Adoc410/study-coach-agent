"use client";
import { useState, useRef } from "react";

const TEACHER_PASS = "teacher2024"; // simple PIN for demo; replace with real auth
const TEACHER_DATA_KEY = "sca_teacher_data";

function loadTeacherData() {
  if (typeof window === "undefined") return { materials: [], quizzes: [] };
  try { return JSON.parse(localStorage.getItem(TEACHER_DATA_KEY) || '{"materials":[],"quizzes":[]}'); }
  catch { return { materials: [], quizzes: [] }; }
}

function saveTeacherData(data) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TEACHER_DATA_KEY, JSON.stringify(data));
}

// ─── PDF text extractor ───────────────────────────────────────────────────────
async function extractPdfText(file) {
  return new Promise((resolve) => {
    if (window.pdfjsLib) {
      doExtract(resolve, file);
    } else {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      s.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        doExtract(resolve, file);
      };
      document.head.appendChild(s);
    }
  });
}

async function doExtract(resolve, file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const pdf = await window.pdfjsLib.getDocument({ data: e.target.result }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(it => it.str).join(" ") + `\n--- Page ${i} ---\n`;
      }
      resolve({ text, pages: pdf.numPages });
    } catch (err) {
      resolve({ text: "", pages: 0, error: String(err) });
    }
  };
  reader.readAsArrayBuffer(file);
}

// ─── Section ──────────────────────────────────────────────────────────────────
function Section({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 20 }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", background: "#1a1a1a", border: "none",
        borderRadius: 8, padding: "10px 14px",
        color: "#ea580c", fontWeight: 700, fontSize: 13,
        cursor: "pointer", textAlign: "left",
        display: "flex", justifyContent: "space-between",
      }}>
        {title} <span>{open ? "▾" : "▸"}</span>
      </button>
      {open && <div style={{ padding: "12px 4px" }}>{children}</div>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TeacherDashboard({ onClose, onSendToChat }) {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [data, setData] = useState(loadTeacherData);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [quizTopic, setQuizTopic] = useState("");
  const [quizCount, setQuizCount] = useState(5);
  const [quizDiff, setQuizDiff] = useState("intermediate");
  const fileRef = useRef();

  const persist = (updated) => {
    setData(updated);
    saveTeacherData(updated);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { text, pages, error } = await extractPdfText(file);
    if (error || !text) {
      alert("Could not extract text from this PDF.");
      setUploading(false);
      return;
    }
    const material = {
      id: Date.now().toString(),
      name: file.name,
      pages,
      text: text.slice(0, 15000),
      uploadedAt: new Date().toLocaleDateString(),
    };
    persist({ ...data, materials: [material, ...data.materials] });
    setUploading(false);
  };

  const generateQuiz = async (materialId) => {
    const mat = data.materials.find(m => m.id === materialId);
    if (!mat && !quizTopic) { alert("Select a material or enter a topic."); return; }
    setGenerating(true);
    const prompt = mat
      ? `Create a ${quizCount}-question ${quizDiff} quiz based on this content:\n\n${mat.text.slice(0, 4000)}`
      : `Create a ${quizCount}-question ${quizDiff} quiz on: ${quizTopic}`;

    onSendToChat(`[TEACHER] ${prompt}`);
    setGenerating(false);
  };

  const deleteMaterial = (id) => {
    persist({ ...data, materials: data.materials.filter(m => m.id !== id) });
  };

  const inp = {
    width: "100%", background: "#111", border: "1px solid #333",
    borderRadius: 8, padding: "8px 12px", color: "#f1f1f1",
    fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 8,
  };

  // ── PIN gate ──
  if (!authed) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 8000,
        background: "rgba(0,0,0,0.9)", display: "flex",
        alignItems: "center", justifyContent: "center",
      }} onClick={onClose}>
        <div onClick={e => e.stopPropagation()} style={{
          background: "#141414", border: "1px solid #2a2a2a",
          borderRadius: 16, padding: 32, width: 340, textAlign: "center",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>👩‍🏫</div>
          <h3 style={{ color: "#ea580c", margin: "0 0 6px", fontSize: 16 }}>Teacher Dashboard</h3>
          <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 20 }}>Enter your teacher PIN to continue</p>
          <input style={{ ...inp, textAlign: "center", letterSpacing: 6, fontSize: 18 }}
            type="password" maxLength={12}
            placeholder="••••••••"
            value={pin} onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (pin === TEACHER_PASS ? setAuthed(true) : alert("Incorrect PIN"))}
          />
          <button onClick={() => pin === TEACHER_PASS ? setAuthed(true) : alert("Incorrect PIN (hint: teacher2024)")}
            style={{ width: "100%", background: "#ea580c", color: "#fff", border: "none", borderRadius: 8, padding: "11px 0", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
            Enter
          </button>
          <button onClick={onClose} style={{ marginTop: 10, background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 12 }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 8000,
      background: "rgba(0,0,0,0.88)", display: "flex",
      alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#141414", border: "1px solid #2a2a2a",
        borderRadius: 16, padding: 24, width: 500, maxWidth: "92%",
        maxHeight: "85vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ color: "#ea580c", margin: 0, fontSize: 16, fontWeight: 700 }}>👩‍🏫 Teacher Dashboard</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        {/* Upload PDF */}
        <Section title="📄 Upload Study Materials">
          <input type="file" accept="application/pdf" ref={fileRef} style={{ display: "none" }} onChange={handleUpload} />
          <div onClick={() => fileRef.current?.click()} style={{
            border: "2px dashed #333", borderRadius: 10, padding: 20, textAlign: "center",
            cursor: "pointer", color: "#9ca3af", fontSize: 13, marginBottom: 12,
            transition: "border-color 0.2s",
          }}>
            {uploading ? "Extracting text…" : "Click to upload PDF"}
          </div>
          {data.materials.map(m => (
            <div key={m.id} style={{
              background: "#1a1a1a", borderRadius: 8, padding: "10px 14px",
              marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 13, color: "#f1f1f1", fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{m.pages} pages · {m.uploadedAt}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => generateQuiz(m.id)} style={{
                  background: "#ea580c", color: "#fff", border: "none",
                  borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600,
                }}>
                  Generate Quiz
                </button>
                <button onClick={() => deleteMaterial(m.id)} style={{
                  background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                  color: "#ef4444", borderRadius: 6, padding: "5px 8px", cursor: "pointer", fontSize: 11,
                }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </Section>

        {/* Create Quiz */}
        <Section title="📝 Create Custom Quiz">
          <label style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 4 }}>Topic</label>
          <input style={inp} value={quizTopic} onChange={e => setQuizTopic(e.target.value)} placeholder="e.g. Photosynthesis S3 Biology" />
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 4 }}>Questions</label>
              <select style={inp} value={quizCount} onChange={e => setQuizCount(Number(e.target.value))}>
                {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 4 }}>Difficulty</label>
              <select style={inp} value={quizDiff} onChange={e => setQuizDiff(e.target.value)}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          <button onClick={() => generateQuiz(null)} disabled={generating || !quizTopic} style={{
            width: "100%", background: "#ea580c", color: "#fff",
            border: "none", borderRadius: 8, padding: "11px 0",
            fontWeight: 700, cursor: "pointer", fontSize: 13,
            opacity: (!quizTopic || generating) ? 0.5 : 1,
          }}>
            {generating ? "Generating…" : "Generate & Send to Chat"}
          </button>
        </Section>

        {/* Student Analytics placeholder */}
        <Section title="📊 Student Analytics">
          <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: 12 }}>
            Analytics appear here as students complete quizzes.
            Progress records are stored locally per device.
          </p>
          <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 11, color: "#ea580c", fontWeight: 700, marginBottom: 8 }}>QUICK STATS</div>
            <div style={{ display: "flex", gap: 16 }}>
              {[["Materials", data.materials.length], ["Quizzes sent", data.quizzes?.length || 0]].map(([label, val]) => (
                <div key={label} style={{ flex: 1, textAlign: "center", background: "#111", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#ea580c" }}>{val}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
