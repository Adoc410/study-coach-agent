"use client";

import { useState, useEffect, useCallback } from "react";
import StarRating from "./StarRating";
import {
  getGrade,
  hasReachedLimit,
  incrementAttempt,
  getRemainingAttempts,
} from "../lib/grading";
import { saveProgressRecord } from "./ProgressDashboard";

const LETTERS = ["A", "B", "C", "D", "E"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizeOptions(q) {
  if (Array.isArray(q.options)) {
    return q.options.map((o, i) => {
      if (typeof o === "string" && /^[A-E][\):\.]/.test(o))
        return [o[0], o.slice(2).trim()];
      return [LETTERS[i] || String(i + 1), String(o)];
    });
  }
  if (q.options && typeof q.options === "object")
    return Object.entries(q.options);
  return [];
}

function resolveAnswer(quiz, q) {
  if (quiz.answerKey) {
    const k = quiz.answerKey.find((k) => k.id === q.id);
    if (k)
      return {
        correct: k.correct_answer ?? k.answer ?? "",
        explanation: k.explanation ?? "",
      };
  }
  return {
    correct: q.answer ?? q.correct_answer ?? "",
    explanation: q.explanation ?? "",
  };
}

// ─── Daily limit wall ─────────────────────────────────────────────────────────
function LimitWall({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.96)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#141414", border: "2px solid #ea580c", borderRadius: 20, padding: 36, width: 380, maxWidth: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
        <h2 style={{ color: "#ea580c", margin: "0 0 8px", fontSize: 20 }}>Daily Limit Reached</h2>
        <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
          You have used all <strong style={{ color: "#f1f1f1" }}>10 free attempts</strong> for today.
          <br />Your limit resets in 24 hours.
        </p>
        <div style={{ background: "#1a1a1a", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>Attempts remaining</div>
          <div style={{ fontSize: 40, fontWeight: 900, color: "#ef4444" }}>0</div>
        </div>
        <button style={{ width: "100%", background: "linear-gradient(135deg,#ea580c,#d97706)", color: "#fff", border: "none", borderRadius: 10, padding: "14px 0", fontWeight: 800, cursor: "pointer", fontSize: 15, marginBottom: 10 }}>
          ⚡ Upgrade to Unlimited — Free for Uganda Students
        </button>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 13 }}>
          Come back tomorrow
        </button>
      </div>
    </div>
  );
}

// ─── Option button ────────────────────────────────────────────────────────────
function OptionButton({ letter, text, selected, graded, onSelect, disabled }) {
  let borderColor = "#2a2a2a", bg = "#141414", letterBg = "transparent";
  let letterBorder = "#374151", letterColor = "#9ca3af", textColor = "#d1d5db", icon = null;

  if (graded) {
    if (letter === graded.correct_answer) {
      borderColor = "#22c55e"; bg = "#052e16"; letterBg = "#22c55e";
      letterBorder = "#22c55e"; letterColor = "#fff"; textColor = "#4ade80"; icon = "✓";
    } else if (letter === graded.selected && !graded.is_correct) {
      borderColor = "#ef4444"; bg = "#1c0505"; letterBg = "#ef4444";
      letterBorder = "#ef4444"; letterColor = "#fff"; textColor = "#f87171"; icon = "✗";
    } else {
      bg = "#111"; borderColor = "#1a1a1a"; letterColor = "#333"; textColor = "#444";
    }
  } else if (selected) {
    borderColor = "#ea580c"; bg = "#1c0a00"; letterBg = "#ea580c";
    letterBorder = "#ea580c"; letterColor = "#fff"; textColor = "#f97316";
  }

  return (
    <button onClick={onSelect} disabled={disabled} role="radio" aria-checked={selected}
      style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", borderRadius: 12, border: `1.5px solid ${borderColor}`, background: bg, cursor: disabled ? "default" : "pointer", transition: "all 0.15s" }}
      onMouseEnter={e => { if (!graded && !selected && !disabled) { e.currentTarget.style.borderColor = "#ea580c"; e.currentTarget.style.background = "#1c0a00"; } }}
      onMouseLeave={e => { if (!graded && !selected && !disabled) { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.background = "#141414"; } }}
    >
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: `1.5px solid ${letterBorder}`, background: letterBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: letterColor, flexShrink: 0, transition: "all 0.15s" }}>
        {letter}
      </div>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: textColor, lineHeight: 1.5, transition: "color 0.15s" }}>{text}</span>
      {icon && <span style={{ fontSize: 16, flexShrink: 0 }}>{icon === "✓" ? <span style={{ color: "#4ade80" }}>✓</span> : <span style={{ color: "#f87171" }}>✗</span>}</span>}
    </button>
  );
}

// ─── Question pane ────────────────────────────────────────────────────────────
function QuestionPane({ q, idx, qKey, answers, results, onSelect, aiExplanations, onAskAI, aiLoading }) {
  const selected = answers[qKey];
  const graded   = results?.graded?.[qKey] || null;
  const opts     = normalizeOptions(q);

  return (
    <div style={{ padding: "24px 20px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", color: "#6b7280", textTransform: "uppercase" }}>Question {idx + 1}</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: "#f1f1f1", lineHeight: 1.55, display: "flex", gap: 10, alignItems: "flex-start" }}>
        {results && <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{graded?.is_correct ? "✅" : "❌"}</span>}
        {q.question}
      </div>
      <div role="radiogroup" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {opts.map(([letter, text]) => (
          <OptionButton key={letter} letter={letter} text={text} selected={selected === letter} graded={graded} onSelect={() => !results && onSelect(qKey, letter)} disabled={!!results} />
        ))}
      </div>
      {results && !graded?.is_correct && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {graded?.explanation && (
            <div style={{ background: "#1c0a00", border: "1px solid #9a3412", borderRadius: 10, padding: "10px 14px" }}>
              <p style={{ fontSize: 13, color: "#fed7aa", margin: 0, lineHeight: 1.6 }}>
                <strong>Explanation:</strong> {graded.explanation}
              </p>
            </div>
          )}
          <button onClick={() => onAskAI(q, qKey)} disabled={aiLoading === qKey}
            style={{ background: "rgba(234,88,12,0.1)", border: "1px solid rgba(234,88,12,0.3)", color: "#ea580c", borderRadius: 8, padding: "8px 14px", cursor: aiLoading === qKey ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, alignSelf: "flex-start" }}>
            {aiLoading === qKey ? "⏳ Asking AI..." : "🤖 Ask AI why I was wrong"}
          </button>
          {aiExplanations[qKey] && (
            <div style={{ background: "rgba(234,88,12,0.06)", border: "1px solid rgba(234,88,12,0.15)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#d1d5db", lineHeight: 1.7 }}>
              <strong style={{ color: "#ea580c" }}>AI:</strong> {aiExplanations[qKey]}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Results panel ────────────────────────────────────────────────────────────
function ResultsPanel({ results, quiz, onRetry, onReview }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); }, []);
  const gradeInfo = getGrade(results.score);

  function motivMsg(pct) {
    if (pct === 100) return "Perfect score! You have completely mastered this topic!";
    if (pct >= 80)  return "Excellent work! You have a strong understanding of this topic.";
    if (pct >= 60)  return "Good effort! Review the weak areas to reach distinction.";
    if (pct >= 50)  return "Don't give up — consistent practice is the key.\nYou can do this!";
    return "Review the material carefully and try again. You've got this!";
  }

  return (
    <div style={{ padding: "32px 24px 28px", display: "flex", flexDirection: "column", alignItems: "center", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)", transition: "opacity 0.5s ease, transform 0.5s ease" }}>
      <StarRating score={results.score} size={26} showLabel={false} />
      <div style={{ width: 96, height: 96, borderRadius: "50%", background: "#222", border: `3px solid ${gradeInfo.color}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "16px 0" }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: gradeInfo.color }}>{gradeInfo.failed ? "F" : gradeInfo.grade}</span>
      </div>
      <div style={{ fontSize: 40, fontWeight: 800, color: "#f1f1f1", marginBottom: 8 }}>{results.score}%</div>
      <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", lineHeight: 1.65, marginBottom: 24, maxWidth: 320, whiteSpace: "pre-line" }}>{motivMsg(results.score)}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, width: "100%", marginBottom: 24 }}>
        {[
          { label: "CORRECT", value: `${results.correct}/${results.total}`, color: "#22c55e" },
          { label: "WRONG",   value: results.wrong,                         color: "#ef4444" },
          { label: "GRADE",   value: gradeInfo.failed ? "F" : gradeInfo.grade, color: "#d1d5db" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#141414", border: "1px solid #2a2a2a", borderRadius: 12, padding: "14px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: "0.5px" }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
        <button onClick={onReview} style={{ width: "100%", padding: "13px 0", borderRadius: 10, border: "1.5px solid #2a2a2a", background: "#1a1a1a", color: "#d1d5db", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          👁 Review answers
        </button>
        <button onClick={onRetry} style={{ width: "100%", padding: "13px 0", borderRadius: 10, border: "1.5px solid #2a2a2a", background: "#1a1a1a", color: "#d1d5db", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          🔁 Restart quiz
        </button>
      </div>
    </div>
  );
}

// ─── Review list ──────────────────────────────────────────────────────────────
function ReviewList({ quiz, results, answers, getQKey, onSelectQuestion, onBack }) {
  const gradeInfo = getGrade(results.score);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 20px", background: "#111", borderBottom: "1px solid #2a2a2a", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px" }}>←</button>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f1f1" }}>Answer review</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{results.score}% · Grade {gradeInfo.failed ? "F" : gradeInfo.grade} · Click any question to see details</div>
        </div>
      </div>
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8, maxHeight: 480, overflowY: "auto" }}>
        {(quiz.questions || []).map((q, i) => {
          const key = getQKey(q, i);
          const graded = results.graded?.[key];
          const ok = graded?.is_correct;
          return (
            <button key={key} onClick={() => onSelectQuestion(i)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, border: "1px solid #2a2a2a", background: "#141414", cursor: "pointer", textAlign: "left", transition: "border-color 0.15s", width: "100%" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#374151"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#2a2a2a"}
            >
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: ok ? "#052e16" : "#1c0505", border: `1.5px solid ${ok ? "#16a34a" : "#dc2626"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: ok ? "#4ade80" : "#f87171", flexShrink: 0 }}>
                {ok ? "✓" : "✗"}
              </div>
              <span style={{ flex: 1, fontSize: 13, color: "#d1d5db", fontWeight: 500, lineHeight: 1.4 }}>Q{i + 1}: {q.question}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap", background: ok ? "#052e16" : "#1c0505", color: ok ? "#4ade80" : "#f87171", border: `1px solid ${ok ? "#16a34a" : "#dc2626"}` }}>
                {ok ? "Correct" : "Wrong"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Detail view ──────────────────────────────────────────────────────────────
function DetailView({ q, idx, qKey, answers, results, total, onBack, onPrev, onNext, aiExplanations, onAskAI, aiLoading }) {
  const gradeInfo = getGrade(results.score);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 20px", background: "#111", borderBottom: "1px solid #2a2a2a", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px" }}>←</button>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f1f1" }}>Q{idx + 1} of {total}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{results.score}% · Grade {gradeInfo.failed ? "F" : gradeInfo.grade}</div>
        </div>
      </div>
      <QuestionPane q={q} idx={idx} qKey={qKey} answers={answers} results={results} onSelect={() => {}} aiExplanations={aiExplanations} onAskAI={onAskAI} aiLoading={aiLoading} />
      <div style={{ display: "flex", gap: 10, padding: "12px 20px 20px" }}>
        <button onClick={onPrev} disabled={idx === 0} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #2a2a2a", background: idx === 0 ? "#0d0d0d" : "#1a1a1a", color: idx === 0 ? "#333" : "#d1d5db", fontSize: 13, fontWeight: 600, cursor: idx === 0 ? "not-allowed" : "pointer" }}>← Prev</button>
        <button onClick={onNext} disabled={idx === total - 1} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: idx === total - 1 ? "#0d0d0d" : "#ea580c", color: idx === total - 1 ? "#333" : "#fff", fontSize: 13, fontWeight: 600, cursor: idx === total - 1 ? "not-allowed" : "pointer" }}>Next →</button>
      </div>
    </div>
  );
}

// ─── Main QuizCard ────────────────────────────────────────────────────────────
export default function QuizCard({ quiz, onClose, studentName, subject, userEmail }) {
  const [answers,        setAnswers]        = useState({});
  const [results,        setResults]        = useState(null);
  const [stepIdx,        setStepIdx]        = useState(0);
  const [detailIdx,      setDetailIdx]      = useState(0);
  const [mode,           setMode]           = useState("quiz");
  const [limitHit,       setLimitHit]       = useState(false);
  const [remaining,      setRemaining]      = useState(10);
  const [aiExplanations, setAiExplanations] = useState({});
  const [aiLoading,      setAiLoading]      = useState(null);

  useEffect(() => { setRemaining(getRemainingAttempts()); }, []);

  const questions = quiz?.questions || [];
  const total     = questions.length;
  const answered  = Object.keys(answers).length;
  const allDone   = answered === total;

  const getQKey = useCallback((q, i) => String(q.id ?? i), []);

  const selectAnswer = useCallback((key, letter) => {
    if (results) return;
    setAnswers(prev => ({ ...prev, [key]: letter }));
  }, [results]);

  const handleSubmit = useCallback(() => {
    if (!allDone || results) return;
    if (hasReachedLimit()) { setLimitHit(true); return; }
    incrementAttempt();
    setRemaining(getRemainingAttempts());

    let correct = 0;
    const graded = {};
    questions.forEach((q, i) => {
      const key = getQKey(q, i);
      const { correct: correctAns, explanation } = resolveAnswer(quiz, q);
      const sel = answers[key];
      const ok  = sel === correctAns;
      if (ok) correct++;
      graded[key] = { selected: sel, correct_answer: correctAns, explanation, is_correct: ok };
    });
    const score = Math.round((correct / total) * 100);
    setResults({ graded, score, correct, wrong: total - correct, total });
    setMode("results");

    // ── Save progress scoped to this student's email ──────────────────────
    saveProgressRecord(
      userEmail,
      quiz.topic   || subject || "Quiz",
      score,
      quiz.subject || subject || ""
    );
  }, [allDone, results, questions, answers, quiz, getQKey, total, subject, userEmail]);

  const askAI = useCallback(async (q, key) => {
    setAiLoading(key);
    const g = results?.graded?.[key];
    try {
      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Quiz question: "${q.question}"\nStudent answered: ${g?.selected}\nCorrect answer: ${g?.correct_answer}\n\nIn 2-3 sentences, explain why the student's answer was wrong and what concept they should review. Be encouraging and specific.`,
          threadId: "quiz-ai-" + Date.now(),
        }),
      });
      const data = await res.json();
      setAiExplanations(prev => ({ ...prev, [key]: data.response }));
    } catch {
      setAiExplanations(prev => ({ ...prev, [key]: "Could not fetch explanation. Please try again." }));
    }
    setAiLoading(null);
  }, [results]);

  const handleRetry = () => {
    setAnswers({}); setResults(null); setStepIdx(0);
    setDetailIdx(0); setMode("quiz"); setAiExplanations({}); setAiLoading(null);
  };

  if (!quiz || questions.length === 0) return null;

  const currentQ   = questions[stepIdx];
  const currentKey = getQKey(currentQ, stepIdx);
  const progressPct = ((stepIdx + 1) / total) * 100;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#1c1c1e", borderRadius: 16, width: "100%", maxWidth: 620, maxHeight: "92vh", overflowY: "auto", display: "flex", flexDirection: "column", position: "relative" }}>

        {onClose && (
          <button onClick={onClose} aria-label="Close quiz" style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 20, lineHeight: 1, zIndex: 10 }}>×</button>
        )}

        {/* QUIZ MODE */}
        {mode === "quiz" && (
          <>
            <div style={{ background: "#111", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #2a2a2a", flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f1f1" }}>Question {stepIdx + 1} of {total}</span>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>{answered}/{total} answered</span>
            </div>
            <div style={{ height: 4, background: "#2a2a2a", flexShrink: 0 }}>
              <div style={{ height: "100%", width: `${progressPct}%`, background: "#ea580c", transition: "width 0.3s" }} />
            </div>
            <QuestionPane q={currentQ} idx={stepIdx} qKey={currentKey} answers={answers} results={null} onSelect={selectAnswer} aiExplanations={aiExplanations} onAskAI={askAI} aiLoading={aiLoading} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", background: "#111", borderTop: "1px solid #2a2a2a", gap: 12, flexShrink: 0 }}>
              <button onClick={() => setStepIdx(s => Math.max(0, s - 1))} disabled={stepIdx === 0}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, border: "1.5px solid #2a2a2a", background: stepIdx === 0 ? "#0d0d0d" : "#1a1a1a", color: stepIdx === 0 ? "#333" : "#d1d5db", fontSize: 13, fontWeight: 600, cursor: stepIdx === 0 ? "not-allowed" : "pointer" }}>
                ← Prev
              </button>
              {stepIdx < total - 1 ? (
                <button onClick={() => setStepIdx(s => Math.min(total - 1, s + 1))}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, border: "none", background: "#ea580c", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Next →
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={!allDone}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, border: "none", background: allDone ? "#ea580c" : "#1a1a1a", color: allDone ? "#fff" : "#444", fontSize: 13, fontWeight: 700, cursor: allDone ? "pointer" : "not-allowed" }}>
                  {allDone ? "✈ Submit quiz" : `Answer all questions (${total - answered} left)`}
                </button>
              )}
            </div>
          </>
        )}

        {mode === "results" && results && <ResultsPanel results={results} quiz={quiz} onRetry={handleRetry} onReview={() => setMode("review")} />}
        {mode === "review" && results && <ReviewList quiz={quiz} results={results} answers={answers} getQKey={getQKey} onSelectQuestion={i => { setDetailIdx(i); setMode("detail"); }} onBack={() => setMode("results")} />}
        {mode === "detail" && results && <DetailView q={questions[detailIdx]} idx={detailIdx} qKey={getQKey(questions[detailIdx], detailIdx)} answers={answers} results={results} total={total} onBack={() => setMode("review")} onPrev={() => setDetailIdx(d => Math.max(0, d - 1))} onNext={() => setDetailIdx(d => Math.min(total - 1, d + 1))} aiExplanations={aiExplanations} onAskAI={askAI} aiLoading={aiLoading} />}
      </div>

      {limitHit && <LimitWall onClose={() => setLimitHit(false)} />}
    </div>
  );
}