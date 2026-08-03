"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RotateCcw,
  Gift,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SpinGame } from "@/types/spinning-wheel";

export default function BusinessSpinLanding() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const { supabase, profile, business } = useAuth();
  const router = useRouter();
  const [games, setGames] = useState<SpinGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [userActivated, setUserActivated] = useState<boolean | null>(null);
  const [enrolledGameId, setEnrolledGameId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!businessSlug || !supabase) return;

    try {
      // Check if user is active with this business
      if (profile?.id) {
        const { data: activation } = await supabase
          .from("customer_business_activations")
          .select("is_active")
          .eq("user_id", profile.id)
          .eq("business_id", business?.id)
          .eq("is_active", true)
          .gte("expires_at", new Date().toISOString())
          .maybeSingle();

        setUserActivated(activation?.is_active || false);

        // Check which game the user is enrolled in
        const { data: enrollment } = await supabase
          .from("spin_participants")
          .select("game_id")
          .eq("user_id", profile.id)
          .eq("business_id", business?.id)
          .order("enrolled_at", { ascending: false })
          .maybeSingle();

        if (enrollment?.game_id) {
          setEnrolledGameId(enrollment.game_id);
        }
      }

      // Load available spin games for this business
      const { data: gamesData, error } = await supabase
        .from("spin_games")
        .select("*")
        .eq("business_id", business?.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setGames(gamesData || []);
    } catch (err: any) {
      console.error("Error loading games:", err);
      toast.error("Failed to load spin games");
    } finally {
      setLoading(false);
    }
  }, [businessSlug, supabase, profile?.id, business?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getParticipantCount = async (gameId: string) => {
    const { count } = await supabase
      .from("spin_participants")
      .select("*", { count: "exact", head: true })
      .eq("game_id", gameId);
    return count || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {business?.name || "Spin Games"}
          </h1>
          <p className="text-white/50">
            Choose a game and spin to win amazing prizes
          </p>
        </div>

        {userActivated === false && (
          <Card className="bg-yellow-500/10 border-yellow-500/30 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <p className="text-yellow-300 text-sm">
                  You need an active code to participate in spin games.
                  <Link
                    href={`/${businessSlug}/code-entry`}
                    className="underline text-yellow-400 font-medium"
                  >
                    Redeem a code
                  </Link>{" "}
                  to get started.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {games.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-12 text-center">
              <RotateCcw className="h-12 w-12 mx-auto mb-4 text-white/20" />
              <h3 className="text-white font-semibold mb-2">
                No active spin games
              </h3>
              <p className="text-white/40 text-sm">
                Check back later for new games
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {games.map((game) => (
               <GameCard
                 key={game.id}
                 game={game}
                 businessSlug={businessSlug}
                 userActivated={userActivated}
                 enrolledGameId={enrolledGameId}
               />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GameCard({
  game,
  businessSlug,
  userActivated,
  enrolledGameId,
}: {
  game: SpinGame;
  businessSlug?: string;
  userActivated: boolean | null;
  enrolledGameId: string | null;
}) {
  const [participantCount, setParticipantCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await fetch(
        `/api/public/spin-participants?game_id=${game.id}`,
      ).then((r) => r.json());
      setParticipantCount(data?.count || null);
      setLoading(false);
    };
    load();
  }, [game.id]);

  const isFull =
    game.participant_limit != null &&
    participantCount !== null &&
    participantCount >= game.participant_limit;

  return (
    <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-white">{game.name}</CardTitle>
            {game.description && (
              <p className="text-white/40 text-sm mt-1">{game.description}</p>
            )}
          </div>
          {game.is_single_prize && (
            <Badge
              variant="secondary"
              className="bg-amber-500/20 text-amber-400"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Grand Prize
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-white/60">
            <Gift className="h-4 w-4" />
            <span>{game.prize_config.length} prize slots</span>
          </div>
          <div className="flex items-center gap-2 text-white/60">
            <CheckCircle2 className="h-4 w-4" />
            <span>{game.free_spins_per_day} free/day</span>
          </div>
        </div>

        {/* Participant count */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">Participants</span>
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin text-white/30" />
          ) : (
            <span
              className={cn(
                "font-medium",
                isFull ? "text-red-400" : "text-white/60",
              )}
            >
              {participantCount !== null ? participantCount : "..."}{" "}
              {game.participant_limit !== null && (
                <span className="text-white/30">
                  / {game.participant_limit}
                </span>
              )}
            </span>
          )}
        </div>

        {isFull && (
          <Badge variant="destructive" className="w-full justify-center">
            Game is full
          </Badge>
        )}

        {enrolledGameId === game.id && userActivated && (
          <Badge className="w-full justify-center bg-green-500/20 text-green-400 border-0">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Your Game
          </Badge>
        )}

        <Button
          asChild
          className="w-full"
          disabled={isFull}
          style={{
            backgroundColor: isFull ? undefined : "inherit",
            opacity: isFull ? 0.5 : 1,
          }}
        >
          {isFull ? (
            <span className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              Game Full
            </span>
          ) : enrolledGameId === game.id && userActivated ? (
            <Link href={`/${businessSlug}/spin/${game.id}`}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Spin Now
            </Link>
          ) : (
            <Link href={`/${businessSlug}/spin/${game.id}`}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {userActivated === false ? "Activate Code First" : "View Game"}
            </Link>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
