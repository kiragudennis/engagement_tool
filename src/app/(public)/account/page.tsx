// app/(store)/account/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  Gift,
  Star,
  Trophy,
  Store,
  RotateCcw,
  ArrowRight,
  Loader2,
  Crown,
  History,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function CustomerAccountPage() {
  const { supabase, profile, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeBusinesses, setActiveBusinesses] = useState<any[]>([]);
  const [pointsSummary, setPointsSummary] = useState<any[]>([]);
  const [spinHistory, setSpinHistory] = useState<any[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [redemptionOptions, setRedemptionOptions] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;

    try {
      // Active businesses
      const { data: businesses } = await supabase.rpc(
        "get_user_active_businesses",
        {
          p_user_id: profile.id,
        },
      );
      setActiveBusinesses(businesses || []);

      // Points
      const { data: points } = await supabase.rpc(
        "get_customer_points_summary",
        {
          p_user_id: profile.id,
        },
      );
      setPointsSummary(points || []);
      setTotalPoints(
        points?.reduce((s: number, p: any) => s + (p.points || 0), 0) || 0,
      );

      // Spin history
      const { data: spins } = await supabase
        .from("spin_attempts")
        .select(
          "*, spin_games!inner(name, business_id, businesses!inner(name, slug))",
        )
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setSpinHistory(spins || []);

      // Redemption options
      const { data: options } = await supabase
        .from("points_redemption_options")
        .select("*")
        .eq("is_active", true)
        .order("points_required", { ascending: true });
      setRedemptionOptions(options || []);
    } catch (err) {
      console.error("Error loading account:", err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-white/5">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl">
                {profile?.full_name?.[0] || "?"}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {profile?.full_name || "Player"}
                </h1>
                <p className="text-white/60">{profile?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={signOut}
              className="text-white/60 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>

          {/* Points Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <Star className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">
                  {totalPoints.toLocaleString()}
                </p>
                <p className="text-xs text-white/40">Total Points</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <Store className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">
                  {activeBusinesses.length}
                </p>
                <p className="text-xs text-white/40">Active Businesses</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <RotateCcw className="h-5 w-5 text-green-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">
                  {spinHistory.length}
                </p>
                <p className="text-xs text-white/40">Total Spins</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <Crown className="h-5 w-5 text-amber-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">
                  {pointsSummary
                    .reduce(
                      (s: number, p: any) => s + (p.lifetime_points || 0),
                      0,
                    )
                    .toLocaleString()}
                </p>
                <p className="text-xs text-white/40">Lifetime Points</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="businesses" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="businesses">
              <Store className="h-4 w-4 mr-2" />
              My Businesses
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="rewards">
              <Gift className="h-4 w-4 mr-2" />
              Rewards
            </TabsTrigger>
          </TabsList>

          {/* My Businesses */}
          <TabsContent value="businesses" className="space-y-4">
            {activeBusinesses.length === 0 ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-12 text-center">
                  <Store className="h-12 w-12 text-white/10 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">
                    No Active Businesses
                  </h3>
                  <p className="text-white/40 mb-4">
                    Ask a business for a code to get started!
                  </p>
                  <Button asChild>
                    <Link href="/spin">Enter a Code</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              activeBusinesses.map((biz, i) => (
                <motion.div
                  key={biz.business_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                            style={{
                              backgroundColor: biz.brand_color || "#8B5CF6",
                            }}
                          >
                            {biz.business_name?.[0] || "?"}
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">
                              {biz.business_name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                className={cn(
                                  "text-xs",
                                  biz.is_active
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-red-500/20 text-red-400",
                                )}
                              >
                                {biz.is_active ? "Active" : "Expired"}
                              </Badge>
                              {biz.expires_at && biz.is_active && (
                                <span className="text-white/40 text-xs">
                                  Expires{" "}
                                  {formatDistanceToNow(
                                    new Date(biz.expires_at),
                                    { addSuffix: true },
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-white font-bold">
                              {biz.spins_used} spins
                            </p>
                            {pointsSummary.find(
                              (p: any) => p.business_slug === biz.business_slug,
                            )?.points > 0 && (
                              <p className="text-yellow-400 text-xs">
                                ⭐{" "}
                                {
                                  pointsSummary.find(
                                    (p: any) =>
                                      p.business_slug === biz.business_slug,
                                  )?.points
                                }{" "}
                                pts
                              </p>
                            )}
                          </div>
                          <Button
                            asChild
                            size="sm"
                            style={{ backgroundColor: biz.brand_color }}
                          >
                            <Link href={`/${biz.business_slug}/spin`}>
                              Spin <ArrowRight className="h-3 w-3 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* History */}
          <TabsContent value="history">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Recent Spins</CardTitle>
              </CardHeader>
              <CardContent>
                {spinHistory.length === 0 ? (
                  <p className="text-white/40 text-center py-8">
                    No spins yet. Visit a business to start spinning!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {spinHistory.slice(0, 15).map((spin, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: "#8B5CF6" }}
                          />
                          <div>
                            <p className="text-white text-sm">
                              {spin.prize_type === "points" &&
                              spin.points_awarded > 0
                                ? `Won ${spin.points_awarded} Points`
                                : `Won ${spin.prize_value || spin.prize_type}`}
                            </p>
                            <p className="text-white/40 text-xs">
                              {spin.spin_games?.businesses?.name ||
                                "Unknown Business"}
                            </p>
                          </div>
                        </div>
                        <span className="text-white/30 text-xs">
                          {formatDistanceToNow(new Date(spin.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rewards */}
          <TabsContent value="rewards" className="space-y-6">
            <Card className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/20">
              <CardContent className="p-6 text-center">
                <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">
                  {totalPoints.toLocaleString()}
                </p>
                <p className="text-yellow-300/80">Points Available</p>
                <p className="text-white/40 text-sm mt-2">
                  Earn points by spinning and playing trivia at any business
                </p>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              {redemptionOptions.map((option, i) => (
                <Card
                  key={i}
                  className={cn(
                    "bg-white/5 border-white/10",
                    totalPoints < option.points_required && "opacity-50",
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-white font-semibold">
                          {option.name}
                        </h3>
                        <p className="text-white/50 text-sm mt-1">
                          {option.description}
                        </p>
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-400">
                        {option.points_required} pts
                      </Badge>
                    </div>
                    <Button
                      className="w-full"
                      disabled={totalPoints < option.points_required}
                      variant={
                        totalPoints >= option.points_required
                          ? "default"
                          : "outline"
                      }
                    >
                      {totalPoints >= option.points_required
                        ? "Redeem"
                        : `Need ${option.points_required - totalPoints} more points`}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
