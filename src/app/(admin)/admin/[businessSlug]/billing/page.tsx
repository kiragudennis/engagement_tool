// app/(admin)/admin/[businessSlug]/billing/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { getPlanLimits, PlanLimits } from "@/lib/services/plan-limits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Crown,
  Sparkles,
  Zap,
  CreditCard,
  Smartphone,
  Check,
  AlertTriangle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

const PAYMENT_METHODS = [
  {
    id: "paypal",
    name: "PayPal",
    icon: CreditCard,
    description: "Pay with PayPal or credit card",
  },
  {
    id: "mpesa",
    name: "M-Pesa",
    icon: Smartphone,
    description: "Pay via M-Pesa mobile money",
  },
];

export default function BillingPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const { supabase } = useAuth();
  const router = useRouter();

  const [business, setBusiness] = useState<any>(null);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
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
    setLimits(getPlanLimits(biz.plan));
    setSelectedPlan(biz.plan);
    setLoading(false);
  }, [businessSlug, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          plan: selectedPlan,
          billingCycle,
          paymentMethod,
          phoneNumber: paymentMethod === "mpesa" ? phoneNumber : undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.approvalUrl) {
          window.location.href = data.approvalUrl;
        } else if (data.checkoutRequestId) {
          toast.success("Check your phone for the M-Pesa prompt!");
          // Poll for completion or show spinner
        }
      } else {
        toast.error(data.error || "Checkout failed");
      }
    } catch (err: any) {
      toast.error(err.message);
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

  const isTrial = business?.subscription_status === "trial";
  const isActive = business?.subscription_status === "active";

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

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Current Plan */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="p-6">
            <h2 className="text-white font-semibold text-lg mb-4">
              Current Plan
            </h2>
            <div className="flex items-center justify-between">
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
                      !isTrial && !isActive && "bg-red-500/20 text-red-400",
                    )}
                  >
                    {business?.subscription_status}
                  </Badge>
                </div>
              </div>
              {isTrial && business?.trial_ends_at && (
                <div className="text-right">
                  <p className="text-white/60 text-sm">Trial ends</p>
                  <p className="text-white font-medium">
                    {formatDistanceToNow(new Date(business.trial_ends_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Usage */}
            {limits && (
              <div className="mt-6 space-y-3">
                <UsageBar
                  label="Spins this month"
                  used={business?.spins_this_month || 0}
                  max={limits.maxSpinsPerMonth}
                />
                <UsageBar
                  label="Spin games"
                  used={1}
                  max={limits.maxSpinGames}
                />
                <UsageBar
                  label="Access codes"
                  used={business?.activeCodes || 0}
                  max={limits.maxCodes}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upgrade Plan */}
        {isTrial && (
          <Card className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/20 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <p className="text-yellow-300 font-medium">
                  Your trial ends soon. Subscribe to keep your games running.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <h2 className="text-white font-semibold text-lg mb-6">
              {isActive ? "Change Plan" : "Choose Your Plan"}
            </h2>

            {/* Plan Selection */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {["starter", "pro", "enterprise"].map((plan) => (
                <button
                  key={plan}
                  onClick={() => setSelectedPlan(plan)}
                  className={cn(
                    "p-4 rounded-xl border-2 text-center transition-all",
                    selectedPlan === plan
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20",
                  )}
                >
                  <p className="text-white font-bold capitalize">{plan}</p>
                  <p className="text-white/60 text-sm">
                    ${plan === "starter" ? "29" : plan === "pro" ? "79" : "199"}
                    /mo
                  </p>
                </button>
              ))}
            </div>

            {/* Billing Cycle */}
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

            {/* Payment Method */}
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
                      : "border-white/10 bg-white/5 hover:border-white/20",
                  )}
                >
                  <method.icon
                    className={cn(
                      "h-6 w-6 mx-auto mb-1",
                      paymentMethod === method.id
                        ? "text-purple-400"
                        : "text-white/40",
                    )}
                  />
                  <p className="text-white text-sm font-medium">
                    {method.name}
                  </p>
                  <p className="text-white/40 text-xs">{method.description}</p>
                </button>
              ))}
            </div>

            {/* M-Pesa Phone */}
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
              disabled={processing || selectedPlan === business?.plan}
              className="w-full h-12 text-lg gap-2 bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {processing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {isActive ? "Update Plan" : "Subscribe"} • $
                  {selectedPlan === "starter"
                    ? "29"
                    : selectedPlan === "pro"
                      ? "79"
                      : "199"}
                  /mo
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UsageBar({
  label,
  used,
  max,
}: {
  label: string;
  used: number;
  max: number;
}) {
  const percent = Math.min(100, (used / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className={cn(percent > 80 ? "text-red-400" : "text-white/40")}>
          {used.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>
      <Progress
        value={percent}
        className={cn("h-1.5", percent > 80 && "bg-red-950")}
      />
    </div>
  );
}
