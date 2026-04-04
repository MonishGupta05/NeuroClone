import { Suspense, useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, MeshDistortMaterial, Float } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";

function CameraRig() {
  const mouse = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const h = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 3;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);
  useFrame(({ camera }) => {
    target.current.x += (mouse.current.x - target.current.x) * 0.04;
    target.current.y += (mouse.current.y - target.current.y) * 0.04;
    camera.position.x = target.current.x;
    camera.position.y = target.current.y;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function BrainOrb() {
  const mesh = useRef();
  useFrame((s) => {
    mesh.current.rotation.x = s.clock.elapsedTime * 0.1;
    mesh.current.rotation.y = s.clock.elapsedTime * 0.18;
  });
  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[1.7, 128, 128]} />
      <MeshDistortMaterial
        color="#0891b2" emissive="#06b6d4"
        emissiveIntensity={1.4} distort={0.35}
        speed={2} roughness={0} metalness={1}
      />
    </mesh>
  );
}

function OrbitRing({ radius, tube, tilt, speed, color }) {
  const mesh = useRef();
  useFrame((s) => {
    mesh.current.rotation.x = tilt[0] + s.clock.elapsedTime * speed * 0.4;
    mesh.current.rotation.y = tilt[1] + s.clock.elapsedTime * speed * 0.25;
    mesh.current.rotation.z = tilt[2] + s.clock.elapsedTime * speed * 0.15;
  });
  return (
    <mesh ref={mesh}>
      <torusGeometry args={[radius, tube, 16, 120]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} transparent opacity={0.4} />
    </mesh>
  );
}

function Particles() {
  const mesh = useRef();
  const count = 500;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3.5 + Math.random() * 10;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);
  useFrame((s) => {
    mesh.current.rotation.y = s.clock.elapsedTime * 0.02;
    mesh.current.rotation.x = s.clock.elapsedTime * 0.008;
  });
  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#22d3ee" size={0.05} transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

function SmallOrbs() {
  return (
    <>
      {[
        { pos: [3.2, 2, -1], s: 0.16, sp: 1.2, c: "#22d3ee" },
        { pos: [-3.8, -1.5, 0], s: 0.11, sp: 0.9, c: "#a855f7" },
        { pos: [2.8, -2.8, 1], s: 0.09, sp: 1.5, c: "#ec4899" },
        { pos: [-2.2, 2.8, -0.5], s: 0.13, sp: 1.0, c: "#22d3ee" },
        { pos: [0.5, 3.5, 0.5], s: 0.08, sp: 1.8, c: "#a855f7" },
      ].map((o, i) => (
        <Float key={i} speed={o.sp} rotationIntensity={2} floatIntensity={2}>
          <mesh position={o.pos} scale={o.s}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={o.c} emissive={o.c} emissiveIntensity={2} wireframe />
          </mesh>
        </Float>
      ))}
    </>
  );
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
};

export default function HomePage({ onStart }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden", background: "#030308" }}>
      <Canvas camera={{ position: [0, 0, 9], fov: 55 }} style={{ position: "absolute", inset: 0 }} gl={{ antialias: true }}>
        <color attach="background" args={["#030308"]} />
        <fog attach="fog" args={["#030308", 12, 30]} />
        <ambientLight intensity={0.04} />
        <pointLight position={[0, 0, 4]} intensity={5} color="#06b6d4" />
        <pointLight position={[6, 6, 2]} intensity={2} color="#a855f7" />
        <pointLight position={[-6, -4, -2]} intensity={1.5} color="#ec4899" />
        <Suspense fallback={null}>
          <Stars radius={80} depth={60} count={4000} factor={3} saturation={0} fade speed={0.4} />
          <BrainOrb />
          <OrbitRing radius={3.2} tube={0.016} tilt={[0, 0, 0]} speed={0.8} color="#22d3ee" />
          <OrbitRing radius={4.4} tube={0.011} tilt={[Math.PI / 3, Math.PI / 5, 0]} speed={0.5} color="#a855f7" />
          <OrbitRing radius={5.5} tube={0.007} tilt={[Math.PI / 5, 0, Math.PI / 4]} speed={0.3} color="#ec4899" />
          <Particles />
          <SmallOrbs />
        </Suspense>
        <CameraRig />
      </Canvas>

      {/* Overlays */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 65% 65% at 50% 50%, transparent 15%, #030308 100%)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "35%", pointerEvents: "none", background: "linear-gradient(transparent, #030308)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "20%", pointerEvents: "none", background: "linear-gradient(#030308, transparent)" }} />

      {/* Content */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <motion.div variants={stagger} initial="hidden" animate="show"
          style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>

          <motion.div variants={item} style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)",
            borderRadius: "99px", padding: "6px 18px",
            fontSize: "10px", fontWeight: "700", color: "#22d3ee",
            letterSpacing: "2.5px", textTransform: "uppercase",
            marginBottom: "28px", backdropFilter: "blur(10px)"
          }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981", animation: "blink 2s ease infinite" }} />
            Personal AI Clone · Online
          </motion.div>

          <motion.h1 variants={item} style={{
            fontSize: "clamp(56px, 10vw, 116px)",
            fontWeight: "800", letterSpacing: "-5px", lineHeight: "0.92",
            background: "linear-gradient(135deg, #ffffff 0%, #67e8f9 35%, #a855f7 70%, #ec4899 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text", marginBottom: "10px"
          }}>
            NeuroClone
          </motion.h1>

          <motion.div variants={item} style={{
            fontSize: "clamp(13px, 1.6vw, 16px)", color: "var(--text-secondary)",
            letterSpacing: "-0.2px", marginBottom: "48px", lineHeight: "1.8", maxWidth: "420px"
          }}>
            Your digital second self. Built to think like you,<br />
            remember everything, and never let you slack.
          </motion.div>

          <motion.div variants={item} style={{ display: "flex", gap: "48px", marginBottom: "56px" }}>
            {[{ num: "∞", label: "Memory" }, { num: "24/7", label: "Active" }, { num: "100%", label: "You" }].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: "30px", fontWeight: "800",
                  background: ["linear-gradient(135deg, #22d3ee, #67e8f9)", "linear-gradient(135deg, #a855f7, #d946ef)", "linear-gradient(135deg, #10b981, #22d3ee)"][i],
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
                }}>{s.num}</div>
                <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </motion.div>

          <motion.div variants={item} style={{ pointerEvents: "all" }}>
            <motion.button
              onClick={onStart}
              onHoverStart={() => setHovered(true)}
              onHoverEnd={() => setHovered(false)}
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}
              style={{
                padding: "18px 60px",
                background: "linear-gradient(135deg, #0891b2, #7c3aed, #be185d)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "16px", color: "white",
                fontSize: "16px", fontWeight: "700", cursor: "pointer",
                fontFamily: "'Inter', sans-serif", letterSpacing: "-0.3px",
                boxShadow: hovered
                  ? "0 0 80px rgba(34,211,238,0.5), 0 0 40px rgba(168,85,247,0.3), inset 0 1px 0 rgba(255,255,255,0.2)"
                  : "0 0 40px rgba(34,211,238,0.2), 0 0 20px rgba(168,85,247,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
                transition: "box-shadow 0.4s ease",
                animation: "pulse-ring 3s ease infinite"
              }}
            >
              Talk to NeuroClone →
            </motion.button>
          </motion.div>

          <motion.p variants={item} style={{ marginTop: "24px", fontSize: "10px", color: "var(--text-muted)", fontWeight: "500", letterSpacing: "0.5px" }}>
            Local · Free · Private · Groq + Llama 3.3 70B
          </motion.p>
        </motion.div>
      </div>

      {/* Logo top left */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.5, duration: 0.6 }}
        style={{ position: "absolute", top: "24px", left: "28px", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "30px", height: "30px", borderRadius: "8px",
          background: "linear-gradient(135deg, #0891b2, #7c3aed)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: "800", fontSize: "12px", color: "white",
          boxShadow: "0 0 20px rgba(34,211,238,0.4)"
        }}>N</div>
        <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)" }}>NeuroClone</span>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2, duration: 1 }}
        style={{
          position: "absolute", bottom: "28px", left: "50%", transform: "translateX(-50%)",
          fontSize: "10px", color: "var(--text-muted)", fontWeight: "500",
          display: "flex", alignItems: "center", gap: "10px"
        }}>
        <div style={{ width: "30px", height: "1px", background: "var(--text-muted)", opacity: 0.3 }} />
        Move your mouse to interact
        <div style={{ width: "30px", height: "1px", background: "var(--text-muted)", opacity: 0.3 }} />
      </motion.div>
    </div>
  );
}