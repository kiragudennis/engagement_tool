// app/(public)/[businessSlug]/components/GamesSection.tsx
"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw, Gift, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { SpinGame } from "@/types/spinning-wheel";

interface GamesSectionProps {
  games: SpinGame[];
  businessSlug: string;
  brandColor?: string | null;
}

export function GamesSection({ games, businessSlug, brandColor }: GamesSectionProps) {
  const router = useRouter();

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <RotateCcw className="h-5 w-5 text-yellow-400" />
        <h2 className="text-xl sm:text-2xl font-bold text-white">Active Games</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors h-full flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-white text-base sm:text-lg leading-tight">
                    {game.name}
                  </CardTitle>
                  {game.is_single_prize && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-0 flex-shrink-0">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Grand Prize
                    </Badge>
                  )}
                </div>
                {game.description && (
                  <p className="text-white/40 text-xs sm:text-sm mt-1 line-clamp-2">
                    {game.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-white/60">
                  <span className="flex items-center gap-1.5">
                    <Gift className="h-3.5 w-3.5" />
                    {game.prize_config.length} prizes
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    {game.free_spins_per_day}/day free
                  </span>
                </div>

                {game.participant_limit && (
                  <span className="flex items-center gap-1.5 text-xs text-white/40">
                    <Users className="h-3.5 w-3.5" />
                    Up to {game.participant_limit} players
                  </span>
                )}

                <Button
                  asChild
                  className="w-full mt-auto"
                  style={{
                    backgroundColor: brandColor || undefined,
                  }}
                >
                  <a href={`/${businessSlug}/spin/${game.id}`}>Play Now</a>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
