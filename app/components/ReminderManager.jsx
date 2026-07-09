"use client";
import { useState, useEffect, useRef } from "react";

const REMINDERS_KEY = "sca_reminders";
const COAT_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Coat_of_arms_of_Uganda.svg/400px-Coat_of_arms_of_Uganda.svg.png";

function loadReminders() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(REMINDERS_KEY) || "[]"); } catch { return []; }
}
function saveReminders(list) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("sca_reminders_updated"));
}

// ─── Reminder Banner ──────────────────────────────────────────────────────────
export function ReminderBanner({ onDismiss }) {
  const [dueReminders, setDueReminders] = useState([]);

  const checkDue = () => {
    const all = loadReminders();
    const now = Date.now();
    const due = all.filter(r => r.nextDue && now >= new Date(r.nextDue).getTime());
    setDueReminders(due);
  };

  useEffect(() => {
    checkDue();
    // Check every 60 seconds
    const interval = setInterval(checkDue, 60000);
    window.addEventListener("sca_reminders_updated", checkDue);
    return () => {
      clearInterval(interval);
      window.removeEventListener("sca_reminders_updated", checkDue);
    };
  }, []);

  const dismiss = (id) => {
    // Advance nextDue by 24h if daily, or remove if once
    const all = loadReminders();
    const updated = all.map(r => {
      if (r.id !== id) return r;
      if (r.daily) {
        const next = new Date(r.nextDue);
        next.setDate(next.getDate() + 1);
        return { ...r, nextDue: next.toISOString() };
      }
      return null;
    }).filter(Boolean);
    saveReminders(updated);
    setDueReminders(d => d.filter(r => r.id !== id));
    if (onDismiss) onDismiss(id);
  };

  if (dueReminders.length === 0) return null;

  return (
    <div style={{
      position:"fixed", top:0, left:0, right:0, zIndex:9000,
      background:"linear-gradient(90deg,#ea580c,#d97706)",
      color:"#fff", padding:"10px 20px",
      display:"flex", alignItems:"center", justifyContent:"space-between",
      boxShadow:"0 2px 12px rgba(234,88,12,0.5)",
    }}>
      <span style={{ fontSize:14, fontWeight:600 }}>
        ⏰ Study Reminder: <strong>{dueReminders[0].topic}</strong> — {dueReminders[0].message}
      </span>
      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
        {dueReminders.length > 1 && (
          <span style={{ fontSize:12, opacity:0.8 }}>+{dueReminders.length-1} more</span>
        )}
        <button onClick={()=>dismiss(dueReminders[0].id)} style={{
          background:"rgba(255,255,255,0.2)", border:"none", color:"#fff",
          borderRadius:6, padding:"4px 14px", cursor:"pointer", fontSize:12, fontWeight:600,
        }}>
          Dismiss
        </button>
      </div>
    </div>
  );
}

// ─── Main ReminderManager ─────────────────────────────────────────────────────
export default function ReminderManager({ onClose }) {
  const [reminders, setReminders] = useState([]);
  const [topic,     setTopic]     = useState("");
  const [message,   setMessage]   = useState("Time to review this topic!");
  const [time,      setTime]      = useState("08:00");
  const [daily,     setDaily]     = useState(true);
  const [saved,     setSaved]     = useState(false);

  useEffect(() => {
    setReminders(loadReminders());
    const sync = () => setReminders(loadReminders());
    window.addEventListener("sca_reminders_updated", sync);
    return () => window.removeEventListener("sca_reminders_updated", sync);
  }, []);

  const addReminder = () => {
    if (!topic.trim()) return;
    const now = new Date();
    const [h, m] = time.split(":").map(Number);
    const nextDue = new Date(now);
    nextDue.setHours(h, m, 0, 0);
    if (nextDue <= now) nextDue.setDate(nextDue.getDate() + 1);

    const reminder = {
      id: Date.now().toString(),
      topic: topic.trim(),
      message: message.trim() || "Time to study!",
      time,
      daily,
      nextDue: nextDue.toISOString(),
      createdAt: now.toISOString(),
    };
    const updated = [...reminders, reminder];
    setReminders(updated);
    saveReminders(updated);
    setTopic("");
    setMessage("Time to review this topic!");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const deleteReminder = (id) => {
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    saveReminders(updated);
  };

  const inp = {
    width:"100%", background:"#111", border:"1px solid #2a2a2a",
    borderRadius:8, padding:"9px 12px", color:"#f1f1f1",
    fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit",
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:7000, background:"rgba(0,0,0,0.88)", display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"#141414", border:"1px solid #2a2a2a",
        borderRadius:18, width:440, maxWidth:"94%",
        maxHeight:"85vh", overflowY:"auto",
        position:"relative",
      }}>
        {/* Coat of arms watermark */}
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none", zIndex:0 }}>
          <img src={COAT_URL} alt="" style={{ width:220, height:220, opacity:0.04, objectFit:"contain" }} />
        </div>

        <div style={{ position:"relative", zIndex:1, padding:26 }}>
          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <h3 style={{ color:"#ea580c", margin:0, fontSize:17, fontWeight:800 }}>⏰ Study Reminders</h3>
            <button onClick={onClose} style={{ background:"none", border:"none", color:"#666", fontSize:20, cursor:"pointer" }}>✕</button>
          </div>

          {/* Add form */}
          <div style={{ background:"#1a1a1a", borderRadius:12, padding:18, marginBottom:20, border:"1px solid #2a2a2a" }}>
            <div style={{ fontSize:11, color:"#ea580c", fontWeight:700, marginBottom:14, textTransform:"uppercase", letterSpacing:0.5 }}>
              Add New Reminder
            </div>

            <label style={{ fontSize:11, color:"#9ca3af", display:"block", marginBottom:5 }}>Topic to study</label>
            <input style={{ ...inp, marginBottom:12 }} value={topic}
              onChange={e=>setTopic(e.target.value)}
              placeholder="e.g. Photosynthesis, Algebra, Newton's Laws"
              onKeyDown={e=>e.key==="Enter"&&addReminder()} />

            <label style={{ fontSize:11, color:"#9ca3af", display:"block", marginBottom:5 }}>Reminder message</label>
            <input style={{ ...inp, marginBottom:12 }} value={message}
              onChange={e=>setMessage(e.target.value)}
              placeholder="e.g. Time to review this topic!" />

            <div style={{ display:"flex", gap:12, marginBottom:14 }}>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:11, color:"#9ca3af", display:"block", marginBottom:5 }}>Reminder time</label>
                <input type="time" style={inp} value={time} onChange={e=>setTime(e.target.value)} />
              </div>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:11, color:"#9ca3af", display:"block", marginBottom:5 }}>Frequency</label>
                <select style={{ ...inp, cursor:"pointer" }} value={daily?"daily":"once"} onChange={e=>setDaily(e.target.value==="daily")}>
                  <option value="daily">Daily</option>
                  <option value="once">Once only</option>
                </select>
              </div>
            </div>

            <button onClick={addReminder} disabled={!topic.trim()} style={{
              width:"100%", background:saved?"#16a34a":"linear-gradient(135deg,#ea580c,#d97706)",
              color:"#fff", border:"none", borderRadius:8, padding:"11px 0",
              fontWeight:700, cursor:topic.trim()?"pointer":"not-allowed", fontSize:13,
              opacity:!topic.trim()?0.5:1, transition:"all 0.3s",
            }}>
              {saved ? "✅ Reminder Saved!" : "+ Add Reminder"}
            </button>
          </div>

          {/* Existing reminders */}
          <div style={{ fontSize:11, color:"#ea580c", fontWeight:700, marginBottom:10, textTransform:"uppercase", letterSpacing:0.5 }}>
            Scheduled Reminders ({reminders.length})
          </div>

          {reminders.length === 0 ? (
            <div style={{ background:"#1a1a1a", borderRadius:10, padding:20, textAlign:"center", border:"1px dashed #2a2a2a" }}>
              <div style={{ fontSize:28, marginBottom:8 }}>⏰</div>
              <div style={{ fontSize:13, color:"#555" }}>No reminders yet. Add one above!</div>
            </div>
          ) : (
            reminders.map(r => {
              const nextDueStr = r.nextDue ? new Date(r.nextDue).toLocaleString("en-UG", { weekday:"short", hour:"2-digit", minute:"2-digit" }) : "";
              const isOverdue = r.nextDue && Date.now() >= new Date(r.nextDue).getTime();
              return (
                <div key={r.id} style={{
                  background:"#1a1a1a", borderRadius:10, padding:"12px 14px",
                  marginBottom:8, display:"flex", justifyContent:"space-between",
                  alignItems:"center", border:`1px solid ${isOverdue?"rgba(234,88,12,0.4)":"#2a2a2a"}`,
                }}>
                  <div>
                    <div style={{ fontSize:13, color:"#f1f1f1", fontWeight:600 }}>{r.topic}</div>
                    <div style={{ fontSize:11, color: isOverdue?"#ea580c":"#9ca3af", marginTop:2 }}>
                      {isOverdue?"⏰ Due now — ":""}{nextDueStr} · {r.daily?"Daily":"Once"}
                    </div>
                    <div style={{ fontSize:10, color:"#555", marginTop:1 }}>{r.message}</div>
                  </div>
                  <button onClick={()=>deleteReminder(r.id)} style={{
                    background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)",
                    color:"#ef4444", borderRadius:6, padding:"5px 10px",
                    cursor:"pointer", fontSize:11, flexShrink:0, marginLeft:10,
                  }}>
                    Delete
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}