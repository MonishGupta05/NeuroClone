import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { searchBrain } from "../api/client";

const QUICK_SEARCHES = [
  "What are my goals?",
  "What did I say about GATE?",
  "What corrections have I made?",
  "What sessions have I saved?",
];

export default function SecondBrain() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSearch = async (q) => {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setLoading(true);
    setResult(null);
    try {
      const res = await searchBrain(searchQuery);
      setResult(res.data);
    } catch {
      setResult({ answer: "Backend error. Check if uvicorn is running.", relevant_memories: [], memories_searched: 0, relevant_found: 0 });
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: "12px" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)" }}>🧬 Second Brain</div>
        <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "2px" }}>
          Search your entire memory bank. Ask anything.
        </div>
      </div>

      {/* Search */}
      <motion.div
        animate={{
          borderColor: focused ? "rgba(34,211,238,0.5)" : "var(--border-bright)",
          boxShadow: focused ? "0 0 0 3px rgba(34,211,238,0.08), 0 0 20px rgba(34,211,238,0.1)" : "none"
        }}
        style={{
          display: "flex", gap: "8px",
          background: "rgba(15,15,30,0.9)", border: "1px solid var(--border-bright)",
          borderRadius: "12px", padding: "4px 4px 4px 14px",
          backdropFilter: "blur(10px)"
        }}
      >
        <span style={{ fontSize: "14px", display: "flex", alignItems: "center", color: "var(--text-muted)" }}>🔍</span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="What do I know about..."
          style={{
            flex: 1, background: "transparent", border: "none",
            color: "var(--text-primary)", fontSize: "13px",
            outline: "none", padding: "8px 0", fontFamily: "'Inter', sans-serif"
          }}
        />
        <motion.button
          onClick={() => handleSearch()}
          disabled={loading}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={{
            padding: "7px 16px", borderRadius: "9px",
            background: "linear-gradient(135deg, #0891b2, #7c3aed)",
            border: "none", color: "white", fontWeight: "700",
            fontSize: "11px", cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
            opacity: loading ? 0.6 : 1,
            boxShadow: "0 0 16px rgba(34,211,238,0.2)"
          }}
        >
          {loading ? "..." : "Search"}
        </motion.button>
      </motion.div>

      {/* Quick searches */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
        {QUICK_SEARCHES.map((q, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.03 }}
            onClick={() => handleSearch(q)}
            style={{
              background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.12)",
              borderRadius: "99px", padding: "3px 10px",
              color: "var(--text-muted)", fontSize: "9px",
              cursor: "pointer", fontFamily: "'Inter', sans-serif",
              transition: "all 0.2s"
            }}
          >
            {q}
          </motion.button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: "rgba(15,15,30,0.8)", border: "1px solid var(--border-bright)",
            borderRadius: "12px", padding: "20px", backdropFilter: "blur(10px)",
            textAlign: "center"
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", gap: "5px", marginBottom: "8px" }}>
            {[0, 1, 2].map(i => (
              <motion.div key={i}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--cyan)" }}
              />
            ))}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Searching {query}...</div>
        </motion.div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: "8px" }}
          >
            {/* Stats bar */}
            <div style={{
              display: "flex", gap: "10px",
              fontSize: "9px", color: "var(--text-muted)", fontWeight: "600"
            }}>
              <span>🔎 {result.memories_searched} memories searched</span>
              <span>✅ {result.relevant_found} relevant found</span>
            </div>

            {/* Answer */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: "linear-gradient(135deg, rgba(34,211,238,0.06), rgba(168,85,247,0.04))",
                border: "1px solid rgba(34,211,238,0.2)",
                borderRadius: "12px", padding: "14px",
                backdropFilter: "blur(10px)",
                boxShadow: "0 0 20px rgba(34,211,238,0.06)"
              }}
            >
              <div style={{ fontSize: "9px", color: "var(--cyan)", fontWeight: "700", letterSpacing: "1px", marginBottom: "8px", textTransform: "uppercase" }}>
                NeuroClone Answer
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: "1.7" }}>
                {result.answer}
              </div>
            </motion.div>

            {/* Relevant memories */}
            {result.relevant_memories && result.relevant_memories.length > 0 && (
              <div>
                <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "700", letterSpacing: "1px", marginBottom: "6px", textTransform: "uppercase" }}>
                  Source Memories
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {result.relevant_memories.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{
                        background: "rgba(15,15,30,0.8)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderLeft: "2px solid rgba(34,211,238,0.4)",
                        borderRadius: "8px", padding: "8px 10px",
                        backdropFilter: "blur(10px)"
                      }}
                    >
                      <div style={{ fontSize: "8px", color: "var(--cyan)", fontWeight: "700", letterSpacing: "1px", marginBottom: "2px", textTransform: "uppercase" }}>
                        {m.type}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                        {m.content}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!result && !loading && (
        <div style={{
          textAlign: "center", padding: "32px 20px",
          color: "var(--text-muted)", fontSize: "12px",
          background: "rgba(15,15,30,0.4)", borderRadius: "12px",
          border: "1px dashed rgba(255,255,255,0.05)"
        }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🧬</div>
          <div>Your entire memory bank, searchable.</div>
          <div style={{ fontSize: "10px", marginTop: "4px" }}>The more you chat, the smarter this gets.</div>
        </div>
      )}
    </motion.div>
  );
}