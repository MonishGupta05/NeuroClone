import { useState } from "react";
import { motion } from "framer-motion";
import { getDailyReflection, getInsight, compressMemories } from "../api/client";

export default function ReflectionCard() {
  const [reflection, setReflection] = useState("");
  const [insight, setInsight] = useState("");
  const [loadingRef, setLoadingRef] = useState(false);
  const [loadingIns, setLoadingIns] = useState(false);
  const [compressed, setCompressed] = useState(null);

  const handleReflect = async () => {
    setLoadingRef(true); setReflection("");
    try { const r = await getDailyReflection(); setReflection(r.data.reflection); } catch { setReflection("Backend error."); }
    setLoadingRef(false);
  };

  const handleInsight = async () => {
    setLoadingIns(true); setInsight("");
    try { const r = await getInsight(); setInsight(r.data.insight); } catch { setInsight("Not enough data yet."); }
    setLoadingIns(false);
  };

  const handleCompress = async () => { const r = await compressMemories(); setCompressed(r.data.deleted); };

  const Btn = ({ onClick, loading, children, variant = "primary" }) => (
    <motion.button onClick={onClick} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
      style={{
        width: "100%", padding: "10px 16px", borderRadius: "9px",
        border: variant === "primary" ? "none" : "1px solid rgba(34,211,238,0.2)",
        background: variant === "primary"
          ? "linear-gradient(135deg, #0891b2, #7c3aed)"
          : "rgba(34,211,238,0.05)",
        color: variant === "primary" ? "white" : "var(--cyan)",
        fontWeight: "700", fontSize: "12px", cursor: "pointer",
        opacity: loading ? 0.5 : 1, fontFamily: "'Inter', sans-serif",
        boxShadow: variant === "primary" ? "0 0 20px rgba(34,211,238,0.2)" : "none"
      }}
    >{children}</motion.button>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)" }}>🪞 Reflection</div>
        <motion.button whileHover={{ scale: 1.05 }} onClick={handleCompress}
          style={{
            background: "none", border: "1px solid var(--border)", borderRadius: "5px",
            padding: "3px 9px", color: "var(--text-muted)", fontSize: "9px",
            cursor: "pointer", fontFamily: "'Inter', sans-serif"
          }}>
          {compressed !== null ? `🗑️ Cleared ${compressed}` : "🗜️ Compress"}
        </motion.button>
      </div>

      <Btn onClick={handleReflect} loading={loadingRef}>{loadingRef ? "Generating..." : "⚡ Today's Reflection"}</Btn>
      {reflection && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.15)",
            borderRadius: "10px", padding: "12px",
            color: "var(--text-secondary)", fontSize: "12px", lineHeight: "1.7", fontStyle: "italic",
            backdropFilter: "blur(10px)"
          }}>"{reflection}"</motion.div>
      )}

      <Btn onClick={handleInsight} loading={loadingIns} variant="secondary">{loadingIns ? "Analysing..." : "🔍 Weekly Insight"}</Btn>
      {insight && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)",
            borderRadius: "10px", padding: "12px",
            color: "var(--text-secondary)", fontSize: "12px", lineHeight: "1.7",
            backdropFilter: "blur(10px)"
          }}>{insight}</motion.div>
      )}
    </motion.div>
  );
}