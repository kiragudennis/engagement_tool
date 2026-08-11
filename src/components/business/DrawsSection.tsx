// app/(public)/[businessSlug]/components/DrawsSection.tsx
"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, Users, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Draw } from "@/types/draws";

interface DrawsSectionProps {
  draws: Draw[];
  businessSlug: string;
  brandColor?: string | null;
}

export function DrawsSection({ draws, businessSlug, brandColor }: DrawsSectionProps) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-amber-400" />
        <h2 className="text-xl sm:text-2xl font-bold text-white">Open Draws</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {draws.map((draw, i) => {
          const endsAt = new Date(draw.entry_ends_at);
          const isEndingSoon =
            endsAt.getTime() - Date.now() < 1000 * 60 * 60 * 24 * 2;

          return (
            <motion.div
              key={draw.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-white text-base sm:text-lg">
                    {draw.prize_name}
                  </CardTitle>
                  {draw.prize_description && (
                    <p className="text-white/40 text-xs sm:text-sm mt-1 line-clamp-2">
                      {draw.prize_description}
                    </p>
                  )}
                  {draw.prize_value && (
                    <p className="text-amber-400 font-semibold text-sm mt-1">
                      Worth {draw.prize_value.toLocaleString()}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-3">
                  <div className="flex items-center gap-4 text-xs sm:text-sm text-white/60">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {draw.max_entries_total || "∞"} entries
                    </span>
                    <span
                      className={cn(
                        "flex items-center gap-1.5",
                        isEndingSoon ? "text-red-400" : "text-white/60",
                      )}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {isEndingSoon ? "Ends soon" : formatDistanceToNow(endsAt, { addSuffix: true })}
                    </span>
                  </div>

                  <Button asChild className="w-full mt-auto" variant="secondary">
                    <Link href={`/${businessSlug}/draw/${draw.id}`}>
                      View Draw <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
