// app/(public)/pricing/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Check,
  Sparkles,
  Crown,
  Zap,
  RotateCcw,
  Brain,
  Gift,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// KES to USD approximate conversion rate (for display purposes only)
// Actual rate used by banks may differ slightly
const KES_TO_USD_RATE = 129;

const PLANS = [
  {
    name: "Starter",
    price: 3999, // KES
    usdPrice: Math.round(3999 / KES_TO_USD_RATE),
    icon: Sparkles,
    color: "from-blue-500 to-cyan-500",
    borderColor: "border-blue-500/30",
    bgGlow: "bg-blue-500/10",
    popular: false,
    desc: "For small businesses getting started",
    features: [
      { text: "1 spin game", included: true },
      { text: "1 trivia challenge", included: true },
      { text: "1 active draw", included: true },
      { text: "500 engagements/month", included: true },
      { text: "6 prize slots on wheel", included: true },
      { text: "20 trivia questions", included: true },
      { text: "Basic branding (logo + 1 color)", included: true },
      { text: "Customer CSV export", included: true },
      { text: "Live broadcast (OBS)", included: true },
      { text: "QR code generation", included: true },
      { text: "Email support", included: true },
      { text: "Multiple admin users", included: false },
      { text: "Priority support", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    name: "Pro",
    price: 9999, // KES
    usdPrice: Math.round(9999 / KES_TO_USD_RATE),
    icon: Crown,
    color: "from-purple-500 to-pink-500",
    borderColor: "border-purple-500/30",
    bgGlow: "bg-purple-500/10",
    popular: true,
    desc: "For growing businesses running regular campaigns",
    features: [
      { text: "3 spin games", included: true },
      { text: "3 trivia challenges", included: true },
      { text: "3 active draws", included: true },
      { text: "5,000 engagements/month", included: true },
      { text: "12 prize slots on wheel", included: true },
      { text: "100 trivia questions", included: true },
      { text: "Full branding customization", included: true },
      { text: "Customer CSV + webhook export", included: true },
      { text: "Live broadcast (OBS)", included: true },
      { text: "Bulk code generation", included: true },
      { text: "Analytics dashboard", included: true },
      { text: "3 admin users", included: true },
      { text: "Priority support", included: true },
      { text: "API access", included: false },
    ],
  },
  {
    name: "Enterprise",
    price: 24999, // KES
    usdPrice: Math.round(24999 / KES_TO_USD_RATE),
    icon: Zap,
    color: "from-amber-500 to-orange-500",
    borderColor: "border-amber-500/30",
    bgGlow: "bg-amber-500/10",
    popular: false,
    desc: "For chains and high-volume venues",
    features: [
      { text: "Unlimited spin games", included: true },
      { text: "Unlimited trivia challenges", included: true },
      { text: "Unlimited active draws", included: true },
      { text: "25,000 engagements/month", included: true },
      { text: "24 prize slots on wheel", included: true },
      { text: "Unlimited trivia questions", included: true },
      { text: "Full white-label branding", included: true },
      { text: "Customer CSV + API + Webhooks", included: true },
      { text: "Live broadcast (OBS)", included: true },
      { text: "Multiple locations support", included: true },
      { text: "Advanced analytics", included: true },
      { text: "10 admin users", included: true },
      { text: "Dedicated support", included: true },
      { text: "API access", included: true },
    ],
  },
];

const FAQS = [
  {
    q: "What counts as an 'engagement'?",
    a: "An engagement is any customer interaction: a spin on your wheel, a trivia answer, or an entry into a draw. The counter resets monthly. Most small businesses stay well within the Starter plan.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes! Upgrade or downgrade anytime. If you upgrade, you get the new limits immediately. If you downgrade, the new limits apply at the start of your next billing cycle.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes, 14-day free trial on any plan. You get 100 engagements during the trial to test everything out. No credit card required.",
  },
  {
    q: "What happens when I hit my engagement limit?",
    a: "We'll notify you before you hit the limit. Your games stay active but customers won't be able to spin or enter draws until the next month or until you upgrade. Your data and setup are never lost.",
  },
  {
    q: "Can I run draws based on spending amounts?",
    a: "Yes! With draws, you can set entry rules based on purchase amounts. For example, 'Every KSH 100 spent = 1 entry' or 'Top 3 spenders this month win.' This works with your existing receipt codes.",
  },
  {
    q: "How do customers access my games?",
    a: "You generate access codes or QR codes from your dashboard. Print them on receipts, post them on social media, or display them in your store. Customers enter the code on our site—no app download needed.",
  },
  {
    q: "Do you support M-Pesa?",
    a: "Yes! We accept M-Pesa and international cards for subscriptions.",
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );

  const getPrice = (basePrice: number) => {
    return billingCycle === "annual"
      ? Math.round((basePrice * 10) / 12)
      : basePrice;
  };

  const formatKES = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950">
      {/* Header */}
      <div className="text-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Badge className="mb-4 bg-purple-500/20 text-purple-300 text-sm px-4 py-1.5 border-0">
            14-day free trial • No credit card required
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Pay for{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              usage
            </span>
            , not features
          </h1>
          <p className="text-lg text-white/60 max-w-xl mx-auto">
            All plans include spins, trivia, and draws. You only pay for how
            many people you engage.
          </p>
          <p className="text-sm text-white/30 mt-3">
            💳 All prices in KES. International cards charged in USD at
            prevailing exchange rate.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={cn(
              "text-sm transition-colors",
              billingCycle === "monthly"
                ? "text-white font-medium"
                : "text-white/40",
            )}
          >
            Monthly
          </button>
          <button
            onClick={() =>
              setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")
            }
            className="w-12 h-6 rounded-full bg-white/10 relative transition-colors"
          >
            <div
              className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full bg-purple-500 transition-transform",
                billingCycle === "annual" ? "translate-x-6" : "translate-x-0.5",
              )}
            />
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className={cn(
              "text-sm transition-colors flex items-center gap-1",
              billingCycle === "annual"
                ? "text-white font-medium"
                : "text-white/40",
            )}
          >
            Annual
            <Badge className="bg-green-500/20 text-green-400 text-xs border-0">
              Save 17%
            </Badge>
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            const price = getPrice(plan.price);
            const usdPrice = Math.round(price / KES_TO_USD_RATE);
            const annualSavings = plan.price * 12 - plan.price * 10;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <Card
                  className={cn(
                    "h-full border transition-all hover:scale-[1.02] duration-300 flex flex-col",
                    plan.popular
                      ? "border-purple-500/50 bg-purple-500/5"
                      : "border-white/10 bg-white/5",
                  )}
                >
                  <CardContent className="p-6 flex flex-col h-full">
                    {/* Plan Header */}
                    {/* <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                        plan.bgGlow,
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-6 w-6",
                          plan.color.split(" ")[0].replace("from-", "text-"),
                        )}
                      />
                    </div> */}
                    <h3 className="text-xl font-bold text-white">
                      {plan.name}
                    </h3>
                    <p className="text-white/40 text-sm mt-1">{plan.desc}</p>

                    {/* Price */}
                    <div className="mt-4 mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white">
                          {formatKES(price)}
                        </span>
                        <span className="text-white/40">/mo</span>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-sm text-white/30 mt-1">
                          ≈ ${usdPrice} USD
                        </p>
                        {billingCycle === "annual" && (
                          <p className="text-xs text-green-400 mt-2">
                            Save {formatKES(annualSavings)}/year
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-3 flex-1">
                      {plan.features.map((feature, j) => (
                        <div key={j} className="flex items-start gap-3">
                          <Check
                            className={cn(
                              "h-4 w-4 mt-0.5 flex-shrink-0",
                              feature.included
                                ? "text-green-400"
                                : "text-white/10",
                            )}
                          />
                          <span
                            className={cn(
                              "text-sm",
                              feature.included
                                ? "text-white/70"
                                : "text-white/20 line-through",
                            )}
                          >
                            {feature.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <Button
                      className={cn(
                        "w-full mt-6",
                        plan.popular
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                          : "bg-white/10 hover:bg-white/20 text-white",
                      )}
                      onClick={() => router.push("/business/signup")}
                    >
                      {plan.popular ? (
                        <>
                          Start Free Trial{" "}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      ) : (
                        <>
                          Get Started <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* What's Included */}
      <div className="border-t border-white/5 py-20">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Every plan includes all three tools
          </h2>
          <p className="text-white/40 mb-12">
            You don't pay extra for spins, trivia, or draws. They're all
            included.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: RotateCcw,
                title: "Spin & Win",
                desc: "Daily engagement wheel. Customers spin from their phones. You capture emails.",
              },
              {
                icon: Brain,
                title: "Live Trivia",
                desc: "Host trivia nights with professional broadcast. Players answer from phones.",
              },
              {
                icon: Gift,
                title: "Prize Draws",
                desc: "Receipt-based entries. Top spenders win. Broadcast the draw live.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 h-full">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="h-7 w-7 text-purple-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">
                      {item.title}
                    </h3>
                    <p className="text-white/40 text-sm">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Draw Spending Tiers */}
      <div className="border-t border-white/5 py-20">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <Badge className="mb-4 bg-amber-500/20 text-amber-300 border-0">
            New
          </Badge>
          <h2 className="text-3xl font-bold text-white mb-4">
            Draws that reward your best customers
          </h2>
          <p className="text-white/40 mb-12 max-w-xl mx-auto">
            Set up draws based on spending. "Top 3 spenders this month win" or
            "Every KSH 500 = 1 entry." You decide the rules.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Top Spender Draw",
                example: "Big Mug Coffee Draw",
                desc: "The customer who spends the most during the draw period wins. Great for monthly loyalty rewards.",
                icon: Crown,
              },
              {
                title: "Receipt Entry Draw",
                example: "Weekend Getaway Draw",
                desc: "Every receipt with a purchase over a certain amount gets an entry. More spend = more entries.",
                icon: Gift,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="bg-white/5 border-white/10 h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <item.icon className="h-5 w-5 text-amber-400" />
                      </div>
                      <h3 className="text-white font-semibold">{item.title}</h3>
                    </div>
                    <p className="text-amber-400 text-sm font-medium mb-2">
                      "{item.example}"
                    </p>
                    <p className="text-white/50 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="border-t border-white/5 py-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <h3 className="text-white font-medium mb-2">{faq.q}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-20 border-t border-white/5">
        <h2 className="text-3xl font-bold text-white mb-4">
          Start your 14-day free trial
        </h2>
        <p className="text-white/60 mb-8">
          No credit card. Set up in 5 minutes. Your customers will love it.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-lg px-8"
            onClick={() => router.push("/business/signup")}
          >
            Start Free Trial <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-white/10 text-white"
            onClick={() => router.push("/spin")}
          >
            I Have a Code
          </Button>
        </div>
      </div>
    </div>
  );
}
