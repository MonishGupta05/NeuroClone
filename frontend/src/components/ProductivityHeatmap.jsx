import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getHourlyAnalytics } from "../api/client";

function getBarColor(score) {
  if (score === -1) return { bg: "rgba(255,255,255,0.04)", glow: "none" };
  if (score >= 80) return { bg: "linear-gradient(180deg, #10b981, #059669)", glow: "0 0 12px rgba(16,185,129,0.6)" };
  if (score >= 60) return { bg: "linear-gradient(180deg, #22d3ee, #0891b2)", glow: "0 0 12px rgba(34,211,238,0.5)" };
  if (score >= 40) return { bg: "linear-gradient(180deg, #f59e0b, #d97706)", glow: "0 0 12px rgba(245,158,11,0.5)" };
  if (score >= 20) return { bg: "linear-gradient(180deg, #f97316, #ea580c)", glow: "0 0 12px rgba(249,115,22,0.5)" };
  return { bg: "linear-gradient(180deg, #ef4444, #dc2626)", glow: "0 0 12px rgba(239,68,68,0.5)" };
}

function formatHour(h) {
  const n = parseInt(h);
  if (n === 0) return "12AM";
  if (n === 12) return "12PM";
  return n < 12 ? `${n}AM` : `${n - 12}PM`;
}

export default function ProductivityHeatmap() {
  const [data, setData] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const r = await getHourlyAnalytics();
      setData(r.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  if (loading && !data) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)" }}>⚡ Efficiency Heatmap</div>
      <div style={{
        background: "rgba(15,15,30,0.7)", border: "1px solid var(--border-bright)",
        borderRadius: "14px", padding: "40px", textAlign: "center",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "10px"
      }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
            style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--cyan)", display: "inline-block", margin: "0 3px" }}
          />
        ))}
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Loading efficiency data...</div>
      </div>
    </div>
  );

  if (!data) return (
    <div style={{ color: "var(--text-muted)", fontSize: "12px", padding: "40px", textAlign: "center" }}>
      No data yet. Browse some sites first.
    </div>
  );

  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: i, key: String(i), ...data.hourly[String(i)]
  }));
  const maxActivity = Math.max(...hours.map(h => (h.focus || 0) + (h.distraction || 0)), 1);
  const efficiency = data.efficiency || 0;
  const effColor = efficiency >= 70 ? "#10b981" : efficiency >= 40 ? "#f59e0b" : "#ef4444";
  const effLabel = efficiency >= 70 ? "High Performer" : efficiency >= 40 ? "Needs Focus" : "Critical";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)" }}>⚡ Efficiency Heatmap</div>
          <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "2px" }}>Hover bars for hourly breakdown</div>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} onClick={load}
          style={{
            background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.15)",
            borderRadius: "5px", padding: "3px 9px", color: "var(--cyan)",
            fontSize: "9px", cursor: "pointer", fontFamily: "'Inter', sans-serif"
          }}>↻</motion.button>
      </div>

      {/* Efficiency card */}
      <div style={{
        background: "rgba(15,15,30,0.8)", border: `1px solid ${effColor}20`,
        borderRadius: "14px", padding: "18px", backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", gap: "16px",
        boxShadow: `0 0 30px ${effColor}10`
      }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg width="90" height="90" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="45" cy="45" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <motion.circle cx="45" cy="45" r="36" fill="none" stroke={effColor} strokeWidth="6"
              strokeDasharray={2 * Math.PI * 36}
              initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 36 * (1 - efficiency / 100) }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 8px ${effColor})` }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center"
          }}>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-primary)" }}>{efficiency}%</div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "14px", fontWeight: "800", color: effColor, marginBottom: "6px" }}>{effLabel}</div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.7" }}>
            {data.peak_hour !== null
              ? <div>🟢 Peak at <strong style={{ color: "var(--text-primary)" }}>{formatHour(data.peak_hour)}</strong></div>
              : <div style={{ color: "var(--text-muted)" }}>No peak hour yet</div>}
            {data.worst_hour !== null &&
              <div>🔴 Lowest at <strong style={{ color: "var(--text-primary)" }}>{formatHour(data.worst_hour)}</strong></div>}
          </div>
        </div>
      </div>

      {/* Hourly bars */}
      <div style={{
        background: "rgba(15,15,30,0.8)", border: "1px solid var(--border-bright)",
        borderRadius: "14px", padding: "16px", backdropFilter: "blur(10px)"
      }}>
        <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "700", letterSpacing: "1px", marginBottom: "12px", textTransform: "uppercase" }}>
          Hourly Breakdown — Last 24 Hours
        </div>

        <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "80px", marginBottom: "6px" }}>
          {hours.map((h, i) => {
            const total = (h.focus || 0) + (h.distraction || 0);
            const barH = total === 0 ? 4 : Math.max((total / maxActivity) * 70, 4);
            const color = getBarColor(h.score ?? -1);
            const isNow = String(h.hour) === String(new Date().getHours());
            const isPeak = String(h.hour) === String(data.peak_hour);

            return (
              <div key={h.hour} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", position: "relative" }}
                onMouseEnter={() => setHovered(h)}
                onMouseLeave={() => setHovered(null)}
              >
                {isPeak && <div style={{ position: "absolute", top: "-12px", fontSize: "8px" }}>⭐</div>}
                {isNow && (
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{
                      position: "absolute", top: "-14px",
                      width: "4px", height: "4px", borderRadius: "50%",
                      background: "#22d3ee", boxShadow: "0 0 6px #22d3ee"
                    }}
                  />
                )}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${barH}px` }}
                  transition={{ duration: 0.7, delay: i * 0.015, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    width: "100%", borderRadius: "3px 3px 0 0",
                    background: color.bg,
                    boxShadow: hovered?.hour === h.hour ? color.glow : "none",
                    outline: isNow ? "1px solid rgba(34,211,238,0.5)" : "none",
                    transition: "box-shadow 0.2s"
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div style={{ display: "flex", gap: "2px" }}>
          {hours.map(h => (
            <div key={h.hour} style={{
              flex: 1, fontSize: "7px",
              color: [0, 6, 12, 18].includes(h.hour) ? "var(--text-secondary)" : "transparent",
              textAlign: "center", fontWeight: "600"
            }}>
              {[0, 6, 12, 18].includes(h.hour) ? formatHour(h.hour) : "."}
            </div>
          ))}
        </div>

        {/* Hover tooltip */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              style={{
                marginTop: "10px", background: "rgba(6,6,15,0.97)",
                border: "1px solid var(--border-bright)", borderRadius: "9px",
                padding: "10px 12px"
              }}
            >
              <div style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "11px", marginBottom: "4px" }}>
                {formatHour(String(hovered.hour))} — {formatHour(String((hovered.hour + 1) % 24))}
              </div>
              <div style={{ display: "flex", gap: "14px", fontSize: "11px", color: "var(--text-secondary)" }}>
                <span>✅ <strong style={{ color: "#10b981" }}>{hovered.focus || 0}</strong> focus</span>
                <span>⚠️ <strong style={{ color: "#ef4444" }}>{hovered.distraction || 0}</strong> distraction</span>
                <span>Score: <strong style={{ color: (hovered.score ?? -1) >= 60 ? "#10b981" : (hovered.score ?? -1) >= 0 ? "#f59e0b" : "var(--text-muted)" }}>
                  {(hovered.score ?? -1) === -1 ? "—" : `${hovered.score}%`}
                </strong></span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
        {[
          { color: "#10b981", label: "Excellent (80%+)" },
          { color: "#22d3ee", label: "Good (60%+)" },
          { color: "#f59e0b", label: "Mixed (40%+)" },
          { color: "#ef4444", label: "Distracted" },
        ].map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: l.color, boxShadow: `0 0 5px ${l.color}80` }} />
            <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>{l.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}