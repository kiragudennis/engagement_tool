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
  Gift,
  Coins,
  Star,
  ArrowLeft,
  ExternalLink,
  Clock,
  User,
  DollarSign,
  Banknote,
  Loader2,
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
  const [dashboard, setDashboard] = useState<ReferralDashboard | null>(null);
  const [commissions, setCommissions] = useState<ReferralCommission[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);;

  const loadData = useCallback(async () => {
    if (!profile?.id) return;

    try {
       const [dashboardRes, commissionsRes, referralsRes, withdrawalsRes] = await Promise.all([
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" />
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
              <p className="text-purple-300 mt-1">
                Invite businesses and earn rewards
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
                <Coins className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">
                  ${totalEarned.toFixed(2)}
                </p>
                <p className="text-xs text-white/40">Total Earned</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 text-orange-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">
                  ${pendingEarnings.toFixed(2)}
                </p>
                <p className="text-xs text-white/40">Pending</p>
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
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <Star className="h-5 w-5 text-green-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">
                  {dashboard?.active_referrals || 0}
                </p>
                <p className="text-xs text-white/40">Active Referrals</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="share" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="share">
              <Share2 className="h-4 w-4 mr-2" />
              Share Your Link
            </TabsTrigger>
            <TabsTrigger value="referrals">
              <User className="h-4 w-4 mr-2" />
              Referred Businesses
            </TabsTrigger>
            <TabsTrigger value="earnings">
              <DollarSign className="h-4 w-4 mr-2" />
              Earnings History
            </TabsTrigger>
            <TabsTrigger value="withdraw">
              <Banknote className="h-4 w-4 mr-2" />
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
                    Your Referral Link
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
                        className="flex-1 px-3 py-2 bg-black/30 rounded-lg font-mono text-sm text-white/60 focus:outline-none"
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
                    <CardContent className="p-4">
                      <p className="text-sm text-purple-300">
                        When someone uses your link to create a business and
                        subscribes to a paid plan, you earn a 50% commission
                        on their first payment.
                      </p>
                      <div className="mt-2 text-xs text-white/40">
                        <span className="font-medium">Commission Structure:</span>
                        <ul className="mt-1 space-y-1">
                          <li>
                            • Starter ($29/mo): $14.50 first payment
                          </li>
                          <li>
                            • Pro ($79/mo): $39.50 first payment
                          </li>
                          <li>
                            • Enterprise ($194/mo): $97.00 first payment
                          </li>
                        </ul>
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
                  <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600">
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
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
                        <div className="flex items-center gap-3">
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
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
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
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Commission History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {commissions.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" />
                          <div>
                            <p className="text-white text-sm">
                              {c.business_name || "Unknown Business"}
                            </p>
                            <p className="text-white/40 text-xs">
                              {c.type} commission • {c.plan || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-white font-medium">
                            ${Number(c.amount || 0).toFixed(2)}
                          </span>
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
                    <Banknote className="h-5 w-5 text-purple-400" />
                    Request Withdrawal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white/60 text-sm">
                      Available Balance (paid commissions)
                    </Label>
                    <p className="text-2xl font-bold text-green-400">
                      ${totalPaid.toFixed(2)}
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
                        toast.error(err.message || "Failed to request withdrawal");
                      } finally {
                        setWithdrawalLoading(false);
                      }
                    }}
                  />

                  <Card className="bg-yellow-500/10 border-yellow-500/20">
                    <CardContent className="p-4">
                      <p className="text-sm text-yellow-300">
                        Minimum withdrawal: <strong>$100 USD</strong>.
                        You can withdraw via Paystack or M-Pesa.
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
                          className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-white/40" />
                            <div>
                              <p className="text-white text-sm">
                                ${Number(w.amount || 0).toFixed(2)}
                              </p>
                              <p className="text-white/40 text-xs">
                                {w.payment_method} • {w.mpesa_phone || "—"}
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
      return;
    }
    await onSubmit(amountNum, method, phone.trim() || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-white/60 text-sm">
          Withdrawal Amount (USD)
        </Label>
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
          <Label className="text-white/60 text-sm">
            M-Pesa Phone Number
          </Label>
          <Input
            type="tel"
            placeholder="+254712345678"
            className="mt-1 bg-white/5 border-white/10 text-white"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      )}

      <Button type="submit" disabled={isDisabled || loading} className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600">
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
