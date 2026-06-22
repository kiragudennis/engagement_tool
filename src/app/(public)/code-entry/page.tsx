// app/(public)/spin/page.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Store,
  RotateCcw,
  Brain,
  Trophy,
  Clock,
  QrCode,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import GamingBackground from "@/components/GamingBackground";

// ─── Types ──────────────────────────────────────────────
interface CodeResult {
  business_name: string;
  business_slug: string;
  business_logo: string | null;
  business_color: string;
  unlocks: "spin" | "trivia" | "draw" | "both";
  code: string;
  redirect_url: string;
  expires_at?: string;
  draw_name?: string;
  draw_prize?: string;
  draw_ends_at?: string;
  trivia_name?: string;
  trivia_time?: string;
}

// ─── Destination Config ─────────────────────────────────
const DESTINATION_CONFIG: Record<
  string,
  {
    icon: any;
    label: string;
    description: string;
    color: string;
    bgGlow: string;
  }
> = {
  spin: {
    icon: RotateCcw,
    label: "Spin & Win",
    description: "Spin the wheel for a chance to win instant prizes!",
    color: "from-purple-500 to-pink-500",
    bgGlow: "bg-purple-500/10",
  },
  trivia: {
    icon: Brain,
    label: "Live Trivia",
    description: "Join the trivia challenge and compete on the leaderboard!",
    color: "from-blue-500 to-cyan-500",
    bgGlow: "bg-blue-500/10",
  },
  draw: {
    icon: Trophy,
    label: "Prize Draw",
    description: "You've been entered into the prize draw. Good luck!",
    color: "from-amber-500 to-orange-500",
    bgGlow: "bg-amber-500/10",
  },
  both: {
    icon: Gift,
    label: "Spin & Draw",
    description: "Spin the wheel AND enter the prize draw!",
    color: "from-green-500 to-emerald-500",
    bgGlow: "bg-green-500/10",
  },
};

// ─── Main Component ─────────────────────────────────────
export default function CodeEntryPage() {
  const searchParams = useSearchParams();
  const prefillCode = searchParams.get("code") || "";
  const fromLogin = searchParams.get("fromLogin") === "true";

  const { supabase, profile } = useAuth();
  const router = useRouter();

  // Form state
  const [code, setCode] = useState(prefillCode.toUpperCase());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeResult, setCodeResult] = useState<CodeResult | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  // Prefill code from URL
  useEffect(() => {
    if (prefillCode) setCode(prefillCode.toUpperCase());
  }, [prefillCode]);

  // Auto-redeem if coming back from login with a stored code
  useEffect(() => {
    if (fromLogin && profile?.id) {
      const storedCode = sessionStorage.getItem("pendingCode");
      if (storedCode) {
        sessionStorage.removeItem("pendingCode");
        setCode(storedCode);
        // Look up and redeem automatically
        handleCodeSubmitWithCode(storedCode);
      }
    }
  }, [fromLogin, profile?.id]);

  // ─── Validate & Preview Code ──────────────────────────
  const handleCodeSubmit = useCallback(async () => {
    if (!code.trim()) {
      setError("Please enter a code");
      return;
    }
    await handleCodeSubmitWithCode(code);
  }, [code, profile?.id, supabase, router]);

  const handleCodeSubmitWithCode = async (codeToUse: string) => {
    setLoading(true);
    setError(null);
    setCodeResult(null);

    try {
      // Look up the code to see what it unlocks
      const { data: codeData } = await supabase
        .from("access_codes")
        .select(
          `id, business_id, code, unlocks, type, businesses!inner(id, name, slug, logo_url, brand_color)`,
        )
        .eq("code", codeToUse.toUpperCase().trim())
        .eq("is_active", true)
        .single();

      if (!codeData) {
        setError("Invalid or expired code. Ask the business for a valid code.");
        setLoading(false);
        return;
      }

      const business = codeData.businesses;
      const baseResult: CodeResult = {
        business_name: business.name,
        business_slug: business.slug,
        business_logo: business.logo_url,
        business_color: business.brand_color,
        unlocks: codeData.unlocks,
        code: codeData.code,
        redirect_url: `/${business.slug}/${codeData.unlocks === "trivia" ? "trivia" : "spin"}`,
      };

      // If code unlocks a draw, get draw details
      if (codeData.unlocks === "draw" || codeData.unlocks === "both") {
        const { data: draw } = await supabase
          .from("draws")
          .select("name, prize_name, entry_ends_at")
          .eq("access_code_id", codeData.id)
          .eq("status", "open")
          .single();

        if (draw) {
          baseResult.draw_name = draw.name;
          baseResult.draw_prize = draw.prize_name;
          baseResult.draw_ends_at = draw.entry_ends_at;
          baseResult.redirect_url = `/${business.slug}/draw`;
        }
      }

      // If code unlocks trivia, get trivia details
      if (codeData.unlocks === "trivia" || codeData.unlocks === "both") {
        const { data: challenge } = await supabase
          .from("challenges")
          .select("name, starts_at")
          .eq("business_id", business.id)
          .eq("challenge_type", "trivia")
          .eq("status", "active")
          .single();

        if (challenge) {
          baseResult.trivia_name = challenge.name;
          baseResult.trivia_time = challenge.starts_at;
        }
      }

      setCodeResult(baseResult);

      // If user IS logged in, redeem immediately
      if (profile?.id) {
        await redeemAndRedirect(codeData.code);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ─── Redeem Code (logged in user) ─────────────────────
  const redeemAndRedirect = async (codeToRedeem: string) => {
    setRedeeming(true);
    try {
      const { data, error: rpcError } = await supabase.rpc(
        "redeem_access_code",
        {
          p_code: codeToRedeem.toUpperCase().trim(),
          p_user_id: profile!.id,
        },
      );

      if (rpcError) throw rpcError;
      if (!data.success) {
        setError(data.error);
        setRedeeming(false);
        return;
      }

      toast.success(`Connected to ${data.business_name}!`);

      // Redirect to the right destination
      setTimeout(() => {
        router.push(data.redirect_url);
      }, 1200);
    } catch (err: any) {
      setError(err.message);
      setRedeeming(false);
    }
  };

  // ─── Redirect to login with code stored ───────────────
  const handleGoToLogin = () => {
    if (codeResult?.code) {
      sessionStorage.setItem("pendingCode", codeResult.code);
    }
    router.push(
      `/login?tab=signup&redirect=${encodeURIComponent(`/spin?code=${codeResult?.code || code}&fromLogin=true`)}`,
    );
  };

  // ─── Render ───────────────────────────────────────────
  const destConfig = codeResult
    ? DESTINATION_CONFIG[codeResult.unlocks] || DESTINATION_CONFIG.spin
    : null;

  return (
    <>
      <GamingBackground />
      <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block"
            >
              {destConfig ? (
                <destConfig.icon className="h-16 w-16 text-purple-500 mx-auto" />
              ) : (
                <QrCode className="h-16 w-16 text-purple-500 mx-auto" />
              )}
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
              {destConfig ? destConfig.label : "Enter Your Code"}
            </h1>
            <p className="text-gray-500 dark:text-purple-300 mt-2">
              {destConfig
                ? `You've been invited by ${codeResult?.business_name}`
                : "Got a code from a business? Enter it here."}
            </p>
          </div>

          <Card className="backdrop-blur border-gray-200 dark:border-white/10 shadow-lg dark:shadow-none">
            <CardContent className="p-6">
              <AnimatePresence mode="wait">
                {/* ─── CODE ENTRY ─────────────────────────── */}
                <motion.div
                  key="code-entry"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Code Input */}
                  <div>
                    <Label className="text-gray-700 dark:text-white">
                      Access Code
                    </Label>
                    <Input
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                        setError(null);
                        setCodeResult(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
                      placeholder="e.g., BREW-FRIDAY"
                      className="mt-2 text-lg font-mono tracking-widest text-center bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 h-14"
                      autoFocus
                      disabled={loading || redeeming}
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  {/* Code Preview — shows what this code unlocks */}
                  {codeResult && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-3"
                    >
                      {/* Business */}
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-white/5">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                          style={{
                            backgroundColor:
                              codeResult.business_color || "#8B5CF6",
                          }}
                        >
                          {codeResult.business_name?.[0] || "?"}
                        </div>
                        <div>
                          <p className="text-gray-900 dark:text-white font-semibold">
                            {codeResult.business_name}
                          </p>
                          <p className="text-gray-500 dark:text-purple-300 text-xs">
                            {codeResult.unlocks === "spin" && "Spin & Win"}
                            {codeResult.unlocks === "trivia" &&
                              "Trivia Challenge"}
                            {codeResult.unlocks === "draw" && "Prize Draw"}
                            {codeResult.unlocks === "both" && "Spin & Draw"}
                          </p>
                        </div>
                      </div>

                      {/* What you'll get */}
                      <div
                        className={cn(
                          "p-4 rounded-lg border",
                          destConfig?.bgGlow,
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {destConfig && (
                            <destConfig.icon className="h-5 w-5 text-purple-500" />
                          )}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {destConfig?.description}
                          </span>
                        </div>

                        {/* Draw-specific info */}
                        {codeResult.draw_name && (
                          <div className="mt-2 space-y-1 text-sm">
                            <p className="text-gray-600 dark:text-amber-300">
                              <Trophy className="h-3.5 w-3.5 inline mr-1" />
                              {codeResult.draw_name}
                            </p>
                            {codeResult.draw_prize && (
                              <p className="text-gray-500 dark:text-amber-200/70">
                                Prize: {codeResult.draw_prize}
                              </p>
                            )}
                            {codeResult.draw_ends_at && (
                              <p className="text-gray-400 dark:text-amber-200/50 text-xs">
                                <Clock className="h-3 w-3 inline mr-1" />
                                Entries close{" "}
                                {new Date(
                                  codeResult.draw_ends_at,
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Trivia-specific info */}
                        {codeResult.trivia_name && (
                          <div className="mt-2 space-y-1 text-sm">
                            <p className="text-gray-600 dark:text-blue-300">
                              <Brain className="h-3.5 w-3.5 inline mr-1" />
                              {codeResult.trivia_name}
                            </p>
                            {codeResult.trivia_time && (
                              <p className="text-gray-400 dark:text-blue-200/50 text-xs">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {new Date(
                                  codeResult.trivia_time,
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* NOT logged in - redirect to login */}
                      {!profile && (
                        <div className="space-y-3 pt-2">
                          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-center">
                            <p className="text-purple-700 dark:text-purple-300 text-sm mb-3">
                              You need an account to use this code. It's free
                              and takes 30 seconds!
                            </p>
                            <Button
                              onClick={handleGoToLogin}
                              className="w-full h-11 gap-2 bg-gradient-to-r from-purple-600 to-pink-600"
                            >
                              <LogIn className="h-4 w-4" /> Sign Up or Login to
                              Continue
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Already logged in — redeeming */}
                      {profile && redeeming && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 text-sm">
                          <CheckCircle className="h-4 w-4 flex-shrink-0" />
                          Redeeming your code...
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Submit button (only show if code entered and not yet validated) */}
                  {!codeResult && (
                    <Button
                      onClick={handleCodeSubmit}
                      disabled={loading || !code.trim()}
                      className="w-full h-12 text-lg gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          Continue <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </Button>
                  )}

                  {profile && (
                    <p className="text-xs text-center text-gray-400 dark:text-white/40">
                      Signed in as {profile.email}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-gray-400 dark:text-white/30 text-sm mt-6">
            Don't have a code? Ask your favorite local business for one!
          </p>

          <div className="text-center mt-8 pt-8 border-t border-gray-200 dark:border-white/5">
            <p className="text-gray-400 dark:text-white/50 text-sm mb-3">
              Are you a business?
            </p>
            <Link href="/business/signup">
              <Button
                variant="outline"
                className="border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white"
              >
                <Store className="h-4 w-4 mr-2" />
                Create Your Free Account
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
