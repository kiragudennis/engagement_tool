// app/(admin)/admin/[businessSlug]/billing/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { formatPrice, getPlanLimits } from "@/lib/config/plans";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  CreditCard,
  Smartphone,
  Sparkles,
  Infinity,
  Crown,
  Rocket,
  Store,
  Flame,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { UsageMeter } from "@/components/billing/UsageMeter";
import Link from "next/link";

// ─── Plan definitions (USD only) ───────────────────────
const EARLY_BIRD_PLANS: Record<
  string,
  { name: string; priceUsd: number; icon: any; color: string }
> = {
  early_bronze: {
    name: "Bronze Lifetime",
    priceUsd: 697, // ~3.4x annual (was $775)
    icon: Sparkles,
    color: "from-amber-500 to-orange-500",
  },
  early_silver: {
    name: "Silver Lifetime",
    priceUsd: 1797, // ~3.2x annual (was $1,938)
    icon: Crown,
    color: "from-gray-400 to-gray-500",
  },
  early_gold: {
    name: "Gold Lifetime",
    priceUsd: 4997, // ~2.6x annual (was $3,876)
    icon: Rocket,
    color: "from-yellow-400 to-yellow-600",
  },
};

const MONTHLY_PLANS: Record<
  string,
  {
    name: string;
    monthlyUsd: number;
    annualTotal: number;
    annualSavings: number;
  }
> = {
  starter: {
    name: "Starter",
    monthlyUsd: 29,
    annualTotal: 290,
    annualSavings: 58,
  },
  pro: {
    name: "Pro",
    monthlyUsd: 79,
    annualTotal: 790,
    annualSavings: 158,
  },
  enterprise: {
    name: "Enterprise",
    monthlyUsd: 194,
    annualTotal: 1940,
    annualSavings: 388,
  },
};

const PAYMENT_METHODS = [
  {
    id: "paystack",
    name: "Card / Bank",
    icon: CreditCard,
    desc: "Paystack — international cards",
  },
  {
    id: "mpesa",
    name: "M-Pesa",
    icon: Smartphone,
    desc: "STK push to your phone",
  },
];

export default function AdminBillingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { supabase, profile } = useAuth();

  // Check if coming from signup flow with plan params
  const planParam = searchParams.get("plan") || "";
  const businessIdParam = searchParams.get("businessId") || "";
  const isSignupFlow = !!planParam && !!businessIdParam;

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [step, setStep] = useState<"billing" | "checkout" | "done">("billing");
  const [selectedPlan, setSelectedPlan] = useState<string>(planParam || "pro");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );
  const [paymentMethod, setPaymentMethod] = useState("paystack");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [processing, setProcessing] = useState(false);
  const [codeCount, setCodeCount] = useState(0);

  // Determine plan type
  const isEarlyBird = selectedPlan.startsWith("early_");
  const earlyBirdPlan = isEarlyBird ? EARLY_BIRD_PLANS[selectedPlan] : null;
  const monthlyPlan = !isEarlyBird
    ? MONTHLY_PLANS[selectedPlan] || MONTHLY_PLANS.pro
    : null;

  // Calculate price
  const price = isEarlyBird
    ? earlyBirdPlan!.priceUsd
    : billingCycle === "annual"
      ? monthlyPlan?.annualTotal || 790
      : monthlyPlan?.monthlyUsd || 79;

  // ─── Check if user can subscribe ──────────────────────
  const isSubscribed =
    business?.subscription_status === "active" &&
    !business?.plan?.startsWith("early_"); // Allow upgrading to early bird even if active
  const hasEarlyBird = business?.plan?.startsWith("early_");
  const canSubscribe = !hasEarlyBird && (!isSubscribed || isSignupFlow); // Can't subscribe if already on early bird

  // ─── Load business ────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const slug = window.location.pathname.split("/")[2];
      if (!slug) return;

      const { data: biz } = await supabase
        .from("businesses")
        .select("*")
        .eq("slug", slug)
        .single();

      console.log("Loaded business:", biz);

      if (!biz) {
        router.push("/business/signup");
        return;
      }
      setBusiness(biz);

      if (!isSignupFlow) {
        setSelectedPlan(biz.plan !== "trial" ? biz.plan : "pro");
        const { count } = await supabase
          .from("access_codes")
          .select("*", { count: "exact", head: true })
          .eq("business_id", biz.id);
        setCodeCount(count || 0);
      }

      // If coming from signup, show checkout immediately
      if (isSignupFlow) {
        setStep("checkout");
      }

      setLoading(false);
    };
    load();
  }, [supabase, router, isSignupFlow]);

  // ─── Handle Payment ───────────────────────────────────
  const handlePay = async () => {
    if (!business || !profile) return;

    // Prevent subscribing if already on a plan
    // if (!canSubscribe) {
    //   toast.error("You already have an active subscription");
    //   return;
    // }

    setProcessing(true);

    try {
      if (paymentMethod === "paystack") {
        // Both subscription and one-time go through the same endpoint
        const res = await fetch("/api/billing/paystack/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId: business.id,
            plan: selectedPlan,
            billingCycle: isEarlyBird ? "lifetime" : billingCycle,
            phoneNumber: "0712345678", // Placeholder for Paystack, not used
            email: profile.email,
            fullName: profile.full_name || profile.email,
            isEarlyBird,
          }),
        });
        const data = await res.json();
        console.log("Paystack response:", data);
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
            billingCycle: isEarlyBird ? "lifetime" : billingCycle,
            phoneNumber,
            isEarlyBird,
            email: profile.email,
            fullName: profile.full_name || profile.email,
          }),
        });
        const data = await res.json();
        console.log("M-Pesa response:", data);
        if (!res.ok) throw new Error(data.error || "M-Pesa failed");
        toast.success(data.message || "Check your phone for M-Pesa prompt");
        setStep("done");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setProcessing(false);
    }
  };

  // ─── Navigate to checkout ─────────────────────────────
  const goToCheckout = (planId: string) => {
    // Prevent checkout if already subscribed
    // if (!canSubscribe && !isSignupFlow) {
    //   toast.error("You already have an active subscription");
    //   return;
    // }
    console.log("Plan", planId);

    setSelectedPlan(planId);
    setStep("checkout");
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
  const PlanIcon = isEarlyBird ? earlyBirdPlan?.icon : Sparkles;

  // ─── Done State ───────────────────────────────────────
  if (step === "done") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-center max-w-md"
        >
          <CheckCircle className="h-20 w-20 text-green-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">
            Payment Initiated!
          </h1>
          <p className="text-purple-300 mb-4">
            {paymentMethod === "mpesa"
              ? "Check your phone for the M-Pesa prompt to complete payment."
              : "Your payment is being processed."}
          </p>
          <Button
            onClick={() => router.push(`/admin/${business?.slug}`)}
            className="gap-2"
            size="lg"
          >
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={() =>
              router.push(`/admin/${business?.slug}/billing/manage`)
            }
            className="gap-2"
            size="lg"
            variant={"secondary"}
          >
            Manage bills <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    );
  }

  // ─── Checkout View ────────────────────────────────────
  if (step === "checkout") {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="border-b border-white/10 bg-black/50 backdrop-blur">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("billing")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: business?.brand_color || "#8B5CF6" }}
              >
                {business?.name?.[0]}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {isSignupFlow ? "Complete Setup" : "Checkout"}
                </h1>
                <p className="text-white/40 text-sm">{business?.name}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-lg">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 space-y-6">
              {/* Plan Summary */}
              <div
                className={cn(
                  "p-4 rounded-xl border",
                  isEarlyBird
                    ? "bg-amber-500/5 border-amber-500/20"
                    : "bg-purple-500/5 border-purple-500/20",
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        isEarlyBird ? "bg-amber-500/10" : "bg-purple-500/10",
                      )}
                    >
                      {PlanIcon && (
                        <PlanIcon
                          className={cn(
                            "h-5 w-5",
                            isEarlyBird ? "text-amber-400" : "text-purple-400",
                          )}
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-bold">
                        {isEarlyBird ? earlyBirdPlan?.name : monthlyPlan?.name}
                      </p>
                      {isEarlyBird && (
                        <Badge className="bg-amber-500/20 text-amber-400 text-xs border-0 mt-0.5">
                          <Infinity className="h-3 w-3 mr-1" /> Lifetime
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      {formatPrice(price)}
                    </p>
                    <p className="text-white/40 text-xs">
                      {isEarlyBird
                        ? "one-time"
                        : billingCycle === "annual"
                          ? "/year"
                          : "/mo"}
                    </p>
                  </div>
                </div>

                {/* Billing cycle toggle for monthly plans */}
                {!isEarlyBird && (
                  <>
                    <div className="flex gap-2 mb-3">
                      <Button
                        variant={
                          billingCycle === "monthly" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setBillingCycle("monthly")}
                        className="flex-1"
                      >
                        Monthly
                      </Button>
                      <Button
                        variant={
                          billingCycle === "annual" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setBillingCycle("annual")}
                        className="flex-1"
                      >
                        Annual (Save 17%)
                      </Button>
                    </div>

                    {/* Show savings when annual is selected */}
                    {billingCycle === "annual" && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                        <p className="text-sm text-green-400 font-medium">
                          🎉 Save {formatPrice(monthlyPlan?.annualSavings || 0)}{" "}
                          • 2 months free
                        </p>
                        <p className="text-xs text-green-400/70 mt-1">
                          {formatPrice(monthlyPlan?.monthlyUsd || 0)}/mo
                          equivalent • billed annually
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <Label className="text-white mb-2 block">Payment Method</Label>
                <div className="grid grid-cols-2 gap-3">
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
                      <p className="text-white/40 text-xs">{method.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "mpesa" && (
                <div>
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
                onClick={handlePay}
                // disabled={processing || !canSubscribe}
                className="w-full h-12 text-lg gap-2 bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {processing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : !canSubscribe ? (
                  <>
                    <Lock className="h-5 w-5" /> Already Subscribed
                  </>
                ) : (
                  <>
                    Pay {formatPrice(price)} <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>

              <p className="text-center text-white/20 text-xs">
                Secured by Paystack. We don't store your card details.
              </p>

              {/* Skip for trial */}
              {isSignupFlow && (
                <div className="text-center pt-4 border-t border-white/10">
                  <Button
                    variant="ghost"
                    onClick={() => router.push(`/admin/${business?.slug}`)}
                    className="text-white/40 hover:text-white/60"
                  >
                    Skip for now — start 14-day free trial
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Regular Billing View ─────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="border-b border-white/10 bg-black/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/${business?.slug}`)}
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

        {/* Early Bird Lifetime Deals - Show for all users */}
        <Card
          className={cn(
            "bg-gradient-to-r from-amber-500/5 to-yellow-500/5 border-amber-500/20",
            !canSubscribe && "opacity-75",
          )}
        >
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
              <div className="flex items-start gap-2">
                <Flame className="h-5 w-5 text-amber-400" />
                <h2 className="text-white font-semibold text-lg">
                  Early Bird Lifetime Deals
                </h2>
              </div>

              <div className="flex justify-end items-center">
                <Badge className="bg-amber-500/20 text-amber-400 border-0">
                  Limited Time
                </Badge>
                {!canSubscribe && (
                  <Badge className="bg-gray-500/20 text-gray-400 border-0 ml-auto">
                    <Lock className="h-3 w-3 mr-1" /> Already Subscribed
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-white/50 text-sm mb-4">
              Pay once, use forever. Lock in your price before these deals are
              gone.
            </p>
            {!canSubscribe && (
              <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-amber-300 text-sm flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  You're already on the {business?.plan} plan. Early bird deals
                  are visible for reference.
                </p>
              </div>
            )}
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              {[
                {
                  id: "early_bronze",
                  name: "Bronze",
                  price: 697,
                  desc: "Lifetime",
                  color: "border-amber-500/30 bg-amber-500/5",
                },
                {
                  id: "early_silver",
                  name: "Silver",
                  price: 1797,
                  desc: "Lifetime",
                  color: "border-gray-400/30 bg-gray-400/5",
                  popular: true,
                },
                {
                  id: "early_gold",
                  name: "Gold",
                  price: 4997,
                  desc: "Lifetime",
                  color: "border-yellow-500/30 bg-yellow-500/5",
                },
              ].map((eb) => {
                const isCurrentPlan = business?.plan === eb.id;
                return (
                  <button
                    key={eb.id}
                    onClick={() => goToCheckout(eb.id)}
                    // disabled={!canSubscribe}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center transition-all",
                      canSubscribe && "hover:scale-105 cursor-pointer",
                      !canSubscribe && "cursor-not-allowed opacity-60",
                      eb.color,
                      eb.popular && "ring-1 ring-purple-500/50",
                      isCurrentPlan && "ring-2 ring-green-500/50",
                    )}
                  >
                    {eb.popular && (
                      <Badge className="bg-purple-500/20 text-purple-400 text-xs border-0 mb-1">
                        Best Value
                      </Badge>
                    )}
                    {isCurrentPlan && (
                      <Badge className="bg-green-500/20 text-green-400 text-xs border-0 mb-1">
                        Current Plan
                      </Badge>
                    )}
                    <p className="text-white font-bold">{eb.name}</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {formatPrice(eb.price)}
                    </p>
                    <p className="text-amber-400 text-xs mt-0.5 flex items-center justify-center gap-1">
                      <Infinity className="h-3 w-3" />
                      {eb.desc}
                    </p>
                    {!canSubscribe && !isCurrentPlan && (
                      <Lock className="h-4 w-4 text-gray-400 mx-auto mt-2" />
                    )}
                  </button>
                );
              })}
            </div>
            <a
              href="/pricing/early-birds"
              className="text-amber-400 text-sm hover:underline"
            >
              See full comparison →
            </a>
          </CardContent>
        </Card>

        {/* Monthly Plans */}
        <Card
          className={cn(
            "bg-white/5 border-white/10",
            !canSubscribe && "opacity-75",
          )}
        >
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-white font-semibold text-lg">
                Monthly Plans
              </h2>
              {!canSubscribe && (
                <Badge className="bg-gray-500/20 text-gray-400 border-0 ml-auto">
                  <Lock className="h-3 w-3 mr-1" /> Already Subscribed
                </Badge>
              )}
            </div>
            {!canSubscribe && (
              <div className="mb-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <p className="text-purple-300 text-sm flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  You're currently on the {business?.plan} plan. Subscription
                  changes are disabled.
                </p>
              </div>
            )}
            <div className="grid sm:grid-cols-3 gap-3 mb-6">
              {Object.entries(MONTHLY_PLANS).map(([id, plan]) => {
                const isCurrentPlan = business?.plan === id;
                return (
                  <button
                    key={id}
                    onClick={() => goToCheckout(id)}
                    // disabled={!canSubscribe}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all",
                      canSubscribe && "cursor-pointer",
                      !canSubscribe && "cursor-not-allowed opacity-60",
                      selectedPlan === id && canSubscribe
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20",
                      isCurrentPlan && "ring-2 ring-green-500/50",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-white font-bold">{plan.name}</p>
                      {isCurrentPlan && (
                        <Badge className="bg-green-500/20 text-green-400 text-xs border-0">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-white/60 text-sm mt-1">
                      $ {plan.monthlyUsd.toLocaleString()}/mo
                    </p>
                    <p className="text-white/30 text-xs">
                      or KES {plan.annualTotal.toLocaleString()}/mo billed
                      annually
                    </p>
                  </button>
                );
              })}
            </div>
            <a
              href="/pricing"
              className="text-purple-400 text-sm hover:underline"
            >
              See full comparison →
            </a>
          </CardContent>
        </Card>

        {/* Current Plan */}
        <Card className="bg-white/5 border-white/10">
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-start gap-3">
                <Crown className="h-8 w-8 text-purple-400 flex-shrink-0" />
                <div>
                  <p className="text-white font-bold text-xl capitalize">
                    {business?.plan}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        isTrial && "bg-yellow-500/20 text-yellow-400",
                        isActive && "bg-green-500/20 text-green-400",
                        hasEarlyBird && "bg-amber-500/20 text-amber-400",
                      )}
                    >
                      {hasEarlyBird
                        ? "lifetime"
                        : business?.subscription_status}
                    </Badge>

                    <Link href={"billing/manage"} className="text-sm p-2">
                      Manage
                    </Link>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:text-right">
                {isTrial && business?.trial_ends_at && (
                  <p className="text-white/60 text-sm">
                    Ends{" "}
                    {formatDistanceToNow(new Date(business.trial_ends_at), {
                      addSuffix: true,
                    })}
                  </p>
                )}
                {isActive && business?.next_billing_at && (
                  <p className="text-white/60 text-sm">
                    Next billing{" "}
                    {formatDistanceToNow(new Date(business.next_billing_at), {
                      addSuffix: true,
                    })}
                  </p>
                )}
                {hasEarlyBird && (
                  <Badge className="bg-amber-500/20 text-amber-400 whitespace-nowrap">
                    <Infinity className="h-3 w-3 mr-1" /> Lifetime Access
                  </Badge>
                )}
              </div>
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
      </div>
    </div>
  );
}
