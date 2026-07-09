// lib/security/sanitize.js
// ─── Input sanitisation and validation ───────────────────────────────────────

/**
 * Strip HTML tags and dangerous characters from a string.
 * Use on ALL user-supplied text before storing or passing to AI.
 */
export function sanitizeText(input, maxLength = 2000) {
  if (typeof input !== "string") return "";
  return input
    .slice(0, maxLength)
    .replace(/<[^>]*>/g, "")              // strip HTML tags
    .replace(/javascript:/gi, "")         // strip JS protocol
    .replace(/on\w+\s*=/gi, "")           // strip inline event handlers
    .replace(/[<>]/g, c => c === "<" ? "&lt;" : "&gt;")  // encode remaining < >
    .trim();
}

/**
 * Sanitise a filename — allow only safe characters.
 * Prevents path traversal attacks (../../etc/passwd).
 */
export function sanitizeFilename(name) {
  if (typeof name !== "string") return "file";
  return name
    .replace(/[^a-zA-Z0-9._\- ]/g, "_")  // whitelist safe chars
    .replace(/\.{2,}/g, ".")              // collapse .. sequences
    .replace(/^[./\\]+/, "")             // strip leading dots/slashes
    .slice(0, 128)
    .trim() || "file";
}

/**
 * Sanitise a userId / roomCode — alphanumeric + underscore + dash only.
 */
export function sanitizeId(id, maxLength = 64) {
  if (typeof id !== "string") return "";
  return id.replace(/[^a-zA-Z0-9_\-]/g, "").slice(0, maxLength);
}

/**
 * Comprehensive email validation.
 *
 * Checks (in order):
 *  1. Must be a non-empty string
 *  2. Must contain exactly one @ symbol
 *  3. Local part (before @): 1–64 chars, valid characters only, no leading/trailing dot,
 *     no consecutive dots
 *  4. Domain part (after @): must have at least one dot, no leading/trailing hyphen/dot,
 *     no consecutive dots, no spaces
 *  5. TLD (last segment after final dot): 2–63 letters only (no digits, no hyphens)
 *  6. Total length must not exceed 254 characters (RFC 5321)
 *
 * Returns { valid: boolean, error: string|null }
 * Use isValidEmail() for a simple boolean check.
 */
export function validateEmail(email) {
  if (typeof email !== "string" || !email.trim()) {
    return { valid: false, error: "Email address is required." };
  }

  const trimmed = email.trim().toLowerCase();

  // ── 1. Length ──────────────────────────────────────────────────────────────
  if (trimmed.length > 254) {
    return { valid: false, error: "Email address is too long (max 254 characters)." };
  }

  // ── 2. Exactly one @ ──────────────────────────────────────────────────────
  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount === 0) return { valid: false, error: "Email address must contain an @ symbol." };
  if (atCount > 1)  return { valid: false, error: "Email address must contain only one @ symbol." };

  const [local, domain] = trimmed.split("@");

  // ── 3. Local part ─────────────────────────────────────────────────────────
  if (!local || local.length === 0) {
    return { valid: false, error: "Email address must have a name before the @ symbol." };
  }
  if (local.length > 64) {
    return { valid: false, error: "The part before @ must not exceed 64 characters." };
  }
  if (local.startsWith(".") || local.endsWith(".")) {
    return { valid: false, error: "The part before @ cannot start or end with a dot." };
  }
  if (/\.{2,}/.test(local)) {
    return { valid: false, error: "The part before @ cannot contain consecutive dots." };
  }
  // Allow letters, digits, and: . _ % + - (RFC 5321 common subset)
  if (!/^[a-zA-Z0-9._%+\-]+$/.test(local)) {
    return { valid: false, error: "The part before @ contains invalid characters." };
  }

  // ── 4. Domain part ────────────────────────────────────────────────────────
  if (!domain || domain.length === 0) {
    return { valid: false, error: "Email address must have a domain after the @ symbol." };
  }
  if (domain.length > 255) {
    return { valid: false, error: "The domain part is too long." };
  }
  if (!domain.includes(".")) {
    return { valid: false, error: "The domain must contain at least one dot (e.g. gmail.com)." };
  }
  if (domain.startsWith(".") || domain.endsWith(".")) {
    return { valid: false, error: "The domain cannot start or end with a dot." };
  }
  if (domain.startsWith("-") || domain.endsWith("-")) {
    return { valid: false, error: "The domain cannot start or end with a hyphen." };
  }
  if (/\.{2,}/.test(domain)) {
    return { valid: false, error: "The domain cannot contain consecutive dots." };
  }
  if (/\s/.test(domain)) {
    return { valid: false, error: "The domain cannot contain spaces." };
  }
  // Each domain label must be valid
  const labels = domain.split(".");
  for (const label of labels) {
    if (label.length === 0) {
      return { valid: false, error: "The domain contains an empty section." };
    }
    if (label.length > 63) {
      return { valid: false, error: `Domain label "${label}" is too long (max 63 characters).` };
    }
    if (!/^[a-zA-Z0-9\-]+$/.test(label)) {
      return { valid: false, error: `Domain label "${label}" contains invalid characters.` };
    }
    if (label.startsWith("-") || label.endsWith("-")) {
      return { valid: false, error: `Domain label "${label}" cannot start or end with a hyphen.` };
    }
  }

  // ── 5. TLD must be letters only, 2–63 chars ───────────────────────────────
  const tld = labels[labels.length - 1];
  if (!/^[a-zA-Z]{2,63}$/.test(tld)) {
    return {
      valid: false,
      error: `"${tld}" is not a valid top-level domain. It must contain only letters (e.g. .com, .ug, .org).`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Simple boolean wrapper — use when you just need true/false.
 * For user-facing error messages use validateEmail() instead.
 */
export function isValidEmail(email) {
  return validateEmail(email).valid;
}

/**
 * Detect prompt injection attempts in user messages.
 * Returns { safe: boolean, reason: string|null }
 */
export function checkPromptInjection(text) {
  if (typeof text !== "string") return { safe: false, reason: "Invalid input type" };

  const patterns = [
    { re: /ignore\s+(all\s+)?previous\s+instructions?/i,      reason: "Prompt override attempt" },
    { re: /you\s+are\s+now\s+(a\s+)?(?!a\s+study)/i,          reason: "Role override attempt" },
    { re: /forget\s+(everything|all|your\s+instructions)/i,    reason: "Instruction reset attempt" },
    { re: /system\s*:\s*|<\s*system\s*>/i,                     reason: "System prompt injection" },
    { re: /\[INST\]|\[\/INST\]|<\|im_start\|>/i,               reason: "Model token injection" },
    { re: /reveal\s+(your\s+)?(system\s+)?prompt/i,            reason: "Prompt extraction attempt" },
    { re: /act\s+as\s+(if\s+you\s+are\s+)?(an?\s+)?(?!a\s+study\s+coach)/i, reason: "Persona override" },
    { re: /\bDAN\b|\bjailbreak\b/i,                             reason: "Jailbreak attempt" },
  ];

  for (const { re, reason } of patterns) {
    if (re.test(text)) return { safe: false, reason };
  }
  return { safe: true, reason: null };
}

/**
 * Validate quiz question structure.
 */
export function validateQuizQuestion(q) {
  if (!q || typeof q !== "object") return false;
  if (typeof q.question !== "string" || q.question.trim().length < 5) return false;
  if (typeof q.options !== "object" || Object.keys(q.options).length !== 4) return false;
  if (!["A", "B", "C", "D"].includes(q.correct_answer)) return false;
  return true;
}

/**
 * Validate and sanitise an entire incoming request body.
 * Pass a schema: { field: { type, required, maxLength, enum } }
 */
export function validateBody(body, schema) {
  const errors = [];
  const clean  = {};

  for (const [field, rules] of Object.entries(schema)) {
    const val = body?.[field];

    if (rules.required && (val === undefined || val === null || val === "")) {
      errors.push(`${field} is required`);
      continue;
    }
    if (val === undefined || val === null) continue;

    if (rules.type === "string") {
      if (typeof val !== "string") { errors.push(`${field} must be a string`); continue; }
      const trimmed = sanitizeText(val, rules.maxLength || 5000);
      if (rules.minLength && trimmed.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
        continue;
      }
      if (rules.enum && !rules.enum.includes(val)) {
        errors.push(`${field} must be one of: ${rules.enum.join(", ")}`);
        continue;
      }
      clean[field] = trimmed;
    }

    if (rules.type === "number") {
      const n = Number(val);
      if (isNaN(n)) { errors.push(`${field} must be a number`); continue; }
      if (rules.min !== undefined && n < rules.min) { errors.push(`${field} must be >= ${rules.min}`); continue; }
      if (rules.max !== undefined && n > rules.max) { errors.push(`${field} must be <= ${rules.max}`); continue; }
      clean[field] = n;
    }

    if (rules.type === "boolean") {
      clean[field] = Boolean(val);
    }
  }

  return { valid: errors.length === 0, errors, clean };
}