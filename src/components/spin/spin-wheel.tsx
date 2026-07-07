// components/spin/spin-wheel.tsx
"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface PrizeSegment {
  label: string;
  color: string;
  probability: number;
}

interface SpinWheelProps {
  mustSpin: boolean;
  prizeNumber: number;
  data: Array<{
    option: string;
    style: { backgroundColor: string };
  }>;
  spinDuration?: number;
  onStopSpinning: () => void;
  outerBorderColor?: string;
  outerBorderWidth?: number;
  innerRadius?: number;
  radiusLineColor?: string;
  radiusLineWidth?: number;
  textDistance?: number;
  fontSize?: number;
}

const SpinWheel = memo(function SpinWheel({
  mustSpin,
  prizeNumber,
  data,
  spinDuration = 5,
  onStopSpinning,
  outerBorderColor = "rgba(255,255,255,0.1)",
  outerBorderWidth = 4,
  innerRadius = 20,
  radiusLineColor = "rgba(255,255,255,0.15)",
  radiusLineWidth = 1,
  textDistance = 60,
  fontSize = 12,
}: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [pointerBounce, setPointerBounce] = useState(false);
  const segmentCount = data.length;
  const segmentAngle = 360 / segmentCount;

  // Handle spin
  useEffect(() => {
    if (!mustSpin || isSpinning) return;

    setIsSpinning(true);
    setPointerBounce(true);

    // Calculate target rotation
    // We need to land on the selected prize (prizeNumber)
    // Each segment occupies segmentAngle degrees
    // The wheel rotates clockwise, so we need to calculate the right angle
    const fullSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full rotations
    const targetSegmentAngle = prizeNumber * segmentAngle;
    const segmentMidpoint = targetSegmentAngle + segmentAngle / 2;

    // Add some randomness within the segment (so it doesn't always land dead center)
    const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.6);

    // Calculate final rotation (clockwise, so we subtract)
    const targetRotation =
      360 * fullSpins + (360 - segmentMidpoint + randomOffset);

    setRotation((prev) => prev + targetRotation);
  }, [mustSpin, prizeNumber, isSpinning, segmentAngle, segmentCount]);

  // Handle spin complete
  const handleTransitionEnd = useCallback(() => {
    if (isSpinning) {
      setIsSpinning(false);
      setPointerBounce(false);
      onStopSpinning();
    }
  }, [isSpinning, onStopSpinning]);

  // Generate segment paths
  const segments = data.map((item, index) => {
    const startAngle = (index * segmentAngle * Math.PI) / 180;
    const endAngle = ((index + 1) * segmentAngle * Math.PI) / 180;
    const midAngle = (startAngle + endAngle) / 2;

    // Calculate SVG arc path
    const radius = 50; // percentage of container
    const x1 = 50 + radius * Math.sin(startAngle);
    const y1 = 50 - radius * Math.cos(startAngle);
    const x2 = 50 + radius * Math.sin(endAngle);
    const y2 = 50 - radius * Math.cos(endAngle);

    const largeArc = segmentAngle > 180 ? 1 : 0;
    const pathData = `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    // Text position
    const textRadius = textDistance;
    const textX = 50 + textRadius * Math.sin(midAngle);
    const textY = 50 - textRadius * Math.cos(midAngle);
    const textRotation = (midAngle * 180) / Math.PI;

    return {
      pathData,
      textX,
      textY,
      textRotation,
      color: item.style.backgroundColor,
      label: item.option,
    };
  });

  // Generate outer ring dots
  const outerDots = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * 15 * Math.PI) / 180;
    const dotRadius = 47;
    const x = 50 + dotRadius * Math.sin(angle);
    const y = 50 - dotRadius * Math.cos(angle);
    return { x, y };
  });

  return (
    <div className="relative w-[320px] h-[320px] md:w-[380px] md:h-[380px] mx-auto">
      {/* Outer decorative ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: `${outerBorderWidth}px solid ${outerBorderColor}`,
          boxShadow: `0 0 30px rgba(139, 92, 246, 0.15), inset 0 0 30px rgba(0,0,0,0.2)`,
        }}
      >
        {/* Outer dots */}
        {outerDots.map((dot, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-white/20"
            style={{
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </div>

      {/* Pointer */}
      <motion.div
        className="absolute -top-3 left-1/2 -translate-x-1/2 z-20"
        animate={pointerBounce ? { y: [0, -5, 0] } : { y: 0 }}
        transition={{ duration: 0.3, repeat: pointerBounce ? Infinity : 0 }}
      >
        <svg width="32" height="40" viewBox="0 0 32 40">
          <defs>
            <filter
              id="pointer-shadow"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="3"
                floodColor="rgba(0,0,0,0.4)"
              />
            </filter>
            <linearGradient id="pointer-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
          <polygon
            points="16,40 2,0 30,0"
            fill="url(#pointer-grad)"
            filter="url(#pointer-shadow)"
          />
          <circle cx="16" cy="10" r="3" fill="rgba(255,255,255,0.5)" />
        </svg>
      </motion.div>

      {/* Wheel SVG */}
      <div className="absolute inset-[4px] rounded-full overflow-hidden">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Segments */}
          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: "50% 50%",
              transition: isSpinning
                ? `transform ${spinDuration}s cubic-bezier(0.08, 0.82, 0.17, 1.01)`
                : "none",
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {segments.map((segment, i) => (
              <g key={i}>
                {/* Segment fill */}
                <path
                  d={segment.pathData}
                  fill={segment.color}
                  stroke={radiusLineColor}
                  strokeWidth={radiusLineWidth}
                />

                {/* Segment label */}
                <text
                  x={segment.textX}
                  y={segment.textY}
                  transform={`rotate(${segment.textRotation}, ${segment.textX}, ${segment.textY})`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={fontSize / 10}
                  fontWeight="bold"
                  style={{
                    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                >
                  {/* Truncate long labels */}
                  {segment.label.length > 12
                    ? segment.label.substring(0, 10) + "…"
                    : segment.label}
                </text>
              </g>
            ))}
          </g>

          {/* Center hub - outer ring */}
          <circle
            cx="50"
            cy="50"
            r={innerRadius / 2 + 2}
            fill="rgba(255,255,255,0.15)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
          />

          {/* Center hub - inner circle */}
          <circle
            cx="50"
            cy="50"
            r={innerRadius / 2}
            fill="rgba(255,255,255,0.25)"
          />
        </svg>

        {/* Center hub overlay with sparkle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <motion.div
            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-white to-gray-200 dark:from-gray-300 dark:to-gray-500 flex items-center justify-center shadow-lg"
            animate={isSpinning ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={{ duration: 0.5, repeat: isSpinning ? Infinity : 0 }}
          >
            <motion.div
              className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
              animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
              transition={{
                duration: 2,
                repeat: isSpinning ? Infinity : 0,
                ease: "linear",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  d="M12 2L15 9H22L17 14L19 21L12 17L5 21L7 14L2 9H9L12 2Z"
                  fill="white"
                />
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Glow effect during spin */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        animate={
          isSpinning
            ? {
                boxShadow: [
                  "0 0 40px rgba(139, 92, 246, 0.2), 0 0 80px rgba(236, 72, 153, 0.1)",
                  "0 0 60px rgba(236, 72, 153, 0.3), 0 0 120px rgba(139, 92, 246, 0.15)",
                  "0 0 40px rgba(139, 92, 246, 0.2), 0 0 80px rgba(236, 72, 153, 0.1)",
                ],
              }
            : {
                boxShadow: "0 0 20px rgba(139, 92, 246, 0.1)",
              }
        }
        transition={{ duration: 1, repeat: isSpinning ? Infinity : 0 }}
      />
    </div>
  );
});

export default SpinWheel;
