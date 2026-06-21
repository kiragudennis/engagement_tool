// app/(public)/[businessSlug]/trivia/[challengeId]/live/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  Users,
  Brain,
  Clock,
  Zap,
  Maximize2,
  Minimize2,
  Radio,
  TrendingUp,
  CheckCircle,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────
interface QueueParticipant {
  ticket_number: number;
  user_name: string;
  total_score: number;
  questions_answered: number;
  correct_answers: number;
  current_status: string;
}

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  total_score: number;
  questions_answered: number;
  correct_answers: number;
  accuracy: number;
  current_streak: number;
  best_streak: number;
  current_rank: number;
}

// ─── Main Component ─────────────────────────────────────
export default function TriviaLivePage() {
  const { businessSlug, challengeId } = useParams<{
    businessSlug: string;
    challengeId: string;
  }>();
  const { supabase } = useAuth();

  // Business & Challenge
  const [business, setBusiness] = useState<any>(null);
  const [challenge, setChallenge] = useState<any>(null);
  const [allChallenges, setAllChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Trivia state
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [currentAnswerer, setCurrentAnswerer] = useState<any>(null);
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [playerAnswer, setPlayerAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [phase, setPhase] = useState<string>("waiting");

  const [participants, setParticipants] = useState<QueueParticipant[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeViewers, setActiveViewers] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  // UI
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ─── Load Data ────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      // Business
      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name, slug, brand_color, brand_secondary_color")
        .eq("slug", businessSlug)
        .single();
      if (!biz) return;
      setBusiness(biz);

      // All trivia challenges (for selector)
      const { data: challenges } = await supabase
        .from("challenges")
        .select("id, name")
        .eq("business_id", biz.id)
        .eq("challenge_type", "trivia")
        .eq("status", "active");
      setAllChallenges(challenges || []);

      // Specific challenge
      const { data: ch } = await supabase
        .from("challenges")
        .select("*")
        .eq("id", challengeId)
        .single();
      setChallenge(ch);

      // Queue, leaderboard, points
      const [{ data: queue }, { data: lb }, { data: points }] =
        await Promise.all([
          supabase.rpc("get_trivia_queue_status", {
            p_challenge_id: challengeId,
          }),
          supabase.rpc("get_trivia_leaderboard", {
            p_challenge_id: challengeId,
            p_limit: 20,
          }),
          supabase
            .from("challenge_actions")
            .select("points_awarded")
            .eq("challenge_id", challengeId),
        ]);

      setParticipants(queue || []);
      setLeaderboard(lb || []);
      setTotalPoints(
        points?.reduce((s, a) => s + (a.points_awarded || 0), 0) || 0,
      );
      setLoading(false);
    };
    load();
  }, [businessSlug, challengeId, supabase]);

  // ─── Real-time Channel ────────────────────────────────
  useEffect(() => {
    if (!challengeId) return;

    const ch = supabase.channel(`trivia-live-${challengeId}`);

    // Trivia selections → question broadcast
    ch.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "challenge_trivia_selections",
        filter: `challenge_id=eq.${challengeId}`,
      },
      async (payload) => {
        if (payload.eventType === "INSERT") {
          // New player selected
          setCurrentAnswerer(payload.new);
          setPhase("question");
          setRevealAnswer(false);
          setPlayerAnswer(null);

          const { data: q } = await supabase
            .from("challenge_trivia_questions")
            .select("*")
            .eq("id", payload.new.question_id)
            .single();
          setCurrentQuestion(q);
          setTimeLeft(q?.time_limit_seconds || 5);

          // Refresh queue
          const { data: queue } = await supabase.rpc(
            "get_trivia_queue_status",
            { p_challenge_id: challengeId },
          );
          if (queue) setParticipants(queue);
        } else if (payload.eventType === "UPDATE") {
          setCurrentAnswerer(payload.new);
          if (payload.new.selected_answer !== null)
            setPlayerAnswer(payload.new.selected_answer);

          if (
            payload.new.status === "answered" ||
            payload.new.status === "timeout"
          ) {
            // Auto-reveal after 3 seconds
            setTimeout(async () => {
              setRevealAnswer(true);
              const [{ data: lb }, { data: queue }] = await Promise.all([
                supabase.rpc("get_trivia_leaderboard", {
                  p_challenge_id: challengeId,
                  p_limit: 20,
                }),
                supabase.rpc("get_trivia_queue_status", {
                  p_challenge_id: challengeId,
                }),
              ]);
              if (lb) setLeaderboard(lb);
              if (queue) setParticipants(queue);
            }, 3000);
          }
        }
      },
    );

    // Live ticker → refresh points
    ch.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "challenge_live_ticker",
        filter: `challenge_id=eq.${challengeId}`,
      },
      async () => {
        const { data } = await supabase
          .from("challenge_actions")
          .select("points_awarded")
          .eq("challenge_id", challengeId);
        setTotalPoints(
          data?.reduce((s, a) => s + (a.points_awarded || 0), 0) || 0,
        );
      },
    );

    // Presence
    ch.on("presence", { event: "sync" }, () => {
      setActiveViewers(Object.keys(ch.presenceState()).length);
    });

    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({
          user_id: "viewer",
          online_at: new Date().toISOString(),
        });
      }
    });

    channelRef.current = ch;

    // Countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      ch.unsubscribe();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [challengeId, supabase]);

  // ─── Fullscreen ───────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!isFullscreen) containerRef.current.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, [isFullscreen]);

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // ─── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <Skeleton className="h-96 w-full max-w-4xl rounded-xl" />
      </div>
    );
  }

  const brandColor = business?.brand_color || "#8B5CF6";

  // ─── Render ───────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950"
    >
      {/* OBS metadata */}
      <div className="hidden obs-metadata">
        <div data-title={challenge?.name || ""} />
        <div data-participants={participants.length} />
        <div data-points={totalPoints} />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-20 border-b backdrop-blur-sm bg-purple-950/80 border-purple-500/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: brandColor }}
              >
                {business?.name?.[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400 font-mono">
                    LIVE BROADCAST
                  </span>
                </div>
                <h1 className="text-lg font-bold text-white">
                  {business?.name} Trivia
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Game selector for multiple trivias */}
              {allChallenges.length > 1 && (
                <div className="relative group">
                  <button
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-white hover:bg-white/10"
                    style={{ backgroundColor: `${brandColor}20` }}
                  >
                    <Brain className="h-3.5 w-3.5" />
                    <span>{challenge?.name || "Trivia"}</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <div className="absolute top-full mt-1 right-0 w-56 rounded-lg bg-gray-900 border border-white/10 shadow-xl overflow-hidden hidden group-hover:block z-50">
                    {allChallenges.map((ch: any) => (
                      <Link
                        key={ch.id}
                        href={`/${businessSlug}/trivia/${ch.id}/live`}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/10",
                          ch.id === challengeId
                            ? "text-white bg-white/10"
                            : "text-white/60",
                        )}
                      >
                        <Brain className="h-3.5 w-3.5" />
                        {ch.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 hover:bg-purple-500/30"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3 w-3 text-purple-400" />
                ) : (
                  <Maximize2 className="h-3 w-3 text-purple-400" />
                )}
                <span className="text-xs text-purple-300 hidden sm:inline">
                  {isFullscreen ? "Exit" : "OBS"}
                </span>
              </button>

              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20">
                <Users className="h-3 w-3 text-purple-400" />
                <span className="text-sm text-white">{activeViewers}</span>
              </div>

              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20">
                <TrendingUp className="h-3 w-3 text-green-400" />
                <span className="text-sm text-white">
                  {totalPoints.toLocaleString()}
                </span>
                <span className="text-xs text-purple-300">pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT: Contestants */}
          <Card className="bg-black/50 backdrop-blur border-white/10 h-full">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" style={{ color: brandColor }} />
                Contestants ({participants.length})
              </h3>
            </div>
            <div className="p-3">
              <div className="flex flex-wrap gap-2">
                {participants.map((p) => (
                  <div
                    key={p.ticket_number}
                    className={cn(
                      "px-3 py-2 rounded-lg text-center transition-all min-w-[80px]",
                      p.current_status === "answering"
                        ? "bg-yellow-500/20 border-2 border-yellow-500 scale-110 animate-pulse shadow-lg shadow-yellow-500/20"
                        : p.current_status === "eliminated"
                          ? "bg-red-500/10 opacity-40"
                          : "bg-white/5",
                    )}
                  >
                    <p className="text-lg font-bold text-white">
                      #{p.ticket_number}
                    </p>
                    <p className="text-sm text-white/80 truncate">
                      {p.user_name}
                    </p>
                    <p className="text-xs text-yellow-400">
                      {p.total_score} pts
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* CENTER: Question */}
          <div className="space-y-4">
            {currentQuestion ? (
              <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 backdrop-blur border-yellow-500/30">
                <CardContent className="p-6">
                  {/* Timer */}
                  {timeLeft > 0 && phase === "question" && (
                    <div className="text-center mb-6">
                      <Clock
                        className={cn(
                          "h-8 w-8 mx-auto mb-2",
                          timeLeft <= 2
                            ? "text-red-500 animate-pulse"
                            : "text-yellow-400",
                        )}
                      />
                      <span
                        className={cn(
                          "text-5xl font-bold font-mono",
                          timeLeft <= 2
                            ? "text-red-500 animate-pulse"
                            : "text-yellow-400",
                        )}
                      >
                        {timeLeft}
                      </span>
                    </div>
                  )}

                  <h2 className="text-2xl font-bold text-white text-center mb-6">
                    {currentQuestion.question}
                  </h2>

                  {/* Options */}
                  {currentQuestion.options && (
                    <div className="grid grid-cols-2 gap-3">
                      {currentQuestion.options.map((opt: string, i: number) => (
                        <div
                          key={i}
                          className={cn(
                            "p-4 rounded-xl border-2 text-center transition-all duration-500",
                            revealAnswer &&
                              i === currentQuestion.correct_answer_index
                              ? "border-green-500 bg-green-500/20 scale-105"
                              : revealAnswer &&
                                  i === playerAnswer &&
                                  i !== currentQuestion.correct_answer_index
                                ? "border-red-500 bg-red-500/20"
                                : "border-white/10 bg-white/5",
                          )}
                        >
                          <span className="text-xl font-bold text-white/80">
                            {String.fromCharCode(65 + i)}.
                          </span>
                          <span className="text-xl text-white ml-3">{opt}</span>
                          {revealAnswer &&
                            i === currentQuestion.correct_answer_index && (
                              <CheckCircle className="h-6 w-6 text-green-500 inline ml-2" />
                            )}
                          {revealAnswer &&
                            i === playerAnswer &&
                            i !== currentQuestion.correct_answer_index && (
                              <XCircle className="h-6 w-6 text-red-500 inline ml-2" />
                            )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Answerer */}
                  {currentAnswerer && (
                    <div className="mt-6 text-center">
                      {phase === "question" && (
                        <p className="text-xl text-purple-300">
                          <span className="font-bold text-white text-2xl">
                            {currentAnswerer.user_name}
                          </span>
                          <span className="ml-2">is answering...</span>
                        </p>
                      )}
                      {revealAnswer &&
                        currentAnswerer.is_correct !== undefined && (
                          <div className="flex items-center justify-center gap-3">
                            {currentAnswerer.is_correct ? (
                              <>
                                <CheckCircle className="h-8 w-8 text-green-500" />
                                <span className="text-2xl font-bold text-green-400">
                                  CORRECT! +{currentAnswerer.points_earned} pts
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-8 w-8 text-red-500" />
                                <span className="text-2xl font-bold text-red-400">
                                  WRONG!
                                </span>
                              </>
                            )}
                          </div>
                        )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-black/50 backdrop-blur border-white/10">
                <CardContent className="p-12 text-center">
                  <Brain className="h-20 w-20 text-yellow-500 mx-auto mb-4 animate-pulse" />
                  <h2 className="text-2xl font-bold text-white">
                    Trivia Live!
                  </h2>
                  <p className="text-yellow-300 mt-2">
                    Waiting for the host to begin...
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT: Leaderboard */}
          <Card className="bg-black/50 backdrop-blur border-white/10">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-400" />
                Standings
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-3 text-sm font-medium text-yellow-300">
                      Rank
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-yellow-300">
                      Player
                    </th>
                    <th className="text-center p-3 text-sm font-medium text-yellow-300">
                      Score
                    </th>
                    <th className="text-center p-3 text-sm font-medium text-yellow-300">
                      Correct
                    </th>
                    <th className="text-center p-3 text-sm font-medium text-yellow-300">
                      Accuracy
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, idx) => (
                    <tr
                      key={entry.user_id}
                      className={cn(
                        "border-b border-white/5 hover:bg-white/5 transition-colors",
                        idx === 0 && "bg-yellow-500/5",
                      )}
                    >
                      <td className="p-3">
                        <span className="text-lg">
                          {idx === 0
                            ? "🥇"
                            : idx === 1
                              ? "🥈"
                              : idx === 2
                                ? "🥉"
                                : `#${idx + 1}`}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-white font-medium">
                          {entry.full_name}
                        </span>
                        {entry.current_streak >= 3 && (
                          <span className="ml-2 text-orange-400 text-xs">
                            {entry.current_streak}🔥
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-white font-bold">
                          {entry.total_score}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-green-400">
                          {entry.correct_answers}
                        </span>
                        <span className="text-white/40 text-xs">
                          /{entry.questions_answered}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          className={cn(
                            "text-xs",
                            entry.accuracy >= 80
                              ? "bg-green-500/20 text-green-400"
                              : entry.accuracy >= 50
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400",
                          )}
                        >
                          {entry.accuracy}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {leaderboard.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-purple-300"
                      >
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Waiting for players...</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Prize Tiers */}
        {challenge?.prize_tiers?.length > 0 && (
          <div className="mt-6">
            <Card className="bg-black/50 backdrop-blur border-white/10">
              <div className="p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  Prize Tiers
                </h3>
                <div className="flex flex-wrap gap-3">
                  {challenge.prize_tiers.map((tier: any, idx: number) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-sm py-1.5 px-3"
                    >
                      {tier.rank === 1 && "🥇"} {tier.rank === 2 && "🥈"}{" "}
                      {tier.rank === 3 && "🥉"}
                      Rank {tier.rank}:{" "}
                      {tier.prize_type === "points"
                        ? `${tier.prize_value} pts`
                        : tier.prize_value}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* CTA */}
        <div className="mt-6">
          <Card
            className="border-0"
            style={{
              background: `linear-gradient(135deg, ${brandColor}, ${business?.brand_secondary_color})`,
            }}
          >
            <div className="p-4 text-center">
              <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-white">Want to play?</h3>
              <button
                onClick={() =>
                  window.open(
                    `/${businessSlug}/trivia/${challengeId}`,
                    "_blank",
                  )
                }
                className="mt-2 bg-white text-purple-600 hover:bg-purple-100 font-semibold py-2 px-6 rounded-lg transition-all"
              >
                Join Trivia →
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
