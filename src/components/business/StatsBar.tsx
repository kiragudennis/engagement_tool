// app/(public)/[businessSlug]/components/StatsBar.tsx
"use client";

import { motion } from "framer-motion";
import { Activity, RotateCcw, Brain, Trophy, Gift } from "lucide-react";

interface StatsBarProps {
  engagements: number;
  spins: number;
  trivia: number;
  draws: number;
  prizes: number;
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return num.toString();
}

const stats = [
  { label: "Engaged", value: 0, icon: Activity, color: "text-purple-400" },
  { label: "Spins", value: 0, icon: RotateCcw, color: "text-yellow-400" },
  { label: "Trivia", value: 0, icon: Brain, color: "text-blue-400" },
  { label: "Draws", value: 0, icon: Trophy, color: "text-green-400" },
  { label: "Prizes", value: 0, icon: Gift, color: "text-pink-400" },
];

export function StatsBar({ engagements, spins, trivia, draws, prizes }: StatsBarProps) {
  const values = [engagements, spins, trivia, draws, prizes];

  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-4 mb-10">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 text-center"
        >
          <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 sm:mb-2 ${stat.color}`} />
          <div className="text-lg sm:text-2xl font-bold text-white">
            {formatNumber(values[i])}
          </div>
          <div className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
