// components/wheel/spin-wheel.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Gauge } from "lucide-react";
import confetti from "canvas-confetti";

// ─── Types ───────────────────────────────────────────
export interface WheelSegment {
  label: string;
  color: string;
  icon?: string;
  value: string | number;
  type?: string;
  probability?: number;
}

type WheelPhase =
  | "idle"
  | "spinning"
  | "stopping"
  | "shuffling"
  | "revealing"
  | "complete";

export interface SpinPhysics {
  total_rotation: number;
  animation_duration: number;
  easing_function: string;
  reveal_delay: number;
  base_spins: number;
  drift_factor: number;
  strength_factor: number;
}

export interface SpinWheelProps {
  segments: WheelSegment[];
  mustSpin: boolean;
  prizeNumber: number;
  onStopSpinning: () => void;
  brandColor?: string;
  size?: number;
  isLive?: boolean;
  spinnerName?: string | null;
  shuffledSegments?: WheelSegment[] | null;
  revealDelay?: number;
  spinPhysics?: SpinPhysics | null;
  // For demo mode - auto-reset after complete
  demoMode?: boolean;
  onAnnouncement?: (segment: WheelSegment) => void;
}

// ─── Fisher-Yates Shuffle (for demo mode) ────────────
function shuffleSegments<T>(segments: T[], seed: number): T[] {
  const shuffled = [...segments];
  let hash = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    const j = hash % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ─── Confetti ────────────────────────────────────────
export function fireSpinConfetti(prizeType?: string) {
  const colors = ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6"];
  let intensity = 3;
  if (prizeType === "tryagain") intensity = 1;
  const end = Date.now() + 2000;
  (function frame() {
    confetti({
      particleCount: intensity,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.8 },
      colors,
    });
    confetti({
      particleCount: intensity,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

// ─── Strength Meter ──────────────────────────────────
function StrengthMeter({
  strength,
  isPressed,
  brandColor,
}: {
  strength: number;
  isPressed: boolean;
  brandColor: string;
}) {
  const getStrengthColor = () => {
    if (strength < 25) return "from-green-400 to-green-500";
    if (strength < 50) return "from-yellow-400 to-yellow-500";
    if (strength < 75) return "from-orange-400 to-orange-500";
    return "from-red-400 to-red-500";
  };
  const getStrengthLabel = () => {
    if (strength < 25) return "Gentle";
    if (strength < 50) return "Moderate";
    if (strength < 75) return "Strong";
    return "Maximum!";
  };

  return (
    <AnimatePresence>
      {isPressed && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 w-56 z-30"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-medium text-purple-300">
                {getStrengthLabel()}
              </span>
            </div>
            <span className="text-xs text-purple-400/70">
              {strength < 25
                ? "1-2 spins"
                : strength < 50
                  ? "3-5 spins"
                  : strength < 75
                    ? "6-8 spins"
                    : "9-12 spins"}
            </span>
          </div>
          <div className="relative h-2.5 bg-gray-800/60 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
            <motion.div
              className={`h-full bg-gradient-to-r ${getStrengthColor()} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${strength}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <motion.div
            className="text-center mt-1.5"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <span
              className={`text-xl font-bold bg-gradient-to-r ${getStrengthColor()} bg-clip-text text-transparent`}
            >
              {Math.round(strength)}%
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Wheel Component ────────────────────────────
export function SpinWheel({
  segments,
  mustSpin,
  prizeNumber,
  onStopSpinning,
  brandColor = "#8B5CF6",
  size = 380,
  isLive = false,
  spinnerName = null,
  shuffledSegments = null,
  revealDelay = 800,
  spinPhysics = null,
  demoMode = false,
  onAnnouncement,
}: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [phase, setPhase] = useState<WheelPhase>("idle");
  const [displaySegments, setDisplaySegments] = useState<WheelSegment[]>([
    ...segments,
  ]);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [resultSegment, setResultSegment] = useState<WheelSegment | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

  const previousMustSpin = useRef(false);
  const rotationAccumulator = useRef(0);
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const segmentAngle = 360 / (displaySegments.length || 1);

  // ─── Initialize / Reset ────────────────────────────
  useEffect(() => {
    if (
      !mustSpin &&
      !shuffledSegments &&
      phase !== "spinning" &&
      phase !== "shuffling"
    ) {
      setDisplaySegments([...segments]);
      setPhase("idle");
      setWinningIndex(null);
      setResultSegment(null);
      setIsShuffling(false);
    }
  }, [segments, mustSpin, shuffledSegments]);

  // Auto-reset for demo mode
  useEffect(() => {
    if (demoMode && phase === "complete") {
      const timer = setTimeout(() => {
        setPhase("idle");
        setDisplaySegments([...segments]);
        setWinningIndex(null);
        setResultSegment(null);
        setIsShuffling(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [demoMode, phase, segments]);

  // ─── Handle Spin ───────────────────────────────────
  useEffect(() => {
    if (mustSpin && !previousMustSpin.current) {
      setPhase("spinning");
      setWinningIndex(null);
      setResultSegment(null);
      setIsShuffling(false);
      setDisplaySegments([...segments]); // Show real segments during spin

      if (spinPhysics) {
        rotationAccumulator.current += spinPhysics.total_rotation;
        setRotation(rotationAccumulator.current);
      }
    }
    previousMustSpin.current = mustSpin;
  }, [mustSpin, segments, spinPhysics]);

  // ─── Wheel Stop Handler ────────────────────────────
  const handleWheelStop = useCallback(() => {
    if (phase !== "spinning") return;

    setPhase("stopping");

    // If we have shuffled segments, do the shell-game shuffle
    if (shuffledSegments && shuffledSegments.length > 0) {
      const delay = spinPhysics?.reveal_delay || revealDelay;

      setTimeout(() => {
        // Start shuffle animation
        setPhase("shuffling");
        setIsShuffling(true);

        let swapCount = 0;
        const maxSwaps = 8;
        const swapInterval = setInterval(() => {
          if (swapCount >= maxSwaps) {
            clearInterval(swapInterval);
            setIsShuffling(false);

            // Reveal shuffled segments
            setTimeout(() => {
              setPhase("revealing");
              setDisplaySegments(shuffledSegments);
              setWinningIndex(prizeNumber);
              setResultSegment(shuffledSegments[prizeNumber]);

              // Snap rotation to align winning segment with pointer (270°)
              const targetCenter =
                prizeNumber * segmentAngle + segmentAngle / 2;
              const angleToTarget = (((targetCenter - 270) % 360) + 360) % 360;
              const snapped =
                rotationAccumulator.current -
                (rotationAccumulator.current % 360) +
                angleToTarget;
              rotationAccumulator.current = snapped;
              setRotation(snapped);

              setTimeout(() => {
                setPhase("complete");
                onStopSpinning();
                if (onAnnouncement && shuffledSegments[prizeNumber]) {
                  onAnnouncement(shuffledSegments[prizeNumber]);
                }
              }, 800);
            }, 300);
            return;
          }
          swapCount++;
          // Rapid visual swaps for shell-game effect
          if (swapCount % 2 === 0) {
            setDisplaySegments(
              shuffleSegments([...segments], Date.now() + swapCount),
            );
          } else {
            setDisplaySegments([...segments]);
          }
        }, 150);
      }, delay);
    } else {
      // No shuffled segments - just show result directly
      setTimeout(() => {
        setPhase("revealing");
        setWinningIndex(prizeNumber);
        setResultSegment(displaySegments[prizeNumber]);

        setTimeout(() => {
          setPhase("complete");
          onStopSpinning();
          if (onAnnouncement && displaySegments[prizeNumber]) {
            onAnnouncement(displaySegments[prizeNumber]);
          }
        }, 800);
      }, revealDelay);
    }
  }, [
    phase,
    shuffledSegments,
    segments,
    prizeNumber,
    segmentAngle,
    revealDelay,
    spinPhysics,
    onStopSpinning,
    onAnnouncement,
    displaySegments,
  ]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    };
  }, []);

  // Build transition config
  const getTransition = () => {
    if (phase === "spinning") {
      return {
        duration: spinPhysics?.animation_duration || 4.5,
        ease: [0.08, 0.82, 0.17, 1.01] as [number, number, number, number],
      };
    }
    if (phase === "shuffling") {
      return { duration: 0.3, ease: "easeInOut" as const };
    }
    if (phase === "revealing") {
      return { duration: 0.5, ease: "easeInOut" as const };
    }
    return { duration: 0, ease: "easeInOut" as const };
  };

  const transition = getTransition();

  return (
    <div className="relative flex flex-col items-center">
      {/* Spinner name (live mode) */}
      <AnimatePresence>
        {isLive && spinnerName && phase === "spinning" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 px-6 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
          >
            <p className="text-white font-medium text-sm">
              🎯 <span className="font-bold">{spinnerName}</span> is spinning!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wheel container */}
      <div className="relative mx-auto" style={{ width: size, height: size }}>
        {/* Outer glow */}
        <motion.div
          className="absolute -inset-6 rounded-full"
          animate={{
            boxShadow:
              phase === "spinning"
                ? [
                    `0 0 60px ${brandColor}30, 0 0 120px ${brandColor}15`,
                    `0 0 100px ${brandColor}40, 0 0 180px ${brandColor}25`,
                    `0 0 60px ${brandColor}30, 0 0 120px ${brandColor}15`,
                  ]
                : phase === "shuffling"
                  ? `0 0 120px ${brandColor}60, 0 0 200px ${brandColor}40`
                  : phase === "revealing"
                    ? `0 0 100px ${brandColor}50, 0 0 180px ${brandColor}30`
                    : `0 0 50px ${brandColor}20`,
          }}
          transition={{
            duration: 1.5,
            repeat: phase === "spinning" ? Infinity : 0,
          }}
        />

        {/* Decorative dots */}
        <div className="absolute -inset-3 rounded-full">
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 15 * Math.PI) / 180;
            const outerRadius = size / 2 + 10;
            const x = size / 2 + outerRadius * Math.cos(angle) - 4;
            const y = size / 2 + outerRadius * Math.sin(angle) - 4;
            return (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{ left: x, top: y, backgroundColor: `${brandColor}40` }}
                animate={
                  phase === "spinning"
                    ? { opacity: [0.3, 0.8, 0.3], scale: [1, 1.5, 1] }
                    : { opacity: 0.3, scale: 1 }
                }
                transition={{
                  duration: 0.5,
                  delay: i * 0.02,
                  repeat: phase === "spinning" ? Infinity : 0,
                }}
              />
            );
          })}
        </div>

        {/* Pointer */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
          <motion.div
            animate={
              phase === "spinning"
                ? { y: [0, -4, 0] }
                : phase === "shuffling"
                  ? { y: [0, -6, 0], scale: [1, 1.1, 1] }
                  : phase === "revealing"
                    ? { y: [0, -6, 0], scale: [1, 1.15, 1] }
                    : { y: 0, scale: 1 }
            }
            transition={{
              duration: 0.3,
              repeat:
                phase === "spinning" ||
                phase === "shuffling" ||
                phase === "revealing"
                  ? Infinity
                  : 0,
            }}
          >
            <svg width="32" height="44" viewBox="0 0 32 44">
              <defs>
                <filter id="spin-pointer-shadow">
                  <feDropShadow
                    dx="0"
                    dy="3"
                    stdDeviation="3"
                    floodColor="#000"
                    floodOpacity="0.4"
                  />
                </filter>
                <linearGradient
                  id="spin-pointer-grad"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={brandColor} />
                  <stop offset="100%" stopColor={`${brandColor}DD`} />
                </linearGradient>
              </defs>
              <polygon
                points="16,44 0,0 32,0"
                fill="url(#spin-pointer-grad)"
                filter="url(#spin-pointer-shadow)"
              />
            </svg>
          </motion.div>
        </div>

        {/* Wheel */}
        <div
          className="w-full h-full rounded-full relative overflow-hidden"
          style={{
            border: `4px solid ${brandColor}30`,
            boxShadow: `inset 0 0 40px rgba(0,0,0,0.3)`,
          }}
        >
          {/* Glowing border */}
          <div
            className="absolute -inset-[6px] rounded-full"
            style={
              {
                background: `conic-gradient(from var(--a, 0deg), ${brandColor}, #ec4899, #3b82f6)`,
                animation: `spin ${phase === "spinning" || phase === "shuffling" ? "1.5s" : "3s"} linear infinite`,
              } as React.CSSProperties
            }
          />
          <div
            className="absolute -inset-[8px] rounded-full blur-xl opacity-50"
            style={
              {
                background: `conic-gradient(from var(--a, 0deg), ${brandColor}, #ec4899, #3b82f6)`,
                animation: `spin ${phase === "spinning" || phase === "shuffling" ? "1.5s" : "3s"} linear infinite`,
              } as React.CSSProperties
            }
          />

          {/* Rotating Wheel */}
          <motion.div
            className="w-full h-full rounded-full relative bg-gray-900"
            style={{ zIndex: 1 }}
            animate={{ rotate: rotation }}
            transition={transition}
            onAnimationComplete={handleWheelStop}
          >
            <motion.svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              animate={
                isShuffling
                  ? {
                      filter: [
                        "blur(0px)",
                        "blur(3px)",
                        "blur(0px)",
                        "blur(3px)",
                        "blur(0px)",
                      ],
                    }
                  : { filter: "blur(0px)" }
              }
              transition={{ duration: 0.8, repeat: isShuffling ? Infinity : 0 }}
            >
              {displaySegments.map((seg, i) => {
                const startAngle = i * segmentAngle;
                const endAngle = (i + 1) * segmentAngle;
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;
                const midAngle = (startAngle + endAngle) / 2;
                const midRad = (midAngle * Math.PI) / 180;
                const centerX = 50;
                const centerY = 50;
                const radius = 50;
                const x1 = centerX + radius * Math.cos(startRad);
                const y1 = centerY + radius * Math.sin(startRad);
                const x2 = centerX + radius * Math.cos(endRad);
                const y2 = centerY + radius * Math.sin(endRad);
                const textRadius = 30;
                const textX = centerX + textRadius * Math.cos(midRad);
                const textY = centerY + textRadius * Math.sin(midRad);
                const isWinning = i === winningIndex;

                return (
                  <motion.g key={i}>
                    <motion.polygon
                      points={`${centerX},${centerY} ${x1},${y1} ${x2},${y2}`}
                      fill={`url(#sw-grad-${i})`}
                      opacity={hoveredSegment === i ? 0.95 : 0.85}
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="0.8"
                      onMouseEnter={() => setHoveredSegment(i)}
                      onMouseLeave={() => setHoveredSegment(null)}
                      animate={
                        phase === "revealing" && isWinning
                          ? { opacity: [0.85, 1, 0.85, 1, 0.85] }
                          : phase === "complete" && isWinning
                            ? { opacity: [0.85, 1, 0.85] }
                            : { opacity: 0.85 }
                      }
                      transition={
                        phase === "revealing" && isWinning
                          ? { duration: 0.8, repeat: 3 }
                          : phase === "complete" && isWinning
                            ? { duration: 1.5, repeat: Infinity }
                            : {}
                      }
                    />
                    <defs>
                      <linearGradient
                        id={`sw-grad-${i}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor={seg.color} />
                        <stop offset="100%" stopColor={`${seg.color}CC`} />
                      </linearGradient>
                    </defs>

                    {/* Segment text */}
                    <motion.g
                      style={{ pointerEvents: "none" }}
                      initial={
                        phase === "revealing"
                          ? { opacity: 0, scale: 0 }
                          : undefined
                      }
                      animate={
                        phase === "revealing"
                          ? { opacity: 1, scale: [0, 1.2, 1] }
                          : { opacity: 1, scale: 1 }
                      }
                      transition={
                        phase === "revealing"
                          ? { delay: i * 0.05, duration: 0.5 }
                          : {}
                      }
                    >
                      <text
                        x={textX}
                        y={textY - 5}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="white"
                        fontSize="7"
                        fontWeight="bold"
                        style={{ textShadow: "0 2px 4px rgba(0,0,0,0.6)" }}
                      >
                        {seg.icon || "🎁"}
                      </text>
                      <text
                        x={textX}
                        y={textY + 8}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="white"
                        fontSize="3.5"
                        fontWeight="bold"
                        style={{ textShadow: "0 2px 4px rgba(0,0,0,0.6)" }}
                      >
                        {seg.label}
                      </text>
                    </motion.g>

                    {/* Winning glow ring */}
                    {isWinning &&
                      (phase === "revealing" || phase === "complete") && (
                        <motion.polygon
                          points={`${centerX},${centerY} ${x1},${y1} ${x2},${y2}`}
                          fill="none"
                          stroke="rgba(255,255,255,0.6)"
                          strokeWidth="2"
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      )}
                  </motion.g>
                );
              })}
            </motion.svg>

            {/* Center hub */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <motion.div
                className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-white to-gray-100 flex items-center justify-center shadow-xl"
                animate={
                  phase === "spinning"
                    ? { scale: [1, 1.05, 1] }
                    : phase === "shuffling"
                      ? { scale: [1, 1.15, 1], rotate: [0, 15, -15, 0] }
                      : phase === "revealing"
                        ? { scale: [1, 1.15, 1] }
                        : { scale: 1 }
                }
                transition={{
                  duration: 0.5,
                  repeat:
                    phase === "spinning" ||
                    phase === "shuffling" ||
                    phase === "revealing"
                      ? Infinity
                      : 0,
                }}
              >
                <motion.div
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${brandColor}, ${brandColor}DD)`,
                  }}
                  animate={
                    phase === "shuffling" || phase === "revealing"
                      ? { rotate: [0, 360] }
                      : {}
                  }
                  transition={{ duration: 0.8 }}
                >
                  <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Phase status */}
      <p className="text-xs text-white/40 mt-2">
        {displaySegments.length} prizes •{" "}
        {phase === "idle"
          ? "Ready"
          : phase === "spinning"
            ? "Spinning..."
            : phase === "stopping"
              ? "Stopping..."
              : phase === "shuffling"
                ? "Shuffling prizes..."
                : phase === "revealing"
                  ? "Revealing..."
                  : phase === "complete"
                    ? "Complete!"
                    : ""}
      </p>
    </div>
  );
}

// ─── Spin Button ────────────────────────────────────
export function SpinButton({
  onSpin,
  disabled,
  brandColor = "#8B5CF6",
  phase,
}: {
  onSpin: (strength: number) => void;
  disabled: boolean;
  brandColor?: string;
  phase: WheelPhase;
}) {
  const [isPressed, setIsPressed] = useState(false);
  const [strength, setStrength] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handlePressStart = () => {
    if (disabled || phase !== "idle") return;
    setIsPressed(true);
    setStrength(0);
    intervalRef.current = setInterval(
      () => setStrength((prev) => Math.min(prev + 2, 100)),
      30,
    );
  };

  const handlePressEnd = () => {
    if (!isPressed) return;
    setIsPressed(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (strength > 0) {
      onSpin(strength);
      setStrength(0);
    }
  };

  const getButtonText = () => {
    switch (phase) {
      case "spinning":
        return "Spinning...";
      case "stopping":
        return "Stopping...";
      case "shuffling":
        return "Shuffling...";
      case "revealing":
        return "Revealing...";
      case "complete":
        return "Spin Again?";
      default:
        return isPressed ? "Release to Spin!" : "Press & Hold to Spin";
    }
  };

  return (
    <div className="relative mt-10">
      <StrengthMeter
        strength={strength}
        isPressed={isPressed}
        brandColor={brandColor}
      />

      <motion.button
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchCancel={handlePressEnd}
        disabled={disabled || phase !== "idle"}
        className={`relative px-12 py-4 rounded-xl font-bold text-lg text-white transition-all duration-200 select-none disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${isPressed ? "scale-95" : "scale-100"}`}
        style={{
          background: isPressed
            ? `linear-gradient(135deg, ${brandColor}DD, ${brandColor})`
            : `linear-gradient(135deg, ${brandColor}, ${brandColor}CC)`,
          boxShadow: isPressed
            ? `0 2px 10px ${brandColor}30`
            : `0 4px 20px ${brandColor}40`,
        }}
        whileHover={!disabled && phase === "idle" ? { scale: 1.02 } : {}}
      >
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <span className="relative z-10 flex items-center gap-2">
          {phase === "spinning" ||
          phase === "stopping" ||
          phase === "shuffling" ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              ⚡
            </motion.span>
          ) : phase === "revealing" || phase === "complete" ? (
            <Sparkles className="w-5 h-5" />
          ) : (
            <Zap className="w-5 h-5" />
          )}
          {getButtonText()}
        </span>
      </motion.button>
    </div>
  );
}
