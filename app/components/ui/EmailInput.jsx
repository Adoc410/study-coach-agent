"use client";
// app/components/ui/EmailInput.jsx
// ─── Email input with real-time validation feedback ───────────────────────────

import { useState, useId } from "react";
import { validateEmail }   from "../../../lib/security/sanitize.js";

/**
 * Props:
 *   value         string            — controlled value
 *   onChange      (value) => void   — called with the raw string on every keystroke
 *   onValidChange (value, valid) => void — called when blur/submit + validity known
 *   placeholder   string
 *   label         string
 *   required      boolean
 *   disabled      boolean
 *   autoComplete  string            — defaults to "email"
 */
export default function EmailInput({
  value = "",
  onChange,
  onValidChange,
  placeholder = "you@example.com",
  label       = "Email address",
  required    = true,
  disabled    = false,
  autoComplete = "email",
}) {
  const id            = useId();
  const errorId       = `${id}-error`;
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);

  const result  = validateEmail(value);
  const isEmpty = value.trim().length === 0;
  const showError = touched && !focused && (!result.valid || (required && isEmpty));

  // Colour tokens
  const borderColor = showError
    ? "#dc2626"
    : focused
      ? "#ea580c"
      : result.valid && touched
        ? "#16a34a"
        : "#2a2a2a";

  const iconColor = showError
    ? "#f87171"
    : result.valid && touched && !focused
      ? "#4ade80"
      : "#888";

  function handleChange(e) {
    const v = e.target.value;
    if (onChange) onChange(v);
  }

  function handleBlur() {
    setTouched(true);
    setFocused(false);
    const r = validateEmail(value);
    if (onValidChange) onValidChange(value, r.valid);
  }

  function handleFocus() {
    setFocused(true);
  }

  // Status icon
  const icon = isEmpty && !touched
    ? null
    : result.valid && touched && !focused
      ? "✓"
      : showError
        ? "✗"
        : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>

      {/* Label */}
      {label && (
        <label htmlFor={id} style={{ fontSize: "12px", fontWeight: 600, color: "#d1d5db", display: "flex", gap: "4px" }}>
          {label}
          {required && <span style={{ color: "#f97316" }} aria-hidden="true">*</span>}
        </label>
      )}

      {/* Input wrapper */}
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type="email"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-describedby={showError ? errorId : undefined}
          aria-invalid={showError ? "true" : "false"}
          aria-required={required ? "true" : undefined}
          style={{
            width:           "100%",
            backgroundColor: "#111",
            border:          `1px solid ${borderColor}`,
            borderRadius:    "8px",
            padding:         "9px 36px 9px 12px",
            fontSize:        "13px",
            color:           "#f1f1f1",
            outline:         "none",
            boxSizing:       "border-box",
            transition:      "border-color .18s",
            opacity:         disabled ? .5 : 1,
            cursor:          disabled ? "not-allowed" : "text",
          }}
        />

        {/* Status icon */}
        {icon && (
          <span
            aria-hidden="true"
            style={{
              position:   "absolute",
              right:      "10px",
              top:        "50%",
              transform:  "translateY(-50%)",
              fontSize:   "15px",
              fontWeight: 700,
              color:      iconColor,
              pointerEvents: "none",
            }}>
            {icon}
          </span>
        )}
      </div>

      {/* Error message */}
      {showError && (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          style={{ fontSize: "11px", color: "#f87171", margin: 0, display: "flex", alignItems: "center", gap: "5px" }}>
          <span aria-hidden="true">⚠</span>
          {required && isEmpty ? "Email address is required." : result.error}
        </p>
      )}

      {/* Success message */}
      {!showError && result.valid && touched && !focused && (
        <p style={{ fontSize: "11px", color: "#4ade80", margin: 0, display: "flex", alignItems: "center", gap: "5px" }}
          aria-live="polite">
          <span aria-hidden="true">✓</span> Looks good!
        </p>
      )}
    </div>
  );
}
