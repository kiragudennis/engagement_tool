// app/(public)/[businessSlug]/components/TriviaSection.tsx
"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Challenge } from "@/types/challenges";

interface TriviaSectionProps {
  challenge: Challenge;
  businessSlug: string;
  brandColor?: string | null;
}

export function TriviaSection({ challenge, businessSlug, brandColor }: TriviaSectionProps) {
  const startsAt = challenge.starts_at ? new Date(challenge.starts_at) : null;
  const isLive = startsAt && startsAt.getTime() <= Date.now();
  const statusText = isLive ? "Live now" : startsAt ? `Starts ${formatDistanceToNow(startsAt, { addSuffix: true })}` : "Available";

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-blue-400" />
        <h2 className="text-xl sm:text-2xl font-bold text-white">Live Trivia</h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-white text-base sm:text-lg">
                  {challenge.name}
                </CardTitle>
                {challenge.description && (
                  <p className="text-white/40 text-xs sm:text-sm mt-1 line-clamp-2">
                    {challenge.description}
                  </p>
                )}
              </div>
              {isLive && (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  Live
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-xs sm:text-sm text-white/60">
              <Clock className="h-3.5 w-3.5" />
              {statusText}
            </span>
            <Button asChild style={{ backgroundColor: brandColor || undefined }}>
              <Link href={`/${businessSlug}/trivia/${challenge.id}`}>
                {isLive ? "Join Now" : "View Challenge"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}
