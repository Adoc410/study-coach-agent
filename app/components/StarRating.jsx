"use client";

import { useEffect, useState } from "react";
import { getGrade } from "../lib/grading";

const GOLD       = "#f59e0b";
const GOLD_LIGHT = "#fcd34d";
const GRAY       = "#374151";

function Star({ filled, delay = 0, size = 32 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{
        transition:
          "transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s",
        transform: visible
          ? "scale(1) rotate(0deg)"
          : "scale(0) rotate(-30deg)",
        opacity: visible ? 1 : 0,
        filter: filled ? `drop-shadow(0 0 4px ${GOLD})` : "none",
        display: "inline-block",
      }}
    >
      <polygon
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        fill={filled ? GOLD : GRAY}
        stroke={filled ? GOLD_LIGHT : "#4b5563"}
        strokeWidth="1"
      />
    </svg>
  );
}

export default function StarRating({ score, size = 32, showLabel = true }) {
  const gradeInfo = getGrade(score);
  const stars     = gradeInfo.stars;
  const maxStars  = 5;

  return (
    <div style={{ textAlign: "center" }}>
      {/* Stars row */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 6,
          marginBottom: showLabel ? 10 : 0,
        }}
      >
        {Array.from({ length: maxStars }).map((_, i) => (
          <Star key={i} filled={i < stars} delay={i * 120} size={size} />
        ))}
      </div>

      {/* Grade badge */}
      {showLabel && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: gradeInfo.color,
              letterSpacing: "-1px",
            }}
          >
            {gradeInfo.failed ? "FAILED" : gradeInfo.grade}
          </span>
          <span
            style={{
              fontSize: 12,
              color: "#9ca3af",
              background: "#1f2937",
              padding: "2px 10px",
              borderRadius: 999,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            {gradeInfo.emoji} {gradeInfo.label}
          </span>
        </div>
      )}
    </div>
  );
}