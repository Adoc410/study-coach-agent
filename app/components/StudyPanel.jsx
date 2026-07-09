"use client";

import { useState, useRef } from "react";
import { tr } from "../lib/translations";

function Section({ title, defaultOpen=false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom:"1px solid #2a2a2a" }}>
      <button onClick={()=>setOpen(!open)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"none", border:"none", cursor:"pointer", color:"#fb923c", fontSize:"10px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em" }}>
        {title}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform:open?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.2s", flexShrink:0 }}>
          <path d="M 2 4 L 6 8 L 10 4" stroke="#f97316" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && <div style={{ paddingBottom:"10px" }}>{children}</div>}
    </div>
  );
}

function ScorePill({ score }) {
  const color = score>=80?"#22c55e":score>=60?"#eab308":"#ef4444";
  const bg    = score>=80?"#052e16":score>=60?"#1c1400":"#1c0000";
  return <span style={{ fontSize:"11px", fontWeight:700, color, backgroundColor:bg, border:`1px solid ${color}44`, borderRadius:"6px", padding:"2px 7px" }}>{score}%</span>;
}

function Bar({ value, color="#ea580c" }) {
  return (
    <div style={{ height:"5px", borderRadius:"3px", backgroundColor:"#1c1c1c", overflow:"hidden" }}>
      <div style={{ width:`${Math.min(value,100)}%`, height:"100%", backgroundColor:color, borderRadius:"3px", transition:"width 0.4s ease" }}/>
    </div>
  );
}

export default function StudyPanel({ sessionState, longTermMemory, tokenUsage, totalCost, selectedModel, onModelChange, MODELS, onPdfUpload, language="English" }) {
  const i18n = tr(language);
  const { topics_studied=[], quiz_scores={}, weak_areas=[] } = sessionState;

  const [pdfFile,   setPdfFile]   = useState(null);
  const [pdfStatus, setPdfStatus] = useState("idle");
  const [pdfError,  setPdfError]  = useState("");
  const [pdfPages,  setPdfPages]  = useState(0);
  const fileRef = useRef(null);

  async function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if(!file) return;
    if(file.type!=="application/pdf") { setPdfError("Only PDF files are supported."); setPdfStatus("error"); return; }
    await parsePdf(file);
  }

  async function parsePdf(file) {
    setPdfFile(file); setPdfStatus("loading"); setPdfError("");
    try {
      if(!window.pdfjsLib) {
        await new Promise((res,rej)=>{ const s=document.createElement("script"); s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }
      const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      setPdfPages(pdf.numPages);
      const texts = [];
      for(let i=1;i<=pdf.numPages;i++){
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        texts.push(`--- Page ${i} ---\n${content.items.map(x=>x.str).join(" ")}`);
      }
      const full = texts.join("\n\n").replace(/\s+/g," ").trim();
      if(!full) throw new Error("No readable text found in this PDF.");
      setPdfStatus("done");
      if(onPdfUpload) onPdfUpload(file, full);
    } catch(err) {
      setPdfStatus("error");
      setPdfError(err.message||"Failed to read the PDF.");
    }
  }

  const scores      = Object.values(quiz_scores);
  const avgScore    = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : null;
  const masteredCnt = scores.filter(s=>s>=80).length;
  const totalTopics = (longTermMemory?.topics_mastered?.length||0)+topics_studied.length;
  const level       = avgScore===null?"—":avgScore>=80?i18n.advanced:avgScore>=60?i18n.intermediate:i18n.beginner;
  const levelColor  = avgScore===null?"#888":avgScore>=80?"#22c55e":avgScore>=60?"#eab308":"#ef4444";

  return (
    <div style={{ backgroundColor:"#0d0d0d", color:"#f1f1f1", width:"100%", fontSize:"13px" }}>

      {/* Header */}
      <div style={{ padding:"12px 14px 10px", borderBottom:"1px solid #2a2a2a", background:"linear-gradient(135deg,#1a0a00,#0d0d0d)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <h2 style={{ color:"#f97316", fontSize:"13px", fontWeight:700, margin:0 }}>{i18n.sessionDash}</h2>
          <span style={{ fontSize:"10px", color:"#888" }}>
            {longTermMemory?.total_sessions>1 ? `${i18n.session}${longTermMemory.total_sessions}` : i18n.firstSession}
          </span>
        </div>
      </div>

      {/* Student Progress */}
      <Section title={i18n.studentProgress} defaultOpen={true}>
        <div style={{ padding:"0 14px 8px", display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:"10px", color:"#888", margin:"0 0 3px" }}>{i18n.currentLevel}</p>
            <p style={{ fontSize:"16px", fontWeight:700, color:levelColor, margin:0 }}>{level}</p>
          </div>
          {avgScore!==null && (
            <div style={{ textAlign:"right" }}>
              <p style={{ fontSize:"10px", color:"#888", margin:"0 0 3px" }}>{i18n.avgScore}</p>
              <ScorePill score={avgScore}/>
            </div>
          )}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"6px", padding:"0 14px 10px" }}>
          {[[i18n.topics,totalTopics,"#f97316"],[i18n.quizzes,scores.length,"#60a5fa"],[i18n.mastered,masteredCnt,"#22c55e"]].map(([label,val,color])=>(
            <div key={label} style={{ backgroundColor:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:"8px", padding:"8px", textAlign:"center" }}>
              <p style={{ fontSize:"16px", fontWeight:700, color, margin:0 }}>{val}</p>
              <p style={{ fontSize:"9px", color:"#888", margin:"2px 0 0", textTransform:"uppercase" }}>{label}</p>
            </div>
          ))}
        </div>

        {scores.length>0 && (
          <div style={{ padding:"0 14px" }}>
            <p style={{ fontSize:"10px", color:"#888", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.05em" }}>{i18n.quizBreakdown}</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
              {Object.entries(quiz_scores).map(([topic,score])=>(
                <div key={topic}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"3px" }}>
                    <span style={{ fontSize:"11px", color:"#d1d5db", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:"65%" }}>{topic}</span>
                    <ScorePill score={score}/>
                  </div>
                  <Bar value={score} color={score>=80?"#22c55e":score>=60?"#eab308":"#ef4444"}/>
                </div>
              ))}
            </div>
          </div>
        )}

        {weak_areas.length>0 && (
          <div style={{ margin:"10px 14px 0", padding:"8px 10px", backgroundColor:"#1c0000", border:"1px solid #7f1d1d", borderRadius:"8px" }}>
            <p style={{ fontSize:"10px", color:"#f87171", fontWeight:700, margin:"0 0 5px", textTransform:"uppercase" }}>{i18n.needsReview}</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"4px" }}>
              {weak_areas.map((a,i)=><span key={i} style={{ fontSize:"10px", color:"#fca5a5", backgroundColor:"#450a0a", border:"1px solid #991b1b", borderRadius:"999px", padding:"2px 8px" }}>{a}</span>)}
            </div>
          </div>
        )}

        {longTermMemory?.topics_mastered?.length>0 && (
          <div style={{ margin:"10px 14px 0", padding:"8px 10px", backgroundColor:"#052e16", border:"1px solid #14532d", borderRadius:"8px" }}>
            <p style={{ fontSize:"10px", color:"#4ade80", fontWeight:700, margin:"0 0 5px", textTransform:"uppercase" }}>{i18n.masteredLabel}</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"4px" }}>
              {longTermMemory.topics_mastered.map((t,i)=><span key={i} style={{ fontSize:"10px", color:"#86efac", backgroundColor:"#14532d", border:"1px solid #166534", borderRadius:"999px", padding:"2px 8px" }}>✓ {t}</span>)}
            </div>
          </div>
        )}

        {scores.length===0 && weak_areas.length===0 && (
          <p style={{ fontSize:"11px", color:"#888", padding:"0 14px", fontStyle:"italic" }}>{i18n.takeQuiz}</p>
        )}
      </Section>

      {/* PDF Upload */}
      <Section title={i18n.pdfMaterial} defaultOpen={true}>
        <div style={{ padding:"0 14px" }}>
          <p style={{ fontSize:"11px", color:"#888", margin:"0 0 8px" }}>{i18n.pdfDesc}</p>
          <div onClick={()=>fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={handleDrop}
            style={{ border:`2px dashed ${pdfStatus==="done"?"#22c55e":pdfStatus==="error"?"#ef4444":"#2a2a2a"}`, borderRadius:"10px", padding:"16px 12px", textAlign:"center", cursor:"pointer", backgroundColor:pdfStatus==="done"?"#052e16":"#1a1a1a", transition:"border-color 0.2s, background 0.2s" }}>
            {pdfStatus==="idle"  && <><p style={{ fontSize:"20px", margin:"0 0 4px" }}>📄</p><p style={{ fontSize:"11px", color:"#d1d5db", margin:0 }}>{i18n.pdfClick}</p><p style={{ fontSize:"10px", color:"#888", margin:"3px 0 0" }}>{i18n.pdfHint}</p></>}
            {pdfStatus==="loading" && <p style={{ fontSize:"11px", color:"#f97316", margin:0 }}>{i18n.pdfReading}</p>}
            {pdfStatus==="done"  && <><p style={{ fontSize:"18px", margin:"0 0 4px" }}>✅</p><p style={{ fontSize:"11px", color:"#4ade80", fontWeight:600, margin:0 }}>{pdfFile?.name}</p><p style={{ fontSize:"10px", color:"#888", margin:"3px 0 0" }}>{pdfPages} {pdfPages===1?i18n.pdfLoaded:i18n.pdfPagesLoaded}</p></>}
            {pdfStatus==="error" && <><p style={{ fontSize:"18px", margin:"0 0 4px" }}>❌</p><p style={{ fontSize:"11px", color:"#f87171", margin:0 }}>{pdfError}</p><p style={{ fontSize:"10px", color:"#888", margin:"3px 0 0" }}>{i18n.pdfError}</p></>}
          </div>
          <input ref={fileRef} type="file" accept="application/pdf" style={{ display:"none" }} onChange={handleDrop}/>
          {pdfStatus==="done" && (
            <div style={{ marginTop:"8px", padding:"8px 10px", backgroundColor:"#1a0a00", border:"1px solid #ea580c44", borderRadius:"8px" }}>
              <p style={{ fontSize:"10px", color:"#f97316", margin:0 }}>{i18n.pdfTip} <em>{i18n.pdfTipSum}</em> {i18n.pdfTipOr} <em>{i18n.pdfTipQuiz}</em></p>
            </div>
          )}
        </div>
      </Section>

      {/* AI Model */}
      <Section title={i18n.aiModel}>
        <div style={{ padding:"0 14px" }}>
          <select value={selectedModel} onChange={e=>onModelChange(e.target.value)} style={{ width:"100%", backgroundColor:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:"8px", padding:"7px 10px", fontSize:"12px", color:"#f1f1f1", outline:"none", cursor:"pointer" }}>
            {Object.entries(MODELS).map(([key,{label}])=>(
              <option key={key} value={key} style={{ backgroundColor:"#1a1a1a" }}>{label}</option>
            ))}
          </select>
        </div>
      </Section>

      {/* Topics */}
      <Section title={i18n.topicsStudied}>
        <div style={{ padding:"0 14px" }}>
          {topics_studied.length===0
            ? <p style={{ fontSize:"11px", color:"#888", fontStyle:"italic", margin:0 }}>{i18n.noTopics}</p>
            : <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
                {topics_studied.map((t,i)=><span key={i} style={{ fontSize:"10px", color:"#f97316", backgroundColor:"#1a0a00", border:"1px solid #ea580c55", borderRadius:"999px", padding:"3px 9px" }}>{t}</span>)}
              </div>
          }
        </div>
      </Section>

      {/* Usage */}
      {tokenUsage && (
        <Section title={i18n.usage}>
          <div style={{ padding:"0 14px" }}>
            <div style={{ backgroundColor:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:"8px", padding:"10px" }}>
              {[[i18n.inputTokens,tokenUsage.input_tokens?.toLocaleString()],[i18n.outputTokens,tokenUsage.output_tokens?.toLocaleString()]].map(([label,val])=>(
                <div key={label} style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", color:"#d1d5db", marginBottom:"4px" }}>
                  <span>{label}</span><span style={{ fontWeight:500 }}>{val}</span>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", borderTop:"1px solid #2a2a2a", paddingTop:"6px", marginTop:"4px" }}>
                <span style={{ color:"#d1d5db", fontWeight:600 }}>{i18n.estCost}</span>
                <span style={{ color:"#f97316", fontWeight:700 }}>${tokenUsage.estimated_cost_usd}</span>
              </div>
              {totalCost>0 && (
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", borderTop:"1px solid #2a2a2a", paddingTop:"6px", marginTop:"4px" }}>
                  <span style={{ color:"#888" }}>{i18n.sessionTotal}</span>
                  <span style={{ color:"#f1f1f1", fontWeight:700 }}>${totalCost.toFixed(6)}</span>
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      <div style={{ padding:"10px 14px", borderTop:"1px solid #2a2a2a" }}>
        <p style={{ fontSize:"10px", color:"#888", textAlign:"center", margin:0 }}>{i18n.tipLabel} <em style={{ color:"#d1d5db" }}>{i18n.tipExample}</em></p>
      </div>
    </div>
  );
}