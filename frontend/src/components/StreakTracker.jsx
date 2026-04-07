import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getStreaks } from "../api/client";

export default function StreakTracker() {
  const [data, setData] = useState(null);

  const load = async () => {
    try { const r = await getStreaks(); setData(r.data); } catch {}
  };

  useEffect(() => { load(); }, []);

  if (!data) return (
    <div style={{ color: "var(--text-muted)", fontSize: "12px", padding: "40px", textAlign: "center" }}>
      Loading streak data...
    </div>
  );

  const { current_streak, best_streak, last_14_days, today_score, yesterday_score } = data;
  const beating = today_score >= yesterday_score;
  const diff = Math.abs(today_score - yesterday_score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: "12px" }}
    >
      <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)" }}>🔥 Streak Tracker</div>

      {/* Main streak display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: "rgba(15,15,30,0.8)", border: "1px solid rgba(249,115,22,0.2)",
          borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)",
          boxShadow: "0 0 40px rgba(249,115,22,0.08)",
          textAlign: "center", position: "relative", overflow: "hidden"
        }}
      >
        {/* Background glow */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "200px", height: "200px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)",
          pointerEvents: "none"
        }} />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          style={{ fontSize: "48px", marginBottom: "4px" }}
        >
          {current_streak > 0 ? "🔥" : "💤"}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: "56px", fontWeight: "900",
            background: current_streak > 0
              ? "linear-gradient(135deg, #f97316, #fbbf24)"
              : "linear-gradient(135deg, #444, #666)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text", lineHeight: "1"
          }}
        >
          {current_streak}
        </motion.div>

        <div style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>
          {current_streak === 1 ? "day streak" : "day streak"}
        </div>

        {best_streak > 0 && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)",
            borderRadius: "99px", padding: "3px 12px",
            fontSize: "10px", color: "var(--cyan)", fontWeight: "700"
          }}>
            ⭐ Best: {best_streak} days
          </div>
        )}
      </motion.div>

      {/* Today vs Yesterday */}
      <div style={{
        background: "rgba(15,15,30,0.8)", border: `1px solid ${beating ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
        borderRadius: "12px", padding: "14px", backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", gap: "12px"
      }}>
        <div style={{ fontSize: "20px" }}>{beating ? "📈" : "📉"}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: beating ? "#10b981" : "#ef4444" }}>
            {beating ? `+${diff}% ahead of yesterday` : `${diff}% behind yesterday`}
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
            Today: {today_score}% · Yesterday: {yesterday_score}%
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{
            fontSize: "10px", fontWeight: "700", color: "var(--text-muted)",
            textAlign: "right", marginBottom: "2px"
          }}>Score comparison</div>
          <div style={{ display: "flex", gap: "4px", alignItems: "flex-end" }}>
            {[
              { score: yesterday_score, label: "Yest", color: "#6b7280" },
              { score: today_score, label: "Today", color: beating ? "#10b981" : "#ef4444" }
            ].map((b, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((b.score / 100) * 40, 4)}px` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  style={{
                    width: "18px", borderRadius: "3px 3px 0 0",
                    background: b.color, boxShadow: `0 0 8px ${b.color}60`
                  }}
                />
                <div style={{ fontSize: "8px", color: "var(--text-muted)" }}>{b.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Last 14 days */}
      <div style={{
        background: "rgba(15,15,30,0.8)", border: "1px solid var(--border-bright)",
        borderRadius: "12px", padding: "14px", backdropFilter: "blur(10px)"
      }}>
        <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "700", letterSpacing: "1px", marginBottom: "10px", textTransform: "uppercase" }}>
          Last 14 Days
        </div>
        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
          {last_14_days.map((d, i) => {
            const color = d.score === -1 ? "rgba(255,255,255,0.06)" : d.productive ? "#10b981" : "#ef4444";
            const glow = d.productive ? "0 0 8px rgba(16,185,129,0.5)" : d.score !== -1 ? "0 0 8px rgba(239,68,68,0.5)" : "none";
            const isToday = i === 13;
            return (
              <motion.div
                key={d.date}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.03, type: "spring", stiffness: 200 }}
                title={`${d.day}: ${d.score === -1 ? "No data" : `${d.score}% efficiency`}`}
                style={{
                  flex: 1, aspectRatio: "1", borderRadius: "5px",
                  background: color,
                  boxShadow: glow,
                  outline: isToday ? "2px solid rgba(34,211,238,0.6)" : "none",
                  outlineOffset: "1px",
                  cursor: "default",
                  transition: "transform 0.2s"
                }}
              />
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
          <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>14 days ago</span>
          <span style={{ fontSize: "9px", color: "var(--cyan)" }}>Today</span>
        </div>
      </div>

      {/* Motivation */}
      <div style={{
        background: "linear-gradient(135deg, rgba(249,115,22,0.08), rgba(168,85,247,0.06))",
        border: "1px solid rgba(249,115,22,0.15)", borderRadius: "12px", padding: "12px",
        fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6", textAlign: "center",
        fontStyle: "italic"
      }}>
        {current_streak === 0 && "Every streak starts with day 1. Start today bhai."}
        {current_streak === 1 && "Day 1 done. That's the hardest one. Don't stop now."}
        {current_streak >= 2 && current_streak < 7 && `${current_streak} days in. Building momentum. Keep pushing.`}
        {current_streak >= 7 && `${current_streak} day streak. This version of you is dangerous. Keep going.`}
      </div>
    </motion.div>
  );
}