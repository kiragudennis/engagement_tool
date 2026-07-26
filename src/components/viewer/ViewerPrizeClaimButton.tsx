// components/viewer/ViewerPrizeClaimButton.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Trophy, Coins, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ViewerPrize {
  id: string;
  prize_type: string;
  prize_value: number;
  max_claims_per_user: number;
  max_total_claims: number;
  total_claims: number;
  is_active: boolean;
  game_id: string;
}

interface ViewerPrizeClaimButtonProps {
  businessId: string;
  gameType: "spin" | "draw" | "trivia";
  gameId?: string;
  brandColor: string;
}

export function ViewerPrizeClaimButton({
  businessId,
  gameType,
  gameId,
  brandColor,
}: ViewerPrizeClaimButtonProps) {
  const { supabase, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [viewerPrize, setViewerPrize] = useState<ViewerPrize | null>(null);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const loadPrizeConfig = useCallback(async () => {
    if (!businessId || !gameType || !gameId) return;

    try {
      const { data } = await supabase
        .from("viewer_prizes")
        .select("*")
        .eq("business_id", businessId)
        .eq("game_type", gameType)
        .eq("game_id", gameId)
        .eq("is_active", true)
        .maybeSingle();

      if (data) {
        setViewerPrize(data as ViewerPrize);
      }
    } catch (error) {
      console.error("Failed to load viewer prize config:", error);
    } finally {
      setLoading(false);
    }
  }, [businessId, gameType, gameId, supabase]);

  const handleClaimPrize = async () => {
    if (!profile?.id || claiming) return;

    setClaiming(true);
    try {
      const res = await fetch("/api/business/viewer/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          game_type: gameType,
          game_id: gameId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to claim prize");

      setHasClaimed(true);
      toast.success(
        `Claimed! ${
          data.prize_type === "points"
            ? `+${data.prize_value} points`
            : "Prize awarded"
        }`,
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to claim prize");
    } finally {
      setClaiming(false);
    }
  };

  useEffect(() => {
    if (!viewerPrize || !profile?.id || hasClaimed) return;

    const allClaimed =
      viewerPrize.max_total_claims > 0 &&
      viewerPrize.total_claims >= viewerPrize.max_total_claims;

    if (!allClaimed) {
      const delay = viewerPrize.game_id ? 800 : 300;
      const timer = setTimeout(() => setShowButton(true), delay);
      return () => clearTimeout(timer);
    }
  }, [viewerPrize, profile?.id, hasClaimed]);

  useEffect(() => {
    loadPrizeConfig();
  }, [loadPrizeConfig]);

  if (loading || !profile?.id) return null;

  const allClaimed =
    viewerPrize && viewerPrize.max_total_claims > 0 &&
    viewerPrize.total_claims >= viewerPrize.max_total_claims;

  return (
    <AnimatePresence>
      {showButton && !hasClaimed && !allClaimed && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", bounce: 0.3 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
        >
          <Card
            className="border-2 backdrop-blur"
            style={{
              borderColor: `${brandColor}50`,
              backgroundColor: `${brandColor}15`,
            }}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5" style={{ color: brandColor }} />
                <div>
                  <p className="text-sm font-medium text-white">
                    Prize Available!
                  </p>
                  <p className="text-xs text-white/60">
                    {viewerPrize?.prize_type === "points"
                      ? `+${viewerPrize?.prize_value} points`
                      : "Claim your prize"}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleClaimPrize}
                disabled={claiming}
                size="sm"
                className="gap-1"
                style={{ backgroundColor: brandColor }}
              >
                {claiming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" /> Claim
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {hasClaimed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
        >
          <Badge
            className="bg-green-500/20 text-green-400 border border-green-500/30 px-4 py-2"
            style={{ backdropFilter: "blur(8px)" }}
          >
            <CheckCircle className="h-4 w-4 mr-1" /> Claimed!
          </Badge>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
