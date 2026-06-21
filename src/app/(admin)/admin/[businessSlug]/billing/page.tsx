"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { getPlanLimits } from "@/lib/config/plans";
import {
  PLANS,
  getPriceKes,
  formatKES,
  kesToUsd,
} from "@/lib/config/plans";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Loader2,
  Crown,
  CreditCard,
  Smartphone,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { UsageMeter } from "@/components/billing/UsageMeter";

const PAYMENT_METHODS = [
  {
    id: "paystack",
    name: "Card / Bank",
    icon: CreditCard,
    description: "Paystack — international cards",
  },
  {
    id: "mpesa",
    name: "M-Pesa",
    icon: Smartphone,
    description: "STK push to your phone",
  },
];

export default function BillingPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const searchParams = useSearchParams();
  const { supabase, profile } = useAuth();
  const router = useRouter();

  const [business, setBusiness] = useState<any>(null);
  const [codeCount, setCodeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string>("starter");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );
  const [paymentMethod, setPaymentMethod] = useState("paystack");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [processing, setProcessing] = useState(false);

  const loadData = useCallback(async () => {
    if (!businessSlug) return;
    const { data: biz } = await supabase
      .from("businesses")
      .select("*")
      .eq("slug", businessSlug)
      .single();

    if (!biz) return;
    setBusiness(biz);
    setSelectedPlan(
      searchParams.get("upgrade") || (biz.plan !== "trial" ? biz.plan : "pro"),
    );

    const { count } = await supabase
      .from("access_codes")
      .select("*", { count: "exact", head: true })
      .eq("business_id", biz.id);

    setCodeCount(count || 0);
    setLoading(false);
  }, [businessSlug, supabase, searchParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCheckout = async () => {
    if (!business || !profile) return;
    setProcessing(true);

    try {
      if (paymentMethod === "paystack") {
        const res = await fetch("/api/billing/paystack/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId: business.id,
            plan: selectedPlan,
            billingCycle,
            email: profile.email,
            fullName: profile.full_name || profile.email,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Checkout failed");
        if (data.authorizationUrl) {
          window.location.href = data.authorizationUrl;
          return;
        }
      }

      if (paymentMethod === "mpesa") {
        if (!phoneNumber.trim()) {
          toast.error("Enter your M-Pesa phone number");
          return;
        }
        const res = await fetch("/api/billing/mpesa/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId: business.id,
            plan: selectedPlan,
            billingCycle,
            phoneNumber,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "M-Pesa failed");
        toast.success(data.message || "Check your phone for M-Pesa prompt");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const limits = getPlanLimits(business?.plan || "trial");
  const used =
    business?.engagements_this_month ?? business?.spins_this_month ?? 0;
  const isTrial = business?.subscription_status === "trial";
  const isActive = business?.subscription_status === "active";
  const selectedPlanDef = PLANS.find((p) => p.id === selectedPlan);
  const price = selectedPlanDef
    ? getPriceKes(selectedPlanDef, billingCycle)
    : 0;

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="border-b border-white/10 bg-black/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/${businessSlug}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Billing & Plan</h1>
              <p className="text-white/40 text-sm">{business?.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        {searchParams.get("expired") && (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <p className="text-red-300 text-sm">
                Your trial has ended. Subscribe to restore full access.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Crown className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-white font-bold text-xl capitalize">
                    {business?.plan}
                  </p>
                  <Badge
                    className={cn(
                      isTrial && "bg-yellow-500/20 text-yellow-400",
                      isActive && "bg-green-500/20 text-green-400",
                    )}
                  >
                    {business?.subscription_status}
                  </Badge>
                </div>
              </div>
              {isTrial && business?.trial_ends_at && (
                <p className="text-white/60 text-sm">
                  Ends{" "}
                  {formatDistanceToNow(new Date(business.trial_ends_at), {
                    addSuffix: true,
                  })}
                </p>
              )}
            </div>

            <UsageMeter
              label="Engagements this month"
              used={used}
              max={limits.maxEngagementsPerMonth}
            />
            <div className="mt-3">
              <UsageMeter
                label="Access codes"
                used={codeCount}
                max={limits.maxCodes}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <h2 className="text-white font-semibold text-lg mb-6">
              {isActive ? "Change Plan" : "Choose Your Plan"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    selectedPlan === plan.id
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20",
                  )}
                >
                  <p className="text-white font-bold">{plan.name}</p>
                  <p className="text-white/60 text-sm mt-1">
                    {formatKES(getPriceKes(plan, billingCycle))}/mo
                  </p>
                  <p className="text-white/30 text-xs">
                    ≈ ${kesToUsd(getPriceKes(plan, billingCycle))} USD
                  </p>
                </button>
              ))}
            </div>

            <div className="flex gap-3 mb-6">
              <Button
                variant={billingCycle === "monthly" ? "default" : "outline"}
                onClick={() => setBillingCycle("monthly")}
                className="flex-1"
              >
                Monthly
              </Button>
              <Button
                variant={billingCycle === "annual" ? "default" : "outline"}
                onClick={() => setBillingCycle("annual")}
                className="flex-1"
              >
                Annual (Save 17%)
              </Button>
            </div>

            <Label className="text-white mb-2 block">Payment Method</Label>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={cn(
                    "p-4 rounded-xl border-2 text-center transition-all",
                    paymentMethod === method.id
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-white/10 bg-white/5",
                  )}
                >
                  <method.icon className="h-6 w-6 mx-auto mb-1 text-purple-400" />
                  <p className="text-white text-sm font-medium">{method.name}</p>
                  <p className="text-white/40 text-xs">{method.description}</p>
                </button>
              ))}
            </div>

            {paymentMethod === "mpesa" && (
              <div className="mb-6">
                <Label className="text-white">M-Pesa Phone Number</Label>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0712 345 678"
                  className="mt-1 bg-white/5 border-white/10 text-white"
                />
              </div>
            )}

            <Button
              onClick={handleCheckout}
              disabled={processing}
              className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {processing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Subscribe • {formatKES(price)}/mo (≈ ${kesToUsd(price)} USD)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
