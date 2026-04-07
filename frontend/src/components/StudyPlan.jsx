import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateStudyPlan } from "../api/client";

const subjectColors = {
  GATE: { bg: "rgba(34,211,238,0.1)", border: "rgba(34,211,238,0.3)", text: "#22d3ee", dot: "#22d3ee" },
  VLSI: { bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.3)", text: "#a855f7", dot: "#a855f7" },
  Break: { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)", text: "#6b7280", dot: "#6b7280" },
  Skills: { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", text: "#10b981", dot: "#10b981" },
  Review: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", text: "#f59e0b", dot: "#f59e0b" },
  Other: { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", text: "var(--text-muted)", dot: "#555" },
};

const priorityDot = { high: "#ef4444", medium: "#f59e0b", low: "#6b7280" };

export default function StudyPlan() {
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [checked, setChecked] = useState({});

  const handleGenerate = async () => {
    setLoading(true);
    setPlan([]);
    setChecked({});
    try {
      const res = await generateStudyPlan();
      if (res.data.success && res.data.plan.length > 0) {
        setPlan(res.data.plan);
        setGeneratedAt(res.data.generated_at);
      }
    } catch {}
    setLoading(false);
  };

  const toggle = (i) => setChecked(p => ({ ...p, [i]: !p[i] }));
  const completedCount = Object.values(checked).filter(Boolean).length;
  const pct = plan.length > 0 ? Math.round((completedCount / plan.length) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: "12px" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)" }}>📅 AI Study Plan</div>
          <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "2px" }}>
            {generatedAt ? `Generated at ${generatedAt}` : "Personalized for you by NeuroClone"}
          </div>
        </div>
        {plan.length > 0 && (
          <div style={{ fontSize: "11px", fontWeight: "700", color: pct === 100 ? "#10b981" : "var(--cyan)" }}>
            {completedCount}/{plan.length} done
          </div>
        )}
      </div>

      {/* Generate button */}
      <motion.button
        onClick={handleGenerate}
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          width: "100%", padding: "12px 16px", borderRadius: "12px",
          background: "linear-gradient(135deg, #0891b2, #7c3aed)",
          border: "none", color: "white", fontWeight: "700",
          fontSize: "13px", cursor: "pointer", fontFamily: "'Inter', sans-serif",
          boxShadow: "0 0 24px rgba(34,211,238,0.2)",
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? (
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ display: "inline-block" }}
            >⟳</motion.span>
            Building your plan...
          </span>
        ) : plan.length > 0 ? "🔄 Regenerate Plan" : "⚡ Generate Today's Study Plan"}
      </motion.button>

      {/* Progress bar */}
      {plan.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "99px", height: "3px" }}>
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              height: "100%", borderRadius: "99px",
              background: "linear-gradient(90deg, var(--cyan), #10b981)",
              boxShadow: "0 0 8px rgba(34,211,238,0.4)"
            }}
          />
        </div>
      )}

      {/* Plan blocks */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <AnimatePresence>
          {plan.map((block, i) => {
            const colors = subjectColors[block.subject] || subjectColors.Other;
            const isDone = checked[i];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => toggle(i)}
                style={{
                  background: isDone ? "rgba(16,185,129,0.05)" : colors.bg,
                  border: `1px solid ${isDone ? "rgba(16,185,129,0.2)" : colors.border}`,
                  borderRadius: "10px", padding: "10px 12px",
                  cursor: "pointer", backdropFilter: "blur(10px)",
                  transition: "all 0.3s ease",
                  opacity: isDone ? 0.6 : 1
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  {/* Checkbox */}
                  <motion.div
                    animate={{ scale: isDone ? [1.3, 1] : 1 }}
                    style={{
                      width: "16px", height: "16px", borderRadius: "4px", flexShrink: 0,
                      background: isDone ? "#10b981" : "rgba(255,255,255,0.06)",
                      border: `1px solid ${isDone ? "#10b981" : "rgba(255,255,255,0.12)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginTop: "1px", transition: "all 0.2s"
                    }}
                  >
                    {isDone && <span style={{ fontSize: "10px", color: "white" }}>✓</span>}
                  </motion.div>

                  <div style={{ flex: 1 }}>
                    {/* Time */}
                    <div style={{ fontSize: "9px", color: colors.text, fontWeight: "700", letterSpacing: "0.5px", marginBottom: "2px" }}>
                      {block.time}
                    </div>

                    {/* Task */}
                    <div style={{
                      fontSize: "12px", fontWeight: "600",
                      color: isDone ? "var(--text-muted)" : "var(--text-primary)",
                      textDecoration: isDone ? "line-through" : "none",
                      marginBottom: "4px", transition: "all 0.3s"
                    }}>
                      {block.task}
                    </div>

                    {/* Tags */}
                    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                      <div style={{
                        background: colors.bg, border: `1px solid ${colors.border}`,
                        borderRadius: "99px", padding: "1px 7px",
                        fontSize: "9px", color: colors.text, fontWeight: "700"
                      }}>{block.subject}</div>
                      <div style={{
                        width: "5px", height: "5px", borderRadius: "50%",
                        background: priorityDot[block.priority] || "#555"
                      }} />
                      <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>{block.priority} priority</span>
                    </div>

                    {/* Note */}
                    {block.note && (
                      <div style={{
                        fontSize: "10px", color: "var(--text-muted)",
                        marginTop: "4px", fontStyle: "italic"
                      }}>💡 {block.note}</div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {plan.length === 0 && !loading && (
          <div style={{
            textAlign: "center", padding: "32px 20px",
            color: "var(--text-muted)", fontSize: "12px",
            background: "rgba(15,15,30,0.5)", borderRadius: "12px",
            border: "1px dashed rgba(255,255,255,0.06)"
          }}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>📅</div>
            <div>Hit generate to get your personalized study plan</div>
            <div style={{ fontSize: "10px", marginTop: "4px", color: "var(--text-muted)" }}>Built from your goals + GATE backlog</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}