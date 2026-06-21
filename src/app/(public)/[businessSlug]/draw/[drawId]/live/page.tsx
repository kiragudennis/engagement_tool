// app/(public)/[businessSlug]/draw/[drawId]/live/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Gift,
  Ticket,
  Users,
  Trophy,
  PartyPopper,
  Loader2,
  Radio,
  Clock,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
  Crown,
  Heart,
  Store,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────
interface TickerEntry {
  id: string;
  user_name: string;
  entry_count: number;
  created_at: string;
}

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  entry_count: number;
}

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  brand_color: string;
  brand_secondary_color: string;
}

type DrawPhase = "entry_collection" | "entries_locked" | "winner_reveal";

// ─── Main Component ─────────────────────────────────────
export default function BusinessDrawLivePage() {
  const { businessSlug, drawId } = useParams<{
    businessSlug: string;
    drawId: string;
  }>();
  const { supabase } = useAuth();

  // Business & Draw
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [draw, setDraw] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Phase
  const [phase, setPhase] = useState<DrawPhase>("entry_collection");

  // Stats
  const [ticker, setTicker] = useState<TickerEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [entryCountdown, setEntryCountdown] = useState("");
  const [drawCountdown, setDrawCountdown] = useState("");
  const [countdownProgress, setCountdownProgress] = useState(100);

  // Drawing
  const [drawing, setDrawing] = useState(false);
  const [shufflingNames, setShufflingNames] = useState(false);
  const [winners, setWinners] = useState<any[]>([]);
  const [finalWinner, setFinalWinner] = useState<any>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastEntry, setLastEntry] = useState<TickerEntry | null>(null);

  // UI
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [activeViewers, setActiveViewers] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const winnerAudioRef = useRef<HTMLAudioElement | null>(null);
  const channelRef = useRef<any>(null);

  // ─── Load All Data ────────────────────────────────────
  const loadAllData = useCallback(async () => {
    if (!businessSlug || !drawId) return;

    // Business
    const { data: biz } = await supabase
      .from("businesses")
      .select("id, name, slug, brand_color, brand_secondary_color")
      .eq("slug", businessSlug)
      .single();
    if (!biz) return;
    setBusiness(biz);

    // Draw
    const { data: drawData } = await supabase
      .from("draws")
      .select("*")
      .eq("id", drawId)
      .eq("business_id", biz.id)
      .single();
    if (!drawData) {
      setLoading(false);
      return;
    }
    setDraw(drawData);

    // Stats
    const [
      { data: entries },
      { data: participants },
      { data: lb },
      { data: tickerData },
    ] = await Promise.all([
      supabase.from("draw_entries").select("entry_count").eq("draw_id", drawId),
      supabase.from("draw_entries").select("user_id").eq("draw_id", drawId),
      supabase
        .from("draw_entries")
        .select("user_id, entry_count, users!user_id(full_name)")
        .eq("draw_id", drawId)
        .order("entry_count", { ascending: false })
        .limit(10),
      supabase
        .from("draw_live_ticker")
        .select("*")
        .eq("draw_id", drawId)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    setTotalEntries(entries?.reduce((s, e) => s + e.entry_count, 0) || 0);
    setTotalParticipants(new Set(participants?.map((p) => p.user_id)).size);
    setLeaderboard(
      lb?.map((e: any) => ({
        user_id: e.user_id,
        full_name: e.users?.full_name || "Anonymous",
        entry_count: e.entry_count,
      })) || [],
    );
    setTicker(tickerData || []);

    // Determine phase
    if (drawData.status === "completed" && drawData.winner_id) {
      setPhase("winner_reveal");
      setShowCelebration(true);
      const { data: winnerData } = await supabase
        .from("draw_winners")
        .select("*, users!user_id(full_name)")
        .eq("draw_id", drawId)
        .eq("winner_rank", 1)
        .single();
      setFinalWinner(winnerData);
      setWinners([winnerData]);
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
      setTimeout(() => setShowCelebration(false), 5000);
    } else if (drawData.status === "closed" || drawData.status === "drawing") {
      setPhase("entries_locked");
    } else {
      setPhase("entry_collection");
    }

    setLoading(false);
  }, [businessSlug, drawId, supabase]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ─── Countdown Updates ────────────────────────────────
  useEffect(() => {
    if (!draw) return;
    const interval = setInterval(() => {
      // Entry countdown
      if (draw.entry_ends_at && new Date(draw.entry_ends_at) > new Date()) {
        const end = new Date(draw.entry_ends_at);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        const totalDuration =
          new Date(draw.entry_ends_at).getTime() -
          new Date(draw.entry_starts_at).getTime();
        setCountdownProgress(
          Math.max(0, Math.min(100, (diff / totalDuration) * 100)),
        );
        setEntryCountdown(formatDistanceToNowStrict(end, { addSuffix: true }));
      } else {
        setEntryCountdown("Entries Closed!");
      }

      // Draw countdown
      if (
        phase === "entries_locked" &&
        draw.draw_time &&
        new Date(draw.draw_time) > new Date()
      ) {
        setDrawCountdown(
          `Draw in ${formatDistanceToNowStrict(new Date(draw.draw_time), { addSuffix: true })}`,
        );
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [draw, phase]);

  // ─── Real-time Channel ────────────────────────────────
  useEffect(() => {
    if (!drawId) return;

    const ch = supabase.channel(`draw-live-${drawId}`);

    // New entries
    ch.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "draw_entries",
        filter: `draw_id=eq.${drawId}`,
      },
      async (payload) => {
        const newEntry = payload.new;
        const { data: user } = await supabase
          .from("users")
          .select("full_name")
          .eq("id", newEntry.user_id)
          .single();

        // Update ticker
        const tickerEntry: TickerEntry = {
          id: newEntry.id,
          user_name: user?.full_name || "Customer",
          entry_count: newEntry.entry_count,
          created_at: newEntry.created_at,
        };
        setTicker((prev) => [tickerEntry, ...prev.slice(0, 29)]);

        // Update counts
        setTotalEntries((prev) => prev + newEntry.entry_count);

        // Update leaderboard
        setLeaderboard((prev) => {
          const existing = prev.findIndex(
            (l) => l.user_id === newEntry.user_id,
          );
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing].entry_count += newEntry.entry_count;
            return updated.sort((a, b) => b.entry_count - a.entry_count);
          }
          const newLb = [
            ...prev,
            {
              user_id: newEntry.user_id,
              full_name: user?.full_name || "Anonymous",
              entry_count: newEntry.entry_count,
            },
          ].sort((a, b) => b.entry_count - a.entry_count);
          return newLb.slice(0, 10);
        });

        // Refresh participants periodically
        const { data: participants } = await supabase
          .from("draw_entries")
          .select("user_id")
          .eq("draw_id", drawId);
        setTotalParticipants(new Set(participants?.map((p) => p.user_id)).size);

        // Floating alert
        setLastEntry(tickerEntry);
        setTimeout(() => setLastEntry(null), 3000);

        if (isSoundEnabled && audioRef.current)
          audioRef.current.play().catch(() => {});
      },
    );

    // Draw status changes
    ch.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "draws",
        filter: `id=eq.${drawId}`,
      },
      (payload) => {
        setDraw((prev: any) =>
          prev ? { ...prev, ...payload.new } : payload.new,
        );

        if (
          payload.new.status === "completed" &&
          payload.old.status !== "completed"
        ) {
          // Load winners
          supabase
            .from("draw_winners")
            .select("*, users!user_id(full_name)")
            .eq("draw_id", drawId)
            .eq("winner_rank", 1)
            .single()
            .then(({ data }) => {
              if (data) {
                setFinalWinner(data);
                setWinners([data]);
                setPhase("winner_reveal");
                setShowCelebration(true);
                if (winnerAudioRef.current)
                  winnerAudioRef.current.play().catch(() => {});
                confetti({
                  particleCount: 200,
                  spread: 100,
                  origin: { y: 0.6 },
                });
                setTimeout(() => setShowCelebration(false), 8000);
              }
            });
        }
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
    return () => {
      ch.unsubscribe();
    };
  }, [drawId, supabase, isSoundEnabled]);

  // ─── Start Draw (Host Trigger) ────────────────────────
  const startDraw = async () => {
    setDrawing(true);
    setPhase("entries_locked");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setShufflingNames(true);

    // Shuffle animation
    const shuffleInterval = setInterval(() => {
      const randomNames = leaderboard.map((l) => l.full_name);
      setFinalWinner({
        users: {
          full_name:
            randomNames[Math.floor(Math.random() * randomNames.length)] ||
            "???",
        },
      });
    }, 100);

    await new Promise((resolve) => setTimeout(resolve, 3500));
    clearInterval(shuffleInterval);

    try {
      // Perform the actual draw via RPC
      const { data: result, error } = await supabase.rpc("perform_draw", {
        p_draw_id: drawId,
      });
      if (error) throw error;

      const { data: winnerData } = await supabase
        .from("draw_winners")
        .select("*, users!user_id(full_name)")
        .eq("draw_id", drawId)
        .eq("winner_rank", 1)
        .single();

      setFinalWinner(winnerData);
      setWinners(winnerData ? [winnerData] : []);
      setShufflingNames(false);
      setPhase("winner_reveal");
      setShowCelebration(true);

      if (isSoundEnabled && winnerAudioRef.current)
        winnerAudioRef.current.play().catch(() => {});
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
      setTimeout(() => setShowCelebration(false), 8000);
    } catch (error) {
      console.error("Draw failed:", error);
    } finally {
      setDrawing(false);
    }
  };

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
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!business || !draw) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <Card className="bg-black/50 border-white/10 max-w-md">
          <CardContent className="p-8 text-center">
            <Store className="h-16 w-16 text-white/20 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white">Draw Not Found</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  const brandColor = business.brand_color || "#8B5CF6";
  const isEntryPhase = phase === "entry_collection";
  const isLockedPhase = phase === "entries_locked";
  const isWinnerPhase = phase === "winner_reveal";

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 overflow-hidden relative"
    >
      {/* Audio */}
      <audio ref={audioRef} src="/sounds/entry-chime.mp3" preload="auto" />
      <audio
        ref={winnerAudioRef}
        src="/sounds/winner-fanfare.mp3"
        preload="auto"
      />

      {/* OBS Metadata */}
      <div className="hidden obs-metadata">
        <div data-title={draw.name} />
        <div data-prize={draw.prize_name} />
        <div data-entries={totalEntries} />
        <div data-participants={totalParticipants} />
        <div data-phase={phase} />
      </div>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
              >
                <PartyPopper className="h-24 w-24 text-yellow-500 mx-auto" />
                <p className="text-4xl font-bold text-white mt-4">WINNER!</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div
        className="py-4 px-6 text-white"
        style={{
          background: `linear-gradient(135deg, ${brandColor}, ${business.brand_secondary_color})`,
        }}
      >
        <div className="container mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href={`/${businessSlug}/draw/${drawId}`}
                className="text-white/60 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: `${brandColor}40` }}
              >
                {business.name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Radio className="h-4 w-4 animate-pulse" />
                  <span className="text-xs font-mono tracking-wider">
                    LIVE BROADCAST
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold">{draw.name}</h1>
                <p className="text-white/70 text-sm">
                  {business.name} • Prize: {draw.prize_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-black/20 hover:bg-black/40"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className="p-2 rounded-full bg-black/20 hover:bg-black/40"
              >
                {isSoundEnabled ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
              </button>
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/20">
                <Users className="h-3 w-3" />
                <span className="text-sm">{activeViewers}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Indicator */}
      <div className="bg-black/50 backdrop-blur border-b border-white/10 py-2 px-6">
        <div className="container mx-auto">
          <div className="flex justify-center gap-8">
            {[
              {
                phase: "entry_collection",
                label: "Entry Collection",
                color: "text-green-400",
                bg: "bg-green-400",
              },
              {
                phase: "entries_locked",
                label: "Entries Locked",
                color: "text-yellow-400",
                bg: "bg-yellow-400",
              },
              {
                phase: "winner_reveal",
                label: "Winner Reveal",
                color: "text-purple-400",
                bg: "bg-purple-400",
              },
            ].map((p) => {
              const isActive =
                phase === p.phase ||
                (p.phase === "entry_collection" && isEntryPhase) ||
                (p.phase === "entries_locked" && isLockedPhase) ||
                (p.phase === "winner_reveal" && isWinnerPhase);
              return (
                <div
                  key={p.phase}
                  className={cn(
                    "flex items-center gap-2",
                    isActive ? p.color : "text-white/40",
                  )}
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      isActive ? `${p.bg} animate-pulse` : "bg-white/40",
                    )}
                  />
                  <span className="text-sm">{p.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-black/40 backdrop-blur border-b border-white/10 py-3 px-6">
        <div className="container mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex gap-6">
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <Ticket className="h-4 w-4" />
              <span className="font-mono">{totalEntries.toLocaleString()}</span>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <Users className="h-4 w-4" />
              <span className="font-mono">
                {totalParticipants.toLocaleString()}
              </span>
              <span>players</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Clock className="h-4 w-4" />
            <span>{isEntryPhase ? entryCountdown : drawCountdown}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* PHASE 1: Entry Collection */}
        {isEntryPhase && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Prize Display */}
            <div className="lg:col-span-2">
              <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur border-purple-500/30">
                <CardContent className="p-8 text-center">
                  <motion.div
                    animate={{ scale: [0.95, 1.05, 0.95] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="w-40 h-40 mx-auto mb-4 rounded-full flex items-center justify-center border-4 border-yellow-500/50"
                    style={{
                      background: `radial-gradient(circle, ${brandColor}20, transparent)`,
                    }}
                  >
                    <Gift className="h-20 w-20 text-yellow-400" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-white">
                    {draw.prize_name}
                  </h2>
                  {draw.prize_description && (
                    <p className="text-purple-300 mt-2">
                      {draw.prize_description}
                    </p>
                  )}
                  {draw.prize_value > 0 && (
                    <Badge className="mt-3 text-lg px-4 py-1.5 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      KES {draw.prize_value.toLocaleString()}
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Entry Progress */}
              {draw.max_entries_total && (
                <Card className="bg-black/30 backdrop-blur mt-4">
                  <CardContent className="p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-purple-300">Entry Pool</span>
                      <span className="text-white">
                        {totalEntries.toLocaleString()} /{" "}
                        {draw.max_entries_total.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={(totalEntries / draw.max_entries_total) * 100}
                      className="h-3"
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Leaderboard & Ticker */}
            <div className="space-y-4">
              {leaderboard.length > 0 && (
                <Card className="bg-black/50 backdrop-blur">
                  <CardContent className="p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-400" />
                      Top Entrants
                    </h3>
                    <div className="space-y-2">
                      {leaderboard.slice(0, 8).map((entry, i) => (
                        <div
                          key={entry.user_id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span>
                              {i === 0
                                ? "🥇"
                                : i === 1
                                  ? "🥈"
                                  : i === 2
                                    ? "🥉"
                                    : `#${i + 1}`}
                            </span>
                            <span className="text-white truncate max-w-[120px]">
                              {entry.full_name}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {entry.entry_count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* PHASE 2: Entries Locked */}
        {isLockedPhase && !finalWinner && (
          <div className="flex items-center justify-center min-h-[500px]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center max-w-2xl"
            >
              <Card
                className={cn(
                  "bg-gradient-to-r from-purple-900/80 to-pink-900/80 border-purple-500/50",
                  drawing && "animate-pulse",
                )}
              >
                <CardContent className="py-12">
                  {drawing ? (
                    <>
                      <Loader2 className="h-20 w-20 text-purple-400 mx-auto mb-4 animate-spin" />
                      <p className="text-3xl font-bold text-purple-400">
                        Drawing in progress...
                      </p>
                      <p className="text-slate-400 mt-3">
                        Selecting from {totalEntries.toLocaleString()} entries
                      </p>
                      <div className="mt-6 flex justify-center gap-2">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                            style={{ animationDelay: `${i * 0.2}s` }}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-7xl mb-4">⏰</div>
                      <p className="text-2xl font-bold text-white">
                        Entries are closed!
                      </p>
                      <p className="text-purple-300 mt-2">
                        {totalEntries.toLocaleString()} entries •{" "}
                        {totalParticipants.toLocaleString()} participants
                      </p>
                      <Button
                        className="mt-8 text-lg px-8 py-6"
                        style={{
                          background: `linear-gradient(135deg, ${brandColor}, ${business.brand_secondary_color})`,
                        }}
                        onClick={startDraw}
                      >
                        <Trophy className="h-5 w-5 mr-2" /> START DRAW
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* PHASE 3: Winner Reveal */}
        {isWinnerPhase && finalWinner && (
          <div className="space-y-6">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.4 }}
            >
              <Card
                className={cn(
                  "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 text-center overflow-hidden",
                  shufflingNames && "animate-shake",
                )}
              >
                <CardContent className="py-12">
                  {shufflingNames ? (
                    <>
                      <div className="text-5xl font-mono text-white mb-4 tracking-wider animate-pulse">
                        {finalWinner.users?.full_name || "???"}
                      </div>
                      <p className="text-yellow-400 mt-4">
                        Selecting winner...
                      </p>
                    </>
                  ) : (
                    <>
                      <PartyPopper className="h-20 w-20 text-yellow-500 mx-auto mb-4" />
                      <Badge className="bg-yellow-500 text-black mb-4 text-lg px-4 py-1">
                        🏆 GRAND PRIZE WINNER 🏆
                      </Badge>
                      <p className="text-5xl font-bold text-white mt-4">
                        {finalWinner.users?.full_name}
                      </p>
                      <p className="text-xl text-purple-300 mt-2">
                        Winner of {draw.prize_name}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Consolation */}
            {draw.consolation_points_amount > 0 && (
              <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
                <CardContent className="p-4 text-center">
                  <Heart className="h-5 w-5 text-pink-400 mx-auto mb-1" />
                  <p className="text-sm text-purple-300">
                    🎁 All participants received{" "}
                    {draw.consolation_points_amount} loyalty points!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Scrolling Ticker */}
      {isEntryPhase && ticker.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur border-t border-purple-500/30 py-2 overflow-hidden">
          <div className="whitespace-nowrap animate-marquee">
            {ticker.slice(0, 20).map((entry, idx) => (
              <span key={idx} className="inline-block mx-4 text-sm text-white">
                🎉 {entry.user_name} entered the draw - +{entry.entry_count}{" "}
                entries!
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Floating Entry Alert */}
      {lastEntry && isEntryPhase && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          className="fixed bottom-20 right-4 z-50"
        >
          <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50">
            <CardContent className="p-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-white text-sm font-medium">
                  {lastEntry.user_name}
                </p>
                <p className="text-xs text-green-300">
                  +{lastEntry.entry_count} entries
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }
        .animate-shake {
          animation: shake 0.1s infinite;
        }
      `}</style>
    </div>
  );
}
