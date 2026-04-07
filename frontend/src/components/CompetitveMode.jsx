import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAnalytics, getStreaks } from "../api/client";

function ScoreArc({ score, label, color, size = 120 }) {
  const r = size * 0.4;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: `${size}px`, height: `${size}px` }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={size * 0.06} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
          strokeWidth={size * 0.06}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 ${size * 0.07}px ${color})` }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center"
      }}>
        <div style={{ fontSize: `${size * 0.22}px`, fontWeight: "800", color: "var(--text-primary)" }}>{score}</div>
        <div style={{ fontSize: `${size * 0.09}px`, color, fontWeight: "700" }}>{label}</div>
      </div>
    </div>
  );
}

export default function CompetitiveMode() {
  const [analytics, setAnalytics] = useState(null);
  const [streaks, setStreaks] = useState(null);

  const load = async () => {
    try {
      const [a, s] = await Promise.all([getAnalytics(), getStreaks()]);
      setAnalytics(a.data);
      setStreaks(s.data);
    } catch {}
  };

  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, []);

  if (!analytics || !streaks) return (
    <div style={{ color: "var(--text-muted)", fontSize: "12px", padding: "40px", textAlign: "center" }}>
      Loading competitive data...
    </div>
  );

  const todayScore = analytics.score;
  const yesterdayScore = streaks.yesterday_score;
  const beating = todayScore >= yesterdayScore;
  const diff = Math.abs(todayScore - yesterdayScore);
  const streak = streaks.current_streak;

  const weekScores = analytics.weekly_trend.map(d => {
    const total = d.focus + d.distractions;
    return total === 0 ? 0 : Math.round((d.focus / total) * 100);
  });
  const avgWeek = weekScores.length > 0 ? Math.round(weekScores.reduce((a, b) => a + b, 0) / weekScores.length) : 0;

  const challenges = [
    { goal: "Stay above 70% focus", done: todayScore >= 70, reward: "🏆 Focus Master" },
    { goal: "Beat yesterday's score", done: beating, reward: "📈 Improver" },
    { goal: `Maintain ${streak > 0 ? streak + 1 : 1}+ day streak`, done: streak >= 1, reward: "🔥 Consistent" },
    { goal: "No distractions in last hour", done: analytics.today.distractions === 0, reward: "🎯 Sharp" },
  ];
  const completedChallenges = challenges.filter(c => c.done).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: "12px" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)" }}>🏆 Competitive Mode</div>
          <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "2px" }}>Beat yourself every day</div>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} onClick={load}
          style={{
            background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.15)",
            borderRadius: "5px", padding: "3px 9px", color: "var(--cyan)",
            fontSize: "9px", cursor: "pointer", fontFamily: "'Inter', sans-serif"
          }}>↻</motion.button>
      </div>

      {/* Main comparison */}
      <div style={{
        background: "rgba(15,15,30,0.85)", border: "1px solid var(--border-bright)",
        borderRadius: "16px", padding: "20px", backdropFilter: "blur(10px)",
        boxShadow: `0 0 40px ${beating ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)"}`
      }}>
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ textAlign: "center" }}>
            <ScoreArc score={yesterdayScore} label="Yesterday" color="#6b7280" size={100} />
          </div>

          {/* VS */}
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: "11px", fontWeight: "800", letterSpacing: "2px",
              color: "var(--text-muted)", marginBottom: "6px"
            }}>VS</div>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                fontSize: "20px",
                filter: `drop-shadow(0 0 8px ${beating ? "#10b981" : "#ef4444"})`
              }}
            >
              {beating ? "⬆️" : "⬇️"}
            </motion.div>
          </div>

          <div style={{ textAlign: "center" }}>
            <ScoreArc score={todayScore} label="Today" color={beating ? "#10b981" : "#ef4444"} size={100} />
          </div>
        </div>

        {/* Result banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            textAlign: "center", padding: "10px",
            background: beating ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${beating ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
            borderRadius: "10px"
          }}
        >
          <div style={{
            fontSize: "13px", fontWeight: "700",
            color: beating ? "#10b981" : "#ef4444"
          }}>
            {beating
              ? diff === 0 ? "Tied with yesterday. Push harder." : `+${diff} pts ahead of yesterday! 🔥`
              : diff === 0 ? "Tied with yesterday." : `${diff} pts behind yesterday. Close the gap.`
            }
          </div>
        </motion.div>
      </div>

      {/* Week average */}
      <div style={{
        background: "rgba(15,15,30,0.8)", border: "1px solid var(--border-bright)",
        borderRadius: "12px", padding: "12px 14px", backdropFilter: "blur(10px)",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>7-Day Average</div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-primary)" }}>{avgWeek}%</div>
        </div>
        <div style={{ display: "flex", gap: "3px", alignItems: "flex-end", height: "40px" }}>
          {weekScores.map((s, i) => (
            <motion.div key={i}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max((s / 100) * 36, 3)}px` }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              style={{
                width: "14px", borderRadius: "2px 2px 0 0",
                background: s >= 70 ? "#10b981" : s >= 40 ? "#f59e0b" : "#ef4444",
                boxShadow: `0 0 6px ${s >= 70 ? "rgba(16,185,129,0.5)" : s >= 40 ? "rgba(245,158,11,0.5)" : "rgba(239,68,68,0.5)"}`
              }}
            />
          ))}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Streak</div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "#f97316" }}>{streak} 🔥</div>
        </div>
      </div>

      {/* Daily challenges */}
      <div style={{
        background: "rgba(15,15,30,0.8)", border: "1px solid var(--border-bright)",
        borderRadius: "12px", padding: "14px", backdropFilter: "blur(10px)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>
            Daily Challenges
          </div>
          <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--cyan)" }}>
            {completedChallenges}/{challenges.length} complete
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {challenges.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                background: c.done ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${c.done ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: "8px", padding: "8px 10px",
                transition: "all 0.3s"
              }}
            >
              <div style={{
                width: "16px", height: "16px", borderRadius: "4px", flexShrink: 0,
                background: c.done ? "#10b981" : "rgba(255,255,255,0.06)",
                border: `1px solid ${c.done ? "#10b981" : "rgba(255,255,255,0.1)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "10px"
              }}>
                {c.done ? "✓" : ""}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: "11px", fontWeight: "600",
                  color: c.done ? "var(--text-muted)" : "var(--text-secondary)",
                  textDecoration: c.done ? "line-through" : "none"
                }}>{c.goal}</div>
              </div>
              {c.done && (
                <div style={{
                  fontSize: "9px", color: "#10b981", fontWeight: "700",
                  background: "rgba(16,185,129,0.1)", borderRadius: "99px", padding: "2px 7px"
                }}>{c.reward}</div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}