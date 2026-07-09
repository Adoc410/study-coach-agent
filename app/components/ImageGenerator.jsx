"use client";
import { useState } from "react";

const COAT_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Coat_of_arms_of_Uganda.svg/400px-Coat_of_arms_of_Uganda.svg.png";

const SUGGESTIONS = [
  "Diagram of the human digestive system",
  "Water cycle process illustration",
  "Structure of a plant cell",
  "The solar system with planet labels",
  "Photosynthesis process diagram",
  "DNA double helix structure",
  "Map of East Africa showing countries",
  "Electric circuit with resistors and battery",
  "Food chain in a savanna ecosystem",
  "Cross-section of a volcano",
];

const STYLES = [
  { label: "Diagram",      value: "educational diagram, clean lines, labeled, white background, scientific illustration" },
  { label: "Illustration", value: "colorful educational illustration, vibrant, detailed, for students" },
  { label: "Sketch",       value: "pencil sketch, scientific drawing, black and white, detailed" },
  { label: "Realistic",    value: "realistic, detailed, photographic quality, educational" },
];

export default function ImageGenerator({ onClose }) {
  const [prompt,    setPrompt]    = useState("");
  const [loading,   setLoading]   = useState(false);
  const [imageUrl,  setImageUrl]  = useState(null);
  const [error,     setError]     = useState(null);
  const [style,     setStyle]     = useState(STYLES[0].value);
  const [history,   setHistory]   = useState([]);
  const [usedModel, setUsedModel] = useState(null);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const res = await fetch("/api/image-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Educational illustration for Ugandan students: ${prompt.trim()}, ${style}`,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || `Server error ${res.status}`);
      }

      if (!data.url) throw new Error("No image returned from the server.");

      setImageUrl(data.url);
      setUsedModel(data.model || null);
      setHistory(prev => [{ url: data.url, prompt: prompt.trim() }, ...prev].slice(0, 6));
    } catch (err) {
      setError(err.message || "Failed to generate image.");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `study_image_${Date.now()}.png`;
    a.target = "_blank";
    a.click();
  };

  const inp = {
    width: "100%", background: "#111", border: "1px solid #2a2a2a",
    borderRadius: 8, padding: "10px 12px", color: "#f1f1f1",
    fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 8000, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#141414", border: "1px solid #2a2a2a",
          borderRadius: 18, width: 520, maxWidth: "94%",
          maxHeight: "88vh", overflowY: "auto",
          position: "relative",
        }}
      >
        {/* Coat of arms watermark */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 0 }}>
          <img src={COAT_URL} alt="" style={{ width: 240, height: 240, opacity: 0.04, objectFit: "contain" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1, padding: 26 }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <h3 style={{ color: "#ea580c", margin: 0, fontSize: 17, fontWeight: 800 }}>🖼️ AI Image Generator</h3>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", fontSize: 20, cursor: "pointer" }}>✕</button>
          </div>
          <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 10 }}>
            Generate educational diagrams and illustrations to support your studies.
          </p>



          {/* Style selector */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: "#ea580c", display: "block", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Style</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {STYLES.map(s => (
                <button key={s.label} onClick={() => setStyle(s.value)} style={{
                  padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", border: "none", transition: "all 0.2s",
                  background: style === s.value ? "#ea580c" : "#1a1a1a",
                  color:      style === s.value ? "#fff"    : "#9ca3af",
                }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <label style={{ fontSize: 11, color: "#ea580c", display: "block", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Describe what you want
          </label>
          <textarea
            style={{ ...inp, minHeight: 80, resize: "vertical", marginBottom: 12 }}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. Labeled diagram of the human heart showing chambers and blood flow"
            onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) generate(); }}
          />

          <button
            onClick={generate}
            disabled={loading || !prompt.trim()}
            style={{
              width: "100%",
              background: loading || !prompt.trim() ? "#1a1a1a" : "linear-gradient(135deg,#ea580c,#d97706)",
              color:      loading || !prompt.trim() ? "#555"    : "#fff",
              border: "none", borderRadius: 10,
              padding: "12px 0", fontWeight: 700,
              cursor: prompt.trim() && !loading ? "pointer" : "not-allowed",
              fontSize: 14, marginBottom: 16, transition: "all 0.2s",
            }}
          >
            {loading ? "✨ Generating… (15–30 seconds)" : "✨ Generate Image"}
          </button>

          {/* Suggestions */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Quick ideas</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => setPrompt(s)} style={{
                  background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#9ca3af",
                  borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer",
                  transition: "all 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#ea580c"; e.currentTarget.style.color = "#ea580c"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#9ca3af"; }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Loading indicator */}
          {loading && (
            <div style={{ textAlign: "center", padding: 30, background: "#1a1a1a", borderRadius: 12, border: "1px solid #2a2a2a", marginBottom: 16 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🎨</div>
              <div style={{ fontSize: 13, color: "#ea580c", fontWeight: 600 }}>Creating your educational image…</div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 6 }}>Pollinations AI typically takes 15–30 seconds</div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#ef4444", fontWeight: 600, marginBottom: 4 }}>⚠️ Generation Failed</div>
              <div style={{ fontSize: 12, color: "#fca5a5", lineHeight: 1.6 }}>{error}</div>
            </div>
          )}

          {/* Result */}
          {imageUrl && (
            <div style={{ marginBottom: 16 }}>
              <img
                src={imageUrl}
                alt="Generated educational image"
                style={{ width: "100%", borderRadius: 12, border: "1px solid #2a2a2a", marginBottom: 10, display: "block" }}
              />
              {usedModel && (
                <div style={{ fontSize: 10, color: "#555", textAlign: "center", marginBottom: 8 }}>
                  ✨ Generated with {usedModel}
                </div>
              )}
              <button onClick={download} style={{
                width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a",
                color: "#f1f1f1", borderRadius: 8, padding: "10px 0",
                fontWeight: 600, cursor: "pointer", fontSize: 13,
              }}>
                ⬇ Download Image
              </button>
            </div>
          )}

          {/* History */}
          {history.length > 1 && (
            <div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Recent generations</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {history.slice(1).map((h, i) => (
                  <div key={i} onClick={() => setImageUrl(h.url)} title={h.prompt} style={{ cursor: "pointer" }}>
                    <img src={h.url} alt={h.prompt} style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 8, border: "1px solid #2a2a2a" }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <p style={{ fontSize: 10, color: "#374151", textAlign: "center", marginTop: 16 }}>
            Ctrl+Enter to generate · Powered by Pollinations AI · Completely free, no API key needed
          </p>
        </div>
      </div>
    </div>
  );
}