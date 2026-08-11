// app/(store)/account/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  Gift,
  Trophy,
  Store,
  RotateCcw,
  ArrowRight,
  Loader2,
  LogOut,
  Brain,
  Ticket,
  Coins,
  Share2,
  Copy,
  Menu,
  Settings,
  HelpCircle,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CustomerAccountPage() {
  const { supabase, profile, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allBusinesses, setAllBusinesses] = useState<any[]>([]);
  const [spinHistory, setSpinHistory] = useState<any[]>([]);
  const [drawEntries, setDrawEntries] = useState<any[]>([]);
  const [triviaHistory, setTriviaHistory] = useState<any[]>([]);
  const [redeemedCodes, setRedeemedCodes] = useState<any[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [selectedTab, setSelectedTab] = useState("businesses");
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  const loadData = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const [businessesRes, spinsRes, drawsRes, triviaRes, codesRes] =
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
        ]);

      const biz = businessesRes.data || [];
      setAllBusinesses(biz);
      setTotalPoints(
        biz.reduce((s: number, b: any) => s + (b.points || 0), 0) || 0,
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
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl md:text-2xl flex-shrink-0">
                {profile?.full_name?.[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-2xl font-bold text-white truncate">
                  {profile?.full_name || "Player"}
                </h1>
                <p className="text-sm md:text-base text-white/60 truncate">
                  {profile?.email}
                </p>
              </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/60 hover:text-white flex-shrink-0"
                  aria-label="Account menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-white/10 text-white w-full max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-white">Account Menu</DialogTitle>
                  <DialogDescription className="text-white/50">
                    Quick navigation and account actions
                  </DialogDescription>
                </DialogHeader>

                <nav className="flex flex-col gap-1 py-2">
                  <button
                    onClick={() => {
                      setSelectedTab("businesses");
                      setDialogOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Store className="h-4 w-4 text-purple-400" />
                    My Businesses
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTab("spins");
                      setDialogOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4 text-green-400" />
                    Spin History
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTab("draws");
                      setDialogOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Trophy className="h-4 w-4 text-amber-400" />
                    Draw Entries
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTab("trivia");
                      setDialogOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Brain className="h-4 w-4 text-blue-400" />
                    Trivia Participation
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTab("rewards");
                      setDialogOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Coins className="h-4 w-4 text-yellow-400" />
                    Redeem Points
                  </button>
                  <Link
                    href="/account/referral"
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Share2 className="h-4 w-4 text-pink-400" />
                    Referral Dashboard
                  </Link>
                  <Link
                    href="/docs"
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <HelpCircle className="h-4 w-4 text-cyan-400" />
                    Documentation
                  </Link>
                  <Link
                    href="/account/settings"
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-white/40" />
                    Settings
                  </Link>
                </nav>

                <div className="flex justify-between border-t border-white/10 pt-3">
                  <Button
                    variant="ghost"
                    onClick={signOut}
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>

                  {/* Back home */}
                  <Button
                    variant="ghost"
                    onClick={() => {
                      router.push("/");
                      setDialogOpen(false);
                    }}
                    className="w-full justify-start text-green/70 hover:text-white hover:bg-white/5 mt-1"
                  >
                    <Undo2 className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-3 md:p-4 text-center">
                <Store className="h-4 w-4 md:h-5 md:w-5 text-purple-400 mx-auto mb-1" />
                <p className="text-xl md:text-2xl font-bold text-white">
                  {allBusinesses.length}
                </p>
                <p className="text-xs text-white/40">Businesses</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-3 md:p-4 text-center">
                <RotateCcw className="h-4 w-4 md:h-5 md:w-5 text-green-400 mx-auto mb-1" />
                <p className="text-xl md:text-2xl font-bold text-white">
                  {spinHistory.length}
                </p>
                <p className="text-xs text-white/40">Total Spins</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-3 md:p-4 text-center">
                <Brain className="h-4 w-4 md:h-5 md:w-5 text-blue-400 mx-auto mb-1" />
                <p className="text-xl md:text-2xl font-bold text-white">
                  {triviaHistory.length}
                </p>
                <p className="text-xs text-white/40">Trivia Joined</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-3 md:p-4 text-center">
                <Trophy className="h-4 w-4 md:h-5 md:w-5 text-amber-400 mx-auto mb-1" />
                <p className="text-xl md:text-2xl font-bold text-white">
                  {drawEntries.length}
                </p>
                <p className="text-xs text-white/40">Draws Joined</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          defaultValue="businesses"
        >
          {/* Scrollable Tabs */}
          <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <TabsList className="border border-white/10 inline-flex w-max min-w-full text-white">
              <TabsTrigger value="businesses" className="whitespace-nowrap">
                <Store className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="hidden xs:inline">My Businesses</span>
                <span className="xs:hidden">Biz</span>
              </TabsTrigger>
              <TabsTrigger value="spins" className="whitespace-nowrap">
                <RotateCcw className="h-4 w-4 mr-2 flex-shrink-0" />
                Spins
              </TabsTrigger>
              <TabsTrigger value="draws" className="whitespace-nowrap">
                <Trophy className="h-4 w-4 mr-2 flex-shrink-0" />
                Draws
              </TabsTrigger>
              <TabsTrigger value="trivia" className="whitespace-nowrap">
                <Brain className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="hidden xs:inline">Trivia</span>
                <span className="xs:hidden">Quiz</span>
              </TabsTrigger>
              <TabsTrigger value="codes" className="whitespace-nowrap">
                <Ticket className="h-4 w-4 mr-2 flex-shrink-0" />
                Codes
              </TabsTrigger>
              <TabsTrigger value="rewards" className="whitespace-nowrap">
                <Gift className="h-4 w-4 mr-2 flex-shrink-0" />
                Rewards
              </TabsTrigger>
              <TabsTrigger value="refer" className="whitespace-nowrap">
                <Share2 className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="hidden xs:inline">Referral Program</span>
                <span className="xs:hidden">Refer</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* My Businesses */}
          <TabsContent value="businesses" className="space-y-4 mt-6">
            {allBusinesses.length === 0 ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-8 md:p-12 text-center">
                  <Store className="h-10 w-10 md:h-12 md:w-12 text-white/10 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">
                    No Businesses Yet
                  </h3>
                  <p className="text-white/40 mb-4 text-sm md:text-base">
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
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div
                            className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white font-bold text-base md:text-lg flex-shrink-0"
                            style={{
                              backgroundColor: biz.brand_color || "#8B5CF6",
                            }}
                          >
                            {biz.business_name?.[0] || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold text-sm md:text-base truncate">
                              {biz.business_name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
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
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-right flex-shrink-0">
                            <p className="text-white font-bold text-sm md:text-base">
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
                            <p className="text-white/40 text-xs hidden sm:block">
                              {biz.tier?.toUpperCase() || "BRONZE"} •{" "}
                              {biz.lifetime_points || 0} lifetime
                            </p>
                          </div>
                          <Button
                            asChild
                            size="sm"
                            className="flex-shrink-0"
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
            <Card className="bg-white/5 border-white/10 mt-6">
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
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-white/5 gap-2 sm:gap-0"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
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
                        <span className="text-white/30 text-xs flex-shrink-0">
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
            <Card className="bg-white/5 border-white/10 mt-6">
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
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-white/5 gap-2 sm:gap-0"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
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
                        <span className="text-white/30 text-xs flex-shrink-0">
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
            <Card className="bg-white/5 border-white/10 mt-6">
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
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-white/5 gap-2 sm:gap-0"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
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
                        <span className="text-white/30 text-xs flex-shrink-0">
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
            <Card className="bg-white/5 border-white/10 mt-6">
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
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-white/5 gap-2 sm:gap-0"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
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
                        <span className="text-white/30 text-xs flex-shrink-0">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/20">
                <CardContent className="p-6 text-center">
                  <Trophy className="h-10 w-10 md:h-12 md:w-12 text-yellow-400 mx-auto mb-2" />
                  <p className="text-2xl md:text-3xl font-bold text-white">
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
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                              style={{
                                backgroundColor: biz.brand_color || "#8B5CF6",
                              }}
                            >
                              {biz.business_name?.[0] || "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white text-sm font-medium truncate">
                                {biz.business_name}
                              </p>
                              <p className="text-white/40 text-xs">
                                {biz.points || 0} pts
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
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
          <TabsContent value="refer" className="space-y-6 mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-purple-400" />
                  Refer Businesses & Earn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-white/70 text-sm md:text-base">
                    Share your referral link with businesses. When they
                    subscribe, you earn:
                  </p>
                  <ul className="text-sm text-white/70 space-y-1 list-disc list-inside ml-2">
                    <li>
                      <span className="text-green-400 font-medium">
                        One-time: 50% commission
                      </span>{" "}
                      on their first payment only
                    </li>
                    <li>
                      <span className="text-blue-400 font-medium">
                        Recurring: 10% commission
                      </span>{" "}
                      on every payment
                    </li>
                    <li>
                      <span className="text-purple-400 font-medium">
                        Loyalty points
                      </span>{" "}
                      (commission × 100) awarded immediately regardless of which
                      option you choose
                    </li>
                  </ul>
                  <p className="text-white/40 text-xs mt-1">
                    💰 Cash payouts via Paystack/M-Pesa (min. $100 threshold) •
                    🎮 Points usable for spins, draws & trivia
                  </p>
                  <p className="text-white/30 text-xs">
                    Choose either one-time or recurring — not both
                  </p>
                </div>

                {profile?.referral_enrolled ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-xs border-green-500/20 text-green-400 bg-green-500/10"
                    >
                      Enrolled ({profile.referral_commission_type || "one_time"}
                      )
                    </Badge>
                    {profile.referral_commission_type === "one_time" ? (
                      <span className="text-white/30 text-xs">
                        💰 50% one-time only
                      </span>
                    ) : (
                      <span className="text-white/30 text-xs">
                        🔄 10% recurring only
                      </span>
                    )}
                  </div>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-xs border-yellow-500/20 text-yellow-400 bg-yellow-500/10"
                  >
                    Not Enrolled — Visit dashboard to join
                  </Badge>
                )}

                {profile?.referral_code && (
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="px-3 py-2 bg-black/30 rounded-lg font-mono text-purple-300 text-sm flex-1 min-w-[150px] truncate">
                      {profile.referral_code}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          `${window.location.origin}/business/signup?ref=${profile.referral_code}`,
                        )
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
