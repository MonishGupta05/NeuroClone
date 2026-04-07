import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getMemories, addMemory } from "../api/client";
import { useToast } from "./Toast";

const typeColor = {
  fact: "#22d3ee", goal: "#10b981", correction: "#f59e0b",
  conversation: "#334", reflection: "#a855f7",
  preference: "#ec4899", plan: "#6366f1"
};

const typeIcon = {
  fact: "📌", goal: "🎯", correction: "✏️",
  conversation: "💬", reflection: "🪞",
  preference: "❤️", plan: "📅"
};

export default function MemoryPanel() {
  const [memories, setMemories] = useState([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try { const r = await getMemories(); setMemories(r.data.memories || []); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  const handleAdd = async () => {
    if (!input.trim()) return;
    try {
      await addMemory(input.trim(), "auto");
      setInput("");
      toast.success("Memory stored and auto-tagged!", 2000);
      load();
    } catch { toast.error("Failed to store memory."); }
  };

  const types = ["all", ...new Set(memories.map(m => m.type))];
  const filtered = filter === "all" ? memories : memories.filter(m => m.type === filter);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)" }}>🧠 Memory Bank</div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
          <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>{memories.length} stored</span>
        </div>
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: "6px" }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          placeholder="Store anything... auto-tagged by AI"
          style={{
            flex: 1, background: "rgba(15,15,30,0.85)", border: "1px solid var(--border-bright)",
            borderRadius: "8px", padding: "7px 11px", color: "var(--text-primary)",
            fontSize: "12px", outline: "none", fontFamily: "'Inter', sans-serif"
          }}
        />
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAdd}
          style={{
            padding: "7px 13px", borderRadius: "8px",
            background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)",
            color: "var(--cyan)", fontWeight: "700", fontSize: "12px",
            cursor: "pointer", fontFamily: "'Inter', sans-serif"
          }}>Add</motion.button>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            style={{
              padding: "2px 8px", borderRadius: "99px", border: "none",
              background: filter === t ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.04)",
              border: filter === t ? "1px solid rgba(34,211,238,0.3)" : "1px solid transparent",
              color: filter === t ? "var(--cyan)" : "var(--text-muted)",
              fontSize: "9px", fontWeight: "700", cursor: "pointer",
              fontFamily: "'Inter', sans-serif", textTransform: "capitalize"
            }}
          >{typeIcon[t] || "○"} {t}</button>
        ))}
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "5px", maxHeight: "340px", overflowY: "auto" }}>
        {loading && memories.length === 0 && (
          <div style={{ color: "var(--text-muted)", fontSize: "11px", textAlign: "center", padding: "20px" }}>
            Loading memories...
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{
            textAlign: "center", padding: "24px 20px",
            color: "var(--text-muted)", fontSize: "11px",
            background: "rgba(15,15,30,0.4)", borderRadius: "10px",
            border: "1px dashed rgba(255,255,255,0.05)"
          }}>
            <div style={{ fontSize: "20px", marginBottom: "6px" }}>🧠</div>
            {filter === "all" ? "No memories yet. Start chatting." : `No ${filter} memories yet.`}
          </div>
        )}
        <AnimatePresence>
          {filtered.map((m, i) => (
            <motion.div key={m.id}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ delay: i * 0.025 }}
              style={{
                background: "rgba(15,15,30,0.8)", borderRadius: "9px",
                padding: "9px 11px",
                border: "1px solid rgba(255,255,255,0.04)",
                borderLeft: `2px solid ${typeColor[m.type] || "#334"}`,
                backdropFilter: "blur(10px)"
              }}
            >
              <div style={{
                fontSize: "8px", fontWeight: "700", letterSpacing: "1px",
                color: typeColor[m.type] || "var(--text-muted)",
                marginBottom: "3px", textTransform: "uppercase",
                display: "flex", alignItems: "center", gap: "4px"
              }}>
                {typeIcon[m.type] || "○"} {m.type}
                {m.importance >= 1.5 && <span style={{ color: "#f59e0b" }}>★</span>}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "11px", lineHeight: "1.5" }}>
                {m.content.length > 120 ? m.content.slice(0, 120) + "..." : m.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}