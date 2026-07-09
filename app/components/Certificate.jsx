"use client";
import { useState } from "react";

const COAT_OF_ARMS = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Coat_of_arms_of_Uganda.svg/200px-Coat_of_arms_of_Uganda.svg.png";

// ─── Certificate canvas renderer ──────────────────────────────────────────────
function drawCertificate(canvas, { studentName, subject, topic, grade, score, date, type }) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  // Background
  ctx.fillStyle = "#fffdf5";
  ctx.fillRect(0, 0, W, H);

  // Outer gold border
  ctx.strokeStyle = "#d97706";
  ctx.lineWidth = 16;
  ctx.strokeRect(8, 8, W - 16, H - 16);

  // Inner border
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, W - 48, H - 48);

  // Decorative corner ornaments
  const corners = [[32, 32], [W - 32, 32], [32, H - 32], [W - 32, H - 32]];
  corners.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#d97706";
    ctx.fill();
  });

  // Header text
  ctx.fillStyle = "#78350f";
  ctx.font = "bold 18px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("REPUBLIC OF UGANDA", W / 2, 70);
  ctx.fillText("NATIONAL AI STUDY COACH", W / 2, 92);

  // Divider
  ctx.strokeStyle = "#d97706";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(80, 105);
  ctx.lineTo(W - 80, 105);
  ctx.stroke();

  // Certificate type title
  ctx.fillStyle = "#92400e";
  ctx.font = "italic 14px Georgia, serif";
  ctx.fillText("CERTIFICATE OF", W / 2, 135);

  const typeLabel = type === "fullSyllabus"
    ? "COMPLETION – FULL SYLLABUS"
    : type === "term"
    ? `COMPLETION – ${topic.toUpperCase()}`
    : "ACADEMIC ACHIEVEMENT";

  ctx.font = "bold 22px Georgia, serif";
  ctx.fillStyle = "#78350f";
  ctx.fillText(typeLabel, W / 2, 162);

  // Divider
  ctx.strokeStyle = "#d97706";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, 175);
  ctx.lineTo(W - 120, 175);
  ctx.stroke();

  // "This certifies that"
  ctx.font = "italic 13px Georgia, serif";
  ctx.fillStyle = "#6b7280";
  ctx.fillText("This is to certify that", W / 2, 205);

  // Student name
  ctx.font = "bold 30px Georgia, serif";
  ctx.fillStyle = "#1f2937";
  ctx.fillText(studentName || "Student", W / 2, 242);

  // Underline name
  const nameWidth = ctx.measureText(studentName || "Student").width;
  ctx.strokeStyle = "#d97706";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - nameWidth / 2, 250);
  ctx.lineTo(W / 2 + nameWidth / 2, 250);
  ctx.stroke();

  // Subject / topic text
  ctx.font = "13px Georgia, serif";
  ctx.fillStyle = "#374151";
  ctx.fillText("has successfully completed the study of", W / 2, 278);

  ctx.font = "bold 17px Georgia, serif";
  ctx.fillStyle = "#92400e";
  ctx.fillText(`${subject} – ${topic}`, W / 2, 302);

  // Performance row
  ctx.font = "13px Georgia, serif";
  ctx.fillStyle = "#374151";
  ctx.fillText(`with a score of ${score}% — Grade: ${grade}`, W / 2, 328);

  // Date
  ctx.font = "italic 12px Georgia, serif";
  ctx.fillStyle = "#9ca3af";
  ctx.fillText(`Awarded on ${date}`, W / 2, 358);

  // Seal circle
  ctx.beginPath();
  ctx.arc(W / 2, 415, 44, 0, Math.PI * 2);
  ctx.strokeStyle = "#d97706";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(W / 2, 415, 37, 0, Math.PI * 2);
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = "bold 22px Georgia, serif";
  ctx.fillStyle = "#d97706";
  ctx.textAlign = "center";
  ctx.fillText("✦", W / 2, 425);

  // Footer
  ctx.font = "10px Georgia, serif";
  ctx.fillStyle = "#9ca3af";
  ctx.fillText("Uganda AI Study Coach · For God and My Country", W / 2, H - 38);
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function Certificate({ studentName, subject, topic, grade, score, date, type = "topic", onClose }) {
  const [downloading, setDownloading] = useState(false);

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 680;
      canvas.height = 480;
      drawCertificate(canvas, { studentName, subject, topic, grade, score, date, type });

      // Convert to PNG and download
      const link = document.createElement("a");
      link.download = `Certificate_${studentName}_${topic}.png`.replace(/\s/g, "_");
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(6px)",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "linear-gradient(135deg, #fffdf5 0%, #fff8e1 100%)",
        border: "4px solid #d97706",
        borderRadius: 16,
        padding: "40px 50px",
        maxWidth: 680,
        width: "90%",
        textAlign: "center",
        position: "relative",
        boxShadow: "0 25px 60px rgba(0,0,0,0.5), inset 0 0 0 2px #fbbf24",
      }}>
        {/* Coat of Arms */}
        <img src={COAT_OF_ARMS} alt="Uganda Coat of Arms" style={{
          width: 64, height: 64, objectFit: "contain", marginBottom: 8,
        }} />

        <div style={{ fontSize: 11, color: "#92400e", fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>
          REPUBLIC OF UGANDA · NATIONAL AI STUDY COACH
        </div>

        <div style={{
          borderTop: "1.5px solid #d97706", borderBottom: "1.5px solid #d97706",
          padding: "6px 0", margin: "12px 0",
        }}>
          <div style={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}>CERTIFICATE OF</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#78350f", letterSpacing: 1 }}>
            {type === "fullSyllabus" ? "COMPLETION – FULL SYLLABUS" : type === "term" ? `COMPLETION – ${topic}` : "ACADEMIC ACHIEVEMENT"}
          </div>
        </div>

        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>This is to certify that</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#1f2937", borderBottom: "2px solid #d97706", display: "inline-block", paddingBottom: 4, marginBottom: 12 }}>
          {studentName || "Student"}
        </div>

        <div style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>
          has successfully completed
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>
          {subject} — {topic}
        </div>
        <div style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>
          with a score of <strong>{score}%</strong> — Grade: <strong style={{ color: score >= 70 ? "#16a34a" : score >= 50 ? "#ea580c" : "#ef4444" }}>{grade}</strong>
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic", marginBottom: 24 }}>
          Awarded on {date}
        </div>

        {/* Seal */}
        <div style={{
          width: 70, height: 70, borderRadius: "50%",
          border: "3px solid #d97706", display: "flex",
          alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: 28,
          background: "rgba(217,119,6,0.08)",
        }}>
          🏅
        </div>

        <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 20 }}>
          Uganda AI Study Coach · For God and My Country
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={downloadPDF} disabled={downloading} style={{
            background: "linear-gradient(135deg, #d97706, #ea580c)",
            color: "#fff", border: "none", borderRadius: 8,
            padding: "10px 24px", fontWeight: 700, cursor: "pointer", fontSize: 13,
          }}>
            {downloading ? "Downloading…" : "⬇ Download Certificate"}
          </button>
          <button onClick={onClose} style={{
            background: "transparent", color: "#6b7280",
            border: "1px solid #374151", borderRadius: 8,
            padding: "10px 20px", cursor: "pointer", fontSize: 13,
          }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
