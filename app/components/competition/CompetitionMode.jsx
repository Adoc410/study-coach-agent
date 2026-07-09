"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function genCode() {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

const ROOMS_KEY = "sca_comp_rooms";

function loadRooms() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(ROOMS_KEY) || "{}"); } catch { return {}; }
}

function saveRooms(rooms) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
}

function getRoom(code) { return loadRooms()[code] || null; }

function upsertRoom(code, updater) {
  const rooms = loadRooms();
  rooms[code] = updater(rooms[code] || null);
  saveRooms(rooms);
  return rooms[code];
}

// ─── Timer bar ────────────────────────────────────────────────────────────────
function TimerBar({ seconds, total }) {
  const pct = (seconds / total) * 100;
  const color = pct > 60 ? "#22c55e" : pct > 30 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>Time remaining</span>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{seconds}s</span>
      </div>
      <div style={{ background: "#1f2937", borderRadius: 4, height: 6 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 1s linear, background 0.5s" }} />
      </div>
    </div>
  );
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
function Leaderboard({ players, onClose }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 8500,
      background: "rgba(0,0,0,0.92)", display: "flex",
      alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#141414", border: "2px solid #ea580c",
        borderRadius: 16, padding: 32, width: 400, maxWidth: "90%",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
        <h2 style={{ color: "#ea580c", margin: "0 0 20px", fontSize: 20 }}>Final Leaderboard</h2>
        {sorted.map((p, i) => (
          <div key={p.id} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: i === 0 ? "rgba(245,158,11,0.15)" : "#1a1a1a",
            border: `1px solid ${i === 0 ? "#f59e0b" : "#2a2a2a"}`,
            borderRadius: 8, padding: "10px 14px", marginBottom: 8,
          }}>
            <span style={{ fontSize: 18 }}>{medals[i] || `#${i + 1}`}</span>
            <span style={{ flex: 1, textAlign: "left", marginLeft: 10, fontSize: 14, color: "#f1f1f1", fontWeight: 600 }}>
              {p.name}
            </span>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#ea580c" }}>{p.score} pts</span>
          </div>
        ))}
        <button onClick={onClose} style={{
          marginTop: 20, background: "#ea580c", color: "#fff",
          border: "none", borderRadius: 8, padding: "10px 28px",
          fontWeight: 700, cursor: "pointer", fontSize: 14,
        }}>
          Done
        </button>
      </div>
    </div>
  );
}

// ─── Main CompetitionMode ─────────────────────────────────────────────────────
const QUESTION_TIME = 20; // seconds per question

export default function CompetitionMode({ quizData, onClose }) {
  const [phase, setPhase] = useState("lobby"); // lobby | playing | done
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [myId] = useState(() => Date.now().toString());
  const [room, setRoom] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [selected, setSelected] = useState(null);
  const [myScore, setMyScore] = useState(0);
  const timerRef = useRef(null);
  const pollRef = useRef(null);

  // Poll for room updates every second
  const poll = useCallback(() => {
    if (!roomCode) return;
    const r = getRoom(roomCode);
    if (r) setRoom(r);
  }, [roomCode]);

  useEffect(() => {
    if (phase === "playing" || phase === "waiting") {
      pollRef.current = setInterval(poll, 1000);
    }
    return () => clearInterval(pollRef.current);
  }, [phase, poll]);

  // Question timer
  useEffect(() => {
    if (phase !== "playing") return;
    setTimeLeft(QUESTION_TIME);
    setSelected(null);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          nextQuestion();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [qIndex, phase]);

  const createRoom = () => {
    if (!playerName.trim() || !quizData) return;
    const code = genCode();
    const newRoom = {
      code,
      host: myId,
      questions: quizData.questions,
      topic: quizData.topic,
      players: [{ id: myId, name: playerName.trim(), score: 0, joined: Date.now() }],
      started: false,
      currentQ: 0,
      finished: false,
    };
    upsertRoom(code, () => newRoom);
    setRoomCode(code);
    setRoom(newRoom);
    setPhase("waiting");
  };

  const joinRoom = () => {
    if (!playerName.trim() || !joinCode.trim()) return;
    const code = joinCode.toUpperCase();
    const r = getRoom(code);
    if (!r) { alert("Room not found. Check the code."); return; }
    if (r.started) { alert("Game already started."); return; }
    const updated = upsertRoom(code, (existing) => ({
      ...existing,
      players: [...(existing?.players || []), { id: myId, name: playerName.trim(), score: 0, joined: Date.now() }],
    }));
    setRoomCode(code);
    setRoom(updated);
    setPhase("waiting");
  };

  const startGame = () => {
    upsertRoom(roomCode, (r) => ({ ...r, started: true, currentQ: 0 }));
    setPhase("playing");
    setQIndex(0);
  };

  const handleAnswer = (option) => {
    if (selected !== null) return;
    setSelected(option);
    clearInterval(timerRef.current);
    const q = quizData.questions[qIndex];
    const isCorrect = option === q.answer;
    const points = isCorrect ? Math.max(10, timeLeft * 5) : 0;
    const newScore = myScore + points;
    setMyScore(newScore);
    // Update score in room
    upsertRoom(roomCode, (r) => ({
      ...r,
      players: r.players.map(p => p.id === myId ? { ...p, score: newScore } : p),
    }));
    // Auto-advance after 1.5s
    setTimeout(nextQuestion, 1500);
  };

  const nextQuestion = () => {
    const next = qIndex + 1;
    if (next >= quizData.questions.length) {
      upsertRoom(roomCode, (r) => ({ ...r, finished: true }));
      setPhase("done");
    } else {
      setQIndex(next);
      upsertRoom(roomCode, (r) => ({ ...r, currentQ: next }));
    }
  };

  const inp = {
    width: "100%", background: "#111", border: "1px solid #333",
    borderRadius: 8, padding: "10px 14px", color: "#f1f1f1",
    fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 10,
  };

  if (phase === "done") {
    const players = room?.players || [{ id: myId, name: playerName, score: myScore }];
    return <Leaderboard players={players} onClose={onClose} />;
  }

  if (phase === "playing" && quizData) {
    const q = quizData.questions[qIndex];
    const correctOpt = q.answer;
    const optLetters = ["A", "B", "C", "D"];

    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 8500,
        background: "#0d0d0d", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ width: 500, maxWidth: "92%" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ color: "#ea580c", fontWeight: 700, fontSize: 14 }}>
              🏆 Room: {roomCode}
            </span>
            <span style={{ color: "#9ca3af", fontSize: 13 }}>
              Q {qIndex + 1}/{quizData.questions.length} · {myScore} pts
            </span>
          </div>

          <TimerBar seconds={timeLeft} total={QUESTION_TIME} />

          {/* Question */}
          <div style={{
            background: "#1a1a1a", borderRadius: 12, padding: 20, marginBottom: 16,
            border: "1px solid #2a2a2a",
          }}>
            <div style={{ fontSize: 13, color: "#ea580c", marginBottom: 8 }}>
              Question {qIndex + 1}
            </div>
            <div style={{ fontSize: 16, color: "#f1f1f1", fontWeight: 600, lineHeight: 1.5 }}>
              {q.question}
            </div>
          </div>

          {/* Options */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {q.options.map((opt, i) => {
              const letter = optLetters[i];
              const isSelected = selected === letter;
              const isCorrect = correctOpt === letter;
              let bg = "#1a1a1a";
              let border = "#2a2a2a";
              if (selected !== null) {
                if (isCorrect) { bg = "rgba(34,197,94,0.2)"; border = "#22c55e"; }
                else if (isSelected && !isCorrect) { bg = "rgba(239,68,68,0.2)"; border = "#ef4444"; }
              } else if (isSelected) {
                bg = "rgba(234,88,12,0.2)"; border = "#ea580c";
              }

              return (
                <button key={letter} onClick={() => handleAnswer(letter)} style={{
                  background: bg, border: `2px solid ${border}`,
                  borderRadius: 10, padding: "14px 12px", cursor: selected ? "default" : "pointer",
                  textAlign: "left", transition: "all 0.2s",
                }}>
                  <span style={{ fontSize: 12, color: "#ea580c", fontWeight: 700, marginRight: 6 }}>{letter}</span>
                  <span style={{ fontSize: 13, color: "#f1f1f1" }}>{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Live scores */}
          <div style={{ marginTop: 16, background: "#1a1a1a", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>LIVE SCORES</div>
            {(room?.players || []).sort((a, b) => b.score - a.score).map((p, i) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: p.id === myId ? "#ea580c" : "#f1f1f1" }}>
                  {i + 1}. {p.name}{p.id === myId ? " (you)" : ""}
                </span>
                <span style={{ color: "#f59e0b", fontWeight: 700 }}>{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "waiting") {
    const isHost = room?.host === myId;
    const players = room?.players || [];
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 8500,
        background: "rgba(0,0,0,0.92)", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ background: "#141414", border: "1px solid #2a2a2a", borderRadius: 16, padding: 32, width: 380, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>Room Code</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: "#ea580c", letterSpacing: 6, marginBottom: 20 }}>{roomCode}</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>Share this code with other students to join!</div>
          <div style={{ background: "#1a1a1a", borderRadius: 10, padding: 12, marginBottom: 20 }}>
            {players.map(p => (
              <div key={p.id} style={{ fontSize: 13, color: "#f1f1f1", padding: "4px 0" }}>
                👤 {p.name}{p.id === myId ? " (you)" : ""}
              </div>
            ))}
          </div>
          {isHost ? (
            <button onClick={startGame} disabled={players.length < 1} style={{
              background: "#ea580c", color: "#fff", border: "none",
              borderRadius: 8, padding: "12px 28px", fontWeight: 700, cursor: "pointer", fontSize: 14, width: "100%",
            }}>
              🚀 Start Game ({players.length} player{players.length !== 1 ? "s" : ""})
            </button>
          ) : (
            <div style={{ color: "#9ca3af", fontSize: 13 }}>Waiting for host to start…</div>
          )}
          <button onClick={onClose} style={{ marginTop: 12, background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 12 }}>
            Leave room
          </button>
        </div>
      </div>
    );
  }

  // Lobby
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 8500,
      background: "rgba(0,0,0,0.88)", display: "flex",
      alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#141414", border: "1px solid #2a2a2a",
        borderRadius: 16, padding: 28, width: 380, maxWidth: "90%",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ color: "#ea580c", margin: 0, fontSize: 16, fontWeight: 700 }}>🏆 Quiz Competition</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        {!quizData && (
          <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 16, background: "#1a1a1a", padding: 12, borderRadius: 8 }}>
            ℹ️ Generate a quiz first, then open Competition Mode to play with others.
          </div>
        )}

        <label style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 4 }}>Your Name</label>
        <input style={inp} value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Enter your name" />

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={createRoom} disabled={!quizData || !playerName.trim()} style={{
            flex: 1, background: "#ea580c", color: "#fff", border: "none",
            borderRadius: 8, padding: "11px 0", fontWeight: 700, cursor: "pointer", fontSize: 13,
            opacity: (!quizData || !playerName.trim()) ? 0.4 : 1,
          }}>
            + Create Room
          </button>
        </div>

        <div style={{ textAlign: "center", color: "#555", fontSize: 12, margin: "14px 0" }}>— OR JOIN —</div>

        <input style={inp} value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="Enter room code (e.g. AB3X9)" maxLength={5} />
        <button onClick={joinRoom} disabled={!joinCode.trim() || !playerName.trim()} style={{
          width: "100%", background: "#1a1a1a", color: "#f1f1f1",
          border: "1px solid #333", borderRadius: 8, padding: "11px 0",
          fontWeight: 700, cursor: "pointer", fontSize: 13,
          opacity: (!joinCode.trim() || !playerName.trim()) ? 0.4 : 1,
        }}>
          Join Room
        </button>
      </div>
    </div>
  );
}
