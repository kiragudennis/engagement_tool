// app/(public)/[businessSlug]/spin/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  Gift,
  Trophy,
  Crown,
  Users,
  TrendingUp,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Eye,
  Loader2,
  Ticket,
  RotateCcw,
  Radio,
  Clock,
  Star,
  Flame,
  AlertCircle,
  Store,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { SpinningWheelClientService } from "@/lib/services/spining-wheel-service.client";
import { PointsService } from "@/lib/services/points-service";
import { SpinGame, UserSpinState, PrizeSegment } from "@/types/spinning-wheel";
import { useSocket } from "@/lib/socket/useSocket";
import confetti from "canvas-confetti";
import { Input } from "@/components/ui/input";

// ─── Types ──────────────────────────────────────────────
interface BusinessData {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  brand_color: string;
  brand_secondary_color: string;
}

// ─── Helpers ────────────────────────────────────────────
function fireConfetti() {
  const duration = 2000;
  const end = Date.now() + duration;
  const colors = ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6"];
  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

// ─── Custom Wheel (replaces react-custom-roulette) ──────
function BusinessSpinWheel({
  segments,
  spinning,
  targetIndex,
  onComplete,
}: {
  segments: PrizeSegment[];
  spinning: boolean;
  targetIndex: number;
  onComplete: () => void;
}) {
  const [rotation, setRotation] = useState(0);
  const segmentAngle = 360 / (segments.length || 1);

  useEffect(() => {
    if (!spinning) return;
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const targetAngle =
      360 * fullSpins + (360 - targetIndex * segmentAngle - segmentAngle / 2);
    setRotation((prev) => prev + targetAngle);
  }, [spinning, targetIndex, segmentAngle]);

  return (
    <div className="relative w-[300px] h-[300px] md:w-[340px] md:h-[340px] mx-auto">
      {/* Pointer */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
        <motion.div
          animate={spinning ? { y: [0, -4, 0] } : {}}
          transition={{ duration: 0.3, repeat: spinning ? Infinity : 0 }}
        >
          <svg width="28" height="36" viewBox="0 0 28 36">
            <defs>
              <linearGradient id="pointer-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
            <polygon
              points="14,36 0,0 28,0"
              fill="url(#pointer-grad)"
              filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))"
            />
          </svg>
        </motion.div>
      </div>

      {/* Wheel */}
      <motion.div
        className="w-full h-full rounded-full relative overflow-hidden border-4 border-white/10 shadow-2xl"
        style={{
          boxShadow:
            "0 0 60px rgba(139, 92, 246, 0.15), inset 0 0 30px rgba(0,0,0,0.2)",
        }}
        animate={{ rotate: rotation }}
        transition={{ duration: 5, ease: [0.08, 0.82, 0.17, 1.01] }}
        onAnimationComplete={() => {
          if (spinning) onComplete();
        }}
      >
        {segments.map((seg, i) => {
          const startAngle = (i * segmentAngle * Math.PI) / 180;
          const endAngle = ((i + 1) * segmentAngle * Math.PI) / 180;
          const midAngle = (startAngle + endAngle) / 2;
          const textRadius = 34;

          return (
            <div
              key={i}
              className="absolute inset-0"
              style={{
                clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(startAngle)}% ${50 + 50 * Math.sin(startAngle)}%, ${50 + 50 * Math.cos(endAngle)}% ${50 + 50 * Math.sin(endAngle)}%)`,
                background: `linear-gradient(135deg, ${seg.color}, ${seg.color}DD)`,
              }}
            >
              <span
                className="absolute text-white font-bold whitespace-nowrap text-[11px]"
                style={{
                  left: `${50 + textRadius * Math.cos(midAngle)}%`,
                  top: `${50 + textRadius * Math.sin(midAngle)}%`,
                  transform: `translate(-50%, -50%) rotate(${i * segmentAngle + segmentAngle / 2}deg)`,
                  textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                  maxWidth: "55px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {seg.label}
              </span>
            </div>
          );
        })}

        {/* Center hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <motion.div
            className="w-14 h-14 rounded-full bg-gradient-to-br from-white to-gray-100 dark:from-gray-200 dark:to-gray-400 flex items-center justify-center shadow-lg"
            animate={spinning ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={{ duration: 0.5, repeat: spinning ? Infinity : 0 }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────
export default function BusinessSpinPage() {
  const { businessSlug, gameId } = useParams<{
    businessSlug: string;
    gameId: string;
  }>();
  const { supabase, profile } = useAuth();
  const router = useRouter();

  // Business & Game state
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [game, setGame] = useState<SpinGame | null>(null);
  const [activeGame, setActiveGame] = useState<SpinGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Activation state
  const [activation, setActivation] = useState<any>(null);
  const [codeInput, setCodeInput] = useState("");
  const [redeemingCode, setRedeemingCode] = useState(false);

  // Wheel state
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<{
    prize: string;
    type: string;
  } | null>(null);

  // User state
  const [userState, setUserState] = useState<UserSpinState>({
    spins_used_today: 0,
    spins_used_week: 0,
    spins_used_total: 0,
    free_remaining_today: 0,
    free_remaining_week: 0,
    free_remaining_total: 0,
    points_balance: 0,
    can_spin_free: true,
    can_spin_paid: false,
  });

  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Queue state
  const [queueEnabled, setQueueEnabled] = useState(false);
  const [inQueue, setInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [queueStatus, setQueueStatus] = useState<string | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [joiningQueue, setJoiningQueue] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);

  // Services
  const wheelServiceRef = useRef<SpinningWheelClientService | null>(null);
  if (!wheelServiceRef.current && supabase) {
    wheelServiceRef.current = new SpinningWheelClientService(supabase);
  }
  const wheelService = wheelServiceRef.current;

  // Socket for queue events
  const { on: onSocket, emit: emitSocket } = useSocket();

  useEffect(() => {
    if (!gameId) return;
    emitSocket("join:queue", gameId);
  }, [gameId, emitSocket]);

  useEffect(() => {
    if (!gameId) return;
    const unsub1 = onSocket(`queue:${gameId}:called`, (data: any) => {
      if (data.user_id === profile?.id) {
        setIsMyTurn(true);
        setQueueStatus("current");
      }
    });
    const unsub2 = onSocket(`queue:${gameId}:skipped`, (data: any) => {
      if (data.user_id === profile?.id) {
        setIsMyTurn(false);
        setInQueue(false);
        setQueueStatus(null);
        setQueuePosition(null);
        toast.info("You were skipped from the queue");
      }
    });
    const unsub3 = onSocket(`queue:${gameId}:update`, () => {
      if (profile?.id && gameId) {
        checkQueueStatus();
      }
    });
    return () => {
      unsub1?.();
      unsub2?.();
      unsub3?.();
    };
  }, [gameId, profile?.id, onSocket]);

  const checkQueueStatus = async () => {
    if (!gameId || !profile?.id || !supabase) return;
    try {
      const { data } = await supabase.rpc("get_user_queue_position", {
        p_game_id: gameId,
        p_user_id: profile.id,
      });
      if (data) {
        setInQueue(data.in_queue || false);
        setQueuePosition(data.queue_position || null);
        setQueueStatus(data.status || null);
        setIsMyTurn(data.status === "current");
      }
    } catch (err) {
      console.error("Queue status check failed:", err);
    }
  };

  const joinQueue = async () => {
    if (!gameId || !profile?.id || !supabase) return;
    setJoiningQueue(true);
    setQueueError(null);
    try {
      const { data, error } = await supabase.rpc("join_spin_queue", {
        p_game_id: gameId,
        p_user_id: profile.id,
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      setInQueue(true);
      setQueuePosition(data.queue_position);
      setQueueStatus("waiting");
      toast.success(`You're #${data.queue_position} in queue!`);
    } catch (err: any) {
      setQueueError(err.message || "Failed to join queue");
      toast.error(err.message || "Failed to join queue");
    } finally {
      setJoiningQueue(false);
    }
  };

  const leaveQueue = async () => {
    if (!gameId || !profile?.id || !supabase) return;
    try {
      await supabase.from("spin_queue_entries").delete().eq("game_id", gameId).eq("user_id", profile.id);
      setInQueue(false);
      setQueuePosition(null);
      setQueueStatus(null);
      setIsMyTurn(false);
      toast.success("Left queue");
    } catch (err: any) {
      toast.error(err.message || "Failed to leave queue");
    }
  };

  useEffect(() => {
    if (!queueEnabled || !gameId || !profile?.id) return;
    const interval = setInterval(checkQueueStatus, 3000);
    return () => clearInterval(interval);
  }, [queueEnabled, gameId, profile?.id]);

  // ─── Load Business & Games ────────────────────────────
  const loadData = useCallback(async () => {
    if (!businessSlug || !supabase) return;
    setLoading(true);

    try {
      // Load business
      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name, slug, logo_url, brand_color, brand_secondary_color")
        .eq("slug", businessSlug)
        .single();

      if (!biz) {
        router.push("/spin");
        return;
      }
      setBusiness(biz);

      // Load active spin games for this business
      const { data: gameData } = await supabase
        .from("spin_games")
        .select("*")
        .eq("business_id", biz.id)
        .eq("is_active", true)
        .eq("id", gameId)
        .maybeSingle();

      setGame(gameData || null);

      // Check queue settings
      if (gameData && profile?.id) {
        const { data: queueSettings } = await supabase
          .from("spin_queue_settings")
          .select("queue_enabled")
          .eq("game_id", gameData.id)
          .maybeSingle();
        
        setQueueEnabled(queueSettings?.queue_enabled || false);
        
        if (queueSettings?.queue_enabled) {
          checkQueueStatus();
        }
      }

      // Check user activation
      if (profile?.id) {
        const { data: act } = await supabase
          .from("customer_business_activations")
          .select("*")
          .eq("user_id", profile.id)
          .eq("business_id", biz.id)
          .eq("is_active", true)
          .gte("expires_at", new Date().toISOString())
          .single();

        setActivation(act || null);

        // Load user spin state
        if (act && gameData?.length && wheelService) {
          const [allocation, balance] = await Promise.all([
            wheelService.getUserAllocation(profile.id, gameData[0].id),
            PointsService.getBalance(supabase, profile.id),
          ]);
          setUserState({
            spins_used_today: allocation?.spins_used_today || 0,
            spins_used_week: allocation?.spins_used_this_week || 0,
            spins_used_total: allocation?.spins_used_total || 0,
            free_remaining_today: allocation?.free_spins_remaining_today || 0,
            free_remaining_week: allocation?.free_spins_remaining_week || 0,
            free_remaining_total: allocation?.free_spins_remaining_total || 0,
            points_balance: balance?.points || 0,
            can_spin_free: allocation?.can_spin_free || false,
            can_spin_paid: allocation?.can_spin_paid || false,
          });
        }
      }
    } catch (err) {
      console.error("Error loading spin page:", err);
      setError("Failed to load");
    } finally {
      setLoading(false);
    }
  }, [businessSlug, supabase, profile?.id, router, wheelService]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Real-time subscription ───────────────────────────
  useEffect(() => {
    if (!activeGame?.id) return;
    const ch = supabase
      .channel(`spin-${activeGame.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "spin_attempts",
          filter: `game_id=eq.${activeGame.id}`,
        },
        () => setRefreshKey((prev) => prev + 1),
      )
      .subscribe();
    return () => {
      ch.unsubscribe();
    };
  }, [activeGame?.id, supabase]);

  // ─── Code Redemption ──────────────────────────────────
  const handleRedeemCode = async () => {
    if (!codeInput.trim() || !profile?.id) return;
    setRedeemingCode(true);
    try {
      const { data, error } = await supabase.rpc("redeem_access_code", {
        p_code: codeInput.toUpperCase().trim(),
        p_user_id: profile.id,
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      toast.success(`Welcome to ${business?.name}!`);
      setCodeInput("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Invalid code");
    } finally {
      setRedeemingCode(false);
    }
  };

  // ─── Spin Logic ───────────────────────────────────────
  const handleSpin = async (usePoints: boolean) => {
    if (!profile) {
      toast.error("Login to play");
      return;
    }
    if (!activeGame || spinning || !wheelService) return;

    if (activeGame.is_single_prize && activeGame.single_prize_claimed) {
      toast.error("Grand prize already claimed!");
      return;
    }
    if (!usePoints && !userState.can_spin_free) {
      toast.error(
        "No free spins left today. Use points or come back tomorrow!",
      );
      return;
    }
    if (
      usePoints &&
      userState.points_balance < activeGame.points_per_paid_spin
    ) {
      toast.error(`Need ${activeGame.points_per_paid_spin} points`);
      return;
    }

    setSpinning(true);
    try {
      const result = await wheelService.spin(
        activeGame.id,
        usePoints ? "points" : "free",
      );
      setPrizeNumber(result.segment_index);
      setLastWin({
        prize: result.prize_display || result.prizeDisplay,
        type: result.prize_type,
      });
      setMustSpin(true);

      if (soundEnabled && activeGame.play_sounds) {
        new Audio("/sounds/claim-chime.mp3").play().catch(() => {});
      }
    } catch (err: any) {
      toast.error(err.message || "Spin failed");
      setMustSpin(false);
      setSpinning(false);
    }
  };

  const handleStopSpinning = useCallback(async () => {
    setMustSpin(false);
    setSpinning(false);

    if (
      (lastWin && lastWin.type !== "points") ||
      (lastWin?.type === "points" && parseInt(lastWin.prize) > 0)
    ) {
      fireConfetti();
    }

    if (profile?.id && wheelService && activeGame) {
      const [allocation, balance] = await Promise.all([
        wheelService.getUserAllocation(profile.id, activeGame.id),
        PointsService.getBalance(supabase!, profile.id),
      ]);
      setUserState({
        spins_used_today: allocation?.spins_used_today || 0,
        spins_used_week: allocation?.spins_used_this_week || 0,
        spins_used_total: allocation?.spins_used_total || 0,
        free_remaining_today: allocation?.free_spins_remaining_today || 0,
        free_remaining_week: allocation?.free_spins_remaining_week || 0,
        free_remaining_total: allocation?.free_spins_remaining_total || 0,
        points_balance: balance?.points || 0,
        can_spin_free: allocation?.can_spin_free || false,
        can_spin_paid: allocation?.can_spin_paid || false,
      });
      setRefreshKey((prev) => prev + 1);
    }
  }, [lastWin, profile?.id, wheelService, activeGame, supabase]);

  // ─── Wheel Data ───────────────────────────────────────
  const wheelSegments = useMemo(() => {
    if (!activeGame) return [];
    return activeGame.prize_config;
  }, [activeGame]);

  // ─── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Store className="h-16 w-16 text-gray-300 dark:text-white/20 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-white/60">Business not found</p>
          <Button onClick={() => router.push("/spin")} className="mt-4">
            Enter a Code
          </Button>
        </div>
      </div>
    );
  }

  // ─── Not Activated ────────────────────────────────────
  if (!activation && profile?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
        <Card className="max-w-md w-full bg-white dark:bg-black/50 border-gray-200 dark:border-white/10">
          <CardContent className="p-8 text-center space-y-6">
            <div
              className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white font-bold text-2xl shadow-lg"
              style={{ backgroundColor: business.brand_color }}
            >
              {business.name[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {business.name}
              </h2>
              <p className="text-gray-500 dark:text-white/60 mt-2">
                Enter your code to start spinning!
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleRedeemCode()}
                placeholder="e.g., BREW-FRIDAY"
                className="text-lg font-mono tracking-widest text-center h-14"
                autoFocus
                disabled={redeemingCode}
              />
            </div>
            <Button
              onClick={handleRedeemCode}
              disabled={redeemingCode || !codeInput.trim()}
              className="w-full h-12"
              style={{ backgroundColor: business.brand_color }}
            >
              {redeemingCode ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Activate & Spin"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── No Games ─────────────────────────────────────────
  if (!activeGame) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
        <Card className="max-w-md w-full bg-white dark:bg-black/50 border-gray-200 dark:border-white/10">
          <CardContent className="p-8 text-center space-y-4">
            <RotateCcw className="h-16 w-16 text-gray-300 dark:text-white/20 mx-auto" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              No Active Spin Game
            </h2>
            <p className="text-gray-500 dark:text-white/60">
              {business.name} hasn't set up a spin game yet.
            </p>
            {activation && (
              <Badge className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">
                ✅ Active until{" "}
                {new Date(activation.expires_at).toLocaleDateString()}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Main Spin Page ───────────────────────────────────
  const isGameLive =
    activeGame.is_active &&
    (!activeGame.ends_at || new Date(activeGame.ends_at) > new Date());

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-white/5 bg-white dark:bg-black/50 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: business.brand_color }}
            >
              {business.name[0]}
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white">
                {business.name}
              </h1>
              <p className="text-xs text-gray-500 dark:text-white/40">
                Spin & Win
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activation && (
              <Badge className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-xs">
                Active
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            {activeGame && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-gray-200 dark:border-white/10"
              >
                <Link href={`/${businessSlug}/live`} target="_blank">
                  <Eye className="h-4 w-4 mr-1" /> Live
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Game selector (if multiple games) */}
      {game && (
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              key={game.id}
              onClick={() => setActiveGame(game)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                activeGame?.id === game.id
                  ? "text-white shadow-md"
                  : "bg-white dark:bg-white/5 text-gray-600 dark:text-white/60 border border-gray-200 dark:border-white/10 hover:border-purple-300",
              )}
              style={
                activeGame?.id === game.id
                  ? { backgroundColor: business.brand_color }
                  : {}
              }
            >
              {game.name}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Wheel Column */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
              <CardContent className="pt-6">
                {/* Wheel */}
                <div className="flex justify-center mb-6">
                  <BusinessSpinWheel
                    segments={wheelSegments}
                    spinning={mustSpin}
                    targetIndex={prizeNumber}
                    onComplete={handleStopSpinning}
                  />
                </div>

                {/* Spin Buttons */}
                <div className="space-y-3">
                  {queueEnabled ? (
                    <>
                      {isMyTurn ? (
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            size="lg"
                            onClick={() => handleSpin(false)}
                            disabled={
                              spinning || !isGameLive || !userState?.can_spin_free
                            }
                            className="h-12 gap-2"
                            style={{ backgroundColor: business.brand_color }}
                          >
                            <Gift className="h-5 w-5" />
                            Free Spin
                            <Badge className="ml-1 bg-white/20 text-xs">
                              {userState.free_remaining_today} left
                            </Badge>
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={() => handleSpin(true)}
                            disabled={
                              spinning || !isGameLive || !userState.can_spin_paid
                            }
                            className="h-12 gap-2 border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-400"
                          >
                            <Coins className="h-5 w-5" />
                            {activeGame.points_per_paid_spin} Pts
                          </Button>
                        </div>
                      ) : inQueue ? (
                        <div className="p-4 rounded-xl text-center bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-500/30">
                          <p className="text-purple-700 dark:text-purple-300 font-medium mb-1">
                            You're in the queue!
                          </p>
                          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            #{queuePosition}
                          </p>
                          <p className="text-xs text-purple-600 dark:text-purple-400 mb-3">
                            {queueStatus === "current" ? "It's your turn!" : "Waiting to be called..."}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={leaveQueue}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Leave Queue
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-3">
                            Join the queue and wait for your turn to spin!
                          </p>
                          <Button
                            size="lg"
                            onClick={joinQueue}
                            disabled={joiningQueue || !isGameLive}
                            className="h-12 gap-2"
                            style={{ backgroundColor: business.brand_color }}
                          >
                            {joiningQueue ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <>
                                <Users className="h-5 w-5" />
                                Join Queue
                              </>
                            )}
                          </Button>
                          {queueError && (
                            <p className="text-xs text-red-500 mt-2">{queueError}</p>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        size="lg"
                        onClick={() => handleSpin(false)}
                        disabled={
                          spinning || !isGameLive || !userState?.can_spin_free
                        }
                        className="h-12 gap-2"
                        style={{ backgroundColor: business.brand_color }}
                      >
                        <Gift className="h-5 w-5" />
                        Free Spin
                        <Badge className="ml-1 bg-white/20 text-xs">
                          {userState.free_remaining_today} left
                        </Badge>
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => handleSpin(true)}
                        disabled={
                          spinning || !isGameLive || !userState.can_spin_paid
                        }
                        className="h-12 gap-2 border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-400"
                      >
                        <Coins className="h-5 w-5" />
                        {activeGame.points_per_paid_spin} Pts
                      </Button>
                    </div>
                  )}

                  {spinning && (
                    <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-white/40">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Spinning...</span>
                    </div>
                  )}

                  {/* Last Win */}
                  <AnimatePresence>
                    {lastWin && !spinning && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-4 rounded-xl text-center"
                        style={{
                          background: `linear-gradient(135deg, ${business.brand_color}15, ${business.brand_secondary_color}15)`,
                          borderColor: `${business.brand_color}30`,
                        }}
                      >
                        <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                        <p className="font-bold text-gray-900 dark:text-white">
                          You won: {lastWin.prize}!
                        </p>
                        {lastWin.type === "trivia_ticket" && (
                          <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                            Check the trivia page for your ticket!
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>

            {/* Prize Pool */}
            <Card className="mt-4 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                  <Gift
                    className="h-5 w-5"
                    style={{ color: business.brand_color }}
                  />
                  Prize Pool
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {wheelSegments.map((prize: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg text-sm"
                      style={{
                        backgroundColor: `${prize.color}10`,
                        border: `1px solid ${prize.color}20`,
                      }}
                    >
                      <span className="font-medium text-gray-700 dark:text-white/80">
                        {prize.label}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: `${prize.color}40`,
                          color: prize.color,
                        }}
                      >
                        {prize.probability}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* User Stats */}
            {profile && (
              <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Your Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {userState.free_remaining_today}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-white/40">
                        Free Today
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {userState.points_balance}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-white/40">
                        Points
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-white/40 mb-1">
                      <span>Weekly spins</span>
                      <span>
                        {userState.spins_used_week} /{" "}
                        {activeGame.free_spins_per_week}
                      </span>
                    </div>
                    <Progress
                      value={
                        (userState.spins_used_week /
                          activeGame.free_spins_per_week) *
                        100
                      }
                      className="h-1.5"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Live Broadcast CTA */}
            <Card className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-purple-500/20">
              <CardContent className="p-4 text-center">
                <Radio className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <h3 className="text-gray-900 dark:text-white font-semibold">
                  Live Broadcast
                </h3>
                <p className="text-xs text-gray-500 dark:text-white/50 mt-1 mb-3">
                  Watch the action on the big screen
                </p>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-purple-300 dark:border-purple-500/30"
                >
                  <Link
                    href={`/${businessSlug}/spin/live/${game?.id}`}
                    target="_blank"
                  >
                    <Eye className="h-4 w-4 mr-1" /> Open Live View
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
