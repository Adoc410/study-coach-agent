"use client";
import { useState } from "react";
import { UGANDA_CURRICULUM, getAllSubjects, getTopicsForGrade } from "../lib/curriculum/uganda";

const COAT_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Coat_of_arms_of_Uganda.svg/400px-Coat_of_arms_of_Uganda.svg.png";
const GRADES   = ["S1","S2","S3","S4"];

export default function CurriculumBrowser({ onSelectTopic, onClose }) {
  const [subject,    setSubject]    = useState(null);
  const [grade,      setGrade]      = useState("S1");
  const [activeTerm, setActiveTerm] = useState(null);

  const subjects = getAllSubjects();
  const topics   = subject ? getTopicsForGrade(subject, grade) : [];

  // Group by term
  const termGroups = [1,2,3].map(term => ({
    term,
    topics: topics.filter(t => t.term === term),
  })).filter(g => g.topics.length > 0);

  const Chip = ({ active, label, onClick, color }) => (
    <button onClick={onClick} style={{
      padding:"5px 14px", borderRadius:6, fontSize:12, fontWeight:600,
      cursor:"pointer", border:"none", transition:"all 0.2s",
      background: active ? (color || "#ea580c") : "#1a1a1a",
      color: active ? "#fff" : "#9ca3af",
    }}>
      {label}
    </button>
  );

  return (
    <div style={{ position:"fixed", inset:0, zIndex:7000, background:"rgba(0,0,0,0.88)", display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"#141414", border:"1px solid #2a2a2a",
        borderRadius:18, width:560, maxWidth:"94%",
        maxHeight:"88vh", overflowY:"auto",
        position:"relative",
      }}>
        {/* Coat of arms watermark */}
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none", zIndex:0 }}>
          <img src={COAT_URL} alt="" style={{ width:260, height:260, opacity:0.04, objectFit:"contain" }} />
        </div>

        <div style={{ position:"relative", zIndex:1, padding:26 }}>
          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <div>
              <h3 style={{ color:"#ea580c", margin:0, fontSize:17, fontWeight:800 }}>📚 Uganda O-Level Curriculum</h3>
              <p style={{ color:"#555", fontSize:11, margin:"4px 0 0" }}>
                UNEB aligned · S1–S4 · 3 Terms
              </p>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", color:"#666", fontSize:20, cursor:"pointer" }}>✕</button>
          </div>

          {/* Breadcrumb */}
          {subject && (
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:16, fontSize:12, color:"#555" }}>
              <button onClick={()=>{ setSubject(null); setActiveTerm(null); }} style={{ background:"none", border:"none", color:"#ea580c", cursor:"pointer", fontSize:12, padding:0 }}>
                All Subjects
              </button>
              <span>›</span>
              <span style={{ color:"#9ca3af" }}>
                {subjects.find(s=>s.key===subject)?.icon} {subjects.find(s=>s.key===subject)?.label}
              </span>
              <span>›</span>
              <span style={{ color:"#f1f1f1" }}>{grade}</span>
            </div>
          )}

          {/* Subjects grid */}
          {!subject && (
            <div>
              <div style={{ fontSize:11, color:"#ea580c", fontWeight:700, marginBottom:12, textTransform:"uppercase", letterSpacing:0.5 }}>
                Select a Subject
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {subjects.map(s => (
                  <button key={s.key} onClick={()=>{ setSubject(s.key); setActiveTerm(null); }} style={{
                    background:"#1a1a1a", border:"1px solid #2a2a2a",
                    borderRadius:12, padding:"14px 16px", cursor:"pointer",
                    textAlign:"left", transition:"all 0.2s",
                    display:"flex", alignItems:"center", gap:12,
                  }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor="#ea580c"; e.currentTarget.style.background="rgba(234,88,12,0.08)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor="#2a2a2a"; e.currentTarget.style.background="#1a1a1a"; }}>
                    <span style={{ fontSize:24 }}>{s.icon}</span>
                    <span style={{ fontSize:13, color:"#f1f1f1", fontWeight:600 }}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grade + Topics */}
          {subject && (
            <>
              {/* Grade selector */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:"#ea580c", fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:0.5 }}>
                  Select Grade
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {GRADES.map(g => (
                    <Chip key={g} active={grade===g} label={g} onClick={()=>{ setGrade(g); setActiveTerm(null); }} />
                  ))}
                </div>
              </div>

              {/* Term tabs */}
              {termGroups.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:"#ea580c", fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:0.5 }}>
                    Select Term
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <Chip active={activeTerm===null} label="All Terms" onClick={()=>setActiveTerm(null)} />
                    {termGroups.map(g => (
                      <Chip key={g.term} active={activeTerm===g.term} label={`Term ${g.term}`} onClick={()=>setActiveTerm(g.term)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Topics */}
              {termGroups.length === 0 ? (
                <div style={{ background:"#1a1a1a", borderRadius:10, padding:24, textAlign:"center", color:"#555", fontSize:13, border:"1px dashed #2a2a2a" }}>
                  No topics found for {grade}. Try a different grade.
                </div>
              ) : (
                termGroups
                  .filter(g => activeTerm === null || g.term === activeTerm)
                  .map(group => (
                    <div key={group.term} style={{ marginBottom:18 }}>
                      <div style={{ fontSize:11, color:"#9ca3af", fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:0.5 }}>
                        Term {group.term}
                      </div>
                      {group.topics.map(topic => (
                        <button key={topic.id} onClick={()=>{ onSelectTopic(topic, subject); onClose(); }}
                          style={{
                            display:"flex", alignItems:"center", justifyContent:"space-between",
                            width:"100%", background:"#1a1a1a", border:"1px solid #2a2a2a",
                            borderRadius:10, padding:"12px 16px", cursor:"pointer",
                            textAlign:"left", marginBottom:8, transition:"all 0.2s",
                          }}
                          onMouseEnter={e=>{ e.currentTarget.style.borderColor="#ea580c"; e.currentTarget.style.background="rgba(234,88,12,0.08)"; }}
                          onMouseLeave={e=>{ e.currentTarget.style.borderColor="#2a2a2a"; e.currentTarget.style.background="#1a1a1a"; }}>
                          <div>
                            <span style={{ fontSize:10, color:"#ea580c", fontWeight:700, marginRight:8, background:"rgba(234,88,12,0.12)", padding:"2px 7px", borderRadius:4 }}>
                              {topic.grade}
                            </span>
                            <span style={{ fontSize:13, color:"#f1f1f1", fontWeight:600 }}>{topic.title}</span>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                            <span style={{ fontSize:11, color:"#555" }}>Study →</span>
                          </div>
                        </button>
                      ))}
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