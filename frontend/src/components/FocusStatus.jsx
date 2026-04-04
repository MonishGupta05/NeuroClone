import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getRecentActivity } from "../api/client";

const catColor = { distraction: "#ef4444", focus: "#10b981", neutral: "#333355" };
const catIcon = { distraction: "⚠️", focus: "✅", neutral: "○" };

export default function FocusStatus() {
  const [activity, setActivity] = useState([]);
  const load = async () => { try { const r = await getRecentActivity(); setActivity(r.data.activity); } catch {} };
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, []);
  const dist = activity.filter(a => a.category === "distraction").length;
  const focus = activity.filter(a => a.category === "focus").length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)" }}>📡 Focus Tracker</div>
      <div style={{ display: "flex", gap: "8px" }}>
        {[{ val: dist, label: "Distractions", color: "#ef4444" }, { val: focus, label: "Focus Hits", color: "#10b981" }].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
            style={{
              flex: 1, background: `${s.color}0a`, border: `1px solid ${s.color}20`,
              borderRadius: "10px", padding: "11px", textAlign: "center",
              backdropFilter: "blur(10px)"
            }}>
            <motion.div key={s.val} initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              style={{ fontSize: "22px", fontWeight: "800", color: s.color }}>{s.val}</motion.div>
            <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "2px" }}>{s.label}</div>
          </motion.div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {activity.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: "11px", textAlign: "center", padding: "16px" }}>No activity yet. Install the Chrome extension.</div>}
        <AnimatePresence>
          {activity.map((a, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "rgba(15,15,30,0.8)", borderRadius: "8px", padding: "7px 11px",
                border: "1px solid var(--border)", backdropFilter: "blur(10px)"
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <span style={{ fontSize: "11px" }}>{catIcon[a.category]}</span>
                <span style={{ color: "var(--text-secondary)", fontSize: "11px" }}>{a.site}</span>
              </div>
              <span style={{ fontSize: "8px", fontWeight: "700", color: catColor[a.category], textTransform: "uppercase", letterSpacing: "0.5px" }}>{a.category}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}