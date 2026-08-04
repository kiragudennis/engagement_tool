// app/(admin)/admin/[businessSlug]/referrals/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Users,
  Gift,
  Calendar,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function BusinessReferralsPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const { supabase, profile } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [referralInfo, setReferralInfo] = useState<any>(null);
  const [commissionHistory, setCommissionHistory] = useState<any[]>([]);;

  const loadData = useCallback(async () => {
    if (!profile || !businessSlug || !supabase) return;

    try {
      // Look up business by slug
      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name, slug")
        .eq("slug", businessSlug)
        .maybeSingle();

      if (!biz) return;

      const [referralRes, commissionsRes] = await Promise.all([
        supabase
          .from("referrals")
          .select(
            "id, referral_code, status, commission_type, commission_rate, first_commission_paid, created_at, referrer:users!inner(id, full_name, email)"
          )
          .eq("referred_business_id", biz.id)
          .eq("referral_type", "business")
          .maybeSingle(),
        supabase
          .from("referral_commissions")
          .select(
            "id, type, amount, currency, plan, billing_cycle, status, paid_at, created_at"
          )
          .eq("referred_business_id", biz.id)
          .order("created_at", { ascending: false }),
      ]);

      if (referralRes.data) {
        setReferralInfo({ ...referralRes.data, business_name: biz.name, business_slug: biz.slug });
      }

      if (commissionsRes.data) {
        setCommissionHistory(commissionsRes.data);
      }
    } catch (err) {
      console.error("Error loading referral data:", err);
    } finally {
      setLoading(false);
    }
  }, [profile, businessSlug, supabase]);

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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/${businessSlug}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-purple-500/10 rounded-lg">
            <Users className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Referral Program</h1>
            <p className="text-white/40">
              View referral information for this business
            </p>
          </div>
        </div>

        {!referralInfo ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-12 text-center">
              <Gift className="h-12 w-12 text-white/10 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">
                No Referral Found
              </h3>
              <p className="text-white/40">
                This business was not created through a referral link.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  Referral Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Referrer</p>
                    <p className="text-white font-medium">
                      {referralInfo.referrer?.full_name ||
                        referralInfo.referrer?.email ||
                        "Unknown"}
                    </p>
                    <p className="text-white/40 text-sm">
                      {referralInfo.referrer?.email}
                    </p>
                  </div>
                  <Badge
                    className={
                      referralInfo.status === "completed"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-purple-500/20 text-purple-400"
                    }
                  >
                    {referralInfo.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-white/60 text-xs">Commission Type</p>
                    <p className="text-white font-medium capitalize">
                      {referralInfo.commission_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Commission Rate</p>
                    <p className="text-white font-medium">
                      {Number(referralInfo.commission_rate * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">First Paid</p>
                    <p className="text-white font-medium">
                      {referralInfo.first_commission_paid
                        ? "Yes"
                        : "No"}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">
                      Referred On
                    </p>
                    <p className="text-white font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-white/40" />
                      {formatDistanceToNow(new Date(referralInfo.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <code className="px-2 py-1 bg-black/30 rounded text-xs font-mono text-purple-300">
                    {referralInfo.referral_code}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        referralInfo.referral_code,
                      );
                      toast.success("Referral code copied!");
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {commissionHistory.length > 0 && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">
                    Commission History
                  </CardTitle>
                  <CardDescription className="text-white/40">
                    Commissions earned from your business by your referrer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {commissionHistory.map((c) => (
                      <motion.div
                        key={c.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <Gift className="h-4 w-4 text-yellow-400" />
                          <div>
                            <p className="text-white text-sm">
                              {c.type} commission
                            </p>
                            <p className="text-white/40 text-xs">
                              Plan: {c.plan || "N/A"} •{" "}
                              {c.billing_cycle || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-white font-medium">
                            ${Number(c.amount || 0).toFixed(2)}
                          </span>
                          <Badge
                            className={
                              c.status === "paid"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }
                          >
                            {c.status}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
