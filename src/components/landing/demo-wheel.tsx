// components/landing/demo-wheel.tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Volume2, VolumeX } from "lucide-react";
import confetti from "canvas-confetti";

const SEGMENTS = [
  { label: "Free Coffee", color: "#8B5CF6", icon: "☕", value: "coffee" },
  { label: "10% Off", color: "#EC4899", icon: "🏷️", value: "10percent" },
  { label: "Free Donut", color: "#F59E0B", icon: "🍩", value: "donut" },
  { label: "Try Again", color: "#10B981", icon: "🔄", value: "tryagain" },
  { label: "Free Latte", color: "#3B82F6", icon: "🥤", value: "latte" },
  { label: "20% Off", color: "#EF4444", icon: "💵", value: "20percent" },
  { label: "VIP Pass", color: "#A855F7", icon: "👑", value: "vip" },
  { label: "Mystery", color: "#06B6D4", icon: "🎁", value: "mystery" },
] as const;

// Prize announcements for each segment
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

  // Different intensity based on prize
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

export function DemoWheel() {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<(typeof SEGMENTS)[number] | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const wheelRef = useRef<HTMLDivElement>(null);
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const spinAudioRef = useRef<HTMLAudioElement | null>(null);

  const segmentAngle = 360 / SEGMENTS.length;

  // Initialize audio element
  useEffect(() => {
    // Create audio element for spin sound
    spinAudioRef.current = new Audio("/sounds/wheel-spin.mp3");
    spinAudioRef.current.volume = 0.3; // Adjust volume as needed

    return () => {
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
      }
      if (spinAudioRef.current) {
        spinAudioRef.current.pause();
        spinAudioRef.current = null;
      }
      // Cancel any ongoing speech
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Function to determine which segment is under the pointer
  const getCurrentSegment = useCallback(
    (currentRotation: number): (typeof SEGMENTS)[number] => {
      // Pointer is at top (12 o'clock position = -90 degrees)
      const pointerAngle = 90; // degrees from right, so top is 90
      const normalizedRotation = ((currentRotation % 360) + 360) % 360;
      const effectiveAngle = (pointerAngle - normalizedRotation + 360) % 360;
      const segmentIndex =
        Math.floor(effectiveAngle / segmentAngle) % SEGMENTS.length;
      return SEGMENTS[segmentIndex];
    },
    [segmentAngle],
  );

  // Play spinning sound from file
  const playSpinSound = useCallback(() => {
    if (!soundEnabled || !spinAudioRef.current) return;

    try {
      // Reset and play the audio
      spinAudioRef.current.currentTime = 0;
      spinAudioRef.current.play().catch((error) => {
        console.log("Audio playback failed:", error);
      });
    } catch (error) {
      console.log("Audio not supported or user interaction required");
    }
  }, [soundEnabled]);

  // Announce the result with sound and visual effects
  const announceResult = useCallback(
    (segment: (typeof SEGMENTS)[number]) => {
      // Safety check with proper null/undefined handling
      if (!segment || !segment.value) {
        console.error("Invalid segment:", segment);
        return;
      }

      const announcement = ANNOUNCEMENTS[segment.value];

      // Safety check for announcement
      if (!announcement) {
        console.error("No announcement found for segment:", segment.value);
        // Set default values if announcement is missing
        setShowAnnouncement(true);
        setTimeout(() => setShowAnnouncement(false), 4000);
        return;
      }

      // Create a spoken announcement using Web Speech API
      if (
        typeof window !== "undefined" &&
        "speechSynthesis" in window &&
        soundEnabled
      ) {
        try {
          // Cancel any ongoing speech
          window.speechSynthesis.cancel();

          const utterance = new SpeechSynthesisUtterance(announcement.audio);
          utterance.rate = 0.9;
          utterance.pitch = 1.1;
          utterance.volume = 1;

          window.speechSynthesis.speak(utterance);
        } catch (error) {
          console.log("Speech synthesis not supported");
        }
      }

      // Show visual announcement
      setShowAnnouncement(true);
      setTimeout(() => setShowAnnouncement(false), 4000);
    },
    [soundEnabled],
  );

  const handleSpin = useCallback(() => {
    if (spinning) return;

    setSpinning(true);
    setShowResult(false);
    setShowAnnouncement(false);
    setResult(null);

    // Play spinning sound
    playSpinSound();

    // Randomize the result with weighted probabilities for demo
    const random = Math.random();
    let targetIndex: number;
    if (random < 0.05) {
      targetIndex = 6; // VIP (rare - 5%)
    } else if (random < 0.12) {
      targetIndex = 7; // Mystery (rare - 7%)
    } else if (random < 0.25) {
      targetIndex = 0; // Free Coffee (common - 13%)
    } else if (random < 0.38) {
      targetIndex = 4; // Free Latte (common - 13%)
    } else if (random < 0.48) {
      targetIndex = 1; // 10% Off (common - 10%)
    } else if (random < 0.58) {
      targetIndex = 5; // 20% Off (common - 10%)
    } else if (random < 0.68) {
      targetIndex = 2; // Free Donut (common - 10%)
    } else {
      targetIndex = 3; // Try Again (common - 32%)
    }

    const fullSpins = 8 + Math.floor(Math.random() * 5); // 8-12 full rotations
    const targetAngle =
      360 * fullSpins + (360 - (targetIndex * segmentAngle + segmentAngle / 2));

    const newRotation = rotation + targetAngle;
    setRotation(newRotation);

    // Clear any existing timeout
    if (spinTimeoutRef.current) {
      clearTimeout(spinTimeoutRef.current);
    }

    // Calculate final segment after animation
    spinTimeoutRef.current = setTimeout(() => {
      const finalSegment = getCurrentSegment(newRotation);

      // Additional safety check
      if (!finalSegment) {
        console.error("Failed to get final segment");
        setSpinning(false);
        return;
      }

      setResult(finalSegment);
      setShowResult(true);
      setSpinning(false);

      // Announce the result (this will work for "Try Again" too)
      announceResult(finalSegment);

      // Fire confetti for good prizes (not for "Try Again")
      if (finalSegment.value !== "tryagain") {
        fireConfettiBurst(finalSegment.value);
      }
    }, 4500);
  }, [
    spinning,
    rotation,
    segmentAngle,
    getCurrentSegment,
    announceResult,
    playSpinSound,
  ]);

  // Toggle sound
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (soundEnabled) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (spinAudioRef.current) {
        spinAudioRef.current.pause();
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Ambient glow */}
      <div className="absolute -inset-20 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />

      {/* Sound Toggle Button */}
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
      <div className="relative w-72 h-72 md:w-80 md:h-80">
        {/* Decorative dots around wheel */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 15 * Math.PI) / 180;
          const radius = 44;
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

        {/* Pointer Indicator */}
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
          ref={wheelRef}
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
            const textRadius = 34;

            return (
              <div
                key={i}
                className="absolute inset-0 transition-opacity duration-200 cursor-pointer"
                style={{
                  clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(startRad)}% ${50 + 50 * Math.sin(startRad)}%, ${50 + 50 * Math.cos(endRad)}% ${50 + 50 * Math.sin(endRad)}%)`,
                  background: `linear-gradient(135deg, ${segment.color}, ${segment.color}DD)`,
                  opacity: hoveredSegment === i ? 0.9 : 0.85,
                }}
                onMouseEnter={() => !spinning && setHoveredSegment(i)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
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
      </div>

      {/* Spin Button */}
      <motion.button
        onClick={handleSpin}
        disabled={spinning}
        className="relative mt-8 px-10 py-4 rounded-full font-bold text-lg text-white shadow-2xl transition-all disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden group"
        style={{ background: "linear-gradient(135deg, #8B5CF6, #EC4899)" }}
        whileHover={!spinning ? { scale: 1.05 } : {}}
        whileTap={!spinning ? { scale: 0.95 } : {}}
      >
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

      {/* Result Popup */}
      <AnimatePresence>
        {showResult && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute -bottom-16 left-1/2 -translate-x-1/2 z-30 mt-4"
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

      {/* Full Announcement Banner */}
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
              className="p-2 sm:p-4 rounded-2xl shadow-2xl text-white font-bold text-center text-xs sm:text-sm"
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

      {/* Instruction text */}
      <p className="text-xs mt-3 text-gray-500 dark:text-gray-400">
        👆 Try spinning the demo wheel!
      </p>
    </div>
  );
}
