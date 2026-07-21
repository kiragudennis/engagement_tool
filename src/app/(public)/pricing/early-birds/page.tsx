// app/(public)/pricing/early-birds/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Check,
  ArrowRight,
  Shield,
  Infinity,
  Zap,
  Rocket,
  Timer,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { EARLY_BIRD_PACKAGES, formatPrice } from "@/lib/config/plans";
import { COMPARISON, FAQS } from "@/lib/config/info";

// ─── Urgency Banner ─────────────────────────────────────
function UrgencyBanner() {
  return (
    <div className="bg-gradient-to-r from-red-600/20 via-orange-600/20 to-red-600/20 border border-red-500/30 rounded-xl p-6 mb-12 max-w-3xl mx-auto">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <Timer className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-400" />
            Limited Time Offer — Only 50 Spots Per Package
          </h3>
          <p className="text-white/60 text-sm mt-1 leading-relaxed">
            These early bird packages are capped at 50 businesses per tier. Once
            they're gone, they're gone forever. Lock in lifetime access at a
            fraction of what you'd pay monthly.
          </p>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>18 Bronze spots left</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span>12 Silver spots left</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>7 Gold spots left</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Savings Calculator ─────────────────────────────────
function SavingsHighlight({ pkg }: { pkg: (typeof EARLY_BIRD_PACKAGES)[0] }) {
  // Bronze = Starter ($29/mo), Silver = Pro ($79/mo), Gold = Enterprise ($194/mo)
  const monthlyEquivalent =
    pkg.id === "gold" ? 194 : pkg.id === "silver" ? 79 : 29; // Bronze = Starter

  const annualCost = monthlyEquivalent * 10; // 10 months billed annually
  const threeYearCost = annualCost * 3; // 3 years of annual billing
  const fiveYearCost = annualCost * 5; // 5 years of annual billing
  const savings3yr = threeYearCost - pkg.priceUsd;
  const savings5yr = fiveYearCost - pkg.priceUsd;
  const monthsToBreakEven = Math.ceil(pkg.priceUsd / monthlyEquivalent);

  return (
    <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 text-center">
      <p className="text-green-400 font-bold text-lg">
        Save ${savings3yr.toLocaleString()}
      </p>
      <p className="text-white/50 text-xs mt-1">
        vs 3 years of ${monthlyEquivalent}/mo annual billing
      </p>
      <p className="text-white/30 text-xs mt-2">
        Break-even in {monthsToBreakEven} months • $
        {savings5yr.toLocaleString()} saved over 5 years
      </p>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────
export default function EarlyBirdsPricingPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string>("silver");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950">
      {/* Hero */}
      <div className="text-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Badge className="mb-4 bg-amber-500/20 text-amber-300 text-sm px-4 py-1.5 border-0">
            <Flame className="h-3.5 w-3.5 mr-1" /> Early Bird Launch Offer
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Pay once.{" "}
            <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 bg-clip-text text-transparent">
              Use forever.
            </span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Be one of the first businesses on Engage and lock in lifetime access
            at a fraction of what you'd pay monthly. Limited spots available.
          </p>
        </motion.div>
      </div>

      {/* Urgency Banner */}
      <div className="container mx-auto px-4">
        <UrgencyBanner />
      </div>

      {/* Packages */}
      <div className="container mx-auto px-4 pb-12">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {EARLY_BIRD_PACKAGES.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-4 py-1">
                    Best Value
                  </Badge>
                </div>
              )}

              <Card
                className={cn(
                  "h-full border transition-all hover:scale-[1.02] duration-300 flex flex-col cursor-pointer",
                  selectedPlan === pkg.id
                    ? `${pkg.borderColor} ${pkg.bgGlow} ring-2 ring-offset-2 ring-offset-gray-950`
                    : "border-white/10 bg-white/5",
                )}
                onClick={() => setSelectedPlan(pkg.id)}
              >
                <CardContent className="p-6 flex flex-col h-full">
                  {/* Header */}
                  <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                  <p className="text-white/40 text-sm mt-1">{pkg.desc}</p>

                  {/* Price */}
                  <div className="mt-4 mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">
                        {formatPrice(pkg.priceUsd)}
                      </span>
                      <span className="text-white/40 text-lg sm:text-xs">
                        one-time
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Infinity className="h-4 w-4 text-amber-400" />
                      <span className="text-amber-400 text-sm font-medium">
                        Lifetime access
                      </span>
                    </div>
                  </div>

                  {/* Savings highlight */}
                  <SavingsHighlight pkg={pkg} />

                  {/* Best for */}
                  <div className="mt-4 p-3 rounded-lg bg-white/5">
                    <p className="text-white/30 text-xs">Best for:</p>
                    <p className="text-white/60 text-sm">{pkg.bestFor}</p>
                  </div>

                  {/* Features */}
                  <div className="space-y-2.5 mt-4 flex-1">
                    {pkg.features.map((feature, j) => (
                      <div key={j} className="flex items-start gap-2.5">
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
                            feature.highlight
                              ? "text-amber-300 font-medium"
                              : feature.included
                                ? "text-white/70"
                                : "text-white/20 line-through",
                          )}
                        >
                          {feature.text}
                          {feature.highlight && " ⭐"}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Button
                    className={cn(
                      "w-full mt-6",
                      pkg.popular
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                        : pkg.id === "gold"
                          ? "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black"
                          : "bg-white/10 hover:bg-white/20 text-white",
                    )}
                    onClick={() =>
                      router.push(`/business/signup?plan=early_${pkg.id}`)
                    }
                  >
                    {pkg.id === "gold" ? (
                      <>
                        Get Lifetime Access <Rocket className="h-4 w-4 ml-2" />
                      </>
                    ) : pkg.popular ? (
                      <>
                        Claim Your Spot <ArrowRight className="h-4 w-4 ml-2" />
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
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="border-t border-white/5 py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How much you save vs. monthly billing
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-3 text-white/40 font-medium">
                    On save
                  </th>
                  <th className="text-center p-3 text-amber-400 font-medium">
                    Bronze
                  </th>
                  <th className="text-center p-3 text-gray-300 font-medium">
                    Silver
                  </th>
                  <th className="text-center p-3 text-yellow-400 font-medium">
                    Gold
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr
                    key={i}
                    className={cn(
                      "border-b border-white/5",
                      i === COMPARISON.length - 3 && "bg-green-500/5",
                      i === COMPARISON.length - 2 && "bg-green-500/5",
                    )}
                  >
                    <td className="p-3 text-white/60">{row.label}</td>
                    <td className="p-3 text-center text-white/70">
                      {row.bronze}
                    </td>
                    <td className="p-3 text-center text-white/70">
                      {row.silver}
                    </td>
                    <td className="p-3 text-center text-white/70">
                      {row.gold}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Why Early Bird */}
      <div className="border-t border-white/5 py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why go lifetime?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Infinity,
                title: "Never Pay Again",
                desc: "No monthly bills, no annual renewals, no price increases. Pay once and your business is set for life.",
                color: "text-green-400",
              },
              {
                icon: Shield,
                title: "Grandfathered Features",
                desc: "As we add new features and raise prices for new customers, your package stays exactly as promised.",
                color: "text-blue-400",
              },
              {
                icon: Zap,
                title: "Immediate ROI",
                desc: "Silver pays for itself in under 10 months compared to Pro plan. After that, it's pure savings.",
                color: "text-purple-400",
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
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <item.icon className={cn("h-7 w-7", item.color)} />
                    </div>
                    <h3 className="text-white font-semibold mb-2">
                      {item.title}
                    </h3>
                    <p className="text-white/40 text-sm leading-relaxed">
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
                className="p-5 rounded-xl bg-white/5 border border-white/10"
              >
                <h3 className="text-white font-medium mb-2">{faq.q}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center px-4 py-20 border-t border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge className="mb-4 bg-red-500/20 text-red-300 border-0">
            <Timer className="h-3.5 w-3.5 mr-1" /> Limited Spots Remaining
          </Badge>
          <h2 className="text-3xl font-bold text-white mb-4">
            Lock in your lifetime price today
          </h2>
          <p className="text-white/60 mb-8 max-w-lg mx-auto">
            These prices will never be this low again. 30-day money-back
            guarantee. No risk, all reward.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg px-8 hover:from-purple-500 hover:to-pink-500"
              onClick={() => router.push("/business/signup?plan=early_silver")}
            >
              Claim Your Lifetime Deal <Rocket className="h-5 w-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/10 text-white"
              onClick={() => router.push("/pricing")}
            >
              See Monthly Plans
            </Button>
          </div>
          <p className="text-white/30 text-sm mt-6">
            30-day money-back guarantee • No questions asked
          </p>
        </motion.div>
      </div>

      {/* Back link */}
      <div className="text-center pb-12">
        <Link
          href="/pricing"
          className="text-white/30 hover:text-white/50 text-sm transition-colors"
        >
          ← Back to monthly pricing
        </Link>
      </div>
    </div>
  );
}
