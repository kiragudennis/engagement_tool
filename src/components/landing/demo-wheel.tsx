// components/landing/demo-wheel.tsx
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Gift, Star } from "lucide-react";
import confetti from "canvas-confetti";

const SEGMENTS = [
  { label: "Free Coffee", color: "#8B5CF6", icon: "☕" },
  { label: "10% Off", color: "#EC4899", icon: "🏷️" },
  { label: "Free Donut", color: "#F59E0B", icon: "🍩" },
  { label: "Try Again", color: "#10B981", icon: "🔄" },
  { label: "Free Latte", color: "#3B82F6", icon: "🥤" },
  { label: "20% Off", color: "#EF4444", icon: "💵" },
  { label: "VIP Pass", color: "#A855F7", icon: "👑" },
  { label: "Mystery", color: "#06B6D4", icon: "🎁" },
];

function fireConfettiBurst() {
  const end = Date.now() + 2000;
  const colors = ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6"];

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.8 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export function DemoWheel() {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{
    label: string;
    color: string;
    icon: string;
  } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

  const segmentAngle = 360 / SEGMENTS.length;

  const handleSpin = useCallback(() => {
    if (spinning) return;

    setSpinning(true);
    setShowResult(false);
    setResult(null);

    // Randomize the result
    const targetIndex = Math.floor(Math.random() * SEGMENTS.length);
    const fullSpins = 5 + Math.floor(Math.random() * 4); // 5-8 full rotations
    const targetAngle =
      360 * fullSpins + (360 - targetIndex * segmentAngle - segmentAngle / 2);

    setRotation((prev) => prev + targetAngle);

    // Reveal result after animation
    setTimeout(() => {
      setResult(SEGMENTS[targetIndex]);
      setShowResult(true);
      setSpinning(false);

      // Fire confetti for good prizes (not "Try Again")
      if (SEGMENTS[targetIndex].label !== "Try Again") {
        fireConfettiBurst();
      }
    }, 4500);
  }, [spinning, segmentAngle]);

  return (
    <div className="relative flex flex-col items-center">
      {/* Ambient glow */}
      <div className="absolute -inset-20 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />

      {/* Outer ring */}
      <div className="relative w-72 h-72 md:w-80 md:h-80">
        {/* Decorative dots around wheel */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 15 * Math.PI) / 180;
          const radius = 44; // percentage
          const x = 50 + radius * Math.cos(angle);
          const y = 50 + radius * Math.sin(angle);
          return (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-purple-400/30"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          );
        })}

        {/* Spinning shadow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: spinning
              ? [
                  "0 0 60px rgba(139, 92, 246, 0.3), 0 0 120px rgba(236, 72, 153, 0.15)",
                  "0 0 80px rgba(236, 72, 153, 0.4), 0 0 160px rgba(139, 92, 246, 0.25)",
                  "0 0 60px rgba(139, 92, 246, 0.3), 0 0 120px rgba(236, 72, 153, 0.15)",
                ]
              : "0 0 40px rgba(139, 92, 246, 0.2)",
          }}
          transition={{ duration: 1, repeat: spinning ? Infinity : 0 }}
        />

        {/* Pointer */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <motion.div
            animate={spinning ? { y: [0, -3, 0] } : {}}
            transition={{ duration: 0.3, repeat: spinning ? Infinity : 0 }}
          >
            <svg width="24" height="32" viewBox="0 0 24 32">
              <defs>
                <filter id="pointer-shadow">
                  <feDropShadow
                    dx="0"
                    dy="2"
                    stdDeviation="2"
                    floodColor="#000"
                    floodOpacity="0.3"
                  />
                </filter>
                <linearGradient id="pointer-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A855F7" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
              <polygon
                points="12,32 0,0 24,0"
                fill="url(#pointer-grad)"
                filter="url(#pointer-shadow)"
              />
            </svg>
          </motion.div>
        </div>

        {/* Wheel */}
        <motion.div
          className="w-full h-full rounded-full relative overflow-hidden"
          style={{
            border: "4px solid rgba(139, 92, 246, 0.3)",
            boxShadow: "inset 0 0 30px rgba(0,0,0,0.3)",
          }}
          animate={{ rotate: rotation }}
          transition={{
            duration: 4.5,
            ease: [0.08, 0.82, 0.17, 1.01],
          }}
        >
          {SEGMENTS.map((segment, i) => {
            const startAngle = i * segmentAngle;
            const endAngle = (i + 1) * segmentAngle;
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            const midAngle = (startAngle + endAngle) / 2;
            const midRad = (midAngle * Math.PI) / 180;
            const textRadius = 34; // percentage from center

            return (
              <div
                key={i}
                className="absolute inset-0 transition-opacity duration-200"
                style={{
                  clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(startRad)}% ${50 + 50 * Math.sin(startRad)}%, ${50 + 50 * Math.cos(endRad)}% ${50 + 50 * Math.sin(endRad)}%)`,
                  background: `linear-gradient(135deg, ${segment.color}, ${segment.color}DD)`,
                  opacity: hoveredSegment === i ? 0.9 : 0.85,
                }}
                onMouseEnter={() => !spinning && setHoveredSegment(i)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                {/* Segment label */}
                <span
                  className="absolute text-white font-bold whitespace-nowrap select-none"
                  style={{
                    left: `${50 + textRadius * Math.cos(midRad)}%`,
                    top: `${50 + textRadius * Math.sin(midRad)}%`,
                    transform: `translate(-50%, -50%) rotate(${midAngle}deg)`,
                    fontSize: "11px",
                    textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                    maxWidth: "55px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    textAlign: "center",
                    lineHeight: 1.2,
                  }}
                >
                  {segment.icon} {segment.label}
                </span>

                {/* Subtle inner border */}
                <div
                  className="absolute"
                  style={{
                    left: "50%",
                    top: "50%",
                    width: "100%",
                    height: "1px",
                    background: "rgba(255,255,255,0.15)",
                    transform: `rotate(${startAngle}deg)`,
                    transformOrigin: "0 0",
                  }}
                />
              </div>
            );
          })}

          {/* Center hub */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <motion.div
              className="w-16 h-16 rounded-full bg-gradient-to-br from-white to-gray-100 flex items-center justify-center shadow-lg"
              animate={spinning ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 0.5, repeat: spinning ? Infinity : 0 }}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Tick marks around the edge */}
        {Array.from({ length: SEGMENTS.length }).map((_, i) => {
          const angle = (i * segmentAngle * Math.PI) / 180;
          const innerX = 50 + 46 * Math.cos(angle);
          const innerY = 50 + 46 * Math.sin(angle);
          const outerX = 50 + 50 * Math.cos(angle);
          const outerY = 50 + 50 * Math.sin(angle);
          return (
            <div
              key={`tick-${i}`}
              className="absolute bg-white/20"
              style={{
                left: `${innerX}%`,
                top: `${innerY}%`,
                width: `${Math.abs(outerX - innerX)}%`,
                height: "1px",
                transform: `rotate(${i * segmentAngle}deg)`,
                transformOrigin: "0 0",
              }}
            />
          );
        })}
      </div>

      {/* Spin Button */}
      <motion.button
        onClick={handleSpin}
        disabled={spinning}
        className="relative mt-8 px-10 py-4 rounded-full font-bold text-lg text-white shadow-2xl transition-all disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden group"
        style={{
          background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
        }}
        whileHover={!spinning ? { scale: 1.05 } : {}}
        whileTap={!spinning ? { scale: 0.95 } : {}}
      >
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <span className="relative z-10 flex items-center gap-2">
          {spinning ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                ⚡
              </motion.span>
              Spinning...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Spin to Win!
              <Sparkles className="h-5 w-5" />
            </>
          )}
        </span>
      </motion.button>

      {/* Hint text */}
      {!spinning && !result && (
        <p className="text-white/30 text-xs mt-3">
          👆 Try spinning the demo wheel!
        </p>
      )}

      {/* Result Popup */}
      <AnimatePresence>
        {showResult && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-30"
          >
            <div
              className="px-6 py-3 rounded-full text-white font-bold text-lg shadow-2xl whitespace-nowrap"
              style={{
                background: `linear-gradient(135deg, ${result.color}, ${result.color}DD)`,
              }}
            >
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {result.icon} {result.label}!
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
