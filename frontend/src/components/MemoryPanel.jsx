import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getMemories, addMemory } from "../api/client";

const typeColor = { fact: "#22d3ee", goal: "#10b981", correction: "#f59e0b", conversation: "#333355", reflection: "#a855f7" };

export default function MemoryPanel() {
  const [memories, setMemories] = useState([]);
  const [input, setInput] = useState("");
  const load = async () => { try { const r = await getMemories(); setMemories(r.data.memories); } catch {} };
  useEffect(() => { load(); }, []);
  const handleAdd = async () => {
    if (!input.trim()) return;
    await addMemory(input.trim()); setInput(""); load();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)" }}>🧠 Memory Bank</div>
      <div style={{ display: "flex", gap: "7px" }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()}
          placeholder="Store a memory..."
          style={{
            flex: 1, background: "rgba(15,15,30,0.8)", border: "1px solid var(--border-bright)",
            borderRadius: "8px", padding: "7px 11px", color: "var(--text-primary)",
            fontSize: "12px", outline: "none", fontFamily: "'Inter', sans-serif"
          }} />
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAdd}
          style={{
            padding: "7px 13px", borderRadius: "8px",
            background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)",
            color: "var(--cyan)", fontWeight: "700", fontSize: "12px", cursor: "pointer", fontFamily: "'Inter', sans-serif"
          }}>Add</motion.button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "5px", maxHeight: "280px", overflowY: "auto" }}>
        {memories.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: "11px", textAlign: "center", padding: "20px" }}>No memories yet. Start chatting.</div>}
        <AnimatePresence>
          {memories.map((m, i) => (
            <motion.div key={m.id}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              style={{
                background: "rgba(15,15,30,0.8)", borderRadius: "9px", padding: "9px 11px",
                border: `1px solid rgba(255,255,255,0.04)`,
                borderLeft: `2px solid ${typeColor[m.type] || "var(--border)"}`,
                backdropFilter: "blur(10px)"
              }}>
              <div style={{ fontSize: "8px", fontWeight: "700", letterSpacing: "1px", color: typeColor[m.type] || "var(--text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>{m.type}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "11px", lineHeight: "1.5" }}>{m.content}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}