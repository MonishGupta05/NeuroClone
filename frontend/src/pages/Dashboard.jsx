import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatPanel from "../components/ChatPanel";
import MemoryPanel from "../components/MemoryPanel";
import FocusStatus from "../components/FocusStatus";
import GoalTracker from "../components/GoalTracker";
import Analytics from "../components/Analytics";
import ReflectionCard from "../components/ReflectionCard";

const NAV = [
  { id: "analytics", icon: "📈", label: "Analytics" },
  { id: "reflection", icon: "🪞", label: "Reflect" },
  { id: "goals", icon: "🎯", label: "Goals" },
  { id: "memory", icon: "🧠", label: "Memory" },
  { id: "focus", icon: "📡", label: "Focus" },
];

function Background() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {/* Animated blobs */}
      <div style={{
        position: "absolute", top: "-20%", left: "-10%",
        width: "600px", height: "600px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)",
        animation: "blob 18s ease infinite",
        filter: "blur(40px)"
      }} />
      <div style={{
        position: "absolute", top: "30%", right: "-15%",
        width: "700px", height: "700px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)",
        animation: "blob2 22s ease infinite",
        filter: "blur(50px)"
      }} />
      <div style={{
        position: "absolute", bottom: "-20%", left: "30%",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(236,72,153,0.05) 0%, transparent 70%)",
        animation: "blob3 26s ease infinite",
        filter: "blur(45px)"
      }} />
      {/* Grid pattern */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)`,
        backgroundSize: "32px 32px",
      }} />
      {/* Top gradient line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.3), rgba(168,85,247,0.3), transparent)"
      }} />
    </div>
  );
}

export default function Dashboard() {
  const [activePanel, setActivePanel] = useState("analytics");

  const renderPanel = () => {
    switch (activePanel) {
      case "analytics": return <Analytics />;
      case "reflection": return <ReflectionCard />;
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
          display: "flex", alignItems: "center", padding: "0 20px",
          borderBottom: "1px solid var(--border)",
          background: "rgba(3,3,8,0.8)",
          backdropFilter: "blur(24px)",
          position: "relative"
        }}
      >
        {/* Shimmer line */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "1px", overflow: "hidden"
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.5), rgba(168,85,247,0.5), transparent)"
          }} />
        </div>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "160px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "7px",
            background: "linear-gradient(135deg, #0891b2, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "800", fontSize: "12px", color: "white",
            boxShadow: "0 0 16px rgba(34,211,238,0.4)"
          }}>N</div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
              NeuroClone
            </div>
            <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.5px" }}>Digital Second Self</div>
          </div>
        </div>

        {/* Center nav */}
        <div style={{
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: "2px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid var(--border-bright)",
          borderRadius: "10px", padding: "3px"
        }}>
          {NAV.map(n => (
            <motion.button
              key={n.id}
              onClick={() => setActivePanel(n.id)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{
                padding: "5px 14px", borderRadius: "7px", border: "none",
                background: activePanel === n.id
                  ? "linear-gradient(135deg, #0891b2, #7c3aed)"
                  : "transparent",
                color: activePanel === n.id ? "white" : "var(--text-muted)",
                fontSize: "11px", fontWeight: "600", cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                boxShadow: activePanel === n.id ? "0 0 16px rgba(34,211,238,0.3)" : "none",
                transition: "all 0.2s ease"
              }}
            >
              {n.icon} {n.label}
            </motion.button>
          ))}
        </div>

        {/* Right */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <motion.div
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }}
            />
            <span style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: "600" }}>Live</span>
          </div>
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" style={{
            fontSize: "10px", color: "var(--cyan)", textDecoration: "none",
            border: "1px solid rgba(34,211,238,0.2)", borderRadius: "5px", padding: "3px 8px",
            background: "rgba(34,211,238,0.05)"
          }}>API ↗</a>
        </div>
      </motion.header>

      {/* Body */}
      <div style={{
        flex: 1, display: "grid",
        gridTemplateColumns: "1fr 390px",
        overflow: "hidden", minHeight: 0, position: "relative", zIndex: 1
      }}>
        {/* Chat */}
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

        {/* Right panel */}
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
                initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
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