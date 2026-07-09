"use client";
import { useState, useEffect } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { app } from "../lib/firebase";

const auth     = getAuth(app);
const provider = new GoogleAuthProvider();

// ─── Storage key helpers (per-user isolation) ─────────────────────────────────
export const SESSION_KEY  = "sca_session";
export const LOCKOUT_KEY  = "sca_teacher_lockout";

export function userKey(email, suffix) {
  return `sca_u_${btoa(email.toLowerCase().trim())}_${suffix}`;
}

// ─── Session helpers ──────────────────────────────────────────────────────────
export function saveSession(user) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...user, sessionStart: Date.now() }));
}

export function loadSession() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

// ─── Teacher lockout ──────────────────────────────────────────────────────────
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS   = 30 * 60 * 1000;

function getLockout() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(LOCKOUT_KEY) || "null"); } catch { return null; }
}
function setLockout(data) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCKOUT_KEY, JSON.stringify(data));
}
function checkLockout() {
  const data = getLockout();
  if (!data) return { locked: false, attempts: 0 };
  if (data.lockedUntil && Date.now() < data.lockedUntil) {
    const mins = Math.ceil((data.lockedUntil - Date.now()) / 60000);
    return { locked: true, mins };
  }
  if (data.lockedUntil && Date.now() >= data.lockedUntil) {
    setLockout({ attempts: 0, lockedUntil: null });
    return { locked: false, attempts: 0 };
  }
  return { locked: false, attempts: data.attempts || 0 };
}
function recordFailedAttempt() {
  const data     = getLockout() || { attempts: 0 };
  const attempts = (data.attempts || 0) + 1;
  if (attempts >= MAX_ATTEMPTS) {
    setLockout({ attempts, lockedUntil: Date.now() + LOCKOUT_MS });
  } else {
    setLockout({ attempts, lockedUntil: null });
  }
  return attempts;
}
function resetLockout() { setLockout({ attempts: 0, lockedUntil: null }); }

// ─── useCurrentUser hook ──────────────────────────────────────────────────────
export function useCurrentUser() {
  const [user,  setUser]  = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // First check session storage for fast load
    const session = loadSession();
    if (session) setUser(session);

    // Then listen to Firebase auth state
    const unsub = onAuthStateChanged(auth, firebaseUser => {
      if (firebaseUser) {
        const userData = {
          id:     firebaseUser.uid,
          name:   firebaseUser.displayName || firebaseUser.email.split("@")[0],
          email:  firebaseUser.email,
          avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || firebaseUser.email)}&background=3b82f6&color=fff&bold=true&size=64`,
          role:   "student",
          emailVerified: firebaseUser.emailVerified,
        };
        saveSession(userData);
        setUser(userData);
      } else {
        clearSession();
        setUser(null);
      }
      setReady(true);
    });

    return () => unsub();
  }, []);

  const updateUser = (u) => {
    setUser(u);
    if (u) saveSession(u);
    else { clearSession(); signOut(auth); }
  };

  return [user, updateUser, ready];
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const inp = {
  width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a",
  borderRadius: 10, padding: "12px 14px", color: "#f1f1f1",
  fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 12,
  fontFamily: "inherit",
};

// ─── Student Auth ─────────────────────────────────────────────────────────────
function StudentAuth({ onLogin, onSwitchToTeacher }) {
  const [mode,          setMode]          = useState("login");
  const [name,          setName]          = useState("");
  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [confirm,       setConfirm]       = useState("");
  const [showPass,      setShowPass]      = useState(false);
  const [error,         setError]         = useState("");
  const [info,          setInfo]          = useState("");
  const [loading,       setLoading]       = useState(false);
  const [resetMode,     setResetMode]     = useState(false);
  const [resetEmail,    setResetEmail]    = useState("");
  const [resetSent,     setResetSent]     = useState(false);

  const handleGoogleLogin = async () => {
    setError(""); setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      onLogin({
        id:     u.uid,
        name:   u.displayName || u.email.split("@")[0],
        email:  u.email,
        avatar: u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.email)}&background=3b82f6&color=fff&bold=true&size=64`,
        role:   "student",
        emailVerified: true,
      });
    } catch (err) {
      setError(getFriendlyError(err.code));
    }
    setLoading(false);
  };

  const handleEmailAuth = async () => {
    setError(""); setInfo("");
    if (!email.trim())    { setError("Please enter your email.");    return; }
    if (!password.trim()) { setError("Please enter your password."); return; }

    if (mode === "register") {
      if (!name.trim())         { setError("Please enter your name.");               return; }
      if (password.length < 6)  { setError("Password must be at least 6 characters."); return; }
      if (password !== confirm) { setError("Passwords do not match.");               return; }
      setLoading(true);
      try {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        // Send verification email
        await sendEmailVerification(cred.user);
        setInfo("✅ Account created! Please check your email to verify your account before signing in.");
        setMode("login");
        setPassword(""); setConfirm("");
      } catch (err) {
        setError(getFriendlyError(err.code));
      }
      setLoading(false);
      return;
    }

    // Login
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (!cred.user.emailVerified) {
        setError("Please verify your email before signing in. Check your inbox for a verification link.");
        await signOut(auth);
        setLoading(false);
        return;
      }
      onLogin({
        id:     cred.user.uid,
        name:   cred.user.displayName || email.split("@")[0],
        email:  cred.user.email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cred.user.displayName || email)}&background=3b82f6&color=fff&bold=true&size=64`,
        role:   "student",
        emailVerified: true,
      });
    } catch (err) {
      setError(getFriendlyError(err.code));
    }
    setLoading(false);
  };

  const handlePasswordReset = async () => {
    if (!resetEmail.trim()) { setError("Please enter your email."); return; }
    setLoading(true); setError("");
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSent(true);
    } catch (err) {
      setError(getFriendlyError(err.code));
    }
    setLoading(false);
  };

  // ── Password reset screen ──
  if (resetMode) {
    return (
      <div>
        <div style={{ fontSize: 52, marginBottom: 8, textAlign: "center" }}>🔑</div>
        <h2 style={{ color: "#3b82f6", margin: "0 0 4px", fontSize: 20, fontWeight: 800, textAlign: "center" }}>Reset Password</h2>
        <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 20, textAlign: "center" }}>Enter your email and we'll send a reset link.</p>

        {resetSent ? (
          <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, padding: 16, textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📧</div>
            <div style={{ color: "#4ade80", fontSize: 14, fontWeight: 600 }}>Reset link sent!</div>
            <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>Check your inbox and follow the link to reset your password.</div>
          </div>
        ) : (
          <>
            <input style={inp} value={resetEmail} onChange={e => { setResetEmail(e.target.value); setError(""); }}
              placeholder="Your email address" type="email" onKeyDown={e => e.key === "Enter" && handlePasswordReset()} autoFocus />
            {error && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px" }}>⚠️ {error}</div>}
            <button onClick={handlePasswordReset} disabled={loading} style={{ width: "100%", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", borderRadius: 10, padding: "13px 0", fontWeight: 800, cursor: "pointer", fontSize: 15, marginBottom: 12, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          </>
        )}
        <button onClick={() => { setResetMode(false); setResetSent(false); setError(""); }} style={{ width: "100%", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 13 }}>
          ← Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 52, marginBottom: 8, textAlign: "center" }}>🎓</div>
      <h2 style={{ color: "#3b82f6", margin: "0 0 4px", fontSize: 20, fontWeight: 800, textAlign: "center" }}>
        {mode === "login" ? "Student Sign In" : "Create Account"}
      </h2>
      <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 20, textAlign: "center" }}>Your personalised AI Study Coach</p>

      {/* Mode toggle */}
      <div style={{ display: "flex", background: "#1a1a1a", borderRadius: 10, padding: 4, marginBottom: 20, border: "1px solid #2a2a2a" }}>
        {["login", "register"].map(m => (
          <button key={m} onClick={() => { setMode(m); setError(""); setInfo(""); }} style={{ flex: 1, padding: "8px 0", borderRadius: 7, border: "none", background: mode === m ? "#3b82f6" : "transparent", color: mode === m ? "#fff" : "#9ca3af", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>
            {m === "login" ? "Sign In" : "Register"}
          </button>
        ))}
      </div>

      {/* Google button */}
      <button onClick={handleGoogleLogin} disabled={loading} style={{ width: "100%", background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 10, padding: "11px 0", fontWeight: 700, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16, boxSizing: "border-box", opacity: loading ? 0.7 : 1 }}>
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Continue with Google
      </button>

      <div style={{ color: "#444", fontSize: 12, marginBottom: 14, textAlign: "center" }}>— or use email —</div>

      {mode === "register" && (
        <input style={inp} value={name} onChange={e => { setName(e.target.value); setError(""); }}
          placeholder="Full name" autoFocus />
      )}

      <input style={inp} value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
        placeholder="Email address" type="email" autoFocus={mode === "login"} />

      <div style={{ position: "relative", marginBottom: 12 }}>
        <input style={{ ...inp, marginBottom: 0, paddingRight: 44 }}
          value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
          placeholder="Password (min 6 characters)"
          type={showPass ? "text" : "password"}
          onKeyDown={e => e.key === "Enter" && handleEmailAuth()} />
        <button onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 16, padding: 0 }}>
          {showPass ? "🙈" : "👁️"}
        </button>
      </div>

      {mode === "register" && (
        <input style={inp} value={confirm} onChange={e => { setConfirm(e.target.value); setError(""); }}
          placeholder="Confirm password" type="password"
          onKeyDown={e => e.key === "Enter" && handleEmailAuth()} />
      )}

      {error && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px" }}>⚠️ {error}</div>}
      {info  && <div style={{ color: "#4ade80", fontSize: 12, marginBottom: 10, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, padding: "8px 12px" }}>{info}</div>}

      <button onClick={handleEmailAuth} disabled={loading} style={{ width: "100%", marginTop: 4, background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", borderRadius: 10, padding: "13px 0", fontWeight: 800, cursor: "pointer", fontSize: 15, marginBottom: 10, opacity: loading ? 0.7 : 1 }}>
        {loading ? "Please wait…" : mode === "login" ? "Sign In →" : "Create Account →"}
      </button>

      {mode === "login" && (
        <button onClick={() => { setResetMode(true); setResetEmail(email); setError(""); }} style={{ width: "100%", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 12, marginBottom: 10 }}>
          Forgot password?
        </button>
      )}

      <button onClick={onSwitchToTeacher} style={{ width: "100%", background: "none", border: "1px solid #2a2a2a", color: "#9ca3af", borderRadius: 10, padding: "10px 0", cursor: "pointer", fontSize: 13 }}>
        👩‍🏫 I am a Teacher →
      </button>
    </div>
  );
}

// ─── Teacher Auth ─────────────────────────────────────────────────────────────
function TeacherAuth({ onLogin, onSwitchToStudent }) {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [pin,      setPin]      = useState("");
  const [step,     setStep]     = useState("details");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [lockInfo, setLockInfo] = useState(checkLockout());

  useEffect(() => {
    const interval = setInterval(() => setLockInfo(checkLockout()), 30000);
    return () => clearInterval(interval);
  }, []);

  const goToPin = () => {
    if (!name.trim())  { setError("Please enter your name.");  return; }
    if (!email.trim()) { setError("Please enter your email."); return; }
    setError(""); setStep("pin");
  };

  const submitPin = async () => {
    const lock = checkLockout();
    if (lock.locked) { setError(`Too many failed attempts. Try again in ${lock.mins} minute${lock.mins !== 1 ? "s" : ""}.`); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/teacher-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        const attempts  = recordFailedAttempt();
        const remaining = MAX_ATTEMPTS - attempts;
        if (remaining <= 0) { setError("Too many failed attempts. Locked for 30 minutes."); }
        else { setError(`Incorrect PIN. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`); }
        setLockInfo(checkLockout());
        setLoading(false);
        return;
      }
      resetLockout();
      onLogin({
        id:      `teacher_${Date.now()}`,
        name:    name.trim(),
        email:   email.trim().toLowerCase(),
        role:    "teacher",
        avatar:  `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=ea580c&color=fff&bold=true&size=64`,
        joinedAt: new Date().toISOString(),
      });
    } catch {
      setError("Could not verify PIN. Check your connection.");
    }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ fontSize: 52, marginBottom: 8, textAlign: "center" }}>👩‍🏫</div>
      <h2 style={{ color: "#ea580c", margin: "0 0 4px", fontSize: 20, fontWeight: 800, textAlign: "center" }}>Teacher Sign In</h2>
      <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 24, textAlign: "center" }}>Restricted access — authorised staff only</p>

      {lockInfo.locked ? (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
          <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 14 }}>Account Locked</div>
          <div style={{ color: "#fca5a5", fontSize: 13, marginTop: 6 }}>Too many failed attempts. Try again in {lockInfo.mins} minute{lockInfo.mins !== 1 ? "s" : ""}.</div>
        </div>
      ) : step === "details" ? (
        <>
          <input style={inp} value={name}  onChange={e => { setName(e.target.value);  setError(""); }} placeholder="Your full name"  onKeyDown={e => e.key === "Enter" && goToPin()} autoFocus />
          <input style={inp} value={email} onChange={e => { setEmail(e.target.value); setError(""); }} placeholder="School email" type="email" onKeyDown={e => e.key === "Enter" && goToPin()} />
          {error && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 10 }}>⚠️ {error}</div>}
          <button onClick={goToPin} style={{ width: "100%", background: "linear-gradient(135deg,#ea580c,#d97706)", color: "#fff", border: "none", borderRadius: 10, padding: "13px 0", fontWeight: 800, cursor: "pointer", fontSize: 15, marginBottom: 14 }}>
            Next — Enter PIN →
          </button>
        </>
      ) : (
        <>
          <div style={{ background: "rgba(234,88,12,0.08)", border: "1px solid rgba(234,88,12,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#fed7aa" }}>
            👋 Welcome, <strong>{name}</strong>. Enter your teacher PIN to continue.
          </div>
          <input style={{ ...inp, textAlign: "center", letterSpacing: 6, fontSize: 20 }}
            type="password" maxLength={20} placeholder="••••••••"
            value={pin} onChange={e => { setPin(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && submitPin()} autoFocus />
          {error && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px" }}>⚠️ {error}</div>}
          <button onClick={submitPin} disabled={loading || !pin.trim()} style={{ width: "100%", background: "linear-gradient(135deg,#ea580c,#d97706)", color: "#fff", border: "none", borderRadius: 10, padding: "13px 0", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontSize: 15, marginBottom: 10, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Verifying…" : "Enter Teacher Portal →"}
          </button>
          <button onClick={() => { setStep("details"); setPin(""); setError(""); }} style={{ width: "100%", background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 12 }}>← Back</button>
        </>
      )}

      {step === "details" && !lockInfo.locked && (
        <button onClick={onSwitchToStudent} style={{ width: "100%", marginTop: 10, background: "none", border: "1px solid #2a2a2a", color: "#9ca3af", borderRadius: 10, padding: "10px 0", cursor: "pointer", fontSize: 13 }}>
          🎓 I am a Student →
        </button>
      )}

      <p style={{ fontSize: 10, color: "#444", marginTop: 14, lineHeight: 1.6, textAlign: "center" }}>
        Teacher PIN is required for all staff accounts. Contact your school administrator if you don't have one.
      </p>
    </div>
  );
}

// ─── Main AuthModal ───────────────────────────────────────────────────────────
export default function AuthModal({ onClose, onLogin }) {
  const [panel, setPanel] = useState("student");

  const handleLogin = (userData) => {
    saveSession(userData);
    onLogin(userData);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        background: "#141414",
        border: `1px solid ${panel === "teacher" ? "#ea580c44" : "#3b82f644"}`,
        borderRadius: 20, padding: "36px 32px", width: 400, maxWidth: "92%",
        boxShadow: panel === "teacher" ? "0 0 40px rgba(234,88,12,0.15)" : "0 0 40px rgba(59,130,246,0.15)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {panel === "student"
          ? <StudentAuth  onLogin={handleLogin} onSwitchToTeacher={() => setPanel("teacher")} />
          : <TeacherAuth  onLogin={handleLogin} onSwitchToStudent={() => setPanel("student")} />
        }
      </div>
    </div>
  );
}

// ─── UserPill ─────────────────────────────────────────────────────────────────
export function UserPill({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  if (!user) return null;
  const isTeacher = user.role === "teacher";
  const color     = isTeacher ? "#ea580c" : "#3b82f6";
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 8, background: "#1a1a1a", border: `1px solid ${color}44`, borderRadius: 999, padding: "4px 10px 4px 4px", cursor: "pointer" }}>
        <img src={user.avatar} alt={user.name} style={{ width: 28, height: 28, borderRadius: "50%" }} />
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 12, color: "#f1f1f1", fontWeight: 600, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
          <div style={{ fontSize: 9, color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{isTeacher ? "👩‍🏫 Teacher" : "🎓 Student"}</div>
        </div>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: 8, minWidth: 170, zIndex: 100 }} onClick={e => e.stopPropagation()}>
          <div style={{ padding: "6px 10px", fontSize: 11, color: "#9ca3af" }}>{user.email}</div>
          <div style={{ padding: "2px 10px 8px", fontSize: 11, color, fontWeight: 700, textTransform: "uppercase" }}>{isTeacher ? "👩‍🏫 Teacher" : "🎓 Student"}</div>
          <div style={{ borderTop: "1px solid #2a2a2a", paddingTop: 6 }}>
            <button onClick={() => { onLogout(); setOpen(false); }} style={{ width: "100%", background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12, textAlign: "left", padding: "4px 10px" }}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Friendly error messages ──────────────────────────────────────────────────
function getFriendlyError(code) {
  switch (code) {
    case "auth/email-already-in-use":      return "An account with this email already exists.";
    case "auth/invalid-email":             return "Please enter a valid email address.";
    case "auth/weak-password":             return "Password must be at least 6 characters.";
    case "auth/user-not-found":            return "No account found with this email.";
    case "auth/wrong-password":            return "Incorrect password. Try again or reset your password.";
    case "auth/invalid-credential":        return "Incorrect email or password.";
    case "auth/too-many-requests":         return "Too many attempts. Please wait a moment and try again.";
    case "auth/popup-closed-by-user":      return "Google sign-in was cancelled.";
    case "auth/network-request-failed":    return "Network error. Check your connection.";
    default:                               return "Something went wrong. Please try again.";
  }
}