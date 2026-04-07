import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./Toast";
import {
  sendMessage, sendCorrection, summarizeSession,
  detectLaunchIntent, detectTask, generateImage,
  searchImages, searchBrain
} from "../api/client";

const emotionConfig = {
  tired:      { label: "😴 Tired",      color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  frustrated: { label: "😤 Frustrated", color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
  motivated:  { label: "🔥 Motivated",  color: "#10b981", bg: "rgba(16,185,129,0.08)" },
  sad:        { label: "💙 Low",         color: "#818cf8", bg: "rgba(129,140,248,0.08)" },
  anxious:    { label: "😰 Anxious",    color: "#f97316", bg: "rgba(249,115,22,0.08)" },
  confused:   { label: "🤔 Confused",   color: "#a855f7", bg: "rgba(168,85,247,0.08)" },
};

const STORAGE_KEY = "neuroclone_chat_v2";

function ImageCard({ data, onRetry }) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const toast = useToast();

  const currentUrl = fallbackIndex === 0
    ? data.url
    : (data.fallback_urls?.[fallbackIndex - 1] || data.url);

  const handleError = () => {
    if (fallbackIndex < (data.fallback_urls?.length || 0)) {
      setFallbackIndex(f => f + 1);
      setImgLoaded(false);
    } else {
      setImgError(true);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(currentUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `neuroclone-${(data.prompt || "image").replace(/\s+/g, "-").slice(0, 30)}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Image downloaded!", 2000);
    } catch {
      window.open(currentUrl, "_blank");
      toast.info("Opened in new tab instead", 2000);
    }
    setDownloading(false);
  };

  if (data.type === "image_search") return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: "300px" }}>
      <div style={{ fontSize: "9px", color: "var(--cyan)", fontWeight: "700", letterSpacing: "1px", marginBottom: "8px", textTransform: "uppercase" }}>
        🔍 {data.images?.length || 0} images found · {data.source}
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "3px",
        borderRadius: "12px", overflow: "hidden",
        border: "1px solid rgba(34,211,238,0.15)"
      }}>
        {(data.images || []).slice(0, 9).map((img, i) => (
          <div key={i} style={{ position: "relative", aspectRatio: "1", overflow: "hidden", cursor: "pointer" }}
            onClick={() => window.open(img.url, "_blank")}>
            <img src={img.url} alt="" loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.2s" }}
              onMouseEnter={e => e.target.style.transform = "scale(1.1)"}
              onMouseLeave={e => e.target.style.transform = "scale(1)"}
              onError={e => { e.target.style.display = "none"; }}
            />
          </div>
        ))}
      </div>
      <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "5px" }}>Click any to open full size</div>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ maxWidth: "280px" }}>
      <div style={{ fontSize: "9px", color: "var(--cyan)", fontWeight: "700", letterSpacing: "1px", marginBottom: "6px", textTransform: "uppercase" }}>
        ✨ AI Generated · {data.source}
      </div>

      <div style={{
        borderRadius: "12px", overflow: "hidden",
        border: "1px solid rgba(34,211,238,0.2)",
        boxShadow: "0 0 30px rgba(34,211,238,0.08)",
        background: "rgba(15,15,30,0.8)", minHeight: "180px", position: "relative"
      }}>
        {!imgLoaded && !imgError && (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px"
          }}>
            <div style={{ display: "flex", gap: "5px" }}>
              {[0, 1, 2].map(i => (
                <motion.div key={i}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                  style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--cyan)" }}
                />
              ))}
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Rendering image...</div>
            <div style={{ fontSize: "9px", color: "var(--text-muted)", opacity: 0.6 }}>This takes 5-10 seconds</div>
          </div>
        )}

        {imgError ? (
          <div style={{
            padding: "30px 20px", textAlign: "center",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "10px"
          }}>
            <div style={{ fontSize: "24px" }}>🔄</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Image failed to render</div>
            <motion.button onClick={onRetry} whileHover={{ scale: 1.04 }}
              style={{
                padding: "6px 14px", borderRadius: "7px",
                background: "linear-gradient(135deg, #0891b2, #7c3aed)",
                border: "none", color: "white", fontSize: "11px",
                fontWeight: "700", cursor: "pointer", fontFamily: "'Inter', sans-serif"
              }}>Try Again</motion.button>
          </div>
        ) : (
          <img src={currentUrl} alt={data.prompt}
            onLoad={() => setImgLoaded(true)}
            onError={handleError}
            style={{
              width: "100%", display: "block",
              opacity: imgLoaded ? 1 : 0,
              transition: "opacity 0.6s ease"
            }}
          />
        )}
      </div>

      {!imgError && imgLoaded && (
        <>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "6px", fontStyle: "italic" }}>
            "{data.prompt}"
          </div>
          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            <motion.button onClick={handleDownload} disabled={downloading}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{
                flex: 1, padding: "7px", borderRadius: "8px",
                background: "linear-gradient(135deg, #0891b2, #7c3aed)",
                border: "none", color: "white", fontSize: "11px", fontWeight: "700",
                cursor: "pointer", fontFamily: "'Inter', sans-serif",
                boxShadow: "0 0 16px rgba(34,211,238,0.2)"
              }}
            >{downloading ? "⏳" : "⬇ Download"}</motion.button>
            <motion.button onClick={() => window.open(currentUrl, "_blank")}
              whileHover={{ scale: 1.03 }}
              style={{
                padding: "7px 10px", borderRadius: "8px",
                background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-bright)",
                color: "var(--text-secondary)", fontSize: "11px", cursor: "pointer",
                fontFamily: "'Inter', sans-serif"
              }}>↗</motion.button>
            <motion.button onClick={onRetry} whileHover={{ scale: 1.03 }}
              title="Generate new variation"
              style={{
                padding: "7px 10px", borderRadius: "8px",
                background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-bright)",
                color: "var(--text-secondary)", fontSize: "11px", cursor: "pointer",
                fontFamily: "'Inter', sans-serif"
              }}>🔄</motion.button>
          </div>
        </>
      )}
    </motion.div>
  );
}

export default function ChatPanel() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).filter(m => m.role !== "image").slice(-40);
    } catch {}
    return [{ role: "ai", text: "Bhai, I'm you. Chat, give commands, generate images, open sites, search your brain — all from here." }];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const [correcting, setCorrecting] = useState(null);
  const [emotion, setEmotion] = useState("neutral");
  const [inputFocused, setInputFocused] = useState(false);
  const [lastImagePrompt, setLastImagePrompt] = useState("");
  const bottomRef = useRef(null);
  const toast = useToast();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    try {
      const toSave = messages.filter(m => m.role !== "image").slice(-50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {}
  }, [messages]);

  const detectEmotionLocally = (msg) => {
    const m = msg.toLowerCase();
    const map = {
      tired: ["tired", "thaka", "bored", "neend", "exhausted"],
      frustrated: ["frustrated", "angry", "gussa", "bekaar", "irritated"],
      motivated: ["let's go", "ready", "pumped", "shuru", "haan bhai", "motivated"],
      sad: ["sad", "hurt", "broken", "alone", "cry", "dukhi"],
      anxious: ["stressed", "tension", "overwhelmed", "scared", "anxious", "dar"],
      confused: ["confused", "kya karu", "lost", "don't know", "samajh nahi"],
    };
    for (const [em, kw] of Object.entries(map)) {
      if (kw.some(k => m.includes(k))) return em;
    }
    return "neutral";
  };

  const speakResponse = useCallback((text) => {
    if (muted) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[#*`_~]/g, "").slice(0, 220);
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = "en-IN"; u.rate = 1.05; u.pitch = 1;
    window.speechSynthesis.speak(u);
  }, [muted]);

  const handleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error("Use Chrome for voice support."); return; }
    const r = new SR();
    r.lang = "en-IN"; r.interimResults = false;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = () => { setListening(false); toast.error("Voice input failed. Try again."); };
    r.onresult = (e) => setInput(e.results[0][0].transcript);
    r.start();
    toast.info("Listening... speak now", 2500);
  };

  const generateAndShowImage = async (prompt) => {
    setLastImagePrompt(prompt);
    setMessages(p => [...p, { role: "ai", text: `Generating "${prompt}"... rendering below 👇` }]);
    try {
      const imgRes = await generateImage(prompt);
      setMessages(p => [...p, { role: "image", data: imgRes.data }]);
    } catch {
      toast.error("Image generation failed. Try again.");
      setMessages(p => [...p, { role: "ai", text: "Image generation failed bhai. Try a different description or try again." }]);
    }
  };

  const handleRetryImage = async () => {
    if (!lastImagePrompt) return;
    toast.info("Generating new variation...", 2000);
    setMessages(p => [...p, { role: "ai", text: "Generating a new variation..." }]);
    try {
      const imgRes = await generateImage(lastImagePrompt);
      setMessages(p => [...p, { role: "image", data: imgRes.data }]);
    } catch {
      toast.error("Still failing. Try a different prompt.");
    }
  };

  const handleSend = async () => {
    const userMsg = input.trim();
    if (!userMsg || loading) return;
    setInput("");
    const updated = [...messages, { role: "user", text: userMsg }];
    setMessages(updated);
    setLoading(true);
    setEmotion(detectEmotionLocally(userMsg));
    const msgLower = userMsg.toLowerCase();

    // 1. Second brain search
    if (
      msgLower.includes("what did i") ||
      msgLower.includes("do i know") ||
      msgLower.includes("have i said") ||
      msgLower.includes("search my brain") ||
      msgLower.includes("what do you know about me")
    ) {
      try {
        const res = await searchBrain(userMsg);
        setMessages(p => [...p, { role: "ai", text: res.data.answer }]);
        speakResponse(res.data.answer);
      } catch { setMessages(p => [...p, { role: "ai", text: "Brain search failed. Check backend." }]); }
      setLoading(false); return;
    }

    // 2. Task detection (images)
    try {
      const taskRes = await detectTask(userMsg);
      const task = taskRes.data;

      if (task.detected && task.type === "generate_image") {
        setLoading(false);
        await generateAndShowImage(task.subject);
        return;
      }

      if (task.detected && task.type === "search_image") {
        setMessages(p => [...p, { role: "ai", text: `Searching images of "${task.subject}"...` }]);
        try {
          const imgRes = await searchImages(task.subject);
          setMessages(p => [...p, { role: "image", data: imgRes.data }]);
        } catch { toast.error("Image search failed."); }
        setLoading(false); return;
      }
    } catch {}

    // 3. Browser launch
    try {
      const intentRes = await detectLaunchIntent(userMsg);
      const intent = intentRes.data;
      if (intent.detected) {
        const ok = await toast.confirm(`Open ${intent.description}?`);
        if (ok) {
          window.open(intent.url, "_blank");
          setMessages(p => [...p, { role: "ai", text: `Done. Opening ${intent.description}. Stay focused bhai.` }]);
          toast.success(`Opened ${intent.url}`, 2000);
        } else {
          setMessages(p => [...p, { role: "ai", text: "Okay, not opening it. Good call." }]);
        }
        setLoading(false); return;
      }
    } catch {}

    // 4. Normal chat
    const history = updated.slice(-10)
      .map(m => `${m.role === "user" ? "Monish" : "AI"}: ${m.text || "[image]"}`).join("\n");

    try {
      const res = await sendMessage(userMsg, `Recent conversation:\n${history}`);
      const aiText = res.data.response;
      setMessages(p => [...p, { role: "ai", text: aiText }]);
      speakResponse(aiText);
    } catch {
      toast.error("Backend down. Restart uvicorn.");
      setMessages(p => [...p, { role: "ai", text: "Backend down. Check if uvicorn is running." }]);
    }
    setLoading(false);
  };

  const handleCorrect = async (i) => {
    const correction = prompt("What should I have said instead?");
    if (!correction) return;
    await sendCorrection(correction);
    toast.success("Correction saved to memory.", 2000);
    setCorrecting(i);
    setTimeout(() => setCorrecting(null), 2000);
  };

  const handleSummarize = async () => {
    if (messages.length < 3) { toast.warning("Chat more first before saving.", 2000); return; }
    const conv = messages.map(m => `${m.role === "user" ? "Monish" : "AI"}: ${m.text || "[image]"}`).join("\n");
    try {
      const res = await summarizeSession(conv);
      toast.success(`Session saved: ${res.data.summary.slice(0, 80)}...`, 6000);
    } catch { toast.error("Failed to save session."); }
  };

  const clearChat = async () => {
    const ok = await toast.confirm("Clear chat history?");
    if (ok) {
      setMessages([{ role: "ai", text: "Fresh start bhai. What's on your mind?" }]);
      localStorage.removeItem(STORAGE_KEY);
      toast.success("Chat cleared.", 2000);
    }
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: "rgba(10,10,21,0.88)", borderRadius: "16px",
      border: "1px solid var(--border-bright)", overflow: "hidden",
      backdropFilter: "blur(20px)",
      boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 24px 64px rgba(0,0,0,0.6)"
    }}>

      {/* Header */}
      <div style={{
        padding: "11px 14px",
        background: "linear-gradient(135deg, rgba(34,211,238,0.06), rgba(168,85,247,0.04))",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: "10px", flexShrink: 0
      }}>
        <div style={{ position: "relative" }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "10px",
            background: "linear-gradient(135deg, #0891b2, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "800", fontSize: "13px", color: "white",
            boxShadow: "0 0 18px rgba(34,211,238,0.35)"
          }}>N</div>
          <motion.div
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{
              position: "absolute", bottom: 0, right: 0,
              width: "8px", height: "8px", borderRadius: "50%",
              background: "#10b981", border: "2px solid var(--bg-card)",
              boxShadow: "0 0 6px #10b981"
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)" }}>NeuroClone</div>
          <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>
            Chat · Images · Browser · Memory · Voice
          </div>
        </div>

        <AnimatePresence>
          {emotion !== "neutral" && emotionConfig[emotion] && (
            <motion.div key={emotion}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              style={{
                padding: "3px 9px", borderRadius: "99px",
                background: emotionConfig[emotion].bg,
                border: `1px solid ${emotionConfig[emotion].color}25`,
                fontSize: "10px", fontWeight: "700",
                color: emotionConfig[emotion].color, flexShrink: 0
              }}
            >{emotionConfig[emotion].label}</motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
          <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            onClick={handleSummarize} title="Save session to memory"
            style={{
              padding: "5px 9px", borderRadius: "7px",
              background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.2)",
              color: "var(--cyan)", fontSize: "11px", cursor: "pointer"
            }}>💾</motion.button>
          <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            onClick={clearChat} title="Clear chat"
            style={{
              padding: "5px 9px", borderRadius: "7px",
              background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)",
              color: "#ef4444", fontSize: "11px", cursor: "pointer"
            }}>🗑️</motion.button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: "flex", flexDirection: "column",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start"
              }}
            >
              {msg.role === "ai" && (
                <div style={{
                  fontSize: "8px", color: "var(--text-muted)", marginBottom: "3px",
                  paddingLeft: "4px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase"
                }}>NeuroClone</div>
              )}

              {msg.role === "image" ? (
                <div style={{ paddingLeft: "4px" }}>
                  <ImageCard data={msg.data} onRetry={handleRetryImage} />
                </div>
              ) : (
                <div style={{
                  maxWidth: "80%", padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "14px 14px 3px 14px" : "3px 14px 14px 14px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #0891b2, #7c3aed)"
                    : "rgba(15,15,30,0.92)",
                  color: "var(--text-primary)",
                  fontSize: "13px", lineHeight: "1.65",
                  border: msg.role === "ai" ? "1px solid var(--border-bright)" : "none",
                  boxShadow: msg.role === "user"
                    ? "0 4px 20px rgba(34,211,238,0.2)"
                    : "0 2px 10px rgba(0,0,0,0.4)",
                  backdropFilter: "blur(10px)"
                }}>
                  {msg.text}
                </div>
              )}

              {(msg.role === "ai" || msg.role === "image") && (
                <button onClick={() => handleCorrect(i)} style={{
                  marginTop: "3px", paddingLeft: "4px", background: "none", border: "none",
                  color: "var(--text-muted)", fontSize: "9px", cursor: "pointer",
                  fontFamily: "'Inter', sans-serif"
                }}>
                  {correcting === i ? "✓ saved" : "✏️ correct this"}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "8px",
              background: "linear-gradient(135deg, #0891b2, #7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px", fontWeight: "800", color: "white"
            }}>N</div>
            <div style={{
              padding: "10px 14px", borderRadius: "3px 14px 14px 14px",
              background: "rgba(15,15,30,0.9)", border: "1px solid var(--border-bright)",
              display: "flex", gap: "5px", alignItems: "center"
            }}>
              {[0, 1, 2].map(j => (
                <motion.div key={j}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, delay: j * 0.15, repeat: Infinity }}
                  style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--cyan)" }}
                />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "10px 12px", borderTop: "1px solid var(--border)",
        background: "rgba(6,6,15,0.7)", backdropFilter: "blur(10px)", flexShrink: 0
      }}>
        <motion.div
          animate={{
            borderColor: inputFocused ? "rgba(34,211,238,0.4)" : "var(--border-bright)",
            boxShadow: inputFocused ? "0 0 0 3px rgba(34,211,238,0.05)" : "none"
          }}
          style={{
            display: "flex", gap: "5px", alignItems: "center",
            background: "rgba(15,15,30,0.95)", border: "1px solid var(--border-bright)",
            borderRadius: "11px", padding: "3px 3px 3px 12px"
          }}
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder='Chat or command... "generate image of...", "open PW"'
            style={{
              flex: 1, background: "transparent", border: "none",
              color: "var(--text-primary)", fontSize: "12.5px",
              outline: "none", padding: "8px 0", fontFamily: "'Inter', sans-serif"
            }}
          />

          <motion.button onClick={() => { setMuted(m => !m); if (!muted) window.speechSynthesis.cancel(); }}
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} title={muted ? "Unmute" : "Mute AI voice"}
            style={{
              width: "31px", height: "31px", borderRadius: "7px",
              background: muted ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${muted ? "#ef4444" : "var(--border)"}`,
              color: muted ? "#ef4444" : "var(--text-muted)",
              cursor: "pointer", fontSize: "12px",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >{muted ? "🔇" : "🔊"}</motion.button>

          <motion.button onClick={handleVoice}
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} title="Voice input"
            style={{
              width: "31px", height: "31px", borderRadius: "7px",
              background: listening ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${listening ? "#ef4444" : "var(--border)"}`,
              color: listening ? "#ef4444" : "var(--text-muted)",
              cursor: "pointer", fontSize: "12px",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >{listening ? "🔴" : "🎤"}</motion.button>

          <motion.button onClick={handleSend} disabled={loading || !input.trim()}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            style={{
              padding: "7px 14px", borderRadius: "8px",
              background: input.trim() && !loading
                ? "linear-gradient(135deg, #0891b2, #7c3aed)"
                : "rgba(255,255,255,0.06)",
              border: "none", color: "white", fontWeight: "700",
              fontSize: "11px", cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              fontFamily: "'Inter', sans-serif",
              boxShadow: input.trim() ? "0 0 14px rgba(34,211,238,0.2)" : "none",
              opacity: loading ? 0.5 : 1, transition: "all 0.2s"
            }}
          >Send</motion.button>
        </motion.div>

        <div style={{
          display: "flex", justifyContent: "center", gap: "10px",
          marginTop: "4px", fontSize: "8px", color: "var(--text-muted)"
        }}>
          <span>🔊 mute</span><span>·</span>
          <span>🎤 voice</span><span>·</span>
          <span>Enter to send</span><span>·</span>
          <span>Keys 1–9 switch panels</span>
        </div>
      </div>
    </div>
  );
}