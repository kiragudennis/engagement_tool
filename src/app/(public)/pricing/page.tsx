// app/(public)/pricing/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Check, RotateCcw, Brain, Gift, ArrowRight, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLANS, PRICING_FAQS, formatPrice } from "@/lib/config/plans";

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );

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
            const monthlyPrice = plan.price; // $29, $79, or $194
            const annualTotal = plan.price * 10; // 10 months paid, 2 free
            const annualSavings = plan.price * 2; // 2 months free
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
                    <h3 className="text-xl font-bold text-white">
                      {plan.name}
                    </h3>
                    <p className="text-white/40 text-sm mt-1">{plan.desc}</p>

                    {/* Price */}
                    <div className="mt-4 mb-6">
                      {billingCycle === "annual" ? (
                        <>
                          {/* Annual total prominently displayed */}
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-white">
                              {formatPrice(annualTotal)}
                            </span>
                            <span className="text-white/40">/year</span>
                          </div>

                          {/* Monthly equivalent in smaller text */}
                          <p className="text-sm text-white/40 mt-1">
                            {formatPrice(monthlyPrice)}/mo • 10 months billed
                            annually
                          </p>

                          {/* Savings highlight */}
                          <div className="mt-3 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                            <p className="text-sm text-green-400 font-medium">
                              🎉 Save {formatPrice(annualSavings)} • 2 months
                              free
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Monthly price */}
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-white">
                              {formatPrice(monthlyPrice)}
                            </span>
                            <span className="text-white/40">/mo</span>
                          </div>

                          {/* Upsell to annual */}
                          <p className="text-sm text-white/30 mt-3">
                            Save {formatPrice(annualSavings)} with{" "}
                            <button
                              onClick={() => setBillingCycle("annual")}
                              className="text-green-400 hover:text-green-300 underline"
                            >
                              annual billing
                            </button>
                          </p>
                        </>
                      )}
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
                      onClick={() =>
                        router.push(
                          `/business/signup?plan=${plan.id}&billing=${billingCycle}`,
                        )
                      }
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
            {PRICING_FAQS.map((faq, i) => (
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
          {/* Early Bird */}
          <Button
            variant="outline"
            size="lg"
            className="border-white/10 text-white"
            onClick={() => router.push("/pricing/early-birds")}
          >
            Early Bird Pricing
          </Button>
        </div>
      </div>
    </div>
  );
}
