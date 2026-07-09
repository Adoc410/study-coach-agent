"use client";
import { useState, useEffect } from "react";
import { getGrade } from "../lib/grading";
import StarRating from "./StarRating";
import { getUserProgress, clearUserProgress, appendUserProgress } from "../lib/userStorage";

const COAT_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Coat_of_arms_of_Uganda.svg/400px-Coat_of_arms_of_Uganda.svg.png";

// ─── Grade colors ─────────────────────────────────────────────────────────────
function scoreColor(score) {
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#84cc16";
  if (score >= 50) return "#f59e0b";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

// ─── Public helpers (imported by QuizCard) ────────────────────────────────────
export function saveProgressRecord(email, topic, score, subject = "") {
  if (typeof window === "undefined") return;
  appendUserProgress(email, {
    topic:   topic   || "Quiz",
    subject: subject || inferSubject(topic || ""),
    score,
    date: new Date().toISOString(),
  });
}

export function loadProgressRecords(email) {
  return getUserProgress(email);
}

export function clearProgressRecords(email) {
  clearUserProgress(email);
}

// ─── Subject inference ────────────────────────────────────────────────────────
const SUBJECT_KEYWORDS = {
  "Mathematics":      ["math","algebra","geometry","calculus","trigonometry","statistics","arithmetic","number","equation","fraction","probability","quadratic","polynomial","logarithm"],
  "Biology":          ["biology","cell","photosynthesis","respiration","genetics","dna","ecosystem","evolution","organism","mitosis","meiosis","enzyme","digestion","reproduction","osmosis"],
  "Chemistry":        ["chemistry","atom","molecule","periodic","element","reaction","acid","base","bond","compound","oxidation","electrolysis","titration","mole","solubility"],
  "Physics":          ["physics","force","motion","energy","wave","light","electricity","magnetism","gravity","newton","velocity","acceleration","momentum","optics","thermodynamics"],
  "History":          ["history","war","revolution","independence","colonialism","empire","treaty","ancient","medieval","civilization","democracy","constitution","president","kingdom"],
  "Geography":        ["geography","map","climate","weather","population","migration","continent","ocean","river","mountain","erosion","urbanisation","vegetation","latitude","longitude"],
  "English":          ["english","grammar","essay","poem","novel","shakespeare","vocabulary","comprehension","literature","tense","clause","narrative","metaphor","simile"],
  "Computer Science": ["computer","programming","algorithm","software","hardware","database","network","internet","python","javascript","binary","cpu","operating system"],
  "Economics":        ["economics","supply","demand","market","inflation","gdp","trade","budget","fiscal","monetary","microeconomics","macroeconomics","elasticity"],
  "CRE":              ["cre","christian","bible","gospel","faith","church","religion","god","jesus","prayer","commandment","sacrament"],
  "Agriculture":      ["agriculture","farming","crop","soil","irrigation","fertiliser","livestock","pest","harvest","plant","seed","agroforestry"],
};

function inferSubject(topic) {
  const lower = topic.toLowerCase();
  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return subject;
  }
  return "General";
}

// ─── Data aggregation ─────────────────────────────────────────────────────────
function groupBySubject(records) {
  const map = {};
  records.forEach(r => {
    const sub = r.subject || inferSubject(r.topic);
    if (!map[sub]) map[sub] = { subject: sub, records: [], topics: {} };
    map[sub].records.push(r);
    const t = r.topic;
    if (!map[sub].topics[t]) map[sub].topics[t] = [];
    map[sub].topics[t].push(r.score);
  });
  return Object.values(map).map(s => {
    const scores = s.records.map(r => r.score);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const topics = Object.entries(s.topics).map(([topic, topicScores]) => ({
      topic,
      attempts: topicScores.length,
      avg: Math.round(topicScores.reduce((a, b) => a + b, 0) / topicScores.length),
      best: Math.max(...topicScores),
      latest: topicScores[topicScores.length - 1],
    })).sort((a, b) => a.avg - b.avg);
    return { subject: s.subject, count: scores.length, avg, best: Math.max(...scores), topics };
  }).sort((a, b) => a.avg - b.avg);
}

function getFocusAreas(subjectGroups) {
  const weak = [];
  subjectGroups.forEach(s => {
    s.topics.forEach(t => {
      if (t.avg < 60) weak.push({ ...t, subject: s.subject });
    });
  });
  return weak.sort((a, b) => a.avg - b.avg).slice(0, 6);
}

// ─── Mini bar ─────────────────────────────────────────────────────────────────
function MiniBar({ value, max = 100, color }) {
  return (
    <div style={{ flex: 1, height: 7, background: "#1f2937", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
    </div>
  );
}

// ─── Focus area card ──────────────────────────────────────────────────────────
function FocusCard({ item, rank }) {
  const color = scoreColor(item.avg);
  const urgency = item.avg < 40 ? "🔴 Critical" : item.avg < 50 ? "🟠 Needs work" : "🟡 Improve";
  return (
    <div style={{ background: "#1a1a1a", border: `1px solid ${color}33`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${color}22`, border: `1.5px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color, flexShrink: 0 }}>
        {rank}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f1f1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.topic}</div>
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{item.subject} · {item.attempts} attempt{item.attempts !== 1 ? "s" : ""}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <MiniBar value={item.avg} color={color} />
          <span style={{ fontSize: 11, color, fontWeight: 700, flexShrink: 0 }}>{item.avg}%</span>
        </div>
      </div>
      <div style={{ fontSize: 10, color, fontWeight: 700, flexShrink: 0, textAlign: "right" }}>{urgency}</div>
    </div>
  );
}

// ─── Subject panel ────────────────────────────────────────────────────────────
function SubjectPanel({ group, expanded, onToggle }) {
  const color = scoreColor(group.avg);
  const grade = getGrade(group.avg);
  return (
    <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, overflow: "hidden", marginBottom: 10 }}>
      <button onClick={onToggle} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <div style={{ width: 4, height: 36, borderRadius: 2, background: color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f1f1" }}>{group.subject}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <MiniBar value={group.avg} color={color} />
            <span style={{ fontSize: 12, color, fontWeight: 700, flexShrink: 0 }}>{group.avg}%</span>
          </div>
          <div style={{ fontSize: 10, color: "#6b7280", marginTop: 3 }}>
            {group.count} quiz{group.count !== 1 ? "zes" : ""} · Best: {group.best}% · Grade {grade.failed ? "F" : grade.grade}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${color}18`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color }}>{grade.failed ? "F" : grade.grade}</span>
          </div>
          <span style={{ fontSize: 18, color: "#555", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>⌄</span>
        </div>
      </button>
      {expanded && (
        <div style={{ borderTop: "1px solid #2a2a2a", padding: "10px 16px 14px" }}>
          <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
            Topic Breakdown · weakest first
          </div>
          {group.topics.map((t, i) => {
            const tc = scoreColor(t.avg);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < group.topics.length - 1 ? "1px solid #222" : "none" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: tc, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "#d1d5db", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.topic}</div>
                  <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{t.attempts} attempt{t.attempts !== 1 ? "s" : ""} · Best: {t.best}%</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, width: 140, flexShrink: 0 }}>
                  <MiniBar value={t.avg} color={tc} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: tc, minWidth: 34, textAlign: "right" }}>{t.avg}%</span>
                </div>
                {t.avg < 60 && (
                  <span style={{ fontSize: 10, fontWeight: 700, background: `${tc}22`, color: tc, border: `1px solid ${tc}44`, padding: "2px 7px", borderRadius: 999, flexShrink: 0 }}>
                    Focus
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ records }) {
  if (records.length < 2) return null;
  const last = records.slice(-14);
  const W = 100, H = 32;
  const pts = last.map((r, i) => [(i / (last.length - 1)) * W, H - (r.score / 100) * H]);
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const trend = last[last.length - 1].score - last[0].score;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width={W} height={H} style={{ overflow: "visible" }}>
        <path d={d} fill="none" stroke="#ea580c" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => i === pts.length - 1 && <circle key={i} cx={p[0]} cy={p[1]} r={3} fill="#ea580c" />)}
      </svg>
      <span style={{ fontSize: 11, color: trend >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700 }}>
        {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
      </span>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div style={{ flex: 1, background: "#1a1a1a", borderRadius: 10, padding: "12px 10px", textAlign: "center", border: "1px solid #2a2a2a" }}>
      <div style={{ fontSize: 20, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 9, color: "#555", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────
function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ flex: 1, padding: "7px 0", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: active ? "#ea580c" : "transparent", color: active ? "#fff" : "#6b7280", transition: "all 0.2s" }}>
      {label}
    </button>
  );
}

// ─── Main ProgressDashboard ───────────────────────────────────────────────────
export default function ProgressDashboard({ onClose, userEmail }) {
  const [tab,             setTab]             = useState("subjects");
  const [records,         setRecords]         = useState([]);
  const [subjectGroups,   setSubjectGroups]   = useState([]);
  const [focusAreas,      setFocusAreas]      = useState([]);
  const [expandedSubject, setExpandedSubject] = useState(null);

  const reload = () => {
    const r = getUserProgress(userEmail);
    setRecords(r);
    const groups = groupBySubject(r);
    setSubjectGroups(groups);
    setFocusAreas(getFocusAreas(groups));
  };

  useEffect(() => {
    reload();
    window.addEventListener("sca_progress_updated", reload);
    return () => window.removeEventListener("sca_progress_updated", reload);
  }, [userEmail]);

  const overall  = records.length > 0 ? Math.round(records.reduce((s, r) => s + r.score, 0) / records.length) : null;
  const best     = records.length > 0 ? Math.max(...records.map(r => r.score)) : null;
  const subjects = subjectGroups.length;
  const recent   = [...records].reverse().slice(0, 8);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 7000, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#141414", border: "1px solid #2a2a2a", borderRadius: 18, width: 540, maxWidth: "95%", maxHeight: "90vh", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>

        {/* Watermark */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 0 }}>
          <img src={COAT_URL} alt="" style={{ width: 260, height: 260, opacity: 0.04, objectFit: "contain" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

          {/* Header */}
          <div style={{ padding: "20px 22px 0", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <h3 style={{ color: "#f1f1f1", margin: 0, fontSize: 17, fontWeight: 800 }}>📊 Progress Dashboard</h3>
                <p style={{ color: "#6b7280", margin: "3px 0 0", fontSize: 12 }}>Track your performance by subject and topic</p>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>✕</button>
            </div>

            {/* Student identity banner */}
            {userEmail && (
              <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: "8px 14px", marginBottom: 12, fontSize: 12, color: "#93c5fd", display: "flex", alignItems: "center", gap: 6 }}>
                📧 <strong>{userEmail}</strong>
              </div>
            )}

            {/* Overview stats */}
            {records.length > 0 && (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <StatCard label="Total Quizzes" value={records.length}    color="#ea580c" />
                  <StatCard label="Subjects"       value={subjects}         color="#3b82f6" />
                  <StatCard label="Average"         value={`${overall}%`}   color={scoreColor(overall)} />
                  <StatCard label="Best Score"      value={`${best}%`}      color="#22c55e" />
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 12, padding: "12px 16px", marginBottom: 14, border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <StarRating score={overall} size={22} showLabel={true} />
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>Score trend</div>
                    <Sparkline records={records} />
                  </div>
                </div>
              </>
            )}

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 14, background: "#1a1a1a", padding: 4, borderRadius: 8, border: "1px solid #2a2a2a" }}>
              {[
                { key: "subjects", label: "📚 By Subject" },
                { key: "focus",    label: "🎯 Focus Areas" },
                { key: "recent",   label: "🕐 Recent" },
              ].map(t => <Tab key={t.key} label={t.label} active={tab === t.key} onClick={() => setTab(t.key)} />)}
            </div>
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 22px 22px" }}>

            {records.length === 0 ? (
              <div style={{ background: "#1a1a1a", borderRadius: 12, padding: 32, textAlign: "center", border: "1px dashed #2a2a2a" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
                <div style={{ fontSize: 15, color: "#f1f1f1", fontWeight: 700, marginBottom: 8 }}>No quiz data yet</div>
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                  Complete a quiz and your results will appear here, broken down by subject and topic.
                </div>
              </div>
            ) : (
              <>
                {/* SUBJECTS TAB */}
                {tab === "subjects" && (
                  <div>
                    <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
                      {subjectGroups.length} subject{subjectGroups.length !== 1 ? "s" : ""} · weakest first · tap to expand topics
                    </div>
                    {subjectGroups.map(group => (
                      <SubjectPanel
                        key={group.subject}
                        group={group}
                        expanded={expandedSubject === group.subject}
                        onToggle={() => setExpandedSubject(prev => prev === group.subject ? null : group.subject)}
                      />
                    ))}
                  </div>
                )}

                {/* FOCUS AREAS TAB */}
                {tab === "focus" && (
                  <div>
                    {focusAreas.length === 0 ? (
                      <div style={{ background: "#052e16", border: "1px solid #166534", borderRadius: 12, padding: 24, textAlign: "center" }}>
                        <div style={{ fontSize: 32, marginBottom: 10 }}>🏆</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#4ade80", marginBottom: 6 }}>No weak areas found!</div>
                        <div style={{ fontSize: 13, color: "#86efac" }}>You're scoring 60%+ on everything. Keep it up!</div>
                      </div>
                    ) : (
                      <>
                        <div style={{ background: "#1c0a00", border: "1px solid #9a3412", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span style={{ fontSize: 20, flexShrink: 0 }}>🎯</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#f97316", marginBottom: 4 }}>
                              {focusAreas.length} topic{focusAreas.length !== 1 ? "s" : ""} need your attention
                            </div>
                            <div style={{ fontSize: 12, color: "#fed7aa", lineHeight: 1.6 }}>
                              These are the topics where you're scoring below 60%. Focusing on these will improve your overall grade the most.
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {focusAreas.map((item, i) => (
                            <FocusCard key={`${item.subject}-${item.topic}`} item={item} rank={i + 1} />
                          ))}
                        </div>
                        <div style={{ marginTop: 20 }}>
                          <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                            Subject averages — weakest first
                          </div>
                          {subjectGroups.map(g => {
                            const c = scoreColor(g.avg);
                            return (
                              <div key={g.subject} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f1f" }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0 }} />
                                <div style={{ fontSize: 13, color: "#d1d5db", fontWeight: 500, width: 130, flexShrink: 0 }}>{g.subject}</div>
                                <MiniBar value={g.avg} color={c} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: c, minWidth: 36, textAlign: "right" }}>{g.avg}%</span>
                                {g.avg < 50 && (
                                  <span style={{ fontSize: 10, color: c, fontWeight: 700, background: `${c}22`, border: `1px solid ${c}44`, padding: "2px 7px", borderRadius: 999, flexShrink: 0 }}>Weak</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* RECENT TAB */}
                {tab === "recent" && (
                  <div>
                    <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
                      Last {recent.length} quizzes
                    </div>
                    {recent.map((r, i) => {
                      const c = scoreColor(r.score);
                      const grade = getGrade(r.score);
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#1a1a1a", borderRadius: 10, marginBottom: 7, border: "1px solid #2a2a2a" }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${c}18`, border: `2px solid ${c}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: c }}>{grade.failed ? "F" : grade.grade}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f1f1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.topic}</div>
                            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                              {r.subject || inferSubject(r.topic)} · {new Date(r.date).toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: 17, fontWeight: 800, color: c }}>{r.score}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Clear data */}
            {records.length > 0 && (
              <button
                onClick={() => { if (window.confirm("Clear all your progress data?")) clearUserProgress(userEmail); }}
                style={{ marginTop: 16, width: "100%", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", color: "#ef4444", borderRadius: 8, padding: "9px 0", cursor: "pointer", fontSize: 12 }}
              >
                Clear My Progress Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}