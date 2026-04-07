import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, message, type, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, "success", dur),
    error: (msg, dur) => addToast(msg, "error", dur),
    info: (msg, dur) => addToast(msg, "info", dur),
    warning: (msg, dur) => addToast(msg, "warning", dur),
    confirm: (msg) => new Promise((resolve) => {
      const id = Date.now() + Math.random();
      setToasts(p => [...p, { id, message: msg, type: "confirm", resolve, duration: 0 }]);
    }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: "fixed", top: "20px", right: "20px",
        zIndex: 99999, display: "flex", flexDirection: "column", gap: "8px",
        pointerEvents: "none"
      }}>
        <AnimatePresence>
          {toasts.map(t => (
            <ToastItem key={t.id} toast={t} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(() => onRemove(toast.id), toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onRemove]);

  const configs = {
    success: { color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)", icon: "✅" },
    error: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)", icon: "❌" },
    info: { color: "#22d3ee", bg: "rgba(34,211,238,0.08)", border: "rgba(34,211,238,0.2)", icon: "ℹ️" },
    warning: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", icon: "⚠️" },
    confirm: { color: "#a855f7", bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.25)", icon: "❓" },
  };
  const c = configs[toast.type] || configs.info;

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{
        pointerEvents: "all",
        background: "rgba(6,6,15,0.97)",
        border: `1px solid ${c.border}`,
        borderLeft: `3px solid ${c.color}`,
        borderRadius: "12px",
        padding: "12px 16px",
        maxWidth: "320px",
        minWidth: "260px",
        backdropFilter: "blur(20px)",
        boxShadow: `0 0 30px ${c.color}15, 0 8px 32px rgba(0,0,0,0.6)`,
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        <span style={{ fontSize: "14px", flexShrink: 0 }}>{c.icon}</span>
        <div style={{ flex: 1, fontSize: "12px", color: "rgba(255,255,255,0.85)", lineHeight: "1.5" }}>
          {toast.message}
        </div>
        {toast.type !== "confirm" && (
          <button onClick={() => onRemove(toast.id)} style={{
            background: "none", border: "none", color: "rgba(255,255,255,0.3)",
            cursor: "pointer", fontSize: "14px", lineHeight: "1", padding: "0",
            flexShrink: 0
          }}>×</button>
        )}
      </div>

      {toast.type === "confirm" && (
        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
          <button onClick={() => { toast.resolve(false); onRemove(toast.id); }} style={{
            flex: 1, padding: "6px", borderRadius: "7px",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.5)", fontSize: "11px", cursor: "pointer",
            fontFamily: "'Inter', sans-serif"
          }}>Cancel</button>
          <button onClick={() => { toast.resolve(true); onRemove(toast.id); }} style={{
            flex: 1, padding: "6px", borderRadius: "7px",
            background: "linear-gradient(135deg, #0891b2, #7c3aed)",
            border: "none", color: "white", fontSize: "11px",
            fontWeight: "700", cursor: "pointer", fontFamily: "'Inter', sans-serif"
          }}>Allow</button>
        </div>
      )}

      {toast.duration > 0 && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: toast.duration / 1000, ease: "linear" }}
          style={{
            height: "2px", background: c.color,
            borderRadius: "99px", marginTop: "8px",
            transformOrigin: "left",
            boxShadow: `0 0 6px ${c.color}`
          }}
        />
      )}
    </motion.div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}