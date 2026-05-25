// components/ui/compact-countdown.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompactCountdownProps {
  targetDate: Date | string;
  label?: string;
  className?: string;
}

export function CompactCountdown({
  targetDate,
  label = "until draw",
  className,
}: CompactCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        ),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        "flex items-center gap-3 bg-black/30 backdrop-blur rounded-full px-4 py-2",
        className,
      )}
    >
      <Timer className="h-5 w-5 animate-pulse" />
      <div className="flex gap-2 font-mono font-bold text-sm md:text-base">
        <div className="text-center">
          <span className="text-lg md:text-xl">
            {String(timeLeft.days).padStart(2, "0")}
          </span>
          <span className="text-xs ml-0.5">d</span>
        </div>
        <span className="text-lg md:text-xl">:</span>
        <div className="text-center">
          <span className="text-lg md:text-xl">
            {String(timeLeft.hours).padStart(2, "0")}
          </span>
          <span className="text-xs ml-0.5">h</span>
        </div>
        <span className="text-lg md:text-xl">:</span>
        <div className="text-center">
          <span className="text-lg md:text-xl">
            {String(timeLeft.minutes).padStart(2, "0")}
          </span>
          <span className="text-xs ml-0.5">m</span>
        </div>
        <span className="text-lg md:text-xl">:</span>
        <div className="text-center">
          <span className="text-lg md:text-xl text-yellow-300">
            {String(timeLeft.seconds).padStart(2, "0")}
          </span>
          <span className="text-xs ml-0.5">s</span>
        </div>
      </div>
      <span className="text-xs opacity-80 hidden sm:inline">{label}</span>
    </motion.div>
  );
}
