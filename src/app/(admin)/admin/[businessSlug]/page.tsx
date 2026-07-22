// app/(admin)/admin/[businessSlug]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  Gift,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import { PlanLimitBanner } from "@/components/billing/PlanLimitBanner";

export default function BusinessAdminDashboard() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const { supabase, profile } = useAuth();
  const router = useRouter();

  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSpins: 0,
    spinsToday: 0,
    activeCustomers: 0,
    totalCustomers: 0,
    activeCodes: 0,
    prizesAwarded: 0,
  });
  const [spinGame, setSpinGame] = useState<any>(null);
  const [recentSpins, setRecentSpins] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);

  const loadDashboard = useCallback(async () => {
    if (!businessSlug) return;

    try {
      // Load business
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

      // Load spin game
      const { data: game } = await supabase
        .from("spin_games")
        .select("*")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      setSpinGame(game);

      // Load stats
      const today = new Date().toISOString().split("T")[0];

      if (game) {
        const [
          { count: totalSpins },
          { data: todaySpins },
          { data: recentSpinsData },
        ] = await Promise.all([
          supabase
            .from("spin_attempts")
            .select("*", { count: "exact", head: true })
            .eq("game_id", game.id),
          supabase
            .from("spin_attempts")
            .select("id")
            .eq("game_id", game.id)
            .gte("created_at", today),
          supabase
            .from("spin_attempts")
            .select("*, users!user_id(full_name, email)")
            .eq("game_id", game.id)
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

        setStats((prev) => ({
          ...prev,
          totalSpins: totalSpins || 0,
          spinsToday: todaySpins?.length || 0,
        }));
        setRecentSpins(recentSpinsData || []);
      }

      // Customer stats
      const [{ count: totalCustomers }, { count: activeCustomers }] =
        await Promise.all([
          supabase
            .from("customer_business_activations")
            .select("*", { count: "exact", head: true })
            .eq("business_id", biz.id),
          supabase
            .from("customer_business_activations")
            .select("*", { count: "exact", head: true })
            .eq("business_id", biz.id)
            .eq("is_active", true)
            .gte("expires_at", new Date().toISOString()),
        ]);

      // Active codes
      const { count: activeCodes } = await supabase
        .from("access_codes")
        .select("*", { count: "exact", head: true })
        .eq("business_id", biz.id)
        .eq("is_active", true);

      setStats((prev) => ({
        ...prev,
        totalCustomers: totalCustomers || 0,
        activeCustomers: activeCustomers || 0,
        activeCodes: activeCodes || 0,
      }));
    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [businessSlug, supabase, router]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const publicUrl = `engagespin.com/${businessSlug}/code-entry`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!business) return null;

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
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            {
              label: "Spins Today",
              value: stats.spinsToday,
              icon: Zap,
              color: "text-yellow-400",
            },
            {
              label: "Total Spins",
              value: stats.totalSpins,
              icon: RotateCcw,
              color: "text-purple-400",
            },
            {
              label: "Active Customers",
              value: stats.activeCustomers,
              icon: Users,
              color: "text-green-400",
            },
            {
              label: "Total Customers",
              value: stats.totalCustomers,
              icon: Users,
              color: "text-blue-400",
            },
            {
              label: "Active Codes",
              value: stats.activeCodes,
              icon: Ticket,
              color: "text-pink-400",
            },
            {
              label: "Prizes Won",
              value: stats.totalSpins,
              icon: Gift,
              color: "text-orange-400",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
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
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

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
            {/* Public URL Card */}
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

            {/* Quick Actions */}
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

            {/* Recent Spins */}
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

          {/* Other tabs placeholder */}
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
                  {stats.totalCustomers} total customers •{" "}
                  {stats.activeCustomers} active
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

// Quick action card component
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
