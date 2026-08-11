// app/(public)/[businessSlug]/components/ResultsSection.tsx
"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Gift, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Winner {
  id: string;
  name: string;
  prize: string;
  type: "spin" | "draw";
}

interface ResultsSectionProps {
  winners: Winner[];
  businessSlug: string;
}

export function ResultsSection({ winners, businessSlug }: ResultsSectionProps) {
  if (winners.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-yellow-400" />
        <h2 className="text-xl sm:text-2xl font-bold text-white">Recent Results</h2>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {winners.slice(0, 6).map((winner, i) => (
              <motion.div
                key={winner.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <Gift className="h-4 w-4 text-yellow-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {winner.name}
                    </p>
                    <p className="text-white/40 text-xs truncate">
                      {winner.type === "spin" ? "Spin Win" : "Draw Winner"}
                    </p>
                  </div>
                </div>
                <span className="text-amber-400 text-xs sm:text-sm font-medium truncate ml-2">
                  {winner.prize}
                </span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
