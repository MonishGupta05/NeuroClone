import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [started, setStarted] = useState(false);
  return (
    <AnimatePresence mode="wait">
      {!started ? (
        <motion.div key="home"
          exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: "100vw", height: "100vh" }}>
          <HomePage onStart={() => setStarted(true)} />
        </motion.div>
      ) : (
        <motion.div key="dash"
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: "100vw", height: "100vh" }}>
          <Dashboard />
        </motion.div>
      )}
    </AnimatePresence>
  );
}