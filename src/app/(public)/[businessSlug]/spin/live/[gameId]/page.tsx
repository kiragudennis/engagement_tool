// app/(public)/[businessSlug]/live/[gameId]/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SpinningWheelClientService } from "@/lib/services/spining-wheel-service.client";
import {
  Trophy,
  Gift,
  Zap,
  Crown,
  Users,
  TrendingUp,
  Clock,
  Minimize2,
  Maximize2,
  RotateCcw,
  Radio,
  Sparkles,
  Store,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SpinGame } from "@/types/spinning-wheel";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────
interface Participant {
  id: string;
  name: string;
  avatar: string;
  first_spin_at: string;
  spin_count: number;
}

interface Winner {
  name: string;
  prize: string;
  timestamp: string;
}

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  brand_color: string;
  brand_secondary_color: string;
}

// ─── Sub-Components (same as before) ────────────────────

function CurrentSpinner({
  userName,
  brandColor,
}: {
  userName: string | null;
  brandColor: string;
}) {
  if (!userName) return null;
  return (
    <div className="text-center mb-3">
      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full animate-pulse"
        style={{
          backgroundColor: `${brandColor}20`,
          border: `1px solid ${brandColor}40`,
        }}
      >
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-white font-bold text-lg">{userName}</span>
        <span className="text-white/60 text-sm">is spinning!</span>
      </div>
    </div>
  );
}

function LiveWheel({
  mustSpin,
  prizeNumber,
  data,
  spinning,
  onStopSpinning,
  brandColor,
}: {
  mustSpin: boolean;
  prizeNumber: number;
  data: Array<{ option: string; style: { backgroundColor: string } }>;
  spinning: boolean;
  onStopSpinning: () => void;
  brandColor: string;
}) {
  const [rotation, setRotation] = useState(0);
  const segmentAngle = 360 / (data.length || 1);

  useEffect(() => {
    if (!mustSpin) return;
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const targetAngle =
      360 * fullSpins + (360 - prizeNumber * segmentAngle - segmentAngle / 2);
    setRotation((prev) => prev + targetAngle);
  }, [mustSpin, prizeNumber, segmentAngle]);

  return (
    <div className="relative w-[280px] h-[280px] md:w-[340px] md:h-[340px] mx-auto">
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
        <div
          className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent"
          style={{
            borderTopColor: brandColor,
            filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))",
          }}
        />
      </div>
      <div
        className="w-full h-full rounded-full relative overflow-hidden border-4 border-white/10 shadow-2xl"
        style={{
          boxShadow: `0 0 60px ${brandColor}20, inset 0 0 30px rgba(0,0,0,0.2)`,
        }}
      >
        <div
          className="w-full h-full transition-transform"
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionDuration: mustSpin ? "5s" : "0s",
            transitionTimingFunction: "cubic-bezier(0.08, 0.82, 0.17, 1.01)",
          }}
          onTransitionEnd={() => {
            if (mustSpin) onStopSpinning();
          }}
        >
          {data.map((seg, i) => {
            const startAngle = (i * segmentAngle * Math.PI) / 180;
            const endAngle = ((i + 1) * segmentAngle * Math.PI) / 180;
            const midAngle = (startAngle + endAngle) / 2;
            return (
              <div
                key={i}
                className="absolute inset-0"
                style={{
                  clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(startAngle)}% ${50 + 50 * Math.sin(startAngle)}%, ${50 + 50 * Math.cos(endAngle)}% ${50 + 50 * Math.sin(endAngle)}%)`,
                  background: seg.style.backgroundColor,
                }}
              >
                <span
                  className="absolute text-white font-bold whitespace-nowrap text-[10px]"
                  style={{
                    left: `${50 + 34 * Math.cos(midAngle)}%`,
                    top: `${50 + 34 * Math.sin(midAngle)}%`,
                    transform: `translate(-50%, -50%) rotate(${i * segmentAngle + segmentAngle / 2}deg)`,
                    textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                  }}
                >
                  {seg.option}
                </span>
              </div>
            );
          })}
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border-2 border-white/20">
            <Sparkles className="h-5 w-5 text-white/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ParticipantsLeaderboard({
  participants,
  total,
  brandColor,
}: {
  participants: Participant[];
  total: number;
  brandColor: string;
}) {
  return (
    <Card className="bg-black/50 backdrop-blur border-white/10 h-full">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" style={{ color: brandColor }} />
          Players ({total})
        </h3>
      </div>
      <div className="p-3 space-y-1 max-h-[400px] overflow-y-auto">
        {participants.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-8">
            Waiting for players...
          </p>
        ) : (
          participants.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-2 rounded-lg bg-white/5"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-white text-xs font-bold">
                  {p.avatar}
                </div>
                <span className="text-white text-sm">{p.name}</span>
              </div>
              <Badge className="bg-white/10 text-white/60 text-xs">
                {p.spin_count} spins
              </Badge>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function WinnersFeed({
  winners,
  brandColor,
}: {
  winners: Winner[];
  brandColor: string;
}) {
  return (
    <Card className="bg-black/50 backdrop-blur border-white/10 h-full">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-400" />
          Recent Winners
        </h3>
      </div>
      <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
        {winners.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-8">
            No winners yet...
          </p>
        ) : (
          winners.map((w, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2 rounded-lg bg-white/5 animate-in fade-in slide-in-from-right"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {w.name}
                </p>
                <p className="text-white/40 text-xs truncate">{w.prize}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

// ─── Game Selector Dropdown ─────────────────────────────
function GameSelector({
  games,
  activeGameId,
  businessSlug,
  brandColor,
}: {
  games: SpinGame[];
  activeGameId: string;
  businessSlug: string;
  brandColor: string;
}) {
  const [open, setOpen] = useState(false);

  if (games.length <= 1) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
        style={{ backgroundColor: `${brandColor}20` }}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span>
          {games.find((g) => g.id === activeGameId)?.name || "Select Game"}
        </span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 right-0 z-40 w-56 rounded-lg bg-gray-900 border border-white/10 shadow-xl overflow-hidden">
            {games.map((g) => (
              <Link
                key={g.id}
                href={`/${businessSlug}/spin/live/${g.id}`}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-white/10",
                  g.id === activeGameId
                    ? "text-white bg-white/10"
                    : "text-white/60",
                )}
                onClick={() => setOpen(false)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <div>
                  <p>{g.name}</p>
                  {g.game_type !== "standard" && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-white/10 text-white/50">
                      {g.game_type}
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────
export default function BusinessLiveGamePage() {
  const { businessSlug, gameId } = useParams<{
    businessSlug: string;
    gameId: string;
  }>();
  const { supabase } = useAuth();
  const router = useRouter();

  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [game, setGame] = useState<SpinGame | null>(null);
  const [allGames, setAllGames] = useState<SpinGame[]>([]);
  const [loading, setLoading] = useState(true);

  const [prizeNumber, setPrizeNumber] = useState(0);
  const [mustSpin, setMustSpin] = useState(false);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [currentSpinner, setCurrentSpinner] = useState<{
    user_name: string;
  } | null>(null);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [recentWins, setRecentWins] = useState<Winner[]>([]);
  const [activeViewers, setActiveViewers] = useState(0);
  const [participantStats, setParticipantStats] = useState({
    total_participants: 0,
    total_spins: 0,
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const winnerAudioRef = useRef<HTMLAudioElement | null>(null);
  const dataFetchedRef = useRef(false);

  const wheelServiceRef = useRef<SpinningWheelClientService | null>(null);
  if (!wheelServiceRef.current && supabase) {
    wheelServiceRef.current = new SpinningWheelClientService(supabase);
  }
  const wheelService = wheelServiceRef.current;

  const wheelData = useMemo(() => {
    if (!game) return [];
    return game.prize_config.map((prize) => ({
      option: prize.label,
      style: { backgroundColor: prize.color },
    }));
  }, [game]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!isFullscreen) containerRef.current.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, [isFullscreen]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ─── Load Data ────────────────────────────────────────
  useEffect(() => {
    if (!businessSlug || !gameId || !wheelService || dataFetchedRef.current)
      return;
    dataFetchedRef.current = true;

    const load = async () => {
      try {
        const { data: biz } = await supabase
          .from("businesses")
          .select(
            "id, name, slug, logo_url, brand_color, brand_secondary_color",
          )
          .eq("slug", businessSlug)
          .single();

        if (!biz) {
          router.push("/spin");
          return;
        }
        setBusiness(biz);

        // Load all active games for this business (for game selector)
        const { data: gamesData } = await supabase
          .from("spin_games")
          .select("*")
          .eq("business_id", biz.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        setAllGames(gamesData || []);

        // Load specific game
        const { data: gameData } = await supabase
          .from("spin_games")
          .select("*")
          .eq("id", gameId)
          .single();

        if (!gameData) {
          setLoading(false);
          return;
        }
        setGame(gameData);

        const [participantsList, stats, winnersData] = await Promise.all([
          wheelService.getAllParticipants(gameId, 50),
          wheelService.getParticipantStats(gameId),
          wheelService.getRecentWinners(gameId, 20),
        ]);

        if (participantsList) setParticipants(participantsList);
        if (stats) setParticipantStats(stats);
        if (winnersData) {
          setRecentWins(
            winnersData.map((w: any) => ({
              name: w.name,
              prize: w.prize,
              timestamp: w.timestamp ?? w.time ?? new Date().toISOString(),
            })),
          );
        }
      } catch (err) {
        console.error("Error loading live page:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [businessSlug, gameId, supabase, wheelService, router]);

  // ─── Real-time ────────────────────────────────────────
  useEffect(() => {
    if (!supabase || !gameId) return;

    const channel = supabase
      .channel(`spin-live-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "spin_live_ticker",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const event = payload.new;
          if (event.action_type === "spin_start") {
            setCurrentSpinner({ user_name: event.user_name });
            setWheelSpinning(true);
            requestAnimationFrame(() =>
              requestAnimationFrame(() => setMustSpin(true)),
            );
          } else if (event.action_type === "win") {
            setRecentWins((prev) => [
              {
                name: event.user_name,
                prize: event.prize_text || "Prize!",
                timestamp: event.created_at,
              },
              ...prev.slice(0, 19),
            ]);
            if (winnerAudioRef.current)
              winnerAudioRef.current.play().catch(() => {});
            setCurrentSpinner(null);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "spin_attempts",
          filter: `game_id=eq.${gameId}`,
        },
        async (payload) => {
          const { data: userData } = await supabase
            .from("users")
            .select("id, full_name")
            .eq("id", payload.new.user_id)
            .single();
          if (userData) {
            setParticipants((prev) => {
              const exists = prev.some((p) => p.id === userData.id);
              if (!exists)
                return [
                  {
                    id: userData.id,
                    name: userData.full_name || "Anonymous",
                    avatar: (
                      userData.full_name?.charAt(0) || "?"
                    ).toUpperCase(),
                    first_spin_at: payload.new.created_at,
                    spin_count: 1,
                  },
                  ...prev.slice(0, 49),
                ];
              return prev.map((p) =>
                p.id === userData.id
                  ? { ...p, spin_count: p.spin_count + 1 }
                  : p,
              );
            });
            setParticipantStats((prev) => ({
              total_participants: prev.total_participants + 1,
              total_spins: prev.total_spins + 1,
            }));
          }
        },
      )
      .on("presence", { event: "sync" }, () =>
        setActiveViewers(Object.keys(channel.presenceState()).length),
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED")
          await channel.track({
            user_id: "viewer",
            online_at: new Date().toISOString(),
          });
      });

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, gameId]);

  const handleStopSpinning = useCallback(() => {
    setMustSpin(false);
    setWheelSpinning(false);
    setCurrentSpinner(null);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <Skeleton className="h-96 w-96 rounded-full" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <p className="text-white/60">Business not found</p>
      </div>
    );
  }

  const brandColor = business.brand_color || "#8B5CF6";

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 border-b backdrop-blur-sm bg-purple-950/80 border-purple-500/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              <Link
                href={`/${businessSlug}/spin`}
                className="text-white/40 hover:text-white/70"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: brandColor }}
              >
                {business.name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400 font-mono">
                    LIVE BROADCAST
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-white">
                    {business.name}
                  </h1>
                  {game && (
                    <span className="text-white/40 text-sm">· {game.name}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Game Selector - key addition for multi-game support */}
              <GameSelector
                games={allGames}
                activeGameId={gameId as string}
                businessSlug={businessSlug as string}
                brandColor={brandColor}
              />
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
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
                  {participantStats.total_spins}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6">
        {!game ? (
          <div className="flex items-center justify-center py-20">
            <Card className="bg-black/50 backdrop-blur border-white/10 max-w-md w-full">
              <div className="p-8 text-center">
                <RotateCcw className="h-16 w-16 text-white/20 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">
                  Game Not Found
                </h2>
                <p className="text-white/50">
                  This spin game doesn't exist or has been removed.
                </p>
              </div>
            </Card>
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-14 gap-6">
              <div className="lg:col-span-4 space-y-4">
                <ParticipantsLeaderboard
                  participants={participants}
                  total={participantStats.total_participants}
                  brandColor={brandColor}
                />
              </div>
              <div className="lg:col-span-6 space-y-4">
                <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur border-purple-500/30">
                  <div className="p-6">
                    <CurrentSpinner
                      userName={currentSpinner?.user_name || null}
                      brandColor={brandColor}
                    />
                    <div className="flex justify-center">
                      <LiveWheel
                        mustSpin={mustSpin}
                        prizeNumber={prizeNumber}
                        data={wheelData}
                        spinning={wheelSpinning}
                        onStopSpinning={handleStopSpinning}
                        brandColor={brandColor}
                      />
                    </div>
                    {game.is_single_prize && !game.single_prize_claimed && (
                      <div className="flex justify-center mt-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/50 animate-pulse">
                          <Trophy className="h-3 w-3 text-yellow-400" />
                          <span className="text-xs font-medium text-yellow-400">
                            GRAND PRIZE AVAILABLE
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
              <div className="lg:col-span-4 space-y-4">
                <WinnersFeed winners={recentWins} brandColor={brandColor} />
              </div>
            </div>

            <div className="mt-6 grid lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur border-purple-500/30">
                <div className="p-4">
                  <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                    <Gift className="h-4 w-4 text-purple-400" /> Prize Pool
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {game.prize_config.map((prize, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: prize.color }}
                          />
                          <span className="text-xs text-white">
                            {prize.label}
                          </span>
                        </div>
                        <span className="text-xs text-purple-300">
                          {prize.probability}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
              <Card className="bg-gradient-to-br from-pink-900/40 to-red-900/40 backdrop-blur border-pink-500/30">
                <div className="p-4">
                  <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-pink-400" /> Live Stats
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        label: "Watching",
                        value: activeViewers,
                        color: "text-yellow-400",
                      },
                      {
                        label: "Players",
                        value: participantStats.total_participants,
                        color: "text-green-400",
                      },
                      {
                        label: "Spins",
                        value: participantStats.total_spins,
                        color: "text-blue-400",
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="text-center p-2 rounded-lg bg-white/5"
                      >
                        <div className={cn("text-xl font-bold", s.color)}>
                          {s.value}
                        </div>
                        <div className="text-xs text-purple-300">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}

        <div className="mt-6">
          <Card
            className="border-0"
            style={{
              background: `linear-gradient(135deg, ${brandColor}, ${business.brand_secondary_color})`,
            }}
          >
            <div className="p-4 text-center">
              <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-white mb-1">
                Want to join?
              </h3>
              <p className="text-sm text-white/80 mb-3">
                Spin the wheel for your chance to win!
              </p>
              <button
                onClick={() => window.open(`/${businessSlug}/spin`, "_blank")}
                className="bg-white text-purple-600 hover:bg-purple-100 font-semibold py-2 px-6 rounded-lg transition-all"
              >
                Play Now →
              </button>
            </div>
          </Card>
        </div>
      </div>

      <audio
        ref={winnerAudioRef}
        src="/sounds/claim-chime.mp3"
        preload="auto"
        className="hidden"
      />
    </div>
  );
}
