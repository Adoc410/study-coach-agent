"use client";
export const dynamic = "force-dynamic";

import Sidebar from "../components/sidebar";
import MessageBubble from "../components/MessageBubble";
import QuizCard from "../components/QuizCard";
import AuthModal, { useCurrentUser } from "../components/AuthModal";
import ReminderManager, { ReminderBanner } from "../components/ReminderManager";
import ProgressDashboard from "../components/ProgressDashboard";
import CurriculumBrowser from "../components/CurriculumBrowser";
import ImageGenerator from "../components/ImageGenerator";
import TeacherPortal from "../components/teacher/TeacherPortal";
import TeacherContent from "../components/teacher/teachercontent";
import { t } from "./translations";
import { getRemainingAttempts } from "./grading";
import { loadPersistedLanguage, persistLanguage, SUPPORTED_LANGUAGES } from "./languageManager";

const COAT_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Coat_of_arms_of_Uganda.svg/800px-Coat_of_arms_of_Uganda.svg.png";

const DEFAULT_SETTINGS = {
  model:"gpt-4o", language:"English", temperature:0.7,
  difficulty:"intermediate", numQuestions:5, preferredName:"",
  quizEnabled:true, explanationsEnabled:true, recommendationsEnabled:true,
  progressEnabled:true, socraticMode:false,
};

// ─── Per-user settings persistence ───────────────────────────────────────────
function settingsKey(email) {
  return `sca_settings_${btoa(email.toLowerCase().trim())}`;
}
function loadSettings(email) {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const saved = JSON.parse(localStorage.getItem(settingsKey(email)) || "{}");
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch { return DEFAULT_SETTINGS; }
}
function saveSettings(email, s) {
  if (typeof window === "undefined") return;
  localStorage.setItem(settingsKey(email), JSON.stringify(s));
}

function makeWelcome(lang) {
  return { role:"assistant", content: t(lang, "welcomeGreeting") };
}

// ─── Per-user chat storage ────────────────────────────────────────────────────
function chatsKey(email) {
  return `sca_chats_${btoa(email.toLowerCase().trim())}`;
}
function loadChats(email) {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(chatsKey(email)) || "[]"); } catch { return []; }
}
function saveChats(email, c) {
  if (typeof window === "undefined") return;
  localStorage.setItem(chatsKey(email), JSON.stringify(c));
}

function getSessionIds(email) {
  if (typeof window === "undefined") return { threadId:"", userId:"" };
  const threadKey = `study_thread_${btoa(email.toLowerCase().trim())}`;
  let th = sessionStorage.getItem(threadKey);
  let us = localStorage.getItem("study_user_id");
  if (!th) { th=`t_${Date.now()}`; sessionStorage.setItem(threadKey, th); }
  if (!us) { us=`u_${Date.now()}`; localStorage.setItem("study_user_id", us); }
  return { threadId:th, userId:us, threadKey };
}

// ─── Quiz intent detection ────────────────────────────────────────────────────
function detectQuizIntent(text) {
  const lower = text.toLowerCase().trim();
  const patterns = [
    /(?:quiz\s+me\s+on|test\s+me\s+on)\s+(.+)/i,
    /(?:create|generate|make)\s+a\s+quiz\s+(?:on|about)\s+(.+)/i,
    /(?:quiz|test)\s+(?:on|about)\s+(.+)/i,
    /give\s+me\s+a\s+quiz\s+(?:on|about)\s+(.+)/i,
    /i\s+want\s+(?:a\s+)?(?:to\s+be\s+)?(?:quiz|test)(?:zed|ted)?\s+(?:on|about)\s+(.+)/i,
  ];
  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match) {
      let topic = match[1]
        .replace(/[?.!,]+$/, "")
        .replace(/\bplease\b/gi, "")
        .replace(/\bwith\s+\d+\s+questions?\b/gi, "")
        .replace(/\b(\d+)\s+questions?\b/gi, "")
        .trim();
      const numMatch = text.match(/\b(\d+)\s+questions?\b/i);
      const numQuestions = numMatch ? parseInt(numMatch[1]) : null;
      if (topic.length > 0) return { isQuiz: true, topic, numQuestions };
    }
  }
  return { isQuiz: false };
}

// ─── Student App ──────────────────────────────────────────────────────────────
function StudentApp({ user, onLogout }) {
  const [sidebarOpen,       setSidebarOpen]       = useState(true);
  const [chats,             setChats]             = useState([]);
  const [currentChatId,     setCurrentChatId]     = useState(null);
  const [settings,          setSettings]          = useState(DEFAULT_SETTINGS);
  const [messages,          setMessages]          = useState([makeWelcome("English")]);
  const [input,             setInput]             = useState("");
  const [loading,           setLoading]           = useState(false);
  const [showSuggestions,   setShowSuggestions]   = useState(true);
  const [pdfContext,        setPdfContext]         = useState(null);
  const [showProgress,      setShowProgress]      = useState(false);
  const [showReminders,     setShowReminders]     = useState(false);
  const [showCurriculum,    setShowCurriculum]    = useState(false);
  const [showImages,        setShowImages]        = useState(false);
  const [showTeacherContent,setShowTeacherContent]= useState(false);
  const [activeQuiz,        setActiveQuiz]        = useState(null);
  const [reminders,         setReminders]         = useState([]);
  const [remainingAttempts, setRemainingAttempts] = useState(10);

  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  const lang       = settings.language || "English";
  const userEmail  = user?.email || "";

  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].role === "assistant") {
        return [makeWelcome(lang)];
      }
      return prev;
    });
  }, [lang]);

  // Load THIS user's chats and settings — keyed by email
  useEffect(() => {
    const saved = loadSettings(userEmail);
    setSettings(saved);
    setChats(loadChats(userEmail));
    setRemainingAttempts(getRemainingAttempts());
    setMessages([makeWelcome(saved.language || "English")]);
    setCurrentChatId(null);
    setShowSuggestions(true);
  }, [userEmail]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  // ── Chat management ──────────────────────────────────────────────────────────
  const handleNewChat = useCallback(() => {
    setMessages([makeWelcome(lang)]);
    setInput(""); setCurrentChatId(null);
    setShowSuggestions(true); setPdfContext(null); setActiveQuiz(null);
    const { threadKey } = getSessionIds(userEmail);
    sessionStorage.removeItem(threadKey);
  }, [lang, userEmail]);

  const handleLoadChat = useCallback(chat => {
    setMessages(chat.messages || [makeWelcome(lang)]);
    setCurrentChatId(chat.id); setShowSuggestions(false); setActiveQuiz(null);
    const { threadKey } = getSessionIds(userEmail);
    if (chat.threadId) sessionStorage.setItem(threadKey, chat.threadId);
    else sessionStorage.removeItem(threadKey);
  }, [lang, userEmail]);

  const handleDeleteChat = useCallback(id => {
    setChats(prev => {
      const u = prev.filter(c => c.id !== id);
      saveChats(userEmail, u);
      return u;
    });
    if (currentChatId === id) handleNewChat();
  }, [currentChatId, handleNewChat, userEmail]);

  const handleRenameChat = useCallback((id, title) => {
    setChats(prev => {
      const u = prev.map(c => c.id === id ? { ...c, title } : c);
      saveChats(userEmail, u);
      return u;
    });
  }, [userEmail]);

  const persistMessages = useCallback((msgs, chatId) => {
    setChats(prev => {
      const title    = msgs.find(m => m.role === "user")?.content?.slice(0, 48) || "New Chat";
      const { threadId } = getSessionIds(userEmail);
      let updated;
      if (chatId && prev.find(c => c.id === chatId)) {
        updated = prev.map(c => c.id === chatId ? { ...c, messages:msgs, updatedAt:new Date().toISOString(), threadId } : c);
      } else {
        const nc = { id: chatId || `chat_${Date.now()}`, title, messages:msgs, updatedAt:new Date().toISOString(), threadId };
        if (!chatId) setCurrentChatId(nc.id);
        updated = [nc, ...prev];
      }
      saveChats(userEmail, updated);
      return updated;
    });
  }, [userEmail]);

  // ── Send message ──────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async text => {
    const raw = (text || input).trim();
    if (!raw || loading) return;

    const { threadId, userId } = getSessionIds(userEmail);
    const newMessages = [...messages, { role:"user", content: raw }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setShowSuggestions(false);

    try {
      const intent = settings.quizEnabled ? detectQuizIntent(raw) : { isQuiz: false };

      if (intent.isQuiz) {
        const numQuestions = intent.numQuestions || settings.numQuestions || 5;
        const difficulty   = settings.difficulty || "intermediate";

        const res = await fetch("/api/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: intent.topic, difficulty, num_questions: numQuestions }),
        });

        const quizData = await res.json();
        if (!res.ok) throw new Error(quizData.error || "Failed to generate quiz");

        const confirmText = `✅ Quiz ready! **${quizData.questions.length} questions** on **${quizData.topic}** (${quizData.difficulty}). Good luck! 🎯`;
        const assistantMsg = { role:"assistant", content: confirmText, quizData };
        const finalMessages = [...newMessages, assistantMsg];
        setMessages(finalMessages);
        persistMessages(finalMessages, currentChatId);
        setActiveQuiz(quizData);

      } else {
        const messageText = pdfContext
          ? `[PDF: ${pdfContext.name}]\n${pdfContext.text.slice(0, 8000)}\n\n---\nStudent: ${raw}`
          : raw;

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: messageText, threadId, userId,
            modelName: settings.model, language: lang,
            difficulty: settings.difficulty, numQuestions: settings.numQuestions,
            preferredName: settings.preferredName,
            // Module toggles
            quizEnabled:           settings.quizEnabled,
            explanationsEnabled:   settings.explanationsEnabled,
            recommendationsEnabled:settings.recommendationsEnabled,
            progressEnabled:       settings.progressEnabled,
            socraticMode:          settings.socraticMode,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Request failed");

        const assistantMsg = { role:"assistant", content: data.response, quizData: data.quizData || null };
        const finalMessages = [...newMessages, assistantMsg];
        setMessages(finalMessages);
        persistMessages(finalMessages, currentChatId);
        if (data.quizData) setActiveQuiz(data.quizData);
      }

    } catch (err) {
      const errMsg = { role:"assistant", content: `⚠️ ${err.message || "Something went wrong. Please try again."}`, isError: true };
      const finalMessages = [...newMessages, errMsg];
      setMessages(finalMessages);
      persistMessages(finalMessages, currentChatId);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }, [input, loading, messages, settings, lang, pdfContext, currentChatId, persistMessages, userEmail]);

  const handleKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const suggestions = [
    t(lang,"sug1"), t(lang,"sug2"), t(lang,"sug3"),
    t(lang,"sug4"), t(lang,"sug5"), t(lang,"sug6"),
  ];

  return (
    <div style={{ display:"flex", height:"100vh", background:"#0d0d0d", overflow:"hidden", position:"relative" }}>
      <div style={{ position:"fixed", inset:0, zIndex:-2, background:"#0d0d0d" }} />
      <div style={{ position:"fixed", inset:0, zIndex:-1, pointerEvents:"none", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <img src={COAT_URL} alt="" style={{ width:520, height:520, opacity:0.07, objectFit:"contain", userSelect:"none" }} />
      </div>

      <ReminderBanner />

      <div style={{ position:"relative", zIndex:200 }}>
        <Sidebar
          isOpen={sidebarOpen} onToggle={()=>setSidebarOpen(o=>!o)}
          chats={chats} currentChatId={currentChatId}
          onNewChat={handleNewChat} onLoadChat={handleLoadChat}
          onDeleteChat={handleDeleteChat} onRenameChat={handleRenameChat}
          settings={settings} onSettingsChange={(newSettings) => {
            setSettings(newSettings);
            saveSettings(userEmail, newSettings);
            if (newSettings.language !== settings.language) {
              persistLanguage(newSettings.language);
            }
          }}
          onOpenProgress={()=>setShowProgress(true)}
          onOpenReminders={()=>setShowReminders(true)}
          onOpenCurriculum={()=>setShowCurriculum(true)}
          onOpenImages={()=>setShowImages(true)}
          onOpenTeacher={null}
          remainingAttempts={remainingAttempts}
          user={user} onLogout={onLogout}
        />
      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, position:"relative", zIndex:1, paddingLeft:sidebarOpen?0:44 }}>

        <header style={{ background:"rgba(17,17,17,0.95)", borderBottom:"1px solid #1f1f1f", padding:"0 20px", height:54, display:"flex", alignItems:"center", justifyContent:"space-between", backdropFilter:"blur(8px)", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <span style={{ fontSize:15, fontWeight:800, color:"#f1f1f1" }}>{t(lang,"appName")}</span>
            <span style={{ fontSize:10, color:"#3b82f6", background:"rgba(59,130,246,0.12)", padding:"2px 8px", borderRadius:999, fontWeight:700 }}>
              🎓 {t(lang,"student")}
            </span>
            {pdfContext && (
              <span style={{ fontSize:11, color:"#22c55e", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", padding:"2px 8px", borderRadius:999 }}>
                📄 {pdfContext.name}
                <button onClick={()=>setPdfContext(null)} style={{ background:"none", border:"none", color:"#22c55e", cursor:"pointer", marginLeft:4, fontSize:12 }}>×</button>
              </span>
            )}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <img src={user.avatar} alt={user.name} style={{ width:28, height:28, borderRadius:"50%" }} />
            <span style={{ fontSize:12, color:"#f1f1f1", fontWeight:600 }}>{user.name}</span>
            <button onClick={onLogout} title={t(lang,"signOut")} style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:13 }}>⏻</button>
          </div>
        </header>

        <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>
          <div style={{ maxWidth:720, margin:"0 auto" }}>
            {messages.map((msg,i) => (
              <MessageBubble key={i} message={msg} onQuizOpen={() => msg.quizData && setActiveQuiz(msg.quizData)} />
            ))}

            {loading && (
              <div style={{ display:"flex", justifyContent:"flex-start", marginBottom:12 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0, marginRight:8, marginTop:4 }}>🎓</div>
                <div style={{ background:"rgba(26,26,26,0.75)", border:"1px solid #2a2a2a", borderRadius:"18px 18px 18px 4px", padding:"12px 16px" }}>
                  <div style={{ display:"flex", gap:4 }}>
                    {[0,150,300].map(d=>(
                      <div key={d} style={{ width:8, height:8, borderRadius:"50%", background:"#3b82f6", animation:"bounce 1s infinite", animationDelay:`${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {showSuggestions && !loading && (
              <div style={{ marginTop:16, textAlign:"center" }}>
                <p style={{ fontSize:12, color:"#555", marginBottom:12 }}>{t(lang,"tryOne")}</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", marginBottom:16 }}>
                  {suggestions.map(s => (
                    <button key={s} onClick={()=>sendMessage(s)}
                      style={{ fontSize:12, background:"rgba(26,26,26,0.8)", border:"1px solid #2a2a2a", color:"#9ca3af", padding:"6px 14px", borderRadius:999, cursor:"pointer" }}
                      onMouseEnter={e=>{ e.currentTarget.style.borderColor="#3b82f6"; e.currentTarget.style.color="#3b82f6"; }}
                      onMouseLeave={e=>{ e.currentTarget.style.borderColor="#2a2a2a"; e.currentTarget.style.color="#9ca3af"; }}>
                      {s}
                    </button>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
                  {[
                    [t(lang,"browseCurriculum"), "📚", ()=>setShowCurriculum(true)],
                    [t(lang,"myProgress"),       "📊", ()=>setShowProgress(true)],
                    [t(lang,"generateImage"),    "🖼️", ()=>setShowImages(true)],
                    [t(lang,"setReminder"),      "⏰", ()=>setShowReminders(true)],
                    ["From My Teacher",          "👩‍🏫", ()=>setShowTeacherContent(true)],
                  ].map(([label,icon,action])=>(
                    <button key={label} onClick={action}
                      style={{ background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.2)", color:"#3b82f6", borderRadius:10, padding:"8px 14px", fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div style={{ background:"rgba(17,17,17,0.97)", borderTop:"1px solid #1f1f1f", padding:"12px 20px 14px", flexShrink:0, backdropFilter:"blur(8px)" }}>
          <div style={{ maxWidth:720, margin:"0 auto" }}>
            <div style={{ display:"flex", gap:10, alignItems:"flex-end" }}>
              <textarea ref={textareaRef} rows={1}
                style={{ flex:1, background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:12, padding:"11px 14px", color:"#f1f1f1", fontSize:14, resize:"none", outline:"none", minHeight:46, maxHeight:120, lineHeight:1.5, fontFamily:"inherit" }}
                placeholder={t(lang,"inputPlaceholder")}
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                onFocus={e=>e.target.style.borderColor="#3b82f6"}
                onBlur={e=>e.target.style.borderColor="#2a2a2a"} />
              <button onClick={()=>sendMessage()} disabled={loading||!input.trim()}
                style={{ background:input.trim()?"linear-gradient(135deg,#3b82f6,#1d4ed8)":"#1a1a1a", color:input.trim()?"#fff":"#555", border:"none", borderRadius:12, padding:"11px 20px", fontWeight:700, cursor:input.trim()?"pointer":"default", fontSize:14, flexShrink:0, transition:"all 0.2s" }}>
                {loading?"…":t(lang,"send")}
              </button>
            </div>
            <p style={{ fontSize:11, color:"#374151", textAlign:"center", marginTop:6 }}>
              {t(lang,"enterToSend")}
            </p>
          </div>
        </div>
      </div>

      {activeQuiz && (
        <QuizCard
          quiz={activeQuiz}
          onClose={()=>setActiveQuiz(null)}
          studentName={user?.name}
          subject={activeQuiz.subject || activeQuiz.topic}
          userEmail={userEmail}
        />
      )}
      {showProgress   && <ProgressDashboard onClose={()=>setShowProgress(false)} userEmail={userEmail} />}
      {showReminders  && <ReminderManager   onClose={()=>setShowReminders(false)} />}
      {showCurriculum && (
        <CurriculumBrowser
          onSelectTopic={(topic, sub) => {
            if (settings.quizEnabled) {
              sendMessage(`quiz me on ${topic.title}`);
            } else {
              sendMessage(`explain ${topic.title} to me`);
            }
            setShowCurriculum(false);
          }}
          onClose={()=>setShowCurriculum(false)}
        />
      )}
      {showTeacherContent && (
        <TeacherContent
          onStartQuiz={quiz => setActiveQuiz(quiz)}
          onClose={() => setShowTeacherContent(false)}
        />
      )}
      {showImages && <ImageGenerator onClose={()=>setShowImages(false)} />}

      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>
    </div>
  );
}

// ─── Root router ──────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser, ready] = useCurrentUser();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => { if (ready && !user) setShowAuth(true); }, [ready, user]);

  const handleLogin  = u => { setUser(u); setShowAuth(false); };
  const handleLogout = () => { setUser(null); setShowAuth(true); };

  if (!ready) return (
    <div style={{ height:"100vh", background:"#0d0d0d", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
      <div style={{ fontSize:40 }}>🎓</div>
      <div style={{ fontSize:14, color:"#555" }}>Loading…</div>
    </div>
  );

  if (!user || showAuth) return (
    <div style={{ height:"100vh", background:"#0d0d0d" }}>
      <AuthModal onClose={()=>{}} onLogin={handleLogin} />
    </div>
  );

  if (user.role === "teacher") return (
    <TeacherPortal
      user={user}
      onLogout={handleLogout}
      onSendToChat={msg => {
        localStorage.setItem("sca_teacher_quiz_pending", JSON.stringify({ msg, createdAt: Date.now() }));
        alert("✅ Quiz generated! Students will see it when they next open the app.");
      }}
    />
  );

  return <StudentApp user={user} onLogout={handleLogout} />;
}