// components/landing/demo-wheel.tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Volume2, VolumeX, Zap, Gauge } from "lucide-react";
import confetti from "canvas-confetti";
import spinAnimation from "@/assets/lottie/spin-1.json";
import { LottieIcon } from "../ui/lottie-icon";

const SEGMENTS = [
  {
    label: "Free Coffee",
    color: "#8B5CF6",
    icon: "☕",
    value: "coffee",
    probability: 13,
  },
  {
    label: "10% Off",
    color: "#EC4899",
    icon: "🏷️",
    value: "10percent",
    probability: 10,
  },
  {
    label: "Free Donut",
    color: "#F59E0B",
    icon: "🍩",
    value: "donut",
    probability: 10,
  },
  {
    label: "Try Again",
    color: "#10B981",
    icon: "🔄",
    value: "tryagain",
    probability: 32,
  },
  {
    label: "Free Latte",
    color: "#3B82F6",
    icon: "🥤",
    value: "latte",
    probability: 13,
  },
  {
    label: "20% Off",
    color: "#EF4444",
    icon: "💵",
    value: "20percent",
    probability: 10,
  },
  {
    label: "VIP Pass",
    color: "#A855F7",
    icon: "👑",
    value: "vip",
    probability: 5,
  },
  {
    label: "Mystery",
    color: "#06B6D4",
    icon: "🎁",
    value: "mystery",
    probability: 7,
  },
] as const;

type Segment = (typeof SEGMENTS)[number];

// Fisher-Yates shuffle with seed
function shuffleSegments(
  segments: readonly Segment[],
  seed: number,
): Segment[] {
  const shuffled = [...segments];
  let hash = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    const j = hash % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const ANNOUNCEMENTS: Record<
  string,
  { message: string; audio: string; encouragement: string }
> = {
  coffee: {
    message: "☕🎉 Congratulations! You've won a FREE Coffee! 🎉☕",
    audio: "Congratulations! You've won a FREE Coffee!",
    encouragement: "Enjoy your complimentary coffee!",
  },
  "10percent": {
    message: "🏷️🎊 Amazing! 10% OFF your next purchase! 🎊🏷️",
    audio: "Amazing! 10% OFF your next purchase!",
    encouragement: "Use this code at checkout!",
  },
  donut: {
    message: "🍩✨ Sweet! You've won a FREE Donut! ✨🍩",
    audio: "Sweet! You've won a FREE Donut!",
    encouragement: "Treat yourself today!",
  },
  tryagain: {
    message: "🔄😅 So close! Try again for your chance to win! 😅🔄",
    audio: "So close! Try again for your chance to win!",
    encouragement: "Don't give up - your next spin could be the winner!",
  },
  latte: {
    message: "🥤🎁 Winner! Enjoy a FREE Latte on us! 🎁🥤",
    audio: "Winner! Enjoy a FREE Latte on us!",
    encouragement: "Warm up with a delicious latte!",
  },
  "20percent": {
    message: "💵🔥 Hot deal! 20% OFF your entire order! 🔥💵",
    audio: "Hot deal! 20% OFF your entire order!",
    encouragement: "Big savings await you!",
  },
  vip: {
    message: "👑🌟 VIP PASS UNLOCKED! Special treatment awaits! 🌟👑",
    audio: "VIP PASS UNLOCKED! Special treatment awaits!",
    encouragement: "You're now a VIP member!",
  },
  mystery: {
    message: "🎁❓ MYSTERY PRIZE! Check your rewards! ❓🎁",
    audio: "MYSTERY PRIZE! Check your rewards!",
    encouragement: "A surprise is waiting for you!",
  },
};

function fireConfettiBurst(prizeType: string) {
  const end = Date.now() + 2000;
  const colors = ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6"];
  let intensity = 3;
  if (prizeType === "vip") intensity = 6;
  if (prizeType === "mystery") intensity = 5;
  if (prizeType === "tryagain") intensity = 1;
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

function StrengthMeter({
  strength,
  isPressed,
}: {
  strength: number;
  isPressed: boolean;
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
          className="absolute -top-8 left-1/2 -translate-x-1/2 w-56"
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

export function DemoWheel() {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Segment | null>(null);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [isPressed, setIsPressed] = useState(false);
  const [strength, setStrength] = useState(0);

  // Shuffle & Reveal
  const [phase, setPhase] = useState<
    "idle" | "spinning" | "stopping" | "shuffling" | "revealing" | "complete"
  >("idle");
  const [displaySegments, setDisplaySegments] = useState<Segment[]>([
    ...SEGMENTS,
  ]);
  const [shuffledSegments, setShuffledSegments] = useState<Segment[] | null>(
    null,
  );
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);

  const wheelRef = useRef<HTMLDivElement>(null);
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const spinAudioRef = useRef<HTMLAudioElement | null>(null);
  const strengthIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const rotationAccumulator = useRef(0);

  const segmentAngle = 360 / SEGMENTS.length;

  useEffect(() => {
    spinAudioRef.current = new Audio("/sounds/wheel-spin.mp3");
    spinAudioRef.current.volume = 0.3;
    return () => {
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      if (strengthIntervalRef.current)
        clearInterval(strengthIntervalRef.current);
      spinAudioRef.current?.pause();
      if (typeof window !== "undefined" && window.speechSynthesis)
        window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (phase === "complete") {
      const timer = setTimeout(() => {
        setPhase("idle");
        setDisplaySegments([...SEGMENTS]);
        setWinningIndex(null);
        setShuffledSegments(null);
        setIsShuffling(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const playSpinSound = useCallback(() => {
    if (!soundEnabled || !spinAudioRef.current) return;
    try {
      spinAudioRef.current.currentTime = 0;
      spinAudioRef.current.play().catch(() => {});
    } catch {}
  }, [soundEnabled]);

  const announceResult = useCallback(
    (segment: Segment) => {
      if (!segment?.value) return;
      const announcement = ANNOUNCEMENTS[segment.value];
      if (!announcement) return;
      if (
        typeof window !== "undefined" &&
        "speechSynthesis" in window &&
        soundEnabled
      ) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(announcement.audio);
          utterance.rate = 0.9;
          utterance.pitch = 1.1;
          utterance.volume = 1;
          window.speechSynthesis.speak(utterance);
        } catch {}
      }
      setShowAnnouncement(true);
      setTimeout(() => setShowAnnouncement(false), 4000);
    },
    [soundEnabled],
  );

  const handlePressStart = useCallback(() => {
    if (spinning || phase !== "idle") return;
    setIsPressed(true);
    setStrength(0);
    strengthIntervalRef.current = setInterval(
      () => setStrength((prev) => Math.min(prev + 2, 100)),
      30,
    );
  }, [spinning, phase]);

  const handlePressEnd = useCallback(() => {
    if (!isPressed) return;
    setIsPressed(false);
    if (strengthIntervalRef.current) {
      clearInterval(strengthIntervalRef.current);
      strengthIntervalRef.current = null;
    }
    if (strength > 0 && !spinning && phase === "idle") {
      executeSpin(strength);
      setStrength(0);
    }
  }, [isPressed, strength, spinning, phase]);

  const handleCancel = useCallback(() => {
    setIsPressed(false);
    setStrength(0);
    if (strengthIntervalRef.current) {
      clearInterval(strengthIntervalRef.current);
      strengthIntervalRef.current = null;
    }
  }, []);

  // ─── CORRECTED POINTER ALIGNMENT ──────────────────
  const executeSpin = useCallback(
    (spinStrength: number) => {
      if (spinning || phase !== "idle") return;

      setSpinning(true);
      setPhase("spinning");
      setShowAnnouncement(false);
      setResult(null);
      setDisplaySegments([...SEGMENTS]); // Show original segments during spin
      setWinningIndex(null);
      setShuffledSegments(null);
      setIsShuffling(false);

      playSpinSound();

      // Select prize
      const random = Math.random() * 100;
      let cumulative = 0;
      let selectedIndex = 0;
      for (let i = 0; i < SEGMENTS.length; i++) {
        cumulative += SEGMENTS[i].probability;
        if (random <= cumulative) {
          selectedIndex = i;
          break;
        }
      }
      const selectedPrize = SEGMENTS[selectedIndex];

      // Shuffle segments
      const shuffleSeed = Date.now();
      const shuffled = shuffleSegments(SEGMENTS, shuffleSeed);
      const displayIndex = shuffled.findIndex(
        (s) => s.value === selectedPrize.value,
      );

      setShuffledSegments(shuffled);
      setWinningIndex(displayIndex);

      // ─── FIXED POINTER MATH ──────────────────────────
      // The pointer is at TOP (12 o'clock).
      // In our SVG coordinate system, angles start from 3 o'clock (0°) and go clockwise.
      // So 12 o'clock = -90° or 270°.
      //
      // Each segment i starts at angle: i * segmentAngle
      // The center of segment i is at: i * segmentAngle + segmentAngle / 2
      //
      // To bring segment i's center to the pointer (270°), we need to rotate:
      // 270° - (i * segmentAngle + segmentAngle / 2)
      //
      // But framer-motion rotates clockwise, so we use positive rotation.
      // If we're currently at rotation R, and we want to end at rotation R + total,
      // after rotating by 'total', the segment that was at angle A will be at angle A - total.
      //
      // We want: (segmentCenter - totalRotation) % 360 = 270° (pointer position)
      // Therefore: totalRotation = (segmentCenter - 270°) % 360
      // But we need totalRotation to be positive, so we do:
      // angleToTarget = ((segmentCenter - 270) % 360 + 360) % 360

      const minSpins = 5;
      const maxSpins = 12;
      const strengthFactor = spinStrength / 100;
      const totalSpins = minSpins + strengthFactor * (maxSpins - minSpins);
      const randomOffset = (Math.random() - 0.5) * 0.3;
      const finalSpins = totalSpins + randomOffset;

      const targetSegmentCenter =
        displayIndex * segmentAngle + segmentAngle / 2;

      // Calculate how much we need to rotate so the target segment's center aligns with the pointer (270°)
      const angleToTarget = (((targetSegmentCenter - 270) % 360) + 360) % 360;

      // Total rotation = full spins + alignment
      const totalRotation = finalSpins * 360 + angleToTarget;

      rotationAccumulator.current += totalRotation;
      setRotation(rotationAccumulator.current);

      // Handle wheel stop
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      spinTimeoutRef.current = setTimeout(() => {
        setPhase("stopping");

        // ─── SHELL GAME SHUFFLE ANIMATION ──────────────
        // After stopping, start the shuffle animation
        setTimeout(() => {
          setPhase("shuffling");
          setIsShuffling(true);

          // Do a rapid spin (just the segments visually swap, not the wheel)
          // We'll simulate this with multiple rapid segment swaps
          let swapCount = 0;
          const maxSwaps = 8;
          const swapInterval = setInterval(() => {
            if (swapCount >= maxSwaps) {
              clearInterval(swapInterval);
              // Final reveal - show shuffled segments
              setTimeout(() => {
                setIsShuffling(false);
                setPhase("revealing");
                setDisplaySegments(shuffled);

                // Reset rotation to point at the winning segment in the shuffled wheel
                // After swapping to shuffled, we need to rotate so winning index is at pointer
                const newTargetCenter =
                  displayIndex * segmentAngle + segmentAngle / 2;
                const newAngleToTarget =
                  (((newTargetCenter - 270) % 360) + 360) % 360;
                const newTotalRotation =
                  rotationAccumulator.current -
                  (rotationAccumulator.current % 360) +
                  newAngleToTarget;
                rotationAccumulator.current = newTotalRotation;
                setRotation(newTotalRotation);

                setTimeout(() => {
                  setPhase("complete");
                  setSpinning(false);
                  setResult(selectedPrize);
                  announceResult(selectedPrize);
                  if (selectedPrize.value !== "tryagain") {
                    fireConfettiBurst(selectedPrize.value);
                  }
                }, 800);
              }, 300);
              return;
            }
            swapCount++;
            // Visual jitter - briefly show different segments
            if (swapCount % 2 === 0) {
              setDisplaySegments([...SEGMENTS].sort(() => Math.random() - 0.5));
            } else {
              setDisplaySegments([...SEGMENTS]);
            }
          }, 150);
        }, 600);
      }, 4500);
    },
    [spinning, phase, segmentAngle, announceResult, playSpinSound],
  );

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (
      soundEnabled &&
      typeof window !== "undefined" &&
      window.speechSynthesis
    ) {
      window.speechSynthesis.cancel();
    }
    spinAudioRef.current?.pause();
  };

  return (
    <div className="relative flex flex-col justify-between items-center">
      {/* Ambient glow */}
      <div className="absolute -inset-20 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />

      {/* Sound Toggle */}
      <button
        onClick={toggleSound}
        className="absolute -top-8 right-0 z-30 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle sound"
      >
        {soundEnabled ? (
          <Volume2 className="h-4 w-4" />
        ) : (
          <VolumeX className="h-4 w-4" />
        )}
      </button>

      {/* Outer ring */}
      <div className="relative w-[350px] h-[350px] sm:w-[400px] sm:h-[400px]">
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 15 * Math.PI) / 180;
          const radius = 44;
          return (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-purple-400/30"
              style={{
                left: `${50 + radius * Math.cos(angle)}%`,
                top: `${50 + radius * Math.sin(angle)}%`,
                transform: "translate(-50%, -50%)",
              }}
              animate={
                phase === "spinning"
                  ? { opacity: [0.3, 0.8, 0.3] }
                  : { opacity: 0.3 }
              }
              transition={{
                duration: 0.5,
                delay: i * 0.02,
                repeat: phase === "spinning" ? Infinity : 0,
              }}
            />
          );
        })}

        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow:
              phase === "spinning"
                ? [
                    "0 0 80px rgba(139, 92, 246, 0.3), 0 0 160px rgba(236, 72, 153, 0.15)",
                    "0 0 120px rgba(236, 72, 153, 0.4), 0 0 200px rgba(139, 92, 246, 0.25)",
                    "0 0 80px rgba(139, 92, 246, 0.3), 0 0 160px rgba(236, 72, 153, 0.15)",
                  ]
                : phase === "shuffling"
                  ? "0 0 120px rgba(139, 92, 246, 0.6), 0 0 200px rgba(236, 72, 153, 0.4)"
                  : phase === "revealing"
                    ? "0 0 120px rgba(139, 92, 246, 0.5), 0 0 200px rgba(236, 72, 153, 0.3)"
                    : "0 0 60px rgba(139, 92, 246, 0.2)",
          }}
          transition={{
            duration: 1,
            repeat: phase === "spinning" ? Infinity : 0,
          }}
        />

        {/* Pointer */}
        <div className="absolute -top-4 md:-top-5 left-1/2 -translate-x-1/2 z-20">
          <motion.div
            animate={
              phase === "spinning"
                ? { y: [0, -4, 0] }
                : phase === "shuffling"
                  ? { y: [0, -6, 0], scale: [1, 1.1, 1] }
                  : phase === "revealing"
                    ? { y: [0, -6, 0], scale: [1, 1.15, 1] }
                    : {}
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
                <filter id="pointer-shadow">
                  <feDropShadow
                    dx="0"
                    dy="3"
                    stdDeviation="3"
                    floodColor="#000"
                    floodOpacity="0.4"
                  />
                </filter>
                <linearGradient id="pointer-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A855F7" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
              <polygon
                points="16,44 0,0 32,0"
                fill="url(#pointer-grad)"
                filter="url(#pointer-shadow)"
              />
            </svg>
          </motion.div>
        </div>

        {/* Wheel Container */}
        <div className="relative w-full h-full">
          <div
            className="absolute -inset-[6px] md:-inset-[8px] rounded-full"
            style={
              {
                background:
                  "conic-gradient(from var(--a, 0deg), #8b5cf6, #ec4899, #3b82f6)",
                animation: `spin ${phase === "spinning" || phase === "shuffling" ? "1.5s" : "3s"} linear infinite`,
              } as React.CSSProperties
            }
          />
          <div
            className="absolute -inset-[8px] md:-inset-[10px] rounded-full blur-xl md:blur-2xl opacity-50"
            style={
              {
                background:
                  "conic-gradient(from var(--a, 0deg), #8b5cf6, #ec4899, #3b82f6)",
                animation: `spin ${phase === "spinning" || phase === "shuffling" ? "1.5s" : "3s"} linear infinite`,
              } as React.CSSProperties
            }
          />

          <motion.div
            ref={wheelRef}
            className="w-full h-full rounded-full relative overflow-hidden bg-gray-900"
            style={{
              border: "4px solid rgba(139, 92, 246, 0.3)",
              boxShadow: "inset 0 0 40px rgba(0,0,0,0.3)",
              position: "relative",
              zIndex: 1,
            }}
            animate={{
              rotate: rotation,
            }}
            transition={{
              duration:
                phase === "spinning" ? 4.5 : phase === "shuffling" ? 0.3 : 0.5,
              ease:
                phase === "spinning" ? [0.08, 0.82, 0.17, 1.01] : "easeInOut",
            }}
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
                  : {}
              }
              transition={{ duration: 0.8, repeat: isShuffling ? Infinity : 0 }}
            >
              {displaySegments.map((segment, i) => {
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

                const isWinning = i === winningIndex;
                const textRadius = 28;
                const textX = centerX + textRadius * Math.cos(midRad);
                const textY = centerY + textRadius * Math.sin(midRad);

                return (
                  <motion.g key={i}>
                    <motion.polygon
                      points={`${centerX},${centerY} ${x1},${y1} ${x2},${y2}`}
                      fill={`url(#grad${i})`}
                      opacity={hoveredSegment === i ? 0.9 : 0.85}
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="0.8"
                      onMouseEnter={() => !spinning && setHoveredSegment(i)}
                      onMouseLeave={() => setHoveredSegment(null)}
                      animate={
                        phase === "revealing" && isWinning
                          ? { fillOpacity: [1, 0.7, 1, 0.7, 1] }
                          : phase === "complete" && isWinning
                            ? { fillOpacity: [1, 0.8, 1] }
                            : {}
                      }
                      transition={
                        phase === "revealing" && isWinning
                          ? { duration: 1, repeat: 2 }
                          : phase === "complete" && isWinning
                            ? { duration: 1.5, repeat: Infinity }
                            : {}
                      }
                    />

                    <defs>
                      <linearGradient
                        id={`grad${i}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor={segment.color} />
                        <stop
                          offset="100%"
                          stopColor={segment.color}
                          stopOpacity="0.8"
                        />
                      </linearGradient>
                    </defs>

                    <motion.g
                      style={{ pointerEvents: "none" }}
                      initial={
                        phase === "revealing" ? { opacity: 0, scale: 0 } : {}
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
                        {segment.icon}
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
                        {segment.label}
                      </text>
                    </motion.g>

                    {isWinning && phase === "complete" && (
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
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
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

      {/* Spin Button */}
      <div className="relative mt-12">
        <StrengthMeter strength={strength} isPressed={isPressed} />

        <motion.button
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handleCancel}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onTouchCancel={handleCancel}
          disabled={spinning || phase !== "idle"}
          className={`
            relative px-16 py-3 rounded-lg font-bold text-lg text-white 
            shadow-2xl transition-all select-none
            disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden group
            ${isPressed ? "scale-95" : "scale-100"}
          `}
          style={{
            background: isPressed
              ? "linear-gradient(135deg, #D97706, #B45309)"
              : "linear-gradient(135deg, #F59E0B, #D97706)",
          }}
          whileHover={!spinning && phase === "idle" ? { scale: 1.05 } : {}}
          whileTap={!spinning && phase === "idle" ? { scale: 0.95 } : {}}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <span className="relative z-10 flex items-center gap-2">
            {phase === "spinning" ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  ⚡
                </motion.span>
                Spinning...
              </>
            ) : phase === "stopping" || phase === "shuffling" ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  ⚡
                </motion.span>
                Shuffling...
              </>
            ) : phase === "revealing" ? (
              <>
                <Sparkles className="w-5 h-5" />
                Revealing...
              </>
            ) : phase === "complete" ? (
              <>
                <Sparkles className="w-5 h-5" />
                Spin Again!
              </>
            ) : isPressed ? (
              <>
                <Zap className="w-5 h-5" />
                Release to Spin!
              </>
            ) : (
              <div className="flex items-center gap-2">
                <LottieIcon animation={spinAnimation} isCategory={false} />
                Press & Hold to Spin!
              </div>
            )}
          </span>
        </motion.button>
      </div>

      {/* Result Banner */}
      <AnimatePresence>
        {showAnnouncement && result && result.value && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-lg"
          >
            <div
              className="p-2 sm:p-4 rounded-2xl shadow-2xl font-bold text-center text-xs sm:text-sm text-white"
              style={{
                background: `linear-gradient(135deg, ${result.color}, ${result.color}CC)`,
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.5, repeat: 3 }}
              >
                {ANNOUNCEMENTS[result.value]?.message ||
                  `${result.icon} ${result.label}!`}
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-sm mt-2 opacity-90"
              >
                {ANNOUNCEMENTS[result.value]?.encouragement ||
                  "Enjoy your prize!"}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-white/50 mt-3">
        {phase === "idle"
          ? "Press and hold to build strength, then release!"
          : phase === "spinning"
            ? "Spinning with your strength..."
            : phase === "stopping"
              ? "Wheel stopped! Now watch closely..."
              : phase === "shuffling"
                ? "Shuffling the prizes..."
                : phase === "revealing"
                  ? "Here's what you actually won!"
                  : phase === "complete"
                    ? "🎉 Check your prize!"
                    : ""}
      </p>
    </div>
  );
}
