"use client";
import { useState, useRef, useEffect } from "react";
import {
  saveQuizToCloud, saveAssignmentToCloud,
  saveMaterialToCloud, deleteMaterialFromCloud,
  deleteAssignmentFromCloud,
} from "../../lib/teacherStudentBridge";

const TEACHER_DATA_KEY = "sca_teacher_data";
const O   = "#ea580c";
const BG  = "#0d0d0d";
const BG2 = "#1a1a1a";
const BD  = "#2a2a2a";
const TXT = "#f1f1f1";
const TXT2= "#9ca3af";
const COAT= "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Coat_of_arms_of_Uganda.svg/800px-Coat_of_arms_of_Uganda.svg.png";

function loadData() {
  if (typeof window === "undefined") return { materials:[], quizzes:[], assignments:[] };
  try { return JSON.parse(localStorage.getItem(TEACHER_DATA_KEY) || '{"materials":[],"quizzes":[],"assignments":[]}'); }
  catch { return { materials:[], quizzes:[], assignments:[] }; }
}
function saveData(d) { if (typeof window !== "undefined") localStorage.setItem(TEACHER_DATA_KEY, JSON.stringify(d)); }

async function extractPdfText(file) {
  return new Promise(resolve => {
    const run = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const pdf = await window.pdfjsLib.getDocument({ data: e.target.result }).promise;
          let text = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const c = await page.getTextContent();
            text += c.items.map(it => it.str).join(" ") + `\n--- Page ${i} ---\n`;
          }
          resolve({ text, pages: pdf.numPages });
        } catch(err) { resolve({ text:"", pages:0, error:String(err) }); }
      };
      reader.readAsArrayBuffer(file);
    };
    if (window.pdfjsLib) { run(); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload = run;
    document.head.appendChild(s);
  });
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", background:active?"rgba(234,88,12,0.12)":"none", border:active?"1px solid rgba(234,88,12,0.3)":"1px solid transparent", borderRadius:10, padding:"10px 14px", cursor:"pointer", color:active?O:TXT2, fontSize:13, fontWeight:active?700:400, textAlign:"left", marginBottom:4, transition:"all 0.15s" }}
      onMouseEnter={e=>{ if(!active){e.currentTarget.style.background=BG2;e.currentTarget.style.color=TXT;}}}
      onMouseLeave={e=>{ if(!active){e.currentTarget.style.background="none";e.currentTarget.style.color=TXT2;}}}>
      <span style={{ fontSize:17 }}>{icon}</span>{label}
    </button>
  );
}

function StatCard({ icon, label, value, color=O }) {
  return (
    <div style={{ flex:1, background:BG2, borderRadius:12, padding:"16px 18px", border:`1px solid ${BD}`, textAlign:"center", minWidth:100 }}>
      <div style={{ fontSize:26, marginBottom:4 }}>{icon}</div>
      <div style={{ fontSize:24, fontWeight:900, color }}>{value}</div>
      <div style={{ fontSize:11, color:TXT2, marginTop:2 }}>{label}</div>
    </div>
  );
}

// ─── Materials Tab ────────────────────────────────────────────────────────────
function MaterialsTab({ data, persist }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver,  setDragOver]  = useState(false);
  const [cloudStatus, setCloudStatus] = useState("");
  const fileRef = useRef();

  const upload = async (file) => {
    if (!file || !file.name.endsWith(".pdf")) { alert("Please upload a PDF file."); return; }
    setUploading(true);
    const { text, pages, error } = await extractPdfText(file);
    if (error || !text.trim()) { alert("Could not extract text from this PDF."); setUploading(false); return; }
    const mat = { id: Date.now().toString(), name:file.name, pages, text:text.slice(0,15000), uploadedAt:new Date().toLocaleDateString() };

    // Save locally
    const updated = { ...data, materials:[mat, ...data.materials] };
    persist(updated);

    // Save to Firebase so students can access it
    setCloudStatus("Uploading to cloud…");
    const result = await saveMaterialToCloud({ name:mat.name, pages:mat.pages, text:mat.text, uploadedAt:mat.uploadedAt });
    setCloudStatus(result.success ? "✅ Uploaded & shared with students!" : `⚠️ Local only: ${result.error}`);
    setTimeout(() => setCloudStatus(""), 4000);
    setUploading(false);
  };

  return (
    <div>
      <h3 style={{ color:O, fontWeight:700, fontSize:16, marginBottom:4 }}>📄 Study Materials</h3>
      <p style={{ color:TXT2, fontSize:13, marginBottom:18 }}>Upload PDF textbooks, notes, or past papers. They will be shared with all students.</p>

      {cloudStatus && (
        <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:8, padding:"8px 14px", marginBottom:14, fontSize:13, color:"#4ade80" }}>
          {cloudStatus}
        </div>
      )}

      <input type="file" accept="application/pdf" ref={fileRef} style={{ display:"none" }} onChange={e => upload(e.target.files?.[0])} />
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e=>{ e.preventDefault(); setDragOver(true); }}
        onDragLeave={()=> setDragOver(false)}
        onDrop={e=>{ e.preventDefault(); setDragOver(false); upload(e.dataTransfer.files?.[0]); }}
        style={{ border:`2px dashed ${dragOver?O:"#333"}`, borderRadius:12, padding:"28px 20px", textAlign:"center", cursor:"pointer", color:dragOver?O:TXT2, fontSize:14, marginBottom:20, transition:"all 0.2s" }}>
        {uploading ? <><span style={{ fontSize:28 }}>⏳</span><br/><span style={{ color:O }}>Extracting & uploading…</span></>
          : <><span style={{ fontSize:36 }}>📁</span><br/><strong>Click or drag a PDF here</strong><br/><span style={{ fontSize:12, marginTop:6, display:"block" }}>Shared with all students instantly</span></>}
      </div>

      {data.materials.length === 0 ? (
        <p style={{ color:"#555", textAlign:"center", fontSize:13, padding:20 }}>No materials yet.</p>
      ) : data.materials.map(m => (
        <div key={m.id} style={{ background:BG2, borderRadius:10, padding:"13px 16px", marginBottom:10, border:`1px solid ${BD}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:13, color:TXT, fontWeight:600 }}>📄 {m.name}</div>
            <div style={{ fontSize:11, color:TXT2, marginTop:2 }}>{m.pages} page{m.pages!==1?"s":""} · {m.uploadedAt}</div>
            <div style={{ fontSize:10, color:"#22c55e", marginTop:2 }}>☁️ Shared with students</div>
          </div>
          <button onClick={async () => {
            persist({ ...data, materials:data.materials.filter(x=>x.id!==m.id) });
            await deleteMaterialFromCloud(m.firebaseId || m.id);
          }}
            style={{ background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)", color:"#ef4444", borderRadius:6, padding:"5px 10px", cursor:"pointer", fontSize:11, flexShrink:0, marginLeft:12 }}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Create Quiz Tab ──────────────────────────────────────────────────────────
function CreateQuizTab({ data, persist, onSendToChat, onClose }) {
  const [topic,      setTopic]      = useState("");
  const [count,      setCount]      = useState(5);
  const [diff,       setDiff]       = useState("intermediate");
  const [selMat,     setSelMat]     = useState("");
  const [generating, setGenerating] = useState(false);
  const [status,     setStatus]     = useState("");

  const inp = { width:"100%", background:"#111", border:`1px solid ${BD}`, borderRadius:8, padding:"9px 12px", color:TXT, fontSize:13, outline:"none", boxSizing:"border-box", marginBottom:12, fontFamily:"inherit" };
  const lab = { fontSize:11, color:O, display:"block", marginBottom:5, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 };

  const generate = async () => {
    const mat = data.materials.find(m => m.id === selMat);
    if (!mat && !topic.trim()) { alert("Enter a topic or select a material."); return; }
    setGenerating(true);
    setStatus("Generating quiz…");

    try {
      // Generate quiz via API
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: mat ? mat.name : topic.trim(),
          difficulty: diff,
          num_questions: count,
        }),
      });
      const quizData = await res.json();
      if (!res.ok) throw new Error(quizData.error || "Failed to generate quiz");

      // Save to Firebase so students can see it
      setStatus("Sharing with students…");
      const cloudResult = await saveQuizToCloud({
        topic:      quizData.topic,
        difficulty: quizData.difficulty,
        questions:  quizData.questions,
        answerKey:  quizData.answerKey,
        createdBy:  "teacher",
        createdAt:  new Date().toISOString(),
      });

      // Save locally too
      const saved = { id:Date.now().toString(), topic:mat?mat.name:topic, count, diff, createdAt:new Date().toLocaleDateString() };
      persist({ ...data, quizzes:[saved,...(data.quizzes||[])] });

      if (cloudResult.success) {
        setStatus("✅ Quiz created and shared with all students!");
      } else {
        setStatus("⚠️ Quiz created but not shared: " + cloudResult.error);
      }
    } catch (err) {
      setStatus("❌ Error: " + err.message);
    }

    setGenerating(false);
    setTimeout(() => setStatus(""), 5000);
  };

  return (
    <div>
      <h3 style={{ color:O, fontWeight:700, fontSize:16, marginBottom:4 }}>📝 Create Quiz / Exam</h3>
      <p style={{ color:TXT2, fontSize:13, marginBottom:18 }}>Generate a quiz — it will be instantly shared with all students.</p>

      {status && (
        <div style={{ background:"rgba(234,88,12,0.08)", border:"1px solid rgba(234,88,12,0.25)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:13, color:status.startsWith("✅")?"#4ade80":status.startsWith("❌")?"#ef4444":O }}>
          {status}
        </div>
      )}

      {data.materials.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <label style={lab}>From Uploaded Material</label>
          <select style={inp} value={selMat} onChange={e=>setSelMat(e.target.value)}>
            <option value="">— Or type a topic below —</option>
            {data.materials.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      )}

      <label style={lab}>Topic</label>
      <input style={inp} value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Photosynthesis S3 Biology" onKeyDown={e=>e.key==="Enter"&&generate()} />

      <div style={{ display:"flex", gap:12, marginBottom:14 }}>
        <div style={{ flex:1 }}>
          <label style={lab}>Questions</label>
          <select style={inp} value={count} onChange={e=>setCount(Number(e.target.value))}>
            {[5,10,15,20,25,30].map(n=><option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div style={{ flex:1 }}>
          <label style={lab}>Difficulty</label>
          <select style={inp} value={diff} onChange={e=>setDiff(e.target.value)}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      <button onClick={generate} disabled={generating||(!topic.trim()&&!selMat)} style={{ width:"100%", background:generating?"#1a1a1a":"linear-gradient(135deg,#ea580c,#d97706)", color:generating?"#555":"#fff", border:"none", borderRadius:10, padding:"13px 0", fontWeight:800, cursor:"pointer", fontSize:14, marginBottom:24, opacity:(!topic.trim()&&!selMat)?0.4:1, transition:"all 0.3s" }}>
        {generating?"⏳ Generating & sharing…":"🚀 Generate & Share with Students"}
      </button>

      {(data.quizzes||[]).length > 0 && (
        <div style={{ marginTop:8 }}>
          <div style={{ fontSize:12, color:O, fontWeight:700, marginBottom:10, textTransform:"uppercase" }}>Recent Quizzes Created</div>
          {(data.quizzes||[]).slice(0,6).map(q=>(
            <div key={q.id} style={{ background:BG2, borderRadius:8, padding:"10px 14px", marginBottom:7, border:`1px solid ${BD}`, display:"flex", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:13, color:TXT, fontWeight:600 }}>{q.topic}</div>
                <div style={{ fontSize:11, color:TXT2 }}>{q.count} questions · {q.diff} · {q.createdAt}</div>
                <div style={{ fontSize:10, color:"#22c55e", marginTop:2 }}>☁️ Shared with students</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Teacher Research Assistant */}
      <ResearchAssistant />
    </div>
  );
}

// ─── Teacher Research Assistant ───────────────────────────────────────────────
function ResearchAssistant() {
  const [researchQ,   setResearchQ]   = useState("");
  const [researchAns, setResearchAns] = useState("");
  const [researching, setResearching] = useState(false);

  const inp = { width:"100%", background:"#111", border:`1px solid #2a2a2a`, borderRadius:8, padding:"9px 12px", color:"#f1f1f1", fontSize:13, outline:"none", boxSizing:"border-box", marginBottom:12, fontFamily:"inherit" };

  const doResearch = async () => {
    if (!researchQ.trim()) return;
    setResearching(true); setResearchAns("");
    try {
      const res = await fetch("/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ message: researchQ, threadId:"teacher-research-"+Date.now() }),
      });
      const d = await res.json();
      setResearchAns(d.response || "No response.");
    } catch { setResearchAns("Error — check your API key."); }
    setResearching(false);
  };

  return (
    <div style={{ background:"rgba(234,88,12,0.05)", border:`1px solid rgba(234,88,12,0.15)`, borderRadius:12, padding:18, marginTop:24 }}>
      <div style={{ fontSize:13, fontWeight:700, color:"#ea580c", marginBottom:8 }}>🔍 Teacher Research Assistant</div>
      <p style={{ fontSize:12, color:"#9ca3af", marginBottom:12 }}>Ask anything at your level of understanding — syllabus design, pedagogy, subject matter, past paper analysis.</p>
      <textarea style={{ ...inp, minHeight:70, resize:"vertical" }} value={researchQ} onChange={e=>setResearchQ(e.target.value)}
        placeholder="e.g. What are the key assessment criteria for UCE Biology practical exams?" />
      <button onClick={doResearch} disabled={researching||!researchQ.trim()} style={{ width:"100%", background:"rgba(234,88,12,0.15)", border:`1px solid rgba(234,88,12,0.3)`, color:"#ea580c", borderRadius:8, padding:"10px 0", fontWeight:700, cursor:"pointer", fontSize:13, opacity:!researchQ.trim()?0.4:1 }}>
        {researching?"⏳ Researching…":"🔍 Research"}
      </button>
      {researchAns && (
        <div style={{ marginTop:14, background:"#111", borderRadius:10, padding:"14px 16px", fontSize:13, color:"#f1f1f1", lineHeight:1.7, whiteSpace:"pre-wrap" }}>
          {researchAns}
        </div>
      )}
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────
function AnalyticsTab({ data }) {
  const records = (() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("sca_progress_records")||"[]"); } catch { return []; }
  })();

  const avg  = records.length ? Math.round(records.reduce((s,r)=>s+r.score,0)/records.length) : null;
  const best = records.length ? Math.max(...records.map(r=>r.score)) : null;
  const recent = [...records].reverse().slice(0,15);

  return (
    <div>
      <h3 style={{ color:O, fontWeight:700, fontSize:16, marginBottom:4 }}>📊 Student Analytics</h3>
      <p style={{ color:TXT2, fontSize:13, marginBottom:18 }}>Performance data from students.</p>

      <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
        <StatCard icon="📝" label="Quizzes taken"      value={records.length} />
        <StatCard icon="🎯" label="Average score"      value={avg!==null?`${avg}%`:"—"} color={avg>=70?"#22c55e":avg>=50?O:"#ef4444"} />
        <StatCard icon="🏆" label="Best score"         value={best!==null?`${best}%`:"—"} color="#22c55e" />
        <StatCard icon="📚" label="Materials uploaded" value={data.materials.length} />
      </div>

      {recent.length > 0 ? (
        <div>
          <div style={{ fontSize:12, color:O, fontWeight:700, marginBottom:10, textTransform:"uppercase" }}>Recent Results</div>
          {recent.map((r,i)=>{
            const color = r.score>=80?"#22c55e":r.score>=60?O:"#ef4444";
            return (
              <div key={i} style={{ background:BG2, borderRadius:8, padding:"10px 14px", marginBottom:7, border:`1px solid ${BD}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:13, color:TXT, fontWeight:600 }}>{r.topic}</div>
                  <div style={{ fontSize:11, color:TXT2 }}>{new Date(r.date).toLocaleDateString()}</div>
                </div>
                <div style={{ fontSize:20, fontWeight:900, color }}>{r.score}%</div>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ color:"#555", textAlign:"center", fontSize:13, padding:30 }}>No student results yet.</p>
      )}
    </div>
  );
}

// ─── Assignments Tab ──────────────────────────────────────────────────────────
function AssignmentsTab({ data, persist }) {
  const [title,   setTitle]   = useState("");
  const [topic,   setTopic]   = useState("");
  const [due,     setDue]     = useState("");
  const [selMat,  setSelMat]  = useState("");
  const [status,  setStatus]  = useState("");

  const inp = { width:"100%", background:"#111", border:`1px solid ${BD}`, borderRadius:8, padding:"9px 12px", color:TXT, fontSize:13, outline:"none", boxSizing:"border-box", marginBottom:12 };
  const lab = { fontSize:11, color:O, display:"block", marginBottom:5, fontWeight:700, textTransform:"uppercase" };

  const assign = async () => {
    if (!title.trim()) return;
    const a = { id:Date.now().toString(), title:title.trim(), topic:topic.trim(), dueDate:due, material:selMat, createdAt:new Date().toLocaleDateString(), status:"active" };

    // Save locally
    persist({ ...data, assignments:[a,...(data.assignments||[])] });

    // Save to Firebase
    setStatus("Sharing with students…");
    const result = await saveAssignmentToCloud({ title:a.title, topic:a.topic, dueDate:a.dueDate, createdAt:a.createdAt, status:"active" });
    setStatus(result.success ? "✅ Assignment shared with all students!" : `⚠️ Local only: ${result.error}`);
    setTimeout(() => setStatus(""), 4000);

    setTitle(""); setTopic(""); setDue(""); setSelMat("");
  };

  return (
    <div>
      <h3 style={{ color:O, fontWeight:700, fontSize:16, marginBottom:4 }}>📋 Assign Work</h3>
      <p style={{ color:TXT2, fontSize:13, marginBottom:18 }}>Create assignments — shared with all students instantly.</p>

      {status && (
        <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:8, padding:"8px 14px", marginBottom:14, fontSize:13, color:status.startsWith("✅")?"#4ade80":"#ef4444" }}>
          {status}
        </div>
      )}

      <div style={{ background:"rgba(234,88,12,0.05)", border:`1px solid rgba(234,88,12,0.15)`, borderRadius:12, padding:18, marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:700, color:O, marginBottom:12 }}>New Assignment</div>
        <label style={lab}>Assignment Title</label>
        <input style={inp} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Term 2 Biology Test" />
        <label style={lab}>Topic</label>
        <input style={inp} value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Photosynthesis and Respiration" />
        <label style={lab}>Due Date</label>
        <input type="date" style={inp} value={due} onChange={e=>setDue(e.target.value)} />
        {data.materials.length > 0 && (
          <>
            <label style={lab}>Attach Material (optional)</label>
            <select style={inp} value={selMat} onChange={e=>setSelMat(e.target.value)}>
              <option value="">— No attachment —</option>
              {data.materials.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </>
        )}
        <button onClick={assign} disabled={!title.trim()} style={{ width:"100%", background:"linear-gradient(135deg,#ea580c,#d97706)", color:"#fff", border:"none", borderRadius:8, padding:"11px 0", fontWeight:700, cursor:"pointer", fontSize:13, opacity:!title.trim()?0.4:1 }}>
          + Create & Share Assignment
        </button>
      </div>

      {(data.assignments||[]).length === 0 ? (
        <p style={{ color:"#555", textAlign:"center", fontSize:13 }}>No assignments yet.</p>
      ) : (data.assignments||[]).map(a => (
        <div key={a.id} style={{ background:BG2, borderRadius:10, padding:"13px 16px", marginBottom:10, border:`1px solid ${BD}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:13, color:TXT, fontWeight:700 }}>{a.title}</div>
              {a.topic && <div style={{ fontSize:12, color:TXT2, marginTop:2 }}>{a.topic}</div>}
              <div style={{ fontSize:11, color:"#555", marginTop:3 }}>
                Created {a.createdAt}{a.dueDate ? ` · Due ${new Date(a.dueDate).toLocaleDateString()}` : ""}
              </div>
              <div style={{ fontSize:10, color:"#22c55e", marginTop:2 }}>☁️ Shared with students</div>
            </div>
            <button onClick={async () => {
              persist({ ...data, assignments:(data.assignments||[]).filter(x=>x.id!==a.id) });
              await deleteAssignmentFromCloud(a.firebaseId || a.id);
            }}
              style={{ background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)", color:"#ef4444", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontSize:11, flexShrink:0, marginLeft:12 }}>
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main TeacherPortal ───────────────────────────────────────────────────────
export default function TeacherPortal({ user, onLogout, onSendToChat }) {
  const [tab,  setTab]  = useState("overview");
  const [data, setData] = useState(loadData);
  const persist = updated => { setData(updated); saveData(updated); };

  const tabs = [
    { id:"overview",     icon:"🏠", label:"Overview"    },
    { id:"materials",    icon:"📄", label:"Materials"   },
    { id:"quiz",         icon:"📝", label:"Create Quiz" },
    { id:"assignments",  icon:"📋", label:"Assignments" },
    { id:"analytics",    icon:"📊", label:"Analytics"   },
  ];

  const records = (() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("sca_progress_records")||"[]"); } catch { return []; }
  })();
  const avg = records.length ? Math.round(records.reduce((s,r)=>s+r.score,0)/records.length) : null;

  return (
    <div style={{ display:"flex", height:"100vh", background:BG, overflow:"hidden", position:"relative" }}>
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <img src={COAT} alt="" style={{ width:500, height:500, opacity:0.04, objectFit:"contain" }} />
      </div>

      {/* Sidebar */}
      <div style={{ width:240, minWidth:240, background:"#080808", borderRight:`1px solid ${BD}`, display:"flex", flexDirection:"column", zIndex:10, padding:"20px 12px", flexShrink:0 }}>
        <div style={{ marginBottom:24, paddingLeft:4 }}>
          <div style={{ fontSize:24 }}>👩‍🏫</div>
          <div style={{ fontSize:15, fontWeight:800, color:O, marginTop:4 }}>Teacher Portal</div>
          <div style={{ fontSize:11, color:TXT2 }}>Uganda AI Study Coach</div>
        </div>
        <nav style={{ flex:1 }}>
          {tabs.map(t => <NavBtn key={t.id} icon={t.icon} label={t.label} active={tab===t.id} onClick={()=>setTab(t.id)} />)}
        </nav>
        <div style={{ background:BG2, borderRadius:12, padding:"12px 14px", border:`1px solid ${BD}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <img src={user.avatar} alt={user.name} style={{ width:34, height:34, borderRadius:"50%" }} />
            <div style={{ flex:1, overflow:"hidden" }}>
              <div style={{ fontSize:12, color:TXT, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</div>
              <div style={{ fontSize:10, color:O, fontWeight:600, textTransform:"uppercase" }}>Teacher</div>
            </div>
          </div>
          <div style={{ fontSize:10, color:TXT2, marginTop:6, paddingTop:6, borderTop:`1px solid ${BD}` }}>{user.email}</div>
          <button onClick={onLogout} style={{ marginTop:10, width:"100%", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", color:"#ef4444", borderRadius:8, padding:"7px 0", cursor:"pointer", fontSize:12, fontWeight:600 }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex:1, overflowY:"auto", padding:32, position:"relative", zIndex:1 }}>
        <div style={{ maxWidth:720, margin:"0 auto" }}>

          {tab === "overview" && (
            <div>
              <h2 style={{ color:TXT, fontWeight:800, fontSize:22, marginBottom:4 }}>Welcome back, {user.name} 👋</h2>
              <p style={{ color:TXT2, fontSize:14, marginBottom:24 }}>Your teacher dashboard — content you create is shared with students in real-time.</p>
              <div style={{ display:"flex", gap:14, marginBottom:24, flexWrap:"wrap" }}>
                <StatCard icon="📄" label="Materials"   value={data.materials.length} />
                <StatCard icon="📝" label="Quizzes"     value={(data.quizzes||[]).length} />
                <StatCard icon="📋" label="Assignments" value={(data.assignments||[]).length} />
                <StatCard icon="🎯" label="Avg score"   value={avg!==null?`${avg}%`:"—"} color={avg>=70?"#22c55e":avg>=50?O:"#ef4444"} />
              </div>

              {/* Firebase status */}
              <div style={{ background:"rgba(34,197,94,0.05)", borderRadius:14, padding:18, border:"1px solid rgba(34,197,94,0.15)", marginBottom:18 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#22c55e", marginBottom:6 }}>☁️ Cloud Connected</div>
                <p style={{ fontSize:13, color:TXT2, margin:0, lineHeight:1.7 }}>
                  Everything you create — quizzes, assignments, and materials — is saved to the cloud and instantly visible to all students when they log in.
                </p>
              </div>

              <div style={{ background:BG2, borderRadius:14, padding:22, border:`1px solid ${BD}` }}>
                <div style={{ fontSize:14, fontWeight:700, color:O, marginBottom:12 }}>Quick Actions</div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  {[["📄","Upload Material","materials"],["📝","Create Quiz","quiz"],["📋","Assignments","assignments"],["📊","Analytics","analytics"]].map(([icon,label,t])=>(
                    <button key={t} onClick={()=>setTab(t)} style={{ background:"rgba(234,88,12,0.1)", border:"1px solid rgba(234,88,12,0.2)", color:O, borderRadius:10, padding:"10px 16px", cursor:"pointer", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:7 }}>
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "materials"   && <MaterialsTab   data={data} persist={persist} />}
          {tab === "quiz"        && <CreateQuizTab  data={data} persist={persist} onSendToChat={onSendToChat} onClose={()=>{}} />}
          {tab === "assignments" && <AssignmentsTab data={data} persist={persist} />}
          {tab === "analytics"   && <AnalyticsTab   data={data} />}
        </div>
      </div>
    </div>
  );
}