import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./Toast";
import { addMemory } from "../api/client";

const MODES = {
  focus: { label: "Focus", duration: 25 * 60, color: "#22d3ee", icon: "🎯" },
  short: { label: "Short Break", duration: 5 * 60, color: "#10b981", icon: "☕" },
  long: { label: "Long Break", duration: 15 * 60, color: "#a855f7", icon: "🌙" },
};

const MOTIVATIONAL = [
  "Bhai solid. 25 minutes done. Ratan Tata proud hoga.",
  "Focus session complete. This is what the backlog killer looks like.",
  "One pomodoro down. 370 videos won't watch themselves bhai.",
  "Session done. You're building the habit that changes everything.",
  "25 minutes of pure focus. GATE rank just went up.",
];

const BREAK_MSGS = [
  "Break time bhai. Stand up, stretch, no phone.",
  "Short break. Eyes rest karo. No Instagram.",
  "5 minute break. Water pi. Phone mat uthao.",
];

export default function PomodoroTimer() {
  const [mode, setMode] = useState("focus");
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [currentTask, setCurrentTask] = useState("");
  const [taskInput, setTaskInput] = useState("");
  const [history, setHistory] = useState([]);
  const intervalRef = useRef(null);
  const toast = useToast();

  const currentMode = MODES[mode];
  const total = currentMode.duration;
  const progress = (timeLeft / total);
  const radius = 60;
  const circ = 2 * Math.PI * radius;
  const offset = circ * progress;

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const switchMode = useCallback((m) => {
    setMode(m);
    setTimeLeft(MODES[m].duration);
    setRunning(false);
    clearInterval(intervalRef.current);
  }, []);

  const handleComplete = useCallback(async () => {
    setRunning(false);
    clearInterval(intervalRef.current);

    if (mode === "focus") {
      const newCount = sessions + 1;
      setSessions(newCount);
      const msg = MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)];
      toast.success(msg, 8000);

      const entry = {
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        task: currentTask || "Focus session",
        mode: "focus"
      };
      setHistory(p => [entry, ...p].slice(0, 10));

      try {
        await addMemory(
          `Completed 25-min focus session${currentTask ? ` on: ${currentTask}` : ""}. Total today: ${newCount}`,
          "plan", 1.2
        );
      } catch {}

      // Auto suggest break
      if (newCount % 4 === 0) {
        toast.info("4 sessions done bhai! Take a long break. You earned it.", 6000);
        setTimeout(() => switchMode("long"), 2000);
      } else {
        setTimeout(() => switchMode("short"), 1500);
      }
    } else {
      const breakMsg = BREAK_MSGS[Math.floor(Math.random() * BREAK_MSGS.length)];
      toast.info(`Break done. ${breakMsg}`, 5000);
      setTimeout(() => switchMode("focus"), 1500);
    }
  }, [mode, sessions, currentTask, toast, switchMode]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { handleComplete(); return 0; }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, handleComplete]);

  // Update page title
  useEffect(() => {
    if (running) {
      document.title = `${formatTime(timeLeft)} — ${currentMode.label} · NeuroClone`;
    } else {
      document.title = "NeuroClone";
    }
    return () => { document.title = "NeuroClone"; };
  }, [running, timeLeft, currentMode.label]);

  const handleStart = () => {
    if (!running && currentTask) {
      setRunning(true);
    } else if (!running) {
      toast.warning("Set a task first bhai. What are you working on?", 3000);
    } else {
      setRunning(false);
    }
  };

  const reset = () => {
    setRunning(false);
    setTimeLeft(currentMode.duration);
    clearInterval(intervalRef.current);
  };

  const skipToBreak = () => {
    if (mode === "focus") switchMode("short");
    else switchMode("focus");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: "12px" }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)" }}>⏱️ Pomodoro</div>
          <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "1px" }}>
            {sessions} sessions today
          </div>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {Object.entries(MODES).map(([key, m]) => (
            <motion.button
              key={key}
              onClick={() => switchMode(key)}
              whileHover={{ scale: 1.04 }}
              style={{
                padding: "3px 8px", borderRadius: "6px", border: "none",
                background: mode === key ? `${m.color}20` : "rgba(255,255,255,0.04)",
                border: `1px solid ${mode === key ? m.color + "40" : "transparent"}`,
                color: mode === key ? m.color : "var(--text-muted)",
                fontSize: "9px", fontWeight: "700", cursor: "pointer",
                fontFamily: "'Inter', sans-serif", transition: "all 0.2s"
              }}
            >{m.icon} {m.label}</motion.button>
          ))}
        </div>
      </div>

      {/* Timer ring */}
      <motion.div
        style={{
          background: "rgba(15,15,30,0.85)", border: `1px solid ${currentMode.color}20`,
          borderRadius: "16px", padding: "24px 20px",
          backdropFilter: "blur(10px)",
          boxShadow: running ? `0 0 40px ${currentMode.color}15` : "none",
          transition: "box-shadow 0.5s ease",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "16px"
        }}
      >
        {/* Ring */}
        <div style={{ position: "relative", width: "150px", height: "150px" }}>
          <svg width="150" height="150" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="75" cy="75" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <motion.circle
              cx="75" cy="75" r={radius} fill="none"
              stroke={currentMode.color} strokeWidth="8"
              strokeDasharray={circ}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.5, ease: "linear" }}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 ${running ? "12px" : "4px"} ${currentMode.color})` }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "2px"
          }}>
            <div style={{
              fontSize: "32px", fontWeight: "800",
              color: "var(--text-primary)", letterSpacing: "-2px",
              fontVariantNumeric: "tabular-nums"
            }}>
              {formatTime(timeLeft)}
            </div>
            <div style={{ fontSize: "10px", color: currentMode.color, fontWeight: "700" }}>
              {running ? "FOCUSING" : "PAUSED"}
            </div>
          </div>

          {/* Pulse when running */}
          {running && (
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                position: "absolute", inset: -8,
                borderRadius: "50%",
                border: `2px solid ${currentMode.color}`,
                pointerEvents: "none"
              }}
            />
          )}
        </div>

        {/* Task input */}
        {!currentTask ? (
          <div style={{ width: "100%", display: "flex", gap: "6px" }}>
            <input
              value={taskInput}
              onChange={e => setTaskInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && taskInput.trim() && setCurrentTask(taskInput.trim())}
              placeholder="What are you working on?"
              style={{
                flex: 1, background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px", padding: "7px 10px",
                color: "var(--text-primary)", fontSize: "12px",
                outline: "none", fontFamily: "'Inter', sans-serif"
              }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => taskInput.trim() && setCurrentTask(taskInput.trim())}
              style={{
                padding: "7px 12px", borderRadius: "8px",
                background: `${currentMode.color}20`,
                border: `1px solid ${currentMode.color}30`,
                color: currentMode.color, fontSize: "12px",
                fontWeight: "700", cursor: "pointer", fontFamily: "'Inter', sans-serif"
              }}
            >Set</motion.button>
          </div>
        ) : (
          <div style={{
            width: "100%", background: `${currentMode.color}10`,
            border: `1px solid ${currentMode.color}25`,
            borderRadius: "9px", padding: "8px 12px",
            display: "flex", alignItems: "center", gap: "8px"
          }}>
            <span style={{ fontSize: "11px" }}>{currentMode.icon}</span>
            <span style={{ flex: 1, fontSize: "12px", color: "var(--text-primary)", fontWeight: "600" }}>
              {currentTask}
            </span>
            <button onClick={() => { setCurrentTask(""); setTaskInput(""); reset(); }} style={{
              background: "none", border: "none", color: "var(--text-muted)",
              cursor: "pointer", fontSize: "13px"
            }}>×</button>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: "flex", gap: "8px", width: "100%" }}>
          <motion.button
            onClick={reset}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            style={{
              padding: "9px", borderRadius: "9px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--text-muted)", fontSize: "13px",
              cursor: "pointer"
            }}
          >↺</motion.button>

          <motion.button
            onClick={handleStart}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{
              flex: 1, padding: "10px", borderRadius: "10px",
              background: running
                ? "rgba(239,68,68,0.15)"
                : `linear-gradient(135deg, #0891b2, #7c3aed)`,
              border: running ? "1px solid rgba(239,68,68,0.3)" : "none",
              color: "white", fontWeight: "800", fontSize: "14px",
              cursor: "pointer", fontFamily: "'Inter', sans-serif",
              boxShadow: running ? "none" : `0 0 20px ${currentMode.color}30`
            }}
          >
            {running ? "⏸ Pause" : "▶ Start"}
          </motion.button>

          <motion.button
            onClick={skipToBreak}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            style={{
              padding: "9px 12px", borderRadius: "9px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--text-muted)", fontSize: "10px",
              cursor: "pointer", fontFamily: "'Inter', sans-serif"
            }}
          >Skip →</motion.button>
        </div>
      </motion.div>

      {/* Session dots */}
      <div style={{
        display: "flex", gap: "6px", alignItems: "center",
        background: "rgba(15,15,30,0.7)", border: "1px solid var(--border)",
        borderRadius: "10px", padding: "10px 14px"
      }}>
        <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "700", marginRight: "4px" }}>
          TODAY
        </span>
        {Array.from({ length: Math.min(Math.max(sessions + 1, 4), 12) }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 200 }}
            style={{
              width: "10px", height: "10px", borderRadius: "3px",
              background: i < sessions
                ? "linear-gradient(135deg, var(--cyan), #10b981)"
                : i === sessions && running
                  ? currentMode.color
                  : "rgba(255,255,255,0.06)",
              boxShadow: i < sessions ? "0 0 6px rgba(34,211,238,0.4)" : "none",
              border: i === sessions && !running ? `1px dashed ${currentMode.color}50` : "none",
              transition: "all 0.3s"
            }}
          />
        ))}
        {sessions >= 4 && (
          <span style={{ fontSize: "10px", color: "#f59e0b", marginLeft: "4px" }}>
            +{sessions - 3} more 🔥
          </span>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={{
          background: "rgba(15,15,30,0.6)", border: "1px solid var(--border)",
          borderRadius: "10px", padding: "10px 12px"
        }}>
          <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "700", letterSpacing: "1px", marginBottom: "7px", textTransform: "uppercase" }}>
            Recent Sessions
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {history.slice(0, 4).map((h, i) => (
              <div key={i} style={{
                display: "flex", gap: "8px", alignItems: "center",
                fontSize: "11px", color: "var(--text-secondary)"
              }}>
                <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{h.time}</span>
                <span style={{ flex: 1 }}>✅ {h.task}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}