// app/(public)/[businessSlug]/draw/[drawId]/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Gift,
  Ticket,
  Loader2,
  Crown,
  Eye,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  brand_color: string;
  brand_secondary_color: string;
}

export default function BusinessDrawPage() {
  const { businessSlug, drawId } = useParams<{
    businessSlug: string;
    drawId: string;
  }>();
  const { supabase, profile } = useAuth();
  const router = useRouter();

  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [draw, setDraw] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState(false);

  // Entry state
  const [userEntries, setUserEntries] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Code entry
  const [codeInput, setCodeInput] = useState("");
  const [activation, setActivation] = useState<any>(null);

  // Winner state
  const [isDrawComplete, setIsDrawComplete] = useState(false);
  const [winners, setWinners] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // ─── Load Data ────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!businessSlug || !drawId) return;

    // Load business
    const { data: biz } = await supabase
      .from("businesses")
      .select("id, name, slug, brand_color, brand_secondary_color")
      .eq("slug", businessSlug)
      .single();
    if (!biz) {
      router.push("/spin");
      return;
    }
    setBusiness(biz);

    // Load draw
    const { data: drawData } = await supabase
      .from("draws")
      .select("*")
      .eq("id", drawId)
      .eq("business_id", biz.id)
      .single();
    if (!drawData) {
      setLoading(false);
      return;
    }
    setDraw(drawData);
    setIsDrawComplete(drawData.status === "completed");

    // Load stats
    const [{ data: entries }, { data: participants }, { data: lb }] =
      await Promise.all([
        supabase
          .from("draw_entries")
          .select("entry_count")
          .eq("draw_id", drawId),
        supabase.from("draw_entries").select("user_id").eq("draw_id", drawId),
        supabase
          .from("draw_entries")
          .select("user_id, entry_count, users!user_id(full_name)")
          .eq("draw_id", drawId)
          .order("entry_count", { ascending: false })
          .limit(10),
      ]);

    setTotalEntries(entries?.reduce((s, e) => s + e.entry_count, 0) || 0);
    setTotalParticipants(new Set(participants?.map((p) => p.user_id)).size);
    setLeaderboard(
      lb?.map((e: any) => ({
        user_id: e.user_id,
        full_name: e.users?.full_name || "Anonymous",
        entry_count: e.entry_count,
      })) || [],
    );

    // Check user activation and entries
    if (profile?.id) {
      const { data: act } = await supabase
        .from("customer_business_activations")
        .select("*")
        .eq("user_id", profile.id)
        .eq("business_id", biz.id)
        .eq("is_active", true)
        .gte("expires_at", new Date().toISOString())
        .single();
      setActivation(act);

      const userEntry = entries?.find((e: any) => e.user_id === profile.id);
      setUserEntries(userEntry?.entry_count || 0);
    }

    // Load winners if completed
    if (drawData.status === "completed") {
      const { data: winnerData } = await supabase
        .from("draw_winners")
        .select("*, users!user_id(full_name)")
        .eq("draw_id", drawId)
        .order("winner_rank", { ascending: true });
      setWinners(winnerData || []);
    }

    setLoading(false);
  }, [businessSlug, drawId, supabase, profile?.id, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Real-time ────────────────────────────────────────
  useEffect(() => {
    if (!drawId) return;
    const ch = supabase
      .channel(`draw-${drawId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "draw_entries",
          filter: `draw_id=eq.${drawId}`,
        },
        () => loadData(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "draws",
          filter: `id=eq.${drawId}`,
        },
        (payload) => {
          if (
            payload.new.status === "completed" &&
            payload.old.status !== "completed"
          ) {
            setIsDrawComplete(true);
            confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
            loadData();
          }
        },
      )
      .subscribe();
    channelRef.current = ch;
    return () => {
      ch.unsubscribe();
    };
  }, [drawId, supabase, loadData]);

  // ─── Enter Draw via Code ──────────────────────────────
  const handleEnterDraw = async () => {
    if (!codeInput.trim()) {
      toast.error("Enter your code");
      return;
    }
    if (!profile) {
      router.push("/login");
      return;
    }
    setEntering(true);
    try {
      const { data, error } = await supabase.rpc("redeem_access_code", {
        p_code: codeInput.toUpperCase().trim(),
        p_user_id: profile.id,
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast.success(
        data.draw_entered
          ? `Entered ${data.draw_name}! +${data.draw_entries || 1} entries`
          : `Activated for ${data.business_name}!`,
      );

      setCodeInput("");
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setEntering(false);
    }
  };

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!isFullscreen) containerRef.current.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, [isFullscreen]);

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!business || !draw) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Draw Not Found</h2>
            <Button asChild className="mt-4">
              <Link href={`/${businessSlug}/spin`}>Back to Spin</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const brandColor = business.brand_color || "#8B5CF6";
  const isEntryOpen =
    draw.status === "open" && new Date(draw.entry_ends_at) > new Date();
  const progressPercent = draw.max_entries_total
    ? (totalEntries / draw.max_entries_total) * 100
    : 0;

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
    >
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-white/5 bg-white dark:bg-black/50 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/${businessSlug}/spin`}
              className="text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: brandColor }}
            >
              {business.name[0]}
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white">
                {draw.name}
              </h1>
              <p className="text-xs text-gray-500">{business.name} Draw</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDrawComplete && (
              <Badge className="bg-green-500 text-white">Completed</Badge>
            )}
            {isEntryOpen && (
              <Badge className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">
                Open
              </Badge>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link
                href={`/${businessSlug}/draw/${drawId}/live`}
                target="_blank"
              >
                <Eye className="h-4 w-4 mr-1" /> Live
              </Link>
            </Button>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prize Display */}
            <Card
              className="overflow-hidden"
              style={{ borderColor: `${brandColor}30` }}
            >
              <div
                className="p-8 text-center"
                style={{
                  background: `linear-gradient(135deg, ${brandColor}10, ${business.brand_secondary_color}10)`,
                }}
              >
                <Gift
                  className="h-20 w-20 mx-auto mb-4"
                  style={{ color: brandColor }}
                />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {draw.prize_name}
                </h2>
                {draw.prize_description && (
                  <p className="text-gray-500 dark:text-white/50 mt-2">
                    {draw.prize_description}
                  </p>
                )}
                {draw.prize_value > 0 && (
                  <Badge
                    className="mt-3 text-lg px-4 py-1.5"
                    style={{
                      backgroundColor: `${brandColor}20`,
                      color: brandColor,
                    }}
                  >
                    KES {draw.prize_value.toLocaleString()}
                  </Badge>
                )}
              </div>
            </Card>

            {/* Winners (if completed) */}
            {isDrawComplete && winners.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-xl text-center mb-6">
                    🏆 Winners
                  </h3>
                  <div className="space-y-3">
                    {winners.map((w, i) => (
                      <motion.div
                        key={w.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.2 }}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl",
                          i === 0
                            ? "bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30"
                            : "bg-white dark:bg-white/5",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {i === 0
                              ? "🥇"
                              : i === 1
                                ? "🥈"
                                : i === 2
                                  ? "🥉"
                                  : `#${i + 1}`}
                          </span>
                          <span
                            className={cn("font-bold", i === 0 && "text-lg")}
                          >
                            {w.users?.full_name || "Winner"}
                          </span>
                        </div>
                        <Badge>{w.prize_name || draw.prize_name}</Badge>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Entry Stats */}
            {isEntryOpen && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Entry Progress</h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <StatBox
                      label="Total Entries"
                      value={totalEntries.toLocaleString()}
                      color={brandColor}
                    />
                    <StatBox
                      label="Participants"
                      value={totalParticipants.toLocaleString()}
                    />
                    <StatBox
                      label="Your Entries"
                      value={userEntries.toLocaleString()}
                      color="text-green-600"
                    />
                  </div>
                  {draw.max_entries_total && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Pool</span>
                        <span>
                          {totalEntries} / {draw.max_entries_total}
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Code Entry */}
            {isEntryOpen && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Ticket className="h-4 w-4" style={{ color: brandColor }} />
                    Enter the Draw
                  </h3>
                  <p className="text-xs text-gray-500">
                    Use a code from {business.name} to get entries
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={codeInput}
                      onChange={(e) =>
                        setCodeInput(e.target.value.toUpperCase())
                      }
                      placeholder="e.g., BREW-DRAW"
                      className="font-mono text-center"
                      onKeyDown={(e) => e.key === "Enter" && handleEnterDraw()}
                      disabled={entering}
                    />
                    <Button
                      onClick={handleEnterDraw}
                      disabled={entering || !codeInput.trim()}
                      style={{ backgroundColor: brandColor }}
                    >
                      {entering ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Enter"
                      )}
                    </Button>
                  </div>
                  {activation && (
                    <Badge className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">
                      ✅ Active
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    Top Entrants
                  </h3>
                  <div className="space-y-2">
                    {leaderboard.slice(0, 8).map((entry, i) => (
                      <div
                        key={entry.user_id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span>
                            {i === 0
                              ? "🥇"
                              : i === 1
                                ? "🥈"
                                : i === 2
                                  ? "🥉"
                                  : `#${i + 1}`}
                          </span>
                          <span
                            className={cn(
                              entry.user_id === profile?.id && "font-bold",
                            )}
                          >
                            {entry.full_name}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {entry.entry_count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Draw Info */}
            <Card>
              <CardContent className="p-4 space-y-2 text-sm">
                <InfoRow
                  label="Entries close"
                  value={format(new Date(draw.entry_ends_at), "MMM d, h:mm a")}
                />
                <InfoRow
                  label="Draw date"
                  value={format(new Date(draw.draw_time), "MMM d, h:mm a")}
                />
                {draw.draw_time > new Date() && (
                  <InfoRow
                    label="Time until draw"
                    value={formatDistanceToNow(new Date(draw.draw_time), {
                      addSuffix: true,
                    })}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-white/5">
      <p className="text-2xl font-bold" style={color ? { color } : {}}>
        {value}
      </p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}
