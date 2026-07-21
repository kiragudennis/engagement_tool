// app/(public)/[businessSlug]/code-entry/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Brain,
  Trophy,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import GamingBackground from "@/components/GamingBackground";

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

export default function BusinessCodeEntryPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const searchParams = useSearchParams();
  const prefillCode = searchParams.get("code") || "";

  const { supabase, codeResponse, profile } = useAuth();
  const router = useRouter();

  const [business, setBusiness] = useState<any>(null);
  const [code, setCode] = useState(prefillCode.toUpperCase());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeResult, setCodeResult] = useState<any>(codeResponse || null);
  const [redeeming, setRedeeming] = useState(false);

  // Load business
  useEffect(() => {
    if (!businessSlug) return;
    const load = async () => {
      const { data } = await supabase
        .from("businesses")
        .select("id, name, slug, logo_url, brand_color, brand_secondary_color")
        .eq("slug", businessSlug)
        .single();
      if (data) setBusiness(data);
    };
    load();
  }, [businessSlug, supabase]);

  // Prefill code from URL
  useEffect(() => {
    if (prefillCode) {
      setCode(prefillCode.toUpperCase());
      redeemCode(prefillCode);
    }
  }, [prefillCode]);

  // ─── Look up code ─────────────────────────────────────
  const handleLookup = async () => {
    if (!code.trim()) {
      setError("Please enter a code");
      return;
    }

    setLoading(true);
    setError(null);
    setCodeResult(null);

    try {
      const res = await fetch(
        `/api/customer/code-lookup?code=${encodeURIComponent(code.toUpperCase().trim())}`,
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid code");
        setLoading(false);
        return;
      }

      // Verify code belongs to this business
      if (data.business_slug !== businessSlug) {
        setError(`This code belongs to ${data.business_name}. Redirecting...`);
        setTimeout(
          () =>
            router.push(`/${data.business_slug}/code-entry?code=${data.code}`),
          1500,
        );
        return;
      }

      setCodeResult(data);

      // If logged in, redeem
      if (profile?.id) {
        await redeemCode(data.code);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ─── Redeem code ──────────────────────────────────────
  const redeemCode = async (codeToRedeem: string) => {
    if (!codeToRedeem) return;
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
      setTimeout(() => router.push(data.redirect_url), 1200);
    } catch (err: any) {
      setError(err.message);
      setRedeeming(false);
    }
  };

  // ─── Redirect to login ────────────────────────────────
  const handleGoToLogin = () => {
    if (codeResult?.code)
      sessionStorage.setItem("pendingCode", codeResult.code);
    router.push(
      `/login?tab=signup&redirect=${encodeURIComponent(`/${businessSlug}/code-entry?code=${codeResult?.code || code}`)}`,
    );
  };

  const brandColor = business?.brand_color || "#8B5CF6";
  const destConfig = codeResult
    ? DESTINATION_CONFIG[codeResult.unlocks] || DESTINATION_CONFIG.spin
    : null;

  return (
    <>
      <GamingBackground />
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Business Header */}
          <div className="text-center mb-8">
            {business && (
              <div
                className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                style={{ backgroundColor: brandColor }}
              >
                {business.name[0]}
              </div>
            )}
            <h1 className="text-2xl font-bold">
              {business?.name || "Enter Code"}
            </h1>
            <p className="text-purple-300 mt-1">
              Enter your access code to get started
            </p>
          </div>

          <Card className="bg-black/80 dark:bg-black/50 backdrop-blur border-white/10">
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Access Code</Label>
                <Input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError(null);
                    setCodeResult(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                  placeholder="e.g., BREW-FRIDAY"
                  className="mt-2 text-lg font-mono tracking-widest text-center bg-white/5 border-white/10 text-white placeholder:text-white/30 h-14"
                  autoFocus
                  disabled={loading || redeeming}
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              {/* Code Preview */}
              {codeResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <div
                    className={cn("p-4 rounded-lg border", destConfig?.bgGlow)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {destConfig && (
                        <destConfig.icon className="h-5 w-5 text-purple-500" />
                      )}
                      <span className="font-medium text-white text-center">
                        {destConfig?.description}
                      </span>
                    </div>

                    {codeResult.draw_name && (
                      <div className="mt-2 text-sm text-amber-300">
                        <Trophy className="h-3.5 w-3.5 inline mr-1" />
                        {codeResult.draw_name}
                        {codeResult.draw_prize && (
                          <span className="ml-2 text-amber-200/70">
                            — {codeResult.draw_prize}
                          </span>
                        )}
                      </div>
                    )}

                    {codeResult.trivia_name && (
                      <div className="mt-2 text-sm text-blue-300">
                        <Brain className="h-3.5 w-3.5 inline mr-1" />
                        {codeResult.trivia_name}
                      </div>
                    )}
                  </div>

                  {!profile && (
                    <Button
                      onClick={handleGoToLogin}
                      className="w-full h-11 gap-2 bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      <LogIn className="h-4 w-4" /> Sign Up or Login to Continue
                    </Button>
                  )}

                  {profile && redeeming && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Redeeming...
                    </div>
                  )}
                </motion.div>
              )}

              {!codeResult && (
                <Button
                  onClick={handleLookup}
                  disabled={loading || !code.trim()}
                  className="w-full h-12 text-lg gap-2 bg-gradient-to-r from-purple-600 to-pink-600"
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
                <p className="text-xs text-center text-white/40">
                  Signed in as {profile.email}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
