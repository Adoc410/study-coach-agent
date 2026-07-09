"use client";

function parseMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^### (.+)/.test(line)) {
      elements.push(<div key={i} style={{ fontSize: 14, fontWeight: 800, color: "#ea580c", margin: "10px 0 4px" }}>{line.replace(/^### /, "")}</div>);
    } else if (/^## (.+)/.test(line)) {
      elements.push(<div key={i} style={{ fontSize: 15, fontWeight: 800, color: "#ea580c", margin: "12px 0 4px" }}>{line.replace(/^## /, "")}</div>);
    } else if (/^- (.+)/.test(line) || /^\* (.+)/.test(line)) {
      elements.push(<div key={i} style={{ display: "flex", gap: 8, marginBottom: 3 }}><span style={{ color: "#ea580c", flexShrink: 0 }}>•</span><span>{inlineMarkdown(line.replace(/^[-*] /, ""))}</span></div>);
    } else if (/^\d+\. (.+)/.test(line)) {
      const num = line.match(/^(\d+)\./)[1];
      elements.push(<div key={i} style={{ display: "flex", gap: 8, marginBottom: 3 }}><span style={{ color: "#ea580c", flexShrink: 0, minWidth: 16 }}>{num}.</span><span>{inlineMarkdown(line.replace(/^\d+\. /, ""))}</span></div>);
    } else if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: 6 }} />);
    } else {
      elements.push(<div key={i} style={{ marginBottom: 2, lineHeight: 1.65 }}>{inlineMarkdown(line)}</div>);
    }
    i++;
  }
  return elements;
}

function inlineMarkdown(text) {
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2]) parts.push(<strong key={m.index} style={{ color: "#fff", fontWeight: 700 }}>{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={m.index} style={{ fontStyle: "italic" }}>{m[3]}</em>);
    else if (m[4]) parts.push(<code key={m.index} style={{ background: "rgba(234,88,12,0.2)", color: "#fb923c", borderRadius: 4, padding: "1px 5px", fontSize: "0.9em", fontFamily: "monospace" }}>{m[4]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 0 ? text : parts;
}

export default function MessageBubble({ message, onQuizOpen }) {
  const isUser = message.role === "user";
  const isError = message.isError;

  if (isUser) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <div style={{ background: "linear-gradient(135deg, #ea580c, #c2410c)", color: "#fff", borderRadius: "18px 18px 4px 18px", padding: "10px 14px", maxWidth: "78%", fontSize: 14, lineHeight: 1.5 }}>
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12, gap: 8 }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, marginTop: 4 }}>
        🎓
      </div>
      <div style={{ maxWidth: "82%" }}>
        <div style={{
          background: isError ? "rgba(239,68,68,0.12)" : "rgba(26,26,26,0.82)",
          border: `1px solid ${isError ? "rgba(239,68,68,0.3)" : "rgba(60,60,60,0.5)"}`,
          backdropFilter: "blur(4px)",
          borderRadius: "18px 18px 18px 4px",
          padding: "12px 16px",
          color: isError ? "#fca5a5" : "#e5e7eb",
          fontSize: 14, lineHeight: 1.65,
        }}>
          {parseMarkdown(message.content)}
        </div>

        {/* Quiz card trigger */}
        {message.quizData && !message.quizSubmitted && (
          <button onClick={onQuizOpen} style={{
            marginTop: 8, background: "linear-gradient(135deg, #ea580c, #d97706)",
            color: "#fff", border: "none", borderRadius: 10,
            padding: "9px 18px", fontWeight: 700, cursor: "pointer",
            fontSize: 13, display: "flex", alignItems: "center", gap: 7,
          }}>
            🎯 Open Quiz — {message.quizData.questions?.length} questions
          </button>
        )}
        {message.quizData && message.quizSubmitted && (
          <div style={{ marginTop: 6, fontSize: 11, color: "#22c55e" }}>✓ Quiz submitted</div>
        )}
      </div>
    </div>
  );
}
