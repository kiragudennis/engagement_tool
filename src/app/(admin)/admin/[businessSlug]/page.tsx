// app/(admin)/admin/[businessSlug]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  Ticket,
  Users,
  QrCode,
  Copy,
  ExternalLink,
  Loader2,
  Settings,
  ChevronRight,
  RotateCcw,
  Zap,
  Brain,
  Trophy,
  Eye,
  ArrowUpRight,
  Printer,
  ShoppingBag,
  Globe,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { PlanLimitBanner } from "@/components/billing/PlanLimitBanner";
import { getPlanLimits, isUnlimited } from "@/lib/config/plans";

export default function BusinessAdminDashboard() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const { supabase, business, setBusiness } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [spinGame, setSpinGame] = useState<any>(null);
  const [recentSpins, setRecentSpins] = useState<any[]>([]);
  const [publicCodeLabel, setPublicCodeLabel] = useState("");
  const [publicCodeUnlocks, setPublicCodeUnlocks] = useState("spin");
  const [publicCodeRequireActivation, setPublicCodeRequireActivation] =
    useState(true);
  const [generatingPublicCode, setGeneratingPublicCode] = useState(false);
  const [generatedPublicCode, setGeneratedPublicCode] = useState<string | null>(
    null,
  );

  const loadDashboard = useCallback(async () => {
    if (!businessSlug) return;

    try {
      const { data: biz } = await supabase
        .from("businesses")
        .select("*")
        .eq("slug", businessSlug)
        .single();

      if (!biz) {
        router.push("/business/signup");
        return;
      }
      setBusiness(biz);

      const { data: game } = await supabase
        .from("spin_games")
        .select("*")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      setSpinGame(game);

      if (game) {
        const { data: recentSpinsData } = await supabase
          .from("spin_attempts")
          .select("*, users!user_id(full_name, email)")
          .eq("game_id", game.id)
          .order("created_at", { ascending: false })
          .limit(10);

        setRecentSpins(recentSpinsData || []);
      }
    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [businessSlug, supabase, router, setBusiness]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const publicUrl = `engagespin.com/${businessSlug}/code-entry`;

  const handleGeneratePublicCode = async () => {
    if (!business) return;

    setGeneratingPublicCode(true);
    setGeneratedPublicCode(null);
    try {
      const res = await fetch("/api/business/codes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: businessSlug,
          type: "public",
          label: publicCodeLabel || undefined,
          unlocks: publicCodeUnlocks,
          require_activation: publicCodeRequireActivation,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate code");

      setGeneratedPublicCode(data.code);
      setPublicCodeLabel("");
      toast.success(`Public code ${data.code} created!`);
      loadDashboard();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate code");
    } finally {
      setGeneratingPublicCode(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!business) return null;

  const limits = getPlanLimits(business.plan);
  const totalCodes =
    (business.sticker_codes_this_month || 0) +
    (business.pos_codes_this_month || 0) +
    (business.public_codes_this_month || 0);
  const publicCodesLimit = isUnlimited(limits.maxPublicCodes)
    ? null
    : limits.maxPublicCodes;
  const publicCodesUsed = business.public_codes_this_month || 0;
  const publicCodesPercent =
    publicCodesLimit && publicCodesLimit > 0
      ? Math.min(100, (publicCodesUsed / publicCodesLimit) * 100)
      : 0;

  const statCards = [
    {
      label: "Engagements",
      value: business.engagements_this_month || 0,
      icon: Activity,
      color: "text-purple-400",
      limit: limits.maxEngagementsPerMonth,
    },
    {
      label: "Spins",
      value: business.spins_this_month || 0,
      icon: Zap,
      color: "text-yellow-400",
      limit: limits.maxEngagementsPerMonth,
    },
    {
      label: "Trivia",
      value: business.trivia_answers_this_month || 0,
      icon: Brain,
      color: "text-blue-400",
      limit: limits.maxEngagementsPerMonth,
    },
    {
      label: "Draw Entries",
      value: business.draw_entries_this_month || 0,
      icon: Ticket,
      color: "text-green-400",
      limit: limits.maxEngagementsPerMonth,
    },
    {
      label: "Code Redemptions",
      value: business.code_redemptions_this_month || 0,
      icon: QrCode,
      color: "text-pink-400",
      limit: limits.maxEngagementsPerMonth,
    },
    {
      label: "Sticker Codes",
      value: business.sticker_codes_this_month || 0,
      icon: Printer,
      color: "text-amber-400",
      limit: limits.maxStickerCodes,
    },
    {
      label: "POS Codes",
      value: business.pos_codes_this_month || 0,
      icon: ShoppingBag,
      color: "text-cyan-400",
      limit: limits.maxPosCodes,
    },
    {
      label: "Public Codes",
      value: publicCodesUsed,
      icon: Globe,
      color: "text-orange-400",
      limit: publicCodesLimit,
    },
    {
      label: "Viewers",
      value: business.viewer_engagements_count || 0,
      icon: Eye,
      color: "text-indigo-400",
      limit: limits.maxEngagementsPerMonth,
    },
    {
      label: "Prizes Claimed",
      value: business.viewer_prizes_claimed || 0,
      icon: Trophy,
      color: "text-red-400",
      limit: null,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-white/10 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                style={{ backgroundColor: business.brand_color }}
              >
                {business.name[0]}
              </div>
              <div>
                <h1 className="text-xl font-bold">{business.name}</h1>
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      "text-xs",
                      business.subscription_status === "trial" &&
                        "bg-yellow-500/20 text-yellow-400",
                      business.subscription_status === "active" &&
                        "bg-green-500/20 text-green-400",
                    )}
                  >
                    {business.subscription_status === "trial"
                      ? "Trial"
                      : business.plan}
                  </Badge>
                  {business.subscription_status === "trial" && (
                    <span className="text-xs">
                      {formatDistanceToNow(new Date(business.trial_ends_at), {
                        addSuffix: true,
                      })}{" "}
                      left
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 border-white/10"
                asChild
              >
                <Link href={`/${businessSlug}/code-entry`} target="_blank">
                  <ExternalLink className="h-3 w-3" /> View Page
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/admin/${businessSlug}/settings`}>
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <PlanLimitBanner business={business} />

        {/* All Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="border-white/10">
                <CardContent className="p-4 text-center">
                  <stat.icon
                    className={cn("h-5 w-5 mx-auto mb-2", stat.color)}
                  />
                  <p className="text-2xl font-bold">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-xs">{stat.label}</p>
                  {stat.limit !== null && !isUnlimited(stat.limit) && (
                    <p className="text-[10px] mt-0.5">
                      / {stat.limit.toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Public Code Usage Bar with Upgrade */}
        {publicCodesLimit !== null && (
          <Card className="border-white/10 mb-8">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Public Codes Usage</span>
                <span className="text-xs">
                  {publicCodesUsed} / {publicCodesLimit}
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${publicCodesPercent}%`,
                    backgroundColor:
                      publicCodesPercent >= 90
                        ? "#ef4444"
                        : publicCodesPercent >= 70
                          ? "#f59e0b"
                          : "#8b5cf6",
                  }}
                />
              </div>
              {publicCodesPercent >= 70 && (
                <div className="mt-3 flex justify-end">
                  <Button asChild size="sm">
                    <Link href={`/admin/${businessSlug}/billing?upgrade=pro`}>
                      <ArrowUpRight className="h-4 w-4 mr-1" /> Upgrade for More
                      Public Codes
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex border border-white/10 overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="spin">Spin Game</TabsTrigger>
            <TabsTrigger value="codes">Access Codes</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <QrCode className="h-5 w-5" /> Your Public Page
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="flex-1 p-3 rounded-lg bg-black/30 text-yellow-400 font-mono text-sm">
                    {publicUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(publicUrl);
                      toast.success("URL copied!");
                    }}
                    className="border-white/10"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs mt-2">
                  Share this link with customers, print it as a QR code, or
                  embed it on your website
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <QuickActionCard
                icon={RotateCcw}
                title={spinGame ? "Edit Spin Game" : "Create Spin Game"}
                description={
                  spinGame
                    ? "Customize your wheel"
                    : "Set up your first spin game"
                }
                href={`/admin/${businessSlug}/spin`}
                color={business.brand_color}
              />
              <QuickActionCard
                icon={Ticket}
                title="Draw Setup"
                description={`Configure your draws`}
                href={`/admin/${businessSlug}/draws`}
                color={business.brand_color}
              />
              <QuickActionCard
                icon={Brain}
                title="Trivia Setup"
                description="Configure trivia challenges"
                href={`/admin/${businessSlug}/trivia`}
                color={business.brand_color}
              />
            </div>

            {/* Public Code Generator */}
            <Card className="border-white/10">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-orange-400" /> Generate Public
                  Code
                </h3>
                <p className="text-xs mb-3">
                  Create a public marketing code for social media.{" "}
                  {publicCodeRequireActivation
                    ? "Requires customer to be active."
                    : "No activation required."}
                </p>
                {generatedPublicCode ? (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-green-400 text-sm font-medium mb-1">
                      Code Created!
                    </p>
                    <code className="text-sm font-mono text-green-300">
                      {generatedPublicCode}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => setGeneratedPublicCode(null)}
                    >
                      Generate Another
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Label (optional)</Label>
                      <Input
                        value={publicCodeLabel}
                        onChange={(e) => setPublicCodeLabel(e.target.value)}
                        placeholder="e.g. Instagram promo"
                        className="mt-1 border-white/10"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Unlocks</Label>
                      <Select
                        value={publicCodeUnlocks}
                        onValueChange={setPublicCodeUnlocks}
                      >
                        <SelectTrigger className="border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="points">Points Only</SelectItem>
                          <SelectItem value="spin">Spin Access</SelectItem>
                          <SelectItem value="spin_draw">
                            Spin + Draws
                          </SelectItem>
                          <SelectItem value="draw">Draws Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-xs">Require Activation</Label>
                          <p className="text-xs mt-1">
                            When enabled, customers must be an active user of
                            this business to redeem the code
                          </p>
                        </div>
                        <Switch
                          checked={publicCodeRequireActivation}
                          onCheckedChange={setPublicCodeRequireActivation}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleGeneratePublicCode}
                      disabled={generatingPublicCode}
                      className="w-full gap-2"
                      style={{ backgroundColor: business.brand_color }}
                    >
                      {generatingPublicCode ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Globe className="h-4 w-4" />
                      )}
                      Generate Public Code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Recent Spins</CardTitle>
              </CardHeader>
              <CardContent>
                {recentSpins.length === 0 ? (
                  <p className="text-center py-8">
                    No spins yet. Share your page to get started!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentSpins.slice(0, 8).map((spin, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold">
                            {spin.users?.full_name?.[0] || "?"}
                          </div>
                          <div>
                            <p className="text-sm">
                              {spin.users?.full_name || "Anonymous"}
                            </p>
                            <p className="text-xs">
                              {spin.prize_type === "points" &&
                              spin.points_awarded > 0
                                ? `Won ${spin.points_awarded} Points`
                                : `Won ${spin.prize_value || spin.prize_type}`}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs">
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

          <TabsContent value="spin">
            <Card className="border-white/10">
              <CardContent className="p-12 text-center">
                <RotateCcw className="h-12 w-12 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Spin Game Management</h3>
                <p className="mb-4">
                  Configure your wheel, prizes, and probabilities
                </p>
                <Button
                  asChild
                  style={{ backgroundColor: business.brand_color }}
                >
                  <Link href={`/admin/${businessSlug}/spin`}>
                    {spinGame ? "Edit Spin Game" : "Create Spin Game"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="codes">
            <Card className="border-white/10">
              <CardContent className="p-12 text-center">
                <Ticket className="h-12 w-12 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Access Code Management</h3>
                <p className="mb-4">
                  Create and manage codes that customers use to access your
                  spins
                </p>
                <Button
                  asChild
                  style={{ backgroundColor: business.brand_color }}
                >
                  <Link href={`/admin/${businessSlug}/codes`}>
                    Manage Codes
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card className="border-white/10">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Customer List</h3>
                <p className="mb-4">
                  {business.viewer_engagements_count || 0} total customers •{" "}
                  {business.engagements_this_month || 0} active
                </p>
                <Button
                  asChild
                  style={{ backgroundColor: business.brand_color }}
                >
                  <Link href={`/admin/${businessSlug}/customers`}>
                    View Customers
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

function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  color,
}: {
  icon: any;
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <Card className="border-white/10 hover:bg-white/10 transition-colors cursor-pointer group h-full">
        <CardContent className="p-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm">{description}</p>
          <ChevronRight className="h-4 w-4 mt-3 group-hover:translate-x-1 transition-transform" />
        </CardContent>
      </Card>
    </Link>
  );
}
