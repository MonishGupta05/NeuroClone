import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sendMessage, sendCorrection, summarizeSession, detectLaunchIntent, detectTask, generateImage, searchImages } from "../api/client";

const emotionConfig = {
  tired:      { label: "😴 Tired",      color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  frustrated: { label: "😤 Frustrated", color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
  motivated:  { label: "🔥 Motivated",  color: "#10b981", bg: "rgba(16,185,129,0.08)" },
  sad:        { label: "💙 Low",         color: "#818cf8", bg: "rgba(129,140,248,0.08)" },
  anxious:    { label: "😰 Anxious",    color: "#f97316", bg: "rgba(249,115,22,0.08)" },
  confused:   { label: "🤔 Confused",   color: "#a855f7", bg: "rgba(168,85,247,0.08)" },
};

function ImageMessage({ data }) {
  const handleDownload = (url, name) => {
    const a = document.createElement("a");
    a.href = url; a.download = name || "neuroclone-image.jpg";
    a.target = "_blank"; a.click();
  };

  if (data.type === "ai_image") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ maxWidth: "280px" }}
      >
        <div style={{
          fontSize: "9px", color: "var(--text-muted)", marginBottom: "6px",
          fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase"
        }}>NeuroClone — AI Generated</div>
        <div style={{
          borderRadius: "12px", overflow: "hidden",
          border: "1px solid rgba(34,211,238,0.2)",
          boxShadow: "0 0 30px rgba(34,211,238,0.1)"
        }}>
          <img
            src={data.url} alt={data.prompt}
            style={{ width: "100%", display: "block" }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
        </div>
        <div style={{ marginTop: "8px", display: "flex", gap: "6px" }}>
          <button
            onClick={() => handleDownload(data.url, `${data.prompt}.jpg`)}
            style={{
              flex: 1, padding: "6px", borderRadius: "7px",
              background: "linear-gradient(135deg, #0891b2, #7c3aed)",
              border: "none", color: "white", fontSize: "11px",
              fontWeight: "700", cursor: "pointer", fontFamily: "'Inter', sans-serif"
            }}
          >⬇ Download</button>
          <button
            onClick={() => window.open(data.url, "_blank")}
            style={{
              padding: "6px 10px", borderRadius: "7px",
              background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-bright)",
              color: "var(--text-secondary)", fontSize: "11px", cursor: "pointer",
              fontFamily: "'Inter', sans-serif"
            }}
          >↗</button>
        </div>
        <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "4px" }}>
          Source: {data.source}
        </div>
      </motion.div>
    );
  }

  if (data.type === "image_search") {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: "320px" }}>
        <div style={{ fontSize: "9px", color: "var(--text-muted)", marginBottom: "8px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>
          NeuroClone — Found {data.images.length} images
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px", borderRadius: "10px", overflow: "hidden" }}>
          {data.images.slice(0, 6).map((img, i) => (
            <div key={i} style={{ position: "relative", aspectRatio: "1", overflow: "hidden", cursor: "pointer" }}
              onClick={() => handleDownload(img.url, `${data.query}-${i + 1}.jpg`)}>
              <img src={img.url} alt={img.prompt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{
                position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: 0, transition: "opacity 0.2s",
                fontSize: "16px"
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >⬇</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "6px" }}>
          Click any image to download · Source: {data.source}
        </div>
      </motion.div>
    );
  }

  return null;
}

export default function ChatPanel() {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Bhai, I'm you. Ask me anything, give me a task, or tell me what's going on." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [correcting, setCorrecting] = useState(null);
  const [emotion, setEmotion] = useState("neutral");
  const [inputFocused, setInputFocused] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

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

  const handleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Use Chrome."); return; }
    const r = new SR();
    r.lang = "en-IN"; r.interimResults = false;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onresult = (e) => setInput(e.results[0][0].transcript);
    r.start();
  };

  const speakResponse = (text) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-IN"; u.rate = 1.05; u.pitch = 1;
    window.speechSynthesis.speak(u);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    const updated = [...messages, { role: "user", text: userMsg }];
    setMessages(updated);
    setLoading(true);
    setEmotion(detectEmotionLocally(userMsg));

    // 1. Check task intent (image gen / image search)
    try {
      const taskRes = await detectTask(userMsg);
      const task = taskRes.data;

      if (task.detected && task.type === "generate_image") {
        const ok = window.confirm(`NeuroClone wants to generate an AI image of:\n\n"${task.subject}"\n\nUsing Pollinations AI (free). Allow?`);
        if (ok) {
          setMessages(p => [...p, { role: "ai", text: `Generating AI image of "${task.subject}"... give it a few seconds bhai.` }]);
          const imgRes = await generateImage(task.subject);
          setMessages(p => [...p, { role: "image", data: imgRes.data }]);
        } else {
          setMessages(p => [...p, { role: "ai", text: "Okay, not generating it." }]);
        }
        setLoading(false);
        return;
      }

      if (task.detected && task.type === "search_image") {
        const ok = window.confirm(`NeuroClone wants to search and download images of:\n\n"${task.subject}"\n\nAllow?`);
        if (ok) {
          setMessages(p => [...p, { role: "ai", text: `Searching images of "${task.subject}"...` }]);
          const imgRes = await searchImages(task.subject);
          setMessages(p => [...p, { role: "image", data: imgRes.data }]);
        } else {
          setMessages(p => [...p, { role: "ai", text: "Okay, not searching." }]);
        }
        setLoading(false);
        return;
      }
    } catch {}

    // 2. Check browser launch intent
    try {
      const intentRes = await detectLaunchIntent(userMsg);
      const intent = intentRes.data;
      if (intent.detected) {
        const ok = window.confirm(`NeuroClone wants to:\n\n${intent.description}\n\nAllow?`);
        if (ok) {
          window.open(intent.url, "_blank");
          setMessages(p => [...p, { role: "ai", text: `Done. Opening ${intent.description}. Stay focused bhai.` }]);
        } else {
          setMessages(p => [...p, { role: "ai", text: "Okay, not opening it." }]);
        }
        setLoading(false);
        return;
      }
    } catch {}

    // 3. Normal chat
    const history = updated.slice(-10)
      .map(m => `${m.role === "user" ? "Monish" : "AI"}: ${m.text || "[image]"}`).join("\n");

    try {
      const res = await sendMessage(userMsg, `Recent conversation:\n${history}`);
      const aiText = res.data.response;
      setMessages(p => [...p, { role: "ai", text: aiText }]);
      speakResponse(aiText);
    } catch {
      setMessages(p => [...p, { role: "ai", text: "Backend down. Check uvicorn." }]);
    }
    setLoading(false);
  };

  const handleCorrect = async (i) => {
    const c = prompt("What should I have said instead?");
    if (!c) return;
    await sendCorrection(c);
    setCorrecting(i);
    setTimeout(() => setCorrecting(null), 2000);
  };

  const handleSummarize = async () => {
    if (messages.length < 3) return;
    const conv = messages.map(m => `${m.role === "user" ? "Monish" : "AI"}: ${m.text || "[image]"}`).join("\n");
    const res = await summarizeSession(conv);
    alert(`Session saved:\n\n${res.data.summary}`);
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: "rgba(10,10,21,0.85)",
      borderRadius: "16px",
      border: "1px solid var(--border-bright)",
      overflow: "hidden",
      backdropFilter: "blur(20px)",
      boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 24px 64px rgba(0,0,0,0.6), 0 0 60px rgba(34,211,238,0.03)"
    }}>

      {/* Header */}
      <div style={{
        padding: "12px 16px",
        background: "linear-gradient(135deg, rgba(34,211,238,0.06), rgba(168,85,247,0.04))",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: "10px"
      }}>
        <div style={{ position: "relative" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "linear-gradient(135deg, #0891b2, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "800", fontSize: "14px", color: "white",
            boxShadow: "0 0 20px rgba(34,211,238,0.4), inset 0 1px 0 rgba(255,255,255,0.2)"
          }}>N</div>
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: "absolute", bottom: "0", right: "0",
              width: "9px", height: "9px", borderRadius: "50%",
              background: "#10b981", border: "2px solid var(--bg-card)",
              boxShadow: "0 0 6px #10b981"
            }}
          />
        </div>

        <div>
          <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)" }}>NeuroClone</div>
          <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.3px" }}>
            Your second self · Image gen · Browser control · Always watching
          </div>
        </div>

        <AnimatePresence>
          {emotion !== "neutral" && emotionConfig[emotion] && (
            <motion.div key={emotion}
              initial={{ opacity: 0, scale: 0.7, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.7 }}
              style={{
                padding: "3px 10px", borderRadius: "99px",
                background: emotionConfig[emotion].bg,
                border: `1px solid ${emotionConfig[emotion].color}25`,
                fontSize: "10px", fontWeight: "700", color: emotionConfig[emotion].color
              }}
            >{emotionConfig[emotion].label}</motion.div>
          )}
        </AnimatePresence>

        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={handleSummarize}
          style={{
            marginLeft: "auto", padding: "5px 12px", borderRadius: "7px",
            background: "rgba(34,211,238,0.07)",
            border: "1px solid rgba(34,211,238,0.2)",
            color: "var(--cyan)", fontSize: "10px", fontWeight: "700",
            cursor: "pointer", fontFamily: "'Inter', sans-serif"
          }}
        >💾 Save Session</motion.button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: "flex", flexDirection: "column",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start"
              }}
            >
              {msg.role === "ai" && (
                <div style={{
                  fontSize: "9px", color: "var(--text-muted)", marginBottom: "4px",
                  paddingLeft: "4px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase"
                }}>NeuroClone</div>
              )}

              {msg.role === "image" ? (
                <div style={{ paddingLeft: "4px" }}>
                  <ImageMessage data={msg.data} />
                </div>
              ) : (
                <motion.div whileHover={{ scale: 1.005 }} style={{
                  maxWidth: "78%", padding: "11px 15px",
                  borderRadius: msg.role === "user" ? "14px 14px 3px 14px" : "3px 14px 14px 14px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #0891b2, #7c3aed)"
                    : "rgba(15,15,30,0.9)",
                  color: "var(--text-primary)",
                  fontSize: "13.5px", lineHeight: "1.65",
                  border: msg.role === "ai" ? "1px solid var(--border-bright)" : "none",
                  boxShadow: msg.role === "user"
                    ? "0 4px 24px rgba(34,211,238,0.25), inset 0 1px 0 rgba(255,255,255,0.15)"
                    : "0 2px 12px rgba(0,0,0,0.4)",
                  backdropFilter: "blur(10px)"
                }}>
                  {msg.text}
                </motion.div>
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
              width: "30px", height: "30px", borderRadius: "8px",
              background: "linear-gradient(135deg, #0891b2, #7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: "800", color: "white"
            }}>N</div>
            <div style={{
              padding: "10px 14px", borderRadius: "3px 14px 14px 14px",
              background: "rgba(15,15,30,0.9)", border: "1px solid var(--border-bright)",
              display: "flex", gap: "5px", alignItems: "center",
              backdropFilter: "blur(10px)"
            }}>
              {[0, 1, 2].map(j => (
                <motion.div key={j}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, delay: j * 0.15, repeat: Infinity }}
                  style={{
                    width: "5px", height: "5px", borderRadius: "50%",
                    background: "var(--cyan)"
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border)", background: "rgba(6,6,15,0.6)", backdropFilter: "blur(10px)" }}>
        <motion.div
          animate={{
            borderColor: inputFocused ? "rgba(34,211,238,0.4)" : "var(--border-bright)",
            boxShadow: inputFocused ? "0 0 0 3px rgba(34,211,238,0.08)" : "none"
          }}
          style={{
            display: "flex", gap: "8px", alignItems: "center",
            background: "rgba(15,15,30,0.9)",
            border: "1px solid var(--border-bright)",
            borderRadius: "12px", padding: "4px 4px 4px 14px",
            backdropFilter: "blur(10px)"
          }}
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder='Talk, give task, "generate image of...", "open PW"...'
            style={{
              flex: 1, background: "transparent", border: "none",
              color: "var(--text-primary)", fontSize: "13px",
              outline: "none", padding: "8px 0", fontFamily: "'Inter', sans-serif"
            }}
          />
          <motion.button onClick={handleVoice}
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            style={{
              width: "34px", height: "34px", borderRadius: "8px",
              background: listening ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${listening ? "#ef4444" : "var(--border)"}`,
              color: listening ? "#ef4444" : "var(--text-muted)",
              cursor: "pointer", fontSize: "14px",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s"
            }}
          >{listening ? "🔴" : "🎤"}</motion.button>
          <motion.button onClick={handleSend} disabled={loading}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            style={{
              padding: "8px 18px", borderRadius: "9px",
              background: "linear-gradient(135deg, #0891b2, #7c3aed)",
              border: "none", color: "white", fontWeight: "700",
              fontSize: "12px", cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              boxShadow: "0 0 20px rgba(34,211,238,0.25)",
              opacity: loading ? 0.5 : 1, transition: "opacity 0.2s"
            }}
          >Send</motion.button>
        </motion.div>
        <div style={{
          fontSize: "9px", color: "var(--text-muted)",
          textAlign: "center", marginTop: "6px", fontWeight: "500"
        }}>
          Enter · 🎤 voice · generate images · open sites · Groq + Llama 3.3
        </div>
      </div>
    </div>
  );
}