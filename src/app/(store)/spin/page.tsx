// app/(store)/spin/page.tsx (Optimized)

"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Gift,
  Trophy,
  Users,
  TrendingUp,
  Sparkles,
  Crown,
  Zap,
  Calendar,
  Coins,
  Ticket,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SpinGame } from "@/types/spinning_wheel";
import SpinHero from "@/components/layout/spin-header";

interface GlobalStats {
  total_spins: number;
  active_players: number;
  total_winners: number;
}

interface SpinGameWithStats extends SpinGame {
  active_players?: number;
  spins_today?: number;
  recent_winners?: { user_name: string; prize: string }[];
  top_prize?: {
    label: string;
    color: string;
  } | null;
}

const GAME_TYPE_CONFIG = {
  standard: {
    icon: Sparkles,
    label: "Daily Spin",
    color: "from-blue-500 to-cyan-500",
  },
  vip: {
    icon: Crown,
    label: "VIP Exclusive",
    color: "from-yellow-500 to-amber-500",
  },
  new_customer: {
    icon: Users,
    label: "Welcome Bonus",
    color: "from-green-500 to-emerald-500",
  },
  weekend: {
    icon: Calendar,
    label: "Weekend Special",
    color: "from-purple-500 to-pink-500",
  },
  flash: {
    icon: Zap,
    label: "Flash Game",
    color: "from-red-500 to-orange-500",
  },
};

export default function SpinsPage() {
  const { supabase, profile } = useAuth();
  const [games, setGames] = useState<SpinGameWithStats[]>([]);
  const [featuredGame, setFeaturedGame] = useState<SpinGameWithStats | null>(
    null,
  );
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    total_spins: 0,
    active_players: 0,
    total_winners: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchGames = useCallback(async () => {
    try {
      // Single RPC call for all games with stats
      const { data: gamesData, error: gamesError } = await supabase.rpc(
        "get_spin_games_with_stats",
      );

      if (gamesError) throw gamesError;

      setGames(gamesData || []);

      // Find featured game
      const featured =
        (gamesData || []).find(
          (g: SpinGame) => g.is_active && g.game_type === "vip",
        ) ||
        (gamesData || []).find(
          (g: SpinGame) => g.is_active && g.is_single_prize,
        ) ||
        (gamesData || []).find((g: SpinGame) => g.is_active) ||
        (gamesData || [])[0];

      setFeaturedGame(featured || null);

      // Global stats - another RPC call
      const { data: statsData, error: statsError } = await supabase.rpc(
        "get_global_spin_stats",
      );

      if (!statsError && statsData && statsData.length > 0) {
        setGlobalStats({
          total_spins: statsData[0].total_spins || 0,
          active_players: statsData[0].active_players || 0,
          total_winners: statsData[0].total_winners || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching games:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchGames();

    // Auto-refresh every 30 seconds instead of 10
    const interval = setInterval(fetchGames, 30000);
    return () => clearInterval(interval);
  }, [fetchGames]);

  // Real-time subscription for live updates (single channel)
  useEffect(() => {
    if (!games.length) return;

    const channel = supabase
      .channel("spin-live-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "spin_attempts",
        },
        () => {
          // Just refresh stats, not full games list
          supabase.rpc("get_global_spin_stats").then(({ data }) => {
            if (data && data[0]) {
              setGlobalStats({
                total_spins: data[0].total_spins || 0,
                active_players: data[0].active_players || 0,
                total_winners: data[0].total_winners || 0,
              });
            }
          });
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, games.length]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <SpinHero />

      {/* Global Stats Bar */}
      <div className="bg-black/50 backdrop-blur border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-white">
                <span className="font-bold">
                  {globalStats.total_spins.toLocaleString()}
                </span>{" "}
                total spins
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-white">
                <span className="font-bold">{globalStats.active_players}</span>{" "}
                active now
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" />
              <span className="text-white">
                <span className="font-bold">
                  {globalStats.total_winners.toLocaleString()}
                </span>{" "}
                winners
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Featured Game Banner */}
        {featuredGame && (
          <div className="mb-12">
            <Card className="overflow-hidden bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30">
              <div className="flex flex-col md:flex-row items-center gap-6 p-6">
                <div className="flex-1 text-center md:text-left">
                  <Badge className="mb-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0">
                    <Crown className="h-3 w-3 mr-1" />
                    Featured Game
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-bold">
                    {featuredGame.name}
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    {featuredGame.description}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                    <div className="flex items-center gap-1">
                      <Ticket className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">
                        {featuredGame.free_spins_per_day} free spins/day
                      </span>
                    </div>
                    {featuredGame.points_per_paid_spin > 0 && (
                      <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">
                          {featuredGame.points_per_paid_spin} points per spin
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    asChild
                    className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    <Link href={`/spin/${featuredGame.id}`}>
                      Play Now
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
                {featuredGame.top_prize && (
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                      <Gift className="h-10 w-10 text-yellow-500" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Top Prize
                    </p>
                    <p className="font-bold text-lg">
                      {featuredGame.top_prize.label}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => {
            const config = GAME_TYPE_CONFIG[game.game_type];
            const Icon = config?.icon || Sparkles;
            const isLive =
              game.is_active &&
              (!game.ends_at || new Date(game.ends_at) > new Date());
            const activePlayers = game.active_players || 0;
            const spinsToday = game.spins_today || 0;

            return (
              <Card
                key={game.id}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                {/* Header */}
                <div
                  className={cn(
                    "h-32 bg-gradient-to-r p-4 text-white relative",
                    config?.color || "from-purple-500 to-pink-500",
                  )}
                >
                  <div className="absolute top-4 right-4">
                    {isLive && (
                      <Badge className="bg-green-500 text-white gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        LIVE
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5" />
                    <span className="text-sm opacity-90">
                      {config?.label || "Spin Game"}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold line-clamp-1">
                    {game.name}
                  </h3>
                </div>

                <CardContent className="p-4 space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {game.description}
                  </p>

                  {/* Stats */}
                  <div className="flex justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-blue-500" />
                      <span>{activePlayers} playing</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span>{spinsToday} spins today</span>
                    </div>
                  </div>

                  {/* Recent Winners */}
                  {game.recent_winners && game.recent_winners.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Recent Winners:
                      </p>
                      <div className="space-y-1">
                        {game.recent_winners.slice(0, 2).map((winner, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs"
                          >
                            <Trophy className="h-3 w-3 text-yellow-500" />
                            <span className="truncate">{winner.user_name}</span>
                            <span className="text-muted-foreground">won</span>
                            <Badge variant="outline" className="text-xs">
                              {winner.prize}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prize Preview */}
                  {game.top_prize && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">Top Prize:</span>
                      </div>
                      <Badge
                        style={{
                          backgroundColor: game.top_prize.color,
                          color: "white",
                        }}
                      >
                        {game.top_prize.label}
                      </Badge>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button asChild className="w-full group">
                    <Link href={`/spin/${game.id}`}>
                      Play Now
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {games.length === 0 && (
          <div className="text-center py-12">
            <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Games Available</h3>
            <p className="text-muted-foreground">
              Check back soon for new spin games!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
