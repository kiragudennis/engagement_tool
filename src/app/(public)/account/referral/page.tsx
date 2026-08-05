// app/(public)/account/referral/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import {
  Copy,
  Share2,
  User,
  Gift,
  Coins,
  ArrowLeft,
  ExternalLink,
  Clock,
  DollarSign,
  Loader2,
  GraduationCap,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Label } from "@/components/ui/label";

interface ReferralDashboard {
  referral_code: string;
  referral_link: string;
  total_earned: number;
  pending_earnings: number;
  referred_business_count: number;
  active_referrals: number;
  total_commissions: number;
}

interface ReferralCommission {
  id: string;
  business_name: string;
  type: string;
  amount: number;
  plan: string;
  billing_cycle: string;
  status: string;
  paid_at: string | null;
  created_at: string;
}

interface ReferralRecord {
  id: string;
  referral_code: string;
  status: string;
  commission_type: string;
  commission_rate: number;
  businesses: {
    name: string;
    slug: string;
    plan: string;
    subscription_status: string;
  };
  created_at: string;
}

export default function ReferralDashboardPage() {
  const { supabase, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [enrolled, setEnrolled] = useState<boolean | null>(null);
  const [dashboard, setDashboard] = useState<ReferralDashboard | null>(null);
  const [commissions, setCommissions] = useState<ReferralCommission[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const enrollmentRes = await supabase.rpc("check_referral_enrollment", {
        p_user_id: profile.id,
      });

      if (enrollmentRes.data) {
        setEnrolled(enrollmentRes.data.enrolled || false);
      }

      if (!enrollmentRes.data?.enrolled) {
        setLoading(false);
        return;
      }

      const [dashboardRes, commissionsRes, referralsRes, withdrawalsRes] =
        await Promise.all([
          supabase.rpc("get_user_referral_dashboard", {
            p_user_id: profile.id,
          }),
          supabase.rpc("get_user_referral_commissions", {
            p_user_id: profile.id,
          }),
          supabase
            .from("referrals")
            .select(
              "id, referral_code, status, conversion_type, commission_type, commission_rate, referred_business_id, created_at, updated_at, businesses!inner(name, slug, plan, subscription_status)",
            )
            .eq("referrer_id", profile.id)
            .eq("referral_type", "business")
            .order("created_at", { ascending: false }),
          supabase
            .from("referral_withdrawals")
            .select("*")
            .eq("referrer_id", profile.id)
            .order("created_at", { ascending: false }),
        ]);

      if (dashboardRes.data) {
        setDashboard(dashboardRes.data);
      }

      if (commissionsRes.data) {
        setCommissions(commissionsRes.data);
      }

      if (referralsRes.data) {
        setReferrals(referralsRes.data);
      }

      if (withdrawalsRes.data) {
        setWithdrawals(withdrawalsRes.data);
      }
    } catch (err) {
      console.error("Error loading referral data:", err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPaid = commissions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const shareLink = (url: string) => {
    if (navigator.share) {
      navigator.share({ url });
    } else {
      copyToClipboard(url);
    }
  };

  const handleEnroll = useCallback(
    async (commissionType: "one_time" | "recurring") => {
      setEnrollmentLoading(true);
      try {
        const res = await fetch("/api/referral/enroll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ commission_type: commissionType }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success("Enrolled in referral program!");
        setEnrolled(true);
        loadData();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to enroll";
        toast.error(message);
      } finally {
        setEnrollmentLoading(false);
      }
    },
    [loadData],
  );

  if (loading || enrolled === null) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!enrolled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-purple-400" />
                  Enroll in the Referral Program
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Choose Your Commission Structure
                  </h3>
                  <p className="text-white/60 text-sm">
                    When you refer a business to Engage, you earn both cash and
                    loyalty points. Choose how you want to earn:
                  </p>
                  <div className="mt-2 text-sm text-white/70 space-y-1">
                    <div className="flex items-center gap-2 text-green-400">
                      <DollarSign className="h-4 w-4" />
                      <span>Option 1: 50% fixed on first payment</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-400">
                      <DollarSign className="h-4 w-4" />
                      <span>Option 2: 10% recurring on every payment</span>
                    </div>
                    <div className="flex items-center gap-2 text-purple-400">
                      <Coins className="h-4 w-4" />
                      <span>
                        Both options: Loyalty points = Cash commission × 100
                        (awarded immediately)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enrollment Page - Fixed Version */}
                <div className="space-y-4">
                  <div
                    className="p-4 rounded-lg border-2 border-purple-500/30 bg-purple-500/5 cursor-pointer hover:bg-purple-500/10 transition-colors"
                    onClick={() => handleEnroll("one_time")}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-white">
                          Fixed Commission
                        </h4>
                        <p className="text-sm text-white/60 mt-1">
                          Earn <strong className="text-green-400">50%</strong>{" "}
                          of the referred business's
                          <strong> first payment only</strong>. Simple and
                          straightforward.
                        </p>
                        <div className="mt-2 text-xs text-white/40">
                          Example: Refer a Pro plan ($79/mo) → Earn{" "}
                          <span className="text-green-400">$39.50</span>{" "}
                          one-time
                        </div>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-400 flex-shrink-0 ml-4">
                        Recommended
                      </Badge>
                    </div>
                  </div>

                  <div
                    className="p-4 rounded-lg border-2 border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleEnroll("recurring")}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-white">
                          Recurring Commission
                        </h4>
                        <p className="text-sm text-white/60 mt-1">
                          Earn <strong className="text-blue-400">10%</strong> of
                          <strong> every payment</strong> the referred business
                          makes. Higher long-term rewards.
                        </p>
                        <div className="mt-2 text-xs text-white/40">
                          Example: Refer a Pro plan ($79/mo) → Earn{" "}
                          <span className="text-blue-400">$7.90/mo</span>{" "}
                          recurring
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs border-white/20 text-white/60 flex-shrink-0 ml-4"
                      >
                        Long-term
                      </Badge>
                    </div>
                  </div>
                </div>

                {enrollmentLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                  </div>
                )}

                <Card className="bg-yellow-500/10 border-yellow-500/20">
                  <CardContent className="p-4 space-y-2">
                    <p className="text-sm text-yellow-300">
                      <strong>Dual Rewards:</strong> Every cash commission also
                      earns you loyalty points instantly. Points = Cash
                      commission × 100.
                    </p>
                    <p className="text-xs text-yellow-300/70">
                      You can change your preference later in settings. Your
                      choice applies to all future referrals.
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const referralCode = dashboard?.referral_code || profile?.referral_code || "";
  const referralLink = dashboard?.referral_link || "";
  const totalEarned = Number(dashboard?.total_earned || 0);
  const pendingEarnings = Number(dashboard?.pending_earnings || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950">
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-white/5">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Referral Program
              </h1>
              <p className="text-purple-300 mt-1 flex items-center gap-2">
                <span>Invite businesses — earn cash + loyalty points</span>
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/account">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Account
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-5 w-5 text-green-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">
                  ${totalEarned.toFixed(2)}
                </p>
                <p className="text-xs text-white/40">Cash Earned</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <Coins className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">
                  {(totalEarned * 100).toLocaleString()}
                </p>
                <p className="text-xs text-white/40">Loyalty Points</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 text-orange-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">
                  ${pendingEarnings.toFixed(2)}
                </p>
                <p className="text-xs text-white/40">Pending Cash</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <User className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">
                  {dashboard?.referred_business_count || 0}
                </p>
                <p className="text-xs text-white/40">Referred Businesses</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="share" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 overflow-x-auto flex-nowrap whitespace-nowrap">
            <TabsTrigger value="share" className="text-xs sm:text-sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </TabsTrigger>
            <TabsTrigger value="referrals" className="text-xs sm:text-sm">
              <User className="h-4 w-4 mr-2" />
              Referrals
            </TabsTrigger>
            <TabsTrigger value="earnings" className="text-xs sm:text-sm">
              <DollarSign className="h-4 w-4 mr-2" />
              Earnings
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="text-xs sm:text-sm">
              <Wallet className="h-4 w-4 mr-2" />
              Withdraw
            </TabsTrigger>
          </TabsList>

          {/* Share Tab */}
          <TabsContent value="share" className="space-y-6">
            <div className="max-w-2xl">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Gift className="h-5 w-5 text-purple-400" />
                    Share Your Referral Link
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white/60 text-sm">
                      Your Referral Code
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 px-3 py-2 bg-black/30 rounded-lg font-mono text-purple-300 text-lg">
                        {referralCode}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(referralCode)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white/60 text-sm">
                      Shareable Link
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        readOnly
                        value={referralLink}
                        className="flex-1 px-3 py-2 bg-black/30 rounded-lg font-mono text-sm text-white/60 focus:outline-none truncate"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(referralLink)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => shareLink(referralLink)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Card className="bg-purple-500/10 border-purple-500/20 mt-4">
                    <CardContent className="p-4 space-y-2">
                      <p className="text-sm text-purple-300 font-medium">
                        🎯 What you earn when a business subscribes:
                      </p>
                      <div className="space-y-2 text-sm text-white/70">
                        <div className="flex items-start gap-2">
                          <DollarSign className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-white">Cash commission:</span>
                            <br />
                            <span className="text-green-400">
                              50% one-time
                            </span>{" "}
                            on first payment
                            <span className="text-white/40"> OR </span>
                            <span className="text-blue-400">
                              10% recurring
                            </span>{" "}
                            on every payment
                            <span className="text-white/40 text-xs block">
                              (based on your enrollment choice)
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Coins className="h-4 w-4 text-purple-400 flex-shrink-0" />
                          <span>
                            <strong className="text-purple-400">
                              Loyalty points
                            </strong>{" "}
                            = Cash commission × 100 (awarded immediately,
                            regardless of your choice)
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button
                    asChild
                    className="w-full sm:w-auto gap-2 bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    <Link
                      href={referralLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Preview Your Link <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Referred Businesses Tab */}
          <TabsContent value="referrals" className="space-y-4">
            {referrals.length === 0 ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-12 text-center">
                  <User className="h-12 w-12 text-white/10 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">
                    No Referrals Yet
                  </h3>
                  <p className="text-white/40 mb-4">
                    Share your referral link to start earning commissions!
                  </p>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    <Link href="#share">View Your Link</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              referrals.map((ref, i) => (
                <motion.div
                  key={ref.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                            {ref.businesses?.name?.[0] || "?"}
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">
                              {ref.businesses?.name || "Unknown Business"}
                            </h3>
                            <p className="text-white/40 text-sm">
                              Plan: {ref.businesses?.plan || "N/A"} •{" "}
                              {ref.businesses?.subscription_status || "N/A"}
                            </p>
                            <p className="text-white/30 text-xs">
                              Referred{" "}
                              {formatDistanceToNow(new Date(ref.created_at), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                          <Badge
                            className={cn(
                              "text-xs",
                              ref.status === "completed"
                                ? "bg-green-500/20 text-green-400"
                                : ref.status === "joined"
                                  ? "bg-purple-500/20 text-purple-400"
                                  : "bg-gray-500/20 text-gray-400",
                            )}
                          >
                            {ref.status}
                          </Badge>
                          <Button variant="ghost" size="sm" asChild>
                            <Link
                              href={`/business/${ref.businesses?.slug || ""}/code-entry`}
                            >
                              <ExternalLink className="h-4 w-4" />
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

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-4">
            {commissions.length === 0 ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-12 text-center">
                  <DollarSign className="h-12 w-12 text-white/10 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">
                    No Commissions Yet
                  </h3>
                  <p className="text-white/40">
                    Commissions appear here after referred businesses pay.
                    Loyalty points are awarded immediately.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">
                    Commission History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {commissions.map((c, i) => (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-white/5 gap-2 sm:gap-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" />
                          <div>
                            <p className="text-white text-sm">
                              {c.business_name || "Unknown Business"}
                            </p>
                            <p className="text-white/40 text-xs">
                              {c.type} commission • {c.plan || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-right">
                            <span className="text-white font-medium">
                              ${Number(c.amount || 0).toFixed(2)}
                            </span>
                            <span className="text-purple-400 text-xs ml-2">
                              +{(Number(c.amount || 0) * 100).toLocaleString()}{" "}
                              pts
                            </span>
                          </div>
                          <Badge
                            className={cn(
                              "text-xs",
                              c.status === "paid"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-yellow-500/20 text-yellow-400",
                            )}
                          >
                            {c.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Withdraw Tab */}
          <TabsContent value="withdraw" className="space-y-6">
            <div className="max-w-2xl">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-purple-400" />
                    Withdraw Cash
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white/60 text-sm">
                      Available Cash Balance
                    </Label>
                    <p className="text-2xl font-bold text-green-400">
                      ${totalPaid.toFixed(2)}
                    </p>
                    <p className="text-xs text-white/40 mt-1">
                      Loyalty points are separate and cannot be withdrawn as
                      cash. Use them for spins, draws, and trivia at Engage.
                    </p>
                  </div>

                  <WithdrawForm
                    availableBalance={totalPaid}
                    loading={withdrawalLoading}
                    onSubmit={async (amount, method, phone) => {
                      setWithdrawalLoading(true);
                      try {
                        const res = await fetch(
                          "/api/referral/request-withdrawal",
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              amount,
                              payment_method: method,
                              mpesa_phone: phone || undefined,
                            }),
                          },
                        );
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error);
                        toast.success("Withdrawal request submitted!");
                        loadData();
                      } catch (err: any) {
                        toast.error(
                          err.message || "Failed to request withdrawal",
                        );
                      } finally {
                        setWithdrawalLoading(false);
                      }
                    }}
                  />

                  <Card className="bg-yellow-500/10 border-yellow-500/20">
                    <CardContent className="p-4 space-y-1">
                      <p className="text-sm text-yellow-300">
                        <strong>Minimum withdrawal:</strong> $100 USD
                      </p>
                      <p className="text-xs text-yellow-300/70">
                        Withdraw via Paystack or M-Pesa. Loyalty points are
                        available immediately at Engage and cannot be withdrawn.
                      </p>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              {withdrawals.length > 0 && (
                <Card className="bg-white/5 border-white/10 mt-6">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Withdrawal History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {withdrawals.map((w) => (
                        <div
                          key={w.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-white/5 gap-2 sm:gap-0"
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-white/40 flex-shrink-0" />
                            <div>
                              <p className="text-white text-sm">
                                ${Number(w.amount || 0).toFixed(2)}
                              </p>
                              <p className="text-white/40 text-xs">
                                {w.payment_method}{" "}
                                {w.mpesa_phone ? `• ${w.mpesa_phone}` : ""}
                              </p>
                            </div>
                          </div>
                          <Badge
                            className={cn(
                              "text-xs",
                              w.status === "paid"
                                ? "bg-green-500/20 text-green-400"
                                : w.status === "processing"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : w.status === "failed"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-yellow-500/20 text-yellow-400",
                            )}
                          >
                            {w.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface WithdrawFormProps {
  availableBalance: number;
  loading: boolean;
  onSubmit: (amount: number, method: string, phone?: string) => Promise<void>;
}

function WithdrawForm({
  availableBalance,
  loading,
  onSubmit,
}: WithdrawFormProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"paystack" | "mpesa">("paystack");
  const [phone, setPhone] = useState("");

  const amountNum = Number(amount) || 0;
  const isDisabled =
    loading ||
    availableBalance < 100 ||
    amountNum < 100 ||
    amountNum > availableBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (method === "mpesa" && !phone.trim()) {
      toast.error("Please enter your M-Pesa phone number");
      return;
    }
    await onSubmit(amountNum, method, phone.trim() || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-white/60 text-sm">Withdrawal Amount (USD)</Label>
        <Input
          type="number"
          placeholder="100.00"
          min={100}
          max={availableBalance}
          step="0.01"
          className="mt-1 bg-white/5 border-white/10 text-white"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <p className="text-xs text-white/40 mt-1">
          Available: ${availableBalance.toFixed(2)}
        </p>
      </div>

      <div>
        <Label className="text-white/60 text-sm">Payment Method</Label>
        <Select value={method} onValueChange={(v) => setMethod(v as any)}>
          <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paystack">Paystack</SelectItem>
            <SelectItem value="mpesa">M-Pesa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {method === "mpesa" && (
        <div>
          <Label className="text-white/60 text-sm">M-Pesa Phone Number</Label>
          <Input
            type="tel"
            placeholder="+254712345678"
            className="mt-1 bg-white/5 border-white/10 text-white"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      )}

      <Button
        type="submit"
        disabled={isDisabled || loading}
        className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Withdraw $${amountNum.toFixed(2)}`
        )}
      </Button>
    </form>
  );
}
