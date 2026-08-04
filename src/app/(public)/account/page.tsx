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
  LogOut,
  Brain,
  Ticket,
  Coins,
  Share2,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function CustomerAccountPage() {
  const { supabase, profile, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allBusinesses, setAllBusinesses] = useState<any[]>([]);
  const [spinHistory, setSpinHistory] = useState<any[]>([]);
  const [drawEntries, setDrawEntries] = useState<any[]>([]);
  const [triviaHistory, setTriviaHistory] = useState<any[]>([]);
  const [redeemedCodes, setRedeemedCodes] = useState<any[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [lifetimePoints, setLifetimePoints] = useState(0);
  const [pointsConfig, setPointsConfig] = useState<{
    pointsPerKsh: number;
  } | null>(null);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const [businessesRes, spinsRes, drawsRes, triviaRes, codesRes, cfgRes] =
        await Promise.all([
          supabase.rpc("get_customer_all_points", {
            p_user_id: profile.id,
          }),
          supabase
            .from("spin_attempts")
            .select(
              "*, spin_games!inner(name, business_id, businesses!inner(name, slug))",
            )
            .eq("user_id", profile.id)
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("draw_entries")
            .select(
              "*, draws!inner(name, business_id, businesses!inner(name, slug))",
            )
            .eq("user_id", profile.id)
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("challenge_participants")
            .select(
              "*, challenges!inner(name, business_id, businesses!inner(name, slug))",
            )
            .eq("user_id", profile.id)
            .order("joined_at", { ascending: false })
            .limit(20),
          supabase
            .from("access_code_usage")
            .select(
              "*, access_codes!inner(code, business_id, businesses!inner(name, slug))",
            )
            .eq("user_id", profile.id)
            .order("used_at", { ascending: false })
            .limit(20),
          supabase
            .from("points_config")
            .select("points_per_ksh")
            .eq("id", 1)
            .maybeSingle(),
        ]);

      const biz = businessesRes.data || [];
      setAllBusinesses(biz);
      setTotalPoints(
        biz.reduce((s: number, b: any) => s + (b.points || 0), 0) || 0,
      );
      setLifetimePoints(
        biz.reduce((s: number, b: any) => s + (b.lifetime_points || 0), 0) || 0,
      );
      setPointsConfig(
        cfgRes.data
          ? { pointsPerKsh: cfgRes.data.points_per_ksh || 10 }
          : { pointsPerKsh: 10 },
      );

      setSpinHistory(spinsRes.data || []);
      setDrawEntries(drawsRes.data || []);
      setTriviaHistory(triviaRes.data || []);
      setRedeemedCodes(codesRes.data || []);
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
                  {allBusinesses.length}
                </p>
                <p className="text-xs text-white/40">Businesses</p>
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
                  {lifetimePoints.toLocaleString()}
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
            <TabsTrigger value="spins">
              <RotateCcw className="h-4 w-4 mr-2" />
              Spins
            </TabsTrigger>
            <TabsTrigger value="draws">
              <Trophy className="h-4 w-4 mr-2" />
              Draws
            </TabsTrigger>
            <TabsTrigger value="trivia">
              <Brain className="h-4 w-4 mr-2" />
              Trivia
            </TabsTrigger>
            <TabsTrigger value="codes">
              <Ticket className="h-4 w-4 mr-2" />
              Codes
            </TabsTrigger>
            <TabsTrigger value="rewards">
              <Gift className="h-4 w-4 mr-2" />
              Rewards
            </TabsTrigger>
            <TabsTrigger value="refer">
              <Share2 className="h-4 w-4 mr-2" />
              Referral Program
            </TabsTrigger>
          </TabsList>

          {/* My Businesses */}
          <TabsContent value="businesses" className="space-y-4">
            {allBusinesses.length === 0 ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-12 text-center">
                  <Store className="h-12 w-12 text-white/10 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">
                    No Businesses Yet
                  </h3>
                  <p className="text-white/40 mb-4">
                    Redeem codes from businesses to start earning points!
                  </p>
                  <Button asChild>
                    <Link href="/spin">Enter a Code</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              allBusinesses.map((biz, i) => (
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
                                {biz.is_active ? "Active" : "Inactive"}
                              </Badge>
                              {biz.is_active && biz.expires_at && (
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
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-white font-bold">
                              {biz.points || 0} pts
                            </p>
                            <p className="text-yellow-400 text-xs">
                              ⭐ Worth{" "}
                              {(biz.points_value != null
                                ? (biz.points || 0) * biz.points_value
                                : (biz.points || 0) /
                                  (biz.points_per_redemption || 10)
                              ).toFixed(2)}
                            </p>
                            <p className="text-white/40 text-xs">
                              {biz.tier?.toUpperCase() || "BRONZE"} •{" "}
                              {biz.lifetime_points || 0} lifetime
                            </p>
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

          {/* Spins */}
          <TabsContent value="spins">
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

          {/* Draws */}
          <TabsContent value="draws">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Draw Entries</CardTitle>
              </CardHeader>
              <CardContent>
                {drawEntries.length === 0 ? (
                  <p className="text-white/40 text-center py-8">
                    No draw entries yet. Redeem codes that unlock draws to
                    participate!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {drawEntries.slice(0, 15).map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: "#EC4899" }}
                          />
                          <div>
                            <p className="text-white text-sm">
                              {entry.draws?.name || "Unknown Draw"}
                            </p>
                            <p className="text-white/40 text-xs">
                              {entry.entry_count} entry
                              {entry.entry_count !== 1 ? "ies" : ""} •{" "}
                              {entry.draws?.businesses?.name ||
                                "Unknown Business"}
                            </p>
                          </div>
                        </div>
                        <span className="text-white/30 text-xs">
                          {formatDistanceToNow(new Date(entry.created_at), {
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

          {/* Trivia */}
          <TabsContent value="trivia">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">
                  Trivia Participation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {triviaHistory.length === 0 ? (
                  <p className="text-white/40 text-center py-8">
                    No trivia yet. Join trivia challenges at businesses!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {triviaHistory.slice(0, 15).map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: "#10B981" }}
                          />
                          <div>
                            <p className="text-white text-sm">
                              {entry.challenges?.name || "Unknown Trivia"}
                            </p>
                            <p className="text-white/40 text-xs">
                              Score: {entry.current_score || 0} • Rank: #
                              {entry.current_rank || "N/A"} •{" "}
                              {entry.challenges?.businesses?.name ||
                                "Unknown Business"}
                            </p>
                          </div>
                        </div>
                        <span className="text-white/30 text-xs">
                          {formatDistanceToNow(new Date(entry.joined_at), {
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

          {/* Codes */}
          <TabsContent value="codes">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Codes Redeemed</CardTitle>
              </CardHeader>
              <CardContent>
                {redeemedCodes.length === 0 ? (
                  <p className="text-white/40 text-center py-8">
                    No codes redeemed yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {redeemedCodes.slice(0, 15).map((code, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: "#F59E0B" }}
                          />
                          <div>
                            <p className="text-white text-sm font-mono">
                              {code.access_codes?.code || "UNKNOWN"}
                            </p>
                            <p className="text-white/40 text-xs">
                              {code.access_codes?.businesses?.name ||
                                "Unknown Business"}
                            </p>
                          </div>
                        </div>
                        <span className="text-white/30 text-xs">
                          {formatDistanceToNow(new Date(code.used_at), {
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
          <TabsContent value="rewards">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/20">
                <CardContent className="p-6 text-center">
                  <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-white">
                    {totalPoints.toLocaleString()}
                  </p>
                  <p className="text-yellow-300/80">Total Points</p>
                  <p className="text-white/40 text-sm mt-2">
                    Worth{" "}
                    {allBusinesses.length > 0
                      ? allBusinesses
                          .reduce(
                            (s, b) =>
                              s +
                              (b.points_value != null
                                ? (b.points || 0) * b.points_value
                                : (b.points || 0) /
                                  (b.points_per_redemption || 10)),
                            0,
                          )
                          .toFixed(2)
                      : "0.00"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Coins className="h-5 w-5 text-purple-400" />
                    Points Worth Per Business
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {allBusinesses.length === 0 ? (
                    <p className="text-white/40 text-center py-4 text-sm">
                      No points yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {allBusinesses.map((biz) => (
                        <div
                          key={biz.business_id}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                              style={{
                                backgroundColor: biz.brand_color || "#8B5CF6",
                              }}
                            >
                              {biz.business_name?.[0] || "?"}
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">
                                {biz.business_name}
                              </p>
                              <p className="text-white/40 text-xs">
                                {biz.points || 0} pts
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-yellow-400 text-sm font-medium">
                              {biz.points_value != null
                                ? (biz.points || 0) * biz.points_value
                                : (biz.points || 0) /
                                  (biz.points_per_redemption || 10)}
                            </p>
                            <p className="text-white/30 text-xs">
                              {biz.is_active ? "Active" : "Inactive"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6 bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">
                  How to Redeem Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/50 text-sm leading-relaxed">
                  Points are redeemed at the business during checkout. Tell the
                  cashier you want to pay with points. They will verify your
                  account and deduct points from your balance for that business.
                  Your points never expire as long as you keep engaging.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referral Program Tab */}
          <TabsContent value="refer" className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-purple-400" />
                  Refer Businesses & Earn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-white/70">
                  Share your referral link with businesses. When they subscribe,
                  you earn a 50% commission on their first payment as loyalty
                  points.
                </p>

                {profile?.referral_code && (
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-2 bg-black/30 rounded-lg font-mono text-purple-300">
                      {profile.referral_code}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        navigator.clipboard.writeText(profile.referral_code!)
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <Button asChild variant="outline" size="sm">
                  <Link href="/account/referral" className="gap-2">
                    Full Referral Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
