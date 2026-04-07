import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getAnalytics } from "../api/client";

function Ring({ score }) {
  const r = 48, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  const label = score >= 70 ? "Focused" : score >= 40 ? "Drifting" : "Distracted";
  return (
    <div style={{ position: "relative", width: "110px", height: "110px", flexShrink: 0 }}>
      <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
        <motion.circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-primary)" }}>{score}</div>
        <div style={{ fontSize: "9px", fontWeight: "700", color, letterSpacing: "0.5px" }}>{label}</div>
      </div>
    </div>
  );
}

const GlassCard = ({ children, style = {}, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
    style={{
      background: "rgba(15,15,30,0.75)",
      border: "1px solid var(--border-bright)",
      borderRadius: "12px", padding: "14px",
      backdropFilter: "blur(10px)",
      boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
      ...style
    }}
  >{children}</motion.div>
);

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const r = await getAnalytics();
      setData(r.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, []);

  if (loading && !data) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)" }}>📈 Analytics</div>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          background: "rgba(15,15,30,0.5)", border: "1px solid var(--border)",
          borderRadius: "12px", height: `${60 + i * 20}px`,
          backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)",
          backgroundSize: "400px 100%",
          animation: "shimmer-line 2s infinite"
        }} />
      ))}
    </div>
  );

  if (!data) return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
      <div style={{ fontSize: "28px", marginBottom: "8px" }}>📊</div>
      <div style={{ fontSize: "12px" }}>No data yet. Browse some sites to start tracking.</div>
    </div>
  );

  const maxWeek = Math.max(...data.weekly_trend.map(d => d.distractions + d.focus), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)" }}>📈 Analytics</div>
        <motion.button whileHover={{ scale: 1.05 }} onClick={load}
          style={{
            background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.15)",
            borderRadius: "5px", padding: "3px 9px", color: "var(--cyan)",
            fontSize: "9px", cursor: "pointer", fontFamily: "'Inter', sans-serif"
          }}>↻ Refresh</motion.button>
      </div>

      <GlassCard style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <Ring score={data.score} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "7px" }}>
          {[
            { val: data.today.distractions, label: "Distractions today", color: "#ef4444" },
            { val: data.today.focus, label: "Focus sessions", color: "#10b981" },
          ].map((s, i) => (
            <div key={i} style={{
              background: `${s.color}0d`, border: `1px solid ${s.color}22`,
              borderRadius: "9px", padding: "9px 12px"
            }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.1 }}
                style={{ fontSize: "20px", fontWeight: "800", color: s.color }}>{s.val}</motion.div>
              <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      {data.today.total_sites === 0 && (
        <GlassCard style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "20px", marginBottom: "6px" }}>🔍</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.6" }}>
            No browser activity yet today.<br />
            Install the Chrome extension to start tracking.
          </div>
        </GlassCard>
      )}

      <GlassCard delay={0.1}>
        <div style={{ fontSize: "9px", color: "var(--text-muted)", marginBottom: "10px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>
          7-Day Activity
        </div>
        <div style={{ display: "flex", gap: "5px", alignItems: "flex-end", height: "64px" }}>
          {data.weekly_trend.map((d, i) => {
            const total = d.distractions + d.focus;
            const h = Math.max((total / maxWeek) * 54, 4);
            const pct = total === 0 ? 50 : (d.focus / total) * 100;
            const color = pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : total === 0 ? "#222" : "#ef4444";
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <motion.div
                  initial={{ height: 0 }} animate={{ height: `${h}px` }}
                  transition={{ duration: 0.8, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    width: "100%", borderRadius: "3px 3px 0 0",
                    background: total === 0 ? "rgba(255,255,255,0.04)" : `linear-gradient(180deg, ${color}, ${color}66)`,
                    boxShadow: total > 0 ? `0 0 10px ${color}40` : "none"
                  }}
                />
                <div style={{ fontSize: "8px", color: "var(--text-muted)", fontWeight: "700" }}>{d.day}</div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {data.top_distractions.length > 0 ? (
        <GlassCard delay={0.2}>
          <div style={{ fontSize: "9px", color: "var(--text-muted)", marginBottom: "10px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>
            Top Distractions
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {data.top_distractions.map((d, i) => {
              const pct = Math.round((d.count / data.top_distractions[0].count) * 100);
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{d.site}</span>
                    <span style={{ fontSize: "10px", color: "#ef4444", fontWeight: "700" }}>{d.count}×</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "99px", height: "3px" }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        height: "100%",
                        background: "linear-gradient(90deg, #ef4444, #f97316)",
                        borderRadius: "99px", boxShadow: "0 0 6px rgba(239,68,68,0.5)"
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      ) : (
        <GlassCard delay={0.2} style={{ textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            🎯 No distractions tracked yet. Clean start bhai.
          </div>
        </GlassCard>
      )}

      <GlassCard delay={0.3} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-primary)" }}>{data.total_memories}</div>
          <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>Total memories</div>
        </div>
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {Object.entries(data.memory_stats).filter(([, count]) => count > 0).map(([type, count]) => (
            <div key={type} style={{
              background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.18)",
              borderRadius: "99px", padding: "2px 7px",
              fontSize: "9px", color: "var(--cyan)", fontWeight: "700"
            }}>{type} {count}</div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}