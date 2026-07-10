"use client";
import { useState, useEffect } from "react";
import {
  fetchQuizzesFromCloud,
  fetchAssignmentsFromCloud,
  fetchMaterialsFromCloud,
} from "../../lib/teacherStudentBridge";

export default function TeacherContent({ onStartQuiz, onClose }) {
  const [quizzes,     setQuizzes]     = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [materials,   setMaterials]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState("quizzes");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [q, a, m] = await Promise.all([
        fetchQuizzesFromCloud(),
        fetchAssignmentsFromCloud(),
        fetchMaterialsFromCloud(),
      ]);
      setQuizzes(q);
      setAssignments(a);
      setMaterials(m);
      setLoading(false);
    };
    load();
  }, []);

  const tabs = [
    { key:"quizzes",     label:`📝 Quizzes (${quizzes.length})`         },
    { key:"assignments", label:`📋 Assignments (${assignments.length})`  },
    { key:"materials",   label:`📄 Materials (${materials.length})`      },
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:7500, background:"rgba(0,0,0,0.88)", display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#141414", border:"1px solid #2a2a2a", borderRadius:18, width:540, maxWidth:"95%", maxHeight:"88vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ padding:"20px 22px 0", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div>
              <h3 style={{ color:"#f1f1f1", margin:0, fontSize:17, fontWeight:800 }}>👩‍🏫 From Your Teacher</h3>
              <p style={{ color:"#6b7280", margin:"3px 0 0", fontSize:12 }}>Quizzes, assignments and materials shared by your teacher</p>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", color:"#555", fontSize:22, cursor:"pointer" }}>✕</button>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:4, marginBottom:14, background:"#1a1a1a", padding:4, borderRadius:8, border:"1px solid #2a2a2a" }}>
            {tabs.map(t => (
              <button key={t.key} onClick={()=>setTab(t.key)} style={{ flex:1, padding:"7px 0", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer", border:"none", background:tab===t.key?"#ea580c":"transparent", color:tab===t.key?"#fff":"#6b7280", transition:"all 0.2s" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:"auto", padding:"0 22px 22px" }}>
          {loading ? (
            <div style={{ textAlign:"center", padding:40, color:"#555", fontSize:14 }}>
              Loading teacher content…
            </div>
          ) : (
            <>
              {/* QUIZZES */}
              {tab === "quizzes" && (
                quizzes.length === 0 ? (
                  <div style={{ textAlign:"center", padding:40, color:"#555", fontSize:14 }}>No quizzes from your teacher yet.</div>
                ) : quizzes.map((q, i) => (
                  <div key={q.id || i} style={{ background:"#1a1a1a", borderRadius:12, padding:"14px 16px", marginBottom:10, border:"1px solid #2a2a2a" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:"#f1f1f1" }}>{q.topic}</div>
                        <div style={{ fontSize:12, color:"#9ca3af", marginTop:4 }}>
                          {q.questions?.length || 0} questions · {q.difficulty}
                        </div>
                        <div style={{ fontSize:11, color:"#555", marginTop:2 }}>
                          {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : ""}
                        </div>
                      </div>
                      <button
                        onClick={() => { onStartQuiz(q); onClose(); }}
                        style={{ background:"linear-gradient(135deg,#ea580c,#d97706)", color:"#fff", border:"none", borderRadius:8, padding:"8px 16px", fontWeight:700, cursor:"pointer", fontSize:13, flexShrink:0 }}>
                        Start Quiz
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* ASSIGNMENTS */}
              {tab === "assignments" && (
                assignments.length === 0 ? (
                  <div style={{ textAlign:"center", padding:40, color:"#555", fontSize:14 }}>No assignments from your teacher yet.</div>
                ) : assignments.map((a, i) => (
                  <div key={a.id || i} style={{ background:"#1a1a1a", borderRadius:12, padding:"14px 16px", marginBottom:10, border:"1px solid #2a2a2a" }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#f1f1f1" }}>{a.title}</div>
                    {a.topic && <div style={{ fontSize:12, color:"#9ca3af", marginTop:4 }}>{a.topic}</div>}
                    {a.dueDate && (
                      <div style={{ fontSize:12, color:"#ea580c", marginTop:4, fontWeight:600 }}>
                        Due: {new Date(a.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    <div style={{ fontSize:11, color:"#555", marginTop:2 }}>
                      Set {a.createdAt ? new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt).toLocaleDateString() : ""}
                    </div>
                  </div>
                ))
              )}

              {/* MATERIALS */}
              {tab === "materials" && (
                materials.length === 0 ? (
                  <div style={{ textAlign:"center", padding:40, color:"#555", fontSize:14 }}>No materials from your teacher yet.</div>
                ) : materials.map((m, i) => (
                  <div key={m.id || i} style={{ background:"#1a1a1a", borderRadius:12, padding:"14px 16px", marginBottom:10, border:"1px solid #2a2a2a" }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#f1f1f1" }}>📄 {m.name}</div>
                    <div style={{ fontSize:12, color:"#9ca3af", marginTop:4 }}>{m.pages} pages</div>
                    <div style={{ fontSize:11, color:"#555", marginTop:4, lineHeight:1.5 }}>
                      {m.text?.slice(0, 120)}…
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}