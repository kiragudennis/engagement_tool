// app/(public)/[businessSlug]/spin/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Loader2,
  Sparkles,
  ArrowLeft,
  Trophy,
  Clock,
  Share2,
  QrCode,
  Store,
  Users,
  Zap,
  Timer,
  Flame,
  CheckCircle,
  XCircle,
  RotateCcw,
  Ticket,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import confetti from "canvas-confetti";

// ─── Types ──────────────────────────────────────────────
interface PrizeSegment {
  type: string;
  value: string;
  label: string;
  color: string;
  probability: number;
}

interface SpinGame {
  id: string;
  name: string;
  prize_config: PrizeSegment[];
  free_spins_per_day: number;
  points_per_paid_spin: number;
  is_active: boolean;
  show_confetti: boolean;
  play_sounds: boolean;
  theme_color: string;
}

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  brand_color: string;
  brand_secondary_color: string;
}

// ─── Confetti Cannon ────────────────────────────────────
function fireConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981"],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

// ─── Main Component ─────────────────────────────────────
export default function BusinessSpinPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const { supabase, profile } = useAuth();
  const router = useRouter();

  // State
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [spinGame, setSpinGame] = useState<SpinGame | null>(null);
  const [activation, setActivation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinsLeft, setSpinsLeft] = useState(0);
  const [spinHistory, setSpinHistory] = useState<any[]>([]);
  const [codeInput, setCodeInput] = useState("");
  const [redeemingCode, setRedeemingCode] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);

  const wheelRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ─── Load Business & Spin Game ────────────────────────
  const loadData = useCallback(async () => {
    if (!businessSlug) return;

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

      // Load active spin game
      const { data: game } = await supabase
        .from("spin_games")
        .select("*")
        .eq("business_id", biz.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      setSpinGame(game || null);

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

        if (act && game) {
          // Load spin history
          const { data: history } = await supabase
            .from("spin_attempts")
            .select("*")
            .eq("game_id", game.id)
            .eq("user_id", profile.id)
            .order("created_at", { ascending: false })
            .limit(10);

          setSpinHistory(history || []);

          // Calculate spins left today
          const today = new Date().toDateString();
          const todaySpins = (history || []).filter(
            (s) => new Date(s.created_at).toDateString() === today,
          ).length;
          setSpinsLeft(
            Math.max(0, (game.free_spins_per_day || 1) - todaySpins),
          );
        }
      }
    } catch (err) {
      console.error("Error loading spin page:", err);
    } finally {
      setLoading(false);
    }
  }, [businessSlug, supabase, profile?.id, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

      toast.success(`Activated! Welcome to ${business?.name}!`);
      setShowCodeInput(false);
      setCodeInput("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Invalid code");
    } finally {
      setRedeemingCode(false);
    }
  };

  // ─── Spin Logic ───────────────────────────────────────
  const handleSpin = async () => {
    if (!spinGame || spinning || !profile?.id || !activation) return;

    setSpinning(true);
    setShowResult(false);
    setSpinResult(null);

    try {
      // Determine prize based on probability
      const prizes = spinGame.prize_config;
      const random = Math.random() * 100;
      let cumulative = 0;
      let selectedPrize: PrizeSegment | null = null;
      let prizeIndex = 0;

      for (let i = 0; i < prizes.length; i++) {
        cumulative += prizes[i].probability;
        if (random <= cumulative) {
          selectedPrize = prizes[i];
          prizeIndex = i;
          break;
        }
      }

      if (!selectedPrize) {
        selectedPrize = prizes[prizes.length - 1];
        prizeIndex = prizes.length - 1;
      }

      // Calculate rotation to land on the selected prize
      const segmentAngle = 360 / prizes.length;
      const targetAngle = prizeIndex * segmentAngle + segmentAngle / 2;
      const totalRotation = 360 * 5 + (360 - targetAngle); // 5 full spins + land
      setRotation((prev) => prev + totalRotation);

      // Wait for animation
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Record spin attempt
      const { data: attempt, error: attemptError } = await supabase.rpc(
        "perform_spin",
        {
          p_game_id: spinGame.id,
          p_spin_type: "free",
        },
      );

      if (attemptError) throw attemptError;

      // Handle trivia ticket
      if (attempt?.trivia_ticket) {
        toast.success(`Trivia Ticket #${attempt.trivia_ticket.ticket_number}!`);
      }

      setSpinResult(attempt);
      setShowResult(true);

      // Fire confetti for good prizes
      if (
        selectedPrize.type !== "points" ||
        parseInt(selectedPrize.value) > 0
      ) {
        fireConfetti();
        if (audioRef.current) audioRef.current.play().catch(() => {});
      }

      // Reload data
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Spin failed. Try again.");
    } finally {
      setSpinning(false);
    }
  };

  // ─── Build Wheel Segments ─────────────────────────────
  const segments = spinGame?.prize_config || [];
  const segmentAngle = 360 / (segments.length || 1);

  // ─── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#0a0a0a" }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!business) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#0a0a0a" }}
      >
        <div className="text-center">
          <Store className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">Business not found</p>
          <Button
            onClick={() => router.push("/spin")}
            className="mt-4"
            variant="outline"
          >
            Enter a Code
          </Button>
        </div>
      </div>
    );
  }

  // ─── Not Activated ────────────────────────────────────
  if (!activation && profile?.id && !showCodeInput) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: "#0a0a0a" }}
      >
        <Card className="max-w-md w-full bg-black/50 backdrop-blur border-white/10">
          <CardContent className="p-8 text-center space-y-6">
            <div
              className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white font-bold text-2xl"
              style={{ backgroundColor: business.brand_color }}
            >
              {business.name[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{business.name}</h2>
              <p className="text-white/60 mt-2">
                You need a code to spin. Ask {business.name} for one!
              </p>
            </div>

            <Button
              onClick={() => setShowCodeInput(true)}
              className="w-full gap-2"
              style={{ backgroundColor: business.brand_color }}
            >
              <Ticket className="h-4 w-4" />I Have a Code
            </Button>

            <p className="text-xs text-white/30">
              Codes are given with purchases, at events, or on receipts
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Code Input Overlay ───────────────────────────────
  if (showCodeInput) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: "#0a0a0a" }}
      >
        <Card className="max-w-md w-full bg-black/50 backdrop-blur border-white/10">
          <CardContent className="p-8 space-y-4">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: business.brand_color }}
              >
                {business.name[0]}
              </div>
              <h2 className="text-xl font-bold text-white mt-3">
                {business.name}
              </h2>
              <p className="text-white/60 text-sm mt-1">
                Enter your activation code
              </p>
            </div>

            <Input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleRedeemCode()}
              placeholder="e.g., BREW-FRIDAY"
              className="text-lg font-mono tracking-widest text-center bg-white/5 border-white/10 text-white h-14"
              autoFocus
              disabled={redeemingCode}
            />

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

            <button
              onClick={() => setShowCodeInput(false)}
              className="w-full text-sm text-white/40 hover:text-white/60"
            >
              ← Back
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── No Spin Game ─────────────────────────────────────
  if (!spinGame) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: "#0a0a0a" }}
      >
        <Card className="max-w-md w-full bg-black/50 backdrop-blur border-white/10">
          <CardContent className="p-8 text-center space-y-4">
            <RotateCcw className="h-16 w-16 text-white/20 mx-auto" />
            <h2 className="text-xl font-bold text-white">
              No Active Spin Game
            </h2>
            <p className="text-white/60">
              {business.name} hasn't set up a spin game yet. Check back soon!
            </p>
            {activation && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400">
                ✅ Your activation is active until{" "}
                {formatDistanceToNow(new Date(activation.expires_at), {
                  addSuffix: true,
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Main Spin Page ───────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      <audio ref={audioRef} src="/sounds/win-chime.mp3" preload="auto" />

      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${business.brand_color} 0%, transparent 70%)`,
        }}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 relative z-10"
      >
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white font-bold text-2xl shadow-lg"
          style={{ backgroundColor: business.brand_color }}
        >
          {business.name[0]}
        </div>
        <h1 className="text-2xl font-bold text-white">{business.name}</h1>
        <p className="text-white/50 text-sm mt-1">Spin & Win</p>

        {activation && (
          <Badge className="mt-2 bg-green-500/20 text-green-400 border-0">
            Active • {spinsLeft} spin{spinsLeft !== 1 ? "s" : ""} left today
          </Badge>
        )}
      </motion.div>

      {/* Wheel Container */}
      <div className="relative mb-8" style={{ width: 320, height: 320 }}>
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
          <div
            className="w-0 h-0"
            style={{
              borderLeft: "12px solid transparent",
              borderRight: "12px solid transparent",
              borderTop: `24px solid ${business.brand_color}`,
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
            }}
          />
        </div>

        {/* Wheel */}
        <motion.div
          ref={wheelRef}
          className="w-full h-full rounded-full relative overflow-hidden"
          style={{
            border: `6px solid ${business.brand_color}30`,
            boxShadow: `0 0 60px ${business.brand_color}20, inset 0 0 60px rgba(0,0,0,0.3)`,
          }}
          animate={{ rotate: rotation }}
          transition={{ duration: 5, ease: [0.15, 0.85, 0.25, 1] }}
        >
          {segments.map((segment, index) => {
            const angle = (index * segmentAngle * Math.PI) / 180;
            const nextAngle = ((index + 1) * segmentAngle * Math.PI) / 180;
            const midAngle = (angle + nextAngle) / 2;
            const x = 50 + 35 * Math.cos(midAngle);
            const y = 50 + 35 * Math.sin(midAngle);

            return (
              <div
                key={index}
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(angle)}% ${50 + 50 * Math.sin(angle)}%, ${50 + 50 * Math.cos(nextAngle)}% ${50 + 50 * Math.sin(nextAngle)}%)`,
                  backgroundColor:
                    index % 2 === 0 ? segment.color : `${segment.color}CC`,
                }}
              >
                <span
                  className="text-white text-xs font-bold whitespace-nowrap absolute"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, -50%) rotate(90deg)",
                    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                    maxWidth: "60px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {segment.label}
                </span>
              </div>
            );
          })}

          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border-2 border-white/20">
            <Sparkles className="h-6 w-6 text-white/60" />
          </div>
        </motion.div>
      </div>

      {/* Spin Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        <Button
          onClick={handleSpin}
          disabled={spinning || spinsLeft <= 0}
          className="px-12 py-6 text-xl font-bold rounded-full shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          style={{
            backgroundColor: business.brand_color,
            boxShadow: `0 0 40px ${business.brand_color}40`,
          }}
        >
          {spinning ? (
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
          ) : spinsLeft <= 0 ? (
            "No Spins Left Today"
          ) : (
            <>
              SPIN <Sparkles className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </motion.div>

      {/* Result Overlay */}
      <AnimatePresence>
        {showResult && spinResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowResult(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="bg-gray-900 border-white/10 text-center overflow-hidden">
                {/* Prize Header */}
                <div
                  className="p-8"
                  style={{
                    background: `linear-gradient(135deg, ${business.brand_color}, ${business.brand_secondary_color})`,
                  }}
                >
                  {spinResult.prize_type === "trivia_ticket" ? (
                    <Ticket className="h-16 w-16 text-white mx-auto mb-3" />
                  ) : spinResult.prize_type === "points" &&
                    parseInt(spinResult.prize_value) > 0 ? (
                    <Trophy className="h-16 w-16 text-white mx-auto mb-3" />
                  ) : spinResult.prize_type === "discount" ? (
                    <Zap className="h-16 w-16 text-white mx-auto mb-3" />
                  ) : (
                    <Gift className="h-16 w-16 text-white mx-auto mb-3" />
                  )}
                  <h2 className="text-3xl font-bold text-white">
                    {spinResult.prize_display}
                  </h2>
                </div>

                <CardContent className="p-6 space-y-4">
                  {spinResult.trivia_ticket && (
                    <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-yellow-400 font-bold text-lg">
                        Ticket #{spinResult.trivia_ticket.ticket_number}
                      </p>
                      <p className="text-yellow-300/70 text-sm mt-1">
                        You're in the trivia challenge! Join the live event.
                      </p>
                    </div>
                  )}

                  <p className="text-white/60 text-sm">
                    Show this to {business.name} to claim your prize!
                  </p>

                  <Button
                    onClick={() => setShowResult(false)}
                    className="w-full"
                    style={{ backgroundColor: business.brand_color }}
                  >
                    Done
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Section */}
      {spinHistory.length > 0 && (
        <div className="mt-8 w-full max-w-md relative z-10">
          <h3 className="text-white/60 text-sm font-medium mb-3 text-center">
            Recent Spins
          </h3>
          <div className="space-y-2">
            {spinHistory.slice(0, 5).map((spin, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        segments[spin.segment_index]?.color || "#666",
                    }}
                  />
                  <span className="text-white text-sm">
                    {spin.prize_type === "points" && spin.points_awarded > 0
                      ? `${spin.points_awarded} Points`
                      : spin.prize_value || spin.prize_type}
                  </span>
                </div>
                <span className="text-white/30 text-xs">
                  {formatDistanceToNow(new Date(spin.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center relative z-10">
        <p className="text-white/20 text-xs">
          Powered by Engage • {business.name}
        </p>
      </div>
    </div>
  );
}
