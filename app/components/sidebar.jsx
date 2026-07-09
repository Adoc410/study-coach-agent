"use client";

import { useState, useRef, useEffect } from "react";
import { t } from "../lib/translations";
import { SUPPORTED_LANGUAGES } from "../lib/languageManager";
const LANGUAGES = SUPPORTED_LANGUAGES.map(l => l.code);

const O   = "#ea580c";
const OD  = "#c2410c";
const OL  = "#f97316";
const BG  = "#0d0d0d";
const BG2 = "#1a1a1a";
const BG3 = "#1c1c1c";
const BD  = "#2a2a2a";
const TXT = "#f1f1f1";
const TXT2= "#d1d5db";
const TXT3= "#888";

const INP = { width:"100%", backgroundColor:BG2, border:`1px solid ${BD}`, borderRadius:"8px", padding:"7px 10px", fontSize:"12px", color:TXT, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };
const SEL = { ...INP, cursor:"pointer" };

function Section({ title, children, defaultOpen=false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom:`1px solid ${BD}` }}>
      <button onClick={() => setOpen(o=>!o)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", background:"none", border:"none", cursor:"pointer", color:"#fed7aa", fontSize:"11px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em" }}>
        {title}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform:open?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.2s", flexShrink:0 }}>
          <path d="M 3 5 L 7 9 L 11 5" stroke={OL} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && <div style={{ padding:"4px 0 12px 0" }}>{children}</div>}
    </div>
  );
}

function ChatMenu({ chat, onStart, onRename, onAddToProject, onDelete, lang }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div ref={ref} style={{ position:"relative", flexShrink:0 }}>
      <button onClick={e=>{ e.stopPropagation(); setOpen(o=>!o); }} style={{ background:"none", border:"none", cursor:"pointer", color:OL, fontSize:"16px", padding:"2px 6px", borderRadius:"4px", lineHeight:1 }}>···</button>
      {open && (
        <div onClick={e=>e.stopPropagation()} style={{ position:"absolute", top:"100%", right:0, zIndex:400, backgroundColor:BG2, border:`1px solid ${BD}`, borderRadius:"10px", boxShadow:"0 8px 24px rgba(0,0,0,0.5)", minWidth:"160px", overflow:"hidden", marginTop:"4px" }}>
          {[
            { label:"Open",           action:()=>{ onStart(chat);        setOpen(false); }, color:TXT2 },
            { label:"Rename",         action:()=>{ onRename(chat);       setOpen(false); }, color:TXT2 },
            { label:"Add to Project", action:()=>{ onAddToProject(chat); setOpen(false); }, color:TXT2 },
            { label:"Delete",         action:()=>{ onDelete(chat);       setOpen(false); }, color:"#f87171", danger:true },
          ].map(({ label, action, color, danger }) => (
            <button key={label} onClick={action} style={{ width:"100%", padding:"9px 14px", background:"none", border:"none", cursor:"pointer", color, fontSize:"13px", textAlign:"left", borderTop:danger?`1px solid ${BD}`:"none" }}
              onMouseEnter={e=>e.currentTarget.style.backgroundColor=danger?"#1c0505":BG3}
              onMouseLeave={e=>e.currentTarget.style.backgroundColor="transparent"}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DeleteConfirmBar({ chatTitle, onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed", bottom:"24px", left:"50%", transform:"translateX(-50%)", zIndex:999, backgroundColor:BG2, border:`1px solid ${O}`, borderRadius:"14px", padding:"14px 20px", boxShadow:"0 8px 32px rgba(0,0,0,0.5)", display:"flex", flexDirection:"column", gap:"12px", minWidth:"320px", maxWidth:"90vw" }}>
      <p style={{ color:TXT, fontSize:"13px", margin:0, textAlign:"center" }}>
        Delete <strong style={{ color:"#f87171" }}>"{chatTitle}"</strong>?<br/>
        <span style={{ color:TXT3, fontSize:"11px" }}>This cannot be undone.</span>
      </p>
      <div style={{ display:"flex", gap:"10px" }}>
        <button onClick={onCancel} style={{ flex:1, padding:"8px", borderRadius:"8px", border:`1px solid ${BD}`, backgroundColor:"transparent", color:TXT2, fontSize:"13px", cursor:"pointer" }}>Cancel</button>
        <button onClick={onConfirm} style={{ flex:1, padding:"8px", borderRadius:"8px", border:"none", backgroundColor:"#dc2626", color:"white", fontSize:"13px", fontWeight:600, cursor:"pointer" }}>Yes, Delete</button>
      </div>
    </div>
  );
}

function RenameInput({ value, onSave, onCancel }) {
  const [val, setVal] = useState(value);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <div style={{ padding:"4px 8px", display:"flex", gap:"6px" }} onClick={e=>e.stopPropagation()}>
      <input ref={ref} value={val} onChange={e=>setVal(e.target.value)}
        onKeyDown={e=>{ if(e.key==="Enter") onSave(val); if(e.key==="Escape") onCancel(); }}
        style={{ ...INP, flex:1, border:`1px solid ${O}`, backgroundColor:BG3, padding:"5px 8px" }} />
      <button onClick={()=>onSave(val)} style={{ backgroundColor:O, border:"none", borderRadius:"6px", color:"white", fontSize:"11px", padding:"4px 8px", cursor:"pointer" }}>OK</button>
    </div>
  );
}

function ChatItem({ chat, isActive, onLoadChat, onRename, onAddToProject, onRequestDelete, lang }) {
  const [renaming, setRenaming] = useState(false);
  const [hovered,  setHovered]  = useState(false);
  function formatDate(iso) {
    const d = new Date(iso), now = new Date();
    const diff = Math.floor((now-d)/86400000);
    if (diff===0) return t(lang,"today")||"Today";
    if (diff===1) return t(lang,"yesterday")||"Yesterday";
    if (diff<7)   return `${diff} days ago`;
    return d.toLocaleDateString();
  }
  return (
    <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}>
      {renaming ? (
        <RenameInput value={chat.title} onSave={tt=>{ onRename(chat.id,tt); setRenaming(false); }} onCancel={()=>setRenaming(false)} />
      ) : (
        <div onClick={()=>onLoadChat(chat)} style={{ display:"flex", alignItems:"center", gap:"6px", padding:"8px 10px 8px 16px", cursor:"pointer", backgroundColor:isActive?"#1c0a00":hovered?BG2:"transparent", borderLeft:isActive?`3px solid ${O}`:"3px solid transparent", transition:"background 0.15s" }}>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:"12px", fontWeight:500, color:isActive?OL:TXT2, margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{chat.title}</p>
            <p style={{ fontSize:"10px", color:TXT3, margin:"2px 0 0 0" }}>{formatDate(chat.updatedAt)}</p>
          </div>
          <div style={{ opacity:hovered||isActive?1:0, transition:"opacity 0.15s" }}>
            <ChatMenu chat={chat} onStart={onLoadChat} onRename={()=>setRenaming(true)} onAddToProject={onAddToProject} onDelete={onRequestDelete} lang={lang} />
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <button onClick={onToggle} style={{ width:"36px", height:"20px", borderRadius:"10px", border:"none", cursor:"pointer", backgroundColor:on?O:"#333", position:"relative", flexShrink:0, transition:"background 0.2s" }}>
      <div style={{ width:"14px", height:"14px", borderRadius:"50%", backgroundColor:"white", position:"absolute", top:"3px", left:on?"19px":"3px", transition:"left 0.2s" }} />
    </button>
  );
}

function ToolBtn({ icon, label, onClick }) {
  const [hov, setHov] = useState(false);
  if (!onClick) return null;
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:"flex", alignItems:"center", gap:10, width:"100%", background:hov?BG2:"none", border:"none", color:hov?OL:TXT2, cursor:"pointer", padding:"9px 10px", fontSize:"13px", borderRadius:8, textAlign:"left", transition:"all 0.15s", fontFamily:"inherit" }}>
      <span style={{ fontSize:17, flexShrink:0 }}>{icon}</span>{label}
    </button>
  );
}

export default function Sidebar({
  isOpen, onToggle,
  chats, currentChatId, onNewChat, onLoadChat, onDeleteChat, onRenameChat,
  settings, onSettingsChange,
  onOpenProgress, onOpenReminders, onOpenCurriculum, onOpenImages, onOpenTeacher,
  remainingAttempts, user, onLogout,
}) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [projectToast, setProjectToast] = useState(null);

  const lang = settings?.language || "English";
  const upd  = patch => onSettingsChange({ ...settings, ...patch });
  const PAD  = { paddingLeft:"16px", paddingRight:"16px" };
  const LAB  = { fontSize:"11px", color:"#fb923c", display:"block", marginBottom:"4px", marginTop:"10px" };

  return (
    <>
      {/* Toggle button */}
      <button onClick={onToggle} style={{ position:"fixed", top:"14px", left:isOpen?"292px":"12px", zIndex:300, width:"32px", height:"32px", backgroundColor:O, border:"none", borderRadius:"8px", cursor:"pointer", color:"white", fontSize:"16px", display:"flex", alignItems:"center", justifyContent:"center", transition:"left 0.25s", boxShadow:"0 2px 8px rgba(0,0,0,0.4)" }}>
        {isOpen?"‹":"›"}
      </button>

      {/* Panel */}
      <div style={{ width:isOpen?"280px":"0px", minWidth:isOpen?"280px":"0px", backgroundColor:BG, height:"100vh", overflowY:isOpen?"auto":"hidden", overflowX:"hidden", transition:"width 0.25s, min-width 0.25s", flexShrink:0, display:"flex", flexDirection:"column", borderRight:`1px solid ${BD}`, zIndex:200 }}>
        {isOpen && (<>
          {/* Header */}
          <div style={{ padding:"20px 16px 16px", borderBottom:`1px solid ${BD}` }}>
            <h1 style={{ color:OL, fontSize:"16px", fontWeight:700, margin:0 }}>🎓 {t(lang,"appName")}</h1>
            <p style={{ color:TXT3, fontSize:"11px", margin:"2px 0 0 0" }}>PLE · UCE · UACE</p>
          </div>

          {/* New Chat */}
          <div style={{ padding:"12px 16px", borderBottom:`1px solid ${BD}` }}>
            <button onClick={onNewChat} style={{ width:"100%", background:`linear-gradient(135deg,${O},${OD})`, color:"white", border:"none", borderRadius:"10px", padding:"10px", fontSize:"13px", fontWeight:600, cursor:"pointer" }}>
              {t(lang,"newChat")}
            </button>
          </div>

          {/* Recent Chats */}
          <Section title={t(lang,"recentChats")} defaultOpen={true}>
            {chats.length===0 ? (
              <p style={{ color:TXT3, fontSize:"12px", padding:"0 16px", margin:0 }}>{t(lang,"noChatsYet")}</p>
            ) : chats.map(chat => (
              <ChatItem key={chat.id} chat={chat} isActive={chat.id===currentChatId}
                onLoadChat={onLoadChat} onRename={onRenameChat}
                onAddToProject={c=>{ setProjectToast(c.title); setTimeout(()=>setProjectToast(null),2500); }}
                onRequestDelete={setDeleteTarget} lang={lang} />
            ))}
          </Section>

          {/* Tools */}
          <Section title={t(lang,"tools")}>
            <div style={{ padding:"0 8px" }}>
              <ToolBtn icon="📚" label={t(lang,"ugandaCurriculum")}  onClick={onOpenCurriculum} />
              <ToolBtn icon="📊" label={t(lang,"progressDashboard")} onClick={onOpenProgress} />
              <ToolBtn icon="⏰" label={t(lang,"studyReminders")}    onClick={onOpenReminders} />
              <ToolBtn icon="🖼️" label={t(lang,"aiImages")}          onClick={onOpenImages} />
              <ToolBtn icon="👩‍🏫" label="Teacher Dashboard"           onClick={onOpenTeacher} />
              {/* Daily attempts */}
              <div style={{ margin:"10px 2px 2px", background:remainingAttempts<=3?"rgba(239,68,68,0.1)":"rgba(234,88,12,0.08)", border:`1px solid ${remainingAttempts<=3?"#ef444430":"#ea580c30"}`, borderRadius:8, padding:"8px 12px" }}>
                <div style={{ fontSize:10, color:TXT3, marginBottom:2 }}>{t(lang,"dailyAttempts")}</div>
                <div style={{ fontSize:18, fontWeight:800, color:remainingAttempts<=3?"#ef4444":O }}>{remainingAttempts}/10</div>
                <div style={{ fontSize:10, color:TXT3 }}>{t(lang,"remainingToday")}</div>
              </div>
            </div>
          </Section>

          {/* Language */}
          <Section title={t(lang,"language")}>
            <div style={PAD}>
              <label style={LAB}>{t(lang,"responseLanguage")}</label>
              <select value={lang} onChange={e=>upd({ language:e.target.value })} style={SEL}>
                {LANGUAGES.map(l=>(
                  <option key={l} value={l} style={{ backgroundColor:BG2 }}>{l}</option>
                ))}
              </select>
            </div>
          </Section>

          {/* Settings */}
          <Section title={t(lang,"settingsTitle")}>
            <div style={PAD}>
              <label style={LAB}>{t(lang,"aiModel")}</label>
              <select value={settings.model||"gpt-4o"} onChange={e=>upd({ model:e.target.value })} style={SEL}>
                <option value="gpt-4o"        style={{ backgroundColor:BG2 }}>GPT-4o (Best)</option>
                <option value="gpt-4o-mini"   style={{ backgroundColor:BG2 }}>GPT-4o Mini (Fast)</option>
                <option value="gpt-3.5-turbo" style={{ backgroundColor:BG2 }}>GPT-3.5 Turbo (Cheap)</option>
              </select>

              <label style={LAB}>{t(lang,"temperature")}</label>
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <input type="range" min="0" max="1" step="0.1" value={settings.temperature??0.7}
                  onChange={e=>upd({ temperature:parseFloat(e.target.value) })} style={{ flex:1, accentColor:O }} />
                <span style={{ color:OL, fontSize:"12px", minWidth:"24px" }}>{settings.temperature??0.7}</span>
              </div>

              <label style={LAB}>{t(lang,"quizDifficulty")}</label>
              <select value={settings.difficulty||"intermediate"} onChange={e=>upd({ difficulty:e.target.value })} style={SEL}>
                <option value="beginner"     style={{ backgroundColor:BG2 }}>Beginner</option>
                <option value="intermediate" style={{ backgroundColor:BG2 }}>Intermediate</option>
                <option value="advanced"     style={{ backgroundColor:BG2 }}>Advanced</option>
              </select>

              <label style={LAB}>{t(lang,"questionsPerQuiz")}</label>
              <select value={settings.numQuestions||5} onChange={e=>upd({ numQuestions:parseInt(e.target.value) })} style={SEL}>
                {[3,5,7,10,15,20,25,30,35,40,45,50].map(n=>(
                  <option key={n} value={n} style={{ backgroundColor:BG2 }}>{n}</option>
                ))}
              </select>

              <label style={LAB}>{t(lang,"preferredName")}</label>
              <input type="text" placeholder="e.g. Alex..." value={settings.preferredName||""}
                onChange={e=>upd({ preferredName:e.target.value })} style={INP} />
              <p style={{ fontSize:"10px", color:TXT3, margin:"5px 0 0 0" }}>{t(lang,"aiWillCall")}</p>
            </div>
          </Section>

          {/* Modules */}
          <Section title={t(lang,"modules")}>
            <div style={{ paddingLeft:"16px", paddingRight:"16px" }}>
              {[
                { key:"quizEnabled",           label:t(lang,"quizMode"),          desc:t(lang,"descInteractiveQuiz") },
                { key:"explanationsEnabled",    label:t(lang,"topicExplanations"), desc:t(lang,"descWikipedia") },
                { key:"recommendationsEnabled", label:t(lang,"studyRecs"),         desc:t(lang,"descStudyPlans") },
                { key:"progressEnabled",        label:t(lang,"progressTracking"),  desc:t(lang,"descTracking") },
                { key:"socraticMode",           label:t(lang,"socraticMode"),      desc:t(lang,"descSocratic") },
              ].map(({ key, label, desc })=>(
                <div key={key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${BD}` }}>
                  <div>
                    <p style={{ color:TXT2, fontSize:"12px", margin:0, fontWeight:500 }}>{label}</p>
                    <p style={{ color:TXT3, fontSize:"10px", margin:"2px 0 0 0" }}>{desc}</p>
                  </div>
                  <Toggle on={!!settings[key]} onToggle={()=>upd({ [key]:!settings[key] })} />
                </div>
              ))}
            </div>
          </Section>

          <div style={{ flex:1, minHeight:"20px" }} />

          {/* User card */}
          {user && (
            <div style={{ padding:"12px 16px", borderTop:`1px solid ${BD}`, display:"flex", alignItems:"center", gap:10 }}>
              <img src={user.avatar} alt={user.name} style={{ width:30, height:30, borderRadius:"50%", flexShrink:0 }} />
              <div style={{ flex:1, overflow:"hidden" }}>
                <div style={{ fontSize:12, color:TXT, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</div>
                <div style={{ fontSize:10, color:O, textTransform:"uppercase" }}>{t(lang,"student")}</div>
              </div>
              <button onClick={onLogout} title={t(lang,"signOut")} style={{ background:"none", border:"none", color:TXT3, cursor:"pointer", fontSize:14 }}>⏻</button>
            </div>
          )}
        </>)}
      </div>

      {deleteTarget && (
        <DeleteConfirmBar chatTitle={deleteTarget.title}
          onConfirm={()=>{ onDeleteChat(deleteTarget.id); setDeleteTarget(null); }}
          onCancel={()=>setDeleteTarget(null)} />
      )}
      {projectToast && (
        <div style={{ position:"fixed", bottom:"24px", left:"50%", transform:"translateX(-50%)", zIndex:999, backgroundColor:BG2, border:`1px solid ${O}`, borderRadius:"10px", padding:"10px 20px", color:OL, fontSize:"13px", boxShadow:"0 4px 16px rgba(0,0,0,0.4)" }}>
          "{projectToast}" added to project
        </div>
      )}
    </>
  );
}