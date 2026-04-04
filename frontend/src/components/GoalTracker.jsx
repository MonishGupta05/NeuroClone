import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addMemory } from "../api/client";

const PRESETS = [
  "Watch 5 PW videos today",
  "Solve 2 Verilog problems",
  "No Instagram before 9PM",
  "Revise one concept",
];

export default function GoalTracker() {
  const [goals, setGoals] = useState(() => { try { return JSON.parse(localStorage.getItem("neuroclone_goals")) || []; } catch { return []; } });
  const [input, setInput] = useState("");

  useEffect(() => { localStorage.setItem("neuroclone_goals", JSON.stringify(goals)); }, [goals]);

  const addGoal = async (text) => {
    if (!text.trim()) return;
    setGoals(p => [{ id: Date.now(), text, done: false }, ...p]);
    await addMemory(`Goal set: ${text}`, "goal", 1.8).catch(() => {});
    setInput("");
  };

  const toggle = (id) => setGoals(p => p.map(g => g.id === id ? { ...g, done: !g.done } : g));
  const remove = (id) => setGoals(p => p.filter(g => g.id !== id));
  const done = goals.filter(g => g.done).length;
  const pct = goals.length === 0 ? 0 : Math.round((done / goals.length) * 100);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)" }}>🎯 Goals</div>
        <div style={{ fontSize: "11px", fontWeight: "700", color: pct === 100 ? "var(--green)" : "var(--cyan)" }}>{done}/{goals.length} · {pct}%</div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "99px", height: "3px" }}>
        <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ height: "100%", borderRadius: "99px", background: "linear-gradient(90deg, var(--cyan), var(--green))", boxShadow: "0 0 10px rgba(34,211,238,0.4)" }} />
      </div>

      <div style={{ display: "flex", gap: "7px" }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addGoal(input)}
          placeholder="Add a goal..."
          style={{
            flex: 1, background: "rgba(15,15,30,0.8)", border: "1px solid var(--border-bright)",
            borderRadius: "8px", padding: "7px 11px", color: "var(--text-primary)",
            fontSize: "12px", outline: "none", fontFamily: "'Inter', sans-serif"
          }} />
        <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => addGoal(input)}
          style={{
            padding: "7px 14px", borderRadius: "8px",
            background: "linear-gradient(135deg, #0891b2, #7c3aed)",
            border: "none", color: "white", fontWeight: "700", fontSize: "13px",
            cursor: "pointer", boxShadow: "0 0 16px rgba(34,211,238,0.25)",
            fontFamily: "'Inter', sans-serif"
          }}>+</motion.button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
        {PRESETS.map((p, i) => (
          <motion.button key={i} whileHover={{ scale: 1.03 }} onClick={() => addGoal(p)}
            style={{
              background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.12)",
              borderRadius: "99px", padding: "3px 9px",
              color: "var(--text-muted)", fontSize: "9px", cursor: "pointer", fontFamily: "'Inter', sans-serif"
            }}>+ {p}</motion.button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "5px", maxHeight: "220px", overflowY: "auto" }}>
        {goals.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: "11px", textAlign: "center", padding: "20px" }}>No goals yet.</div>}
        <AnimatePresence>
          {goals.map(g => (
            <motion.div key={g.id}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10, height: 0 }}
              style={{
                display: "flex", alignItems: "center", gap: "9px",
                background: g.done ? "rgba(16,185,129,0.06)" : "rgba(15,15,30,0.8)",
                borderRadius: "9px", padding: "9px 11px",
                border: `1px solid ${g.done ? "rgba(16,185,129,0.2)" : "var(--border)"}`,
                backdropFilter: "blur(10px)", transition: "all 0.3s"
              }}>
              <input type="checkbox" checked={g.done} onChange={() => toggle(g.id)}
                style={{ accentColor: "var(--cyan)", width: "13px", height: "13px", cursor: "pointer" }} />
              <span style={{
                flex: 1, color: g.done ? "var(--text-muted)" : "var(--text-secondary)",
                fontSize: "12px", textDecoration: g.done ? "line-through" : "none", transition: "all 0.3s"
              }}>{g.text}</span>
              <motion.button whileHover={{ scale: 1.2 }} onClick={() => remove(g.id)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "13px", fontFamily: "'Inter', sans-serif" }}>×</motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}