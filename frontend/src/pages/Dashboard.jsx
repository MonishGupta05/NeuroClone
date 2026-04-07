import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatPanel from "../components/ChatPanel";
import MemoryPanel from "../components/MemoryPanel";
import FocusStatus from "../components/FocusStatus";
import GoalTracker from "../components/GoalTracker";
import Analytics from "../components/Analytics";
import ReflectionCard from "../components/ReflectionCard";
import ProductivityHeatmap from "../components/ProductivityHeatmap";
import StreakTracker from "../components/StreakTracker";
import StudyPlan from "../components/StudyPlan";
import SecondBrain from "../components/SecondBrain";
import CompetitiveMode from "../components/CompetitiveMode";
import PomodoroTimer from "../components/PomodoroTimer";

const NAV = [
  { id: "analytics", icon: "📈", label: "Analytics" },
  { id: "heatmap", icon: "⚡", label: "Efficiency" },
  { id: "pomodoro", icon: "⏱️", label: "Focus" },
  { id: "compete", icon: "🏆", label: "Compete" },
  { id: "streak", icon: "🔥", label: "Streak" },
  { id: "plan", icon: "📅", label: "Plan" },
  { id: "brain", icon: "🧬", label: "Brain" },
  { id: "reflect", icon: "🪞", label: "Reflect" },
  { id: "goals", icon: "🎯", label: "Goals" },
  { id: "memory", icon: "🧠", label: "Memory" },
  { id: "focus", icon: "📡", label: "Activity" },
];

function Background() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <div style={{
        position: "absolute", top: "-20%", left: "-10%",
        width: "600px", height: "600px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(34,211,238,0.055) 0%, transparent 70%)",
        animation: "blob 18s ease infinite", filter: "blur(40px)"
      }} />
      <div style={{
        position: "absolute", top: "30%", right: "-15%",
        width: "700px", height: "700px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 70%)",
        animation: "blob2 22s ease infinite", filter: "blur(50px)"
      }} />
      <div style={{
        position: "absolute", bottom: "-20%", left: "30%",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(236,72,153,0.035) 0%, transparent 70%)",
        animation: "blob3 26s ease infinite", filter: "blur(45px)"
      }} />
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(rgba(255,255,255,0.018) 1px, transparent 1px)",
        backgroundSize: "32px 32px"
      }} />
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.3), rgba(168,85,247,0.3), transparent)"
      }} />
    </div>
  );
}

export default function Dashboard() {
  const [activePanel, setActivePanel] = useState("analytics");
  const [pomodoroRunning, setPomodoroRunning] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const shortcuts = {
        "1": "analytics", "2": "heatmap", "3": "pomodoro",
        "4": "compete", "5": "streak", "6": "plan",
        "7": "brain", "8": "reflect", "9": "goals",
        "0": "memory"
      };
      if (shortcuts[e.key]) setActivePanel(shortcuts[e.key]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const renderPanel = () => {
    switch (activePanel) {
      case "analytics": return <Analytics />;
      case "heatmap": return <ProductivityHeatmap />;
      case "pomodoro": return <PomodoroTimer />;
      case "compete": return <CompetitiveMode />;
      case "streak": return <StreakTracker />;
      case "plan": return <StudyPlan />;
      case "brain": return <SecondBrain />;
      case "reflect": return <ReflectionCard />;
      case "goals": return <GoalTracker />;
      case "memory": return <MemoryPanel />;
      case "focus": return <FocusStatus />;
      default: return <Analytics />;
    }
  };

  return (
    <div style={{
      height: "100vh", width: "100vw",
      display: "flex", flexDirection: "column",
      background: "var(--bg-base)", position: "relative", overflow: "hidden"
    }}>
      <Background />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          height: "52px", flexShrink: 0, zIndex: 10,
          display: "flex", alignItems: "center", padding: "0 16px",
          borderBottom: "1px solid var(--border)",
          background: "rgba(3,3,8,0.88)", backdropFilter: "blur(24px)",
          position: "relative", gap: "10px"
        }}
      >
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.35), rgba(168,85,247,0.35), transparent)"
        }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <div style={{
            width: "26px", height: "26px", borderRadius: "7px",
            background: "linear-gradient(135deg, #0891b2, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "800", fontSize: "11px", color: "white",
            boxShadow: "0 0 14px rgba(34,211,238,0.4)"
          }}>N</div>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
            NeuroClone
          </span>
        </div>

        {/* Nav */}
        <div style={{
          flex: 1, display: "flex", gap: "2px", overflowX: "auto",
          padding: "4px", background: "rgba(255,255,255,0.03)",
          border: "1px solid var(--border)", borderRadius: "10px",
          scrollbarWidth: "none"
        }}>
          {NAV.map((n, idx) => (
            <motion.button
              key={n.id}
              onClick={() => setActivePanel(n.id)}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              title={`${n.label} (${idx === 9 ? "0" : idx + 1})`}
              style={{
                padding: "4px 11px", borderRadius: "7px", border: "none",
                background: activePanel === n.id
                  ? "linear-gradient(135deg, #0891b2, #7c3aed)"
                  : "transparent",
                color: activePanel === n.id ? "white" : "var(--text-muted)",
                fontSize: "10px", fontWeight: "600", cursor: "pointer",
                fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap",
                boxShadow: activePanel === n.id ? "0 0 14px rgba(34,211,238,0.25)" : "none",
                transition: "all 0.2s ease", flexShrink: 0
              }}
            >
              {n.icon} {n.label}
              {n.id === "pomodoro" && pomodoroRunning && (
                <span style={{
                  display: "inline-block", width: "5px", height: "5px",
                  borderRadius: "50%", background: "#22d3ee",
                  marginLeft: "4px", boxShadow: "0 0 6px #22d3ee",
                  animation: "blink 1s ease infinite"
                }} />
              )}
            </motion.button>
          ))}
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <motion.div
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }}
            />
            <span style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: "600" }}>Live</span>
          </div>
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" style={{
            fontSize: "9px", color: "var(--cyan)", textDecoration: "none",
            border: "1px solid rgba(34,211,238,0.2)", borderRadius: "5px",
            padding: "2px 7px", background: "rgba(34,211,238,0.04)"
          }}>API ↗</a>
        </div>
      </motion.header>

      {/* Body */}
      <div style={{
        flex: 1, display: "grid",
        gridTemplateColumns: "1fr 390px",
        overflow: "hidden", minHeight: 0, position: "relative", zIndex: 1
      }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            padding: "14px", overflow: "hidden",
            borderRight: "1px solid var(--border)",
            display: "flex", flexDirection: "column"
          }}
        >
          <ChatPanel />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                {renderPanel()}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}