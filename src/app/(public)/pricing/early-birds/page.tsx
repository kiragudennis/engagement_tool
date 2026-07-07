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
  Crown,
  Sparkles,
  Shield,
  Infinity,
  Zap,
  Rocket,
  Timer,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ─── Early Bird Packages ────────────────────────────────
const EARLY_BIRD_PACKAGES = [
  {
    id: "bronze",
    name: "Bronze",
    priceKes: 100_000,
    icon: Sparkles,
    color: "from-amber-500 to-orange-500",
    borderColor: "border-amber-500/30",
    bgGlow: "bg-amber-500/10",
    popular: false,
    desc: "For small businesses ready to grow with gamification",
    features: [
      {
        text: "Lifetime access — never pay again",
        included: true,
        highlight: true,
      },
      { text: "3 spin games", included: true },
      { text: "3 trivia challenges", included: true },
      { text: "3 active draws", included: true },
      { text: "5,000 engagements/month", included: true },
      { text: "12 prize slots on wheel", included: true },
      { text: "Full branding customization", included: true },
      { text: "Customer CSV + webhook export", included: true },
      { text: "Live broadcast (OBS)", included: true },
      { text: "Bulk code generation", included: true },
      { text: "Analytics dashboard", included: true },
      { text: "3 admin users", included: true },
      { text: "Priority email support", included: true },
      { text: "API access", included: false },
      { text: "Dedicated support", included: false },
      { text: "Custom integrations", included: false },
    ],
    bestFor: "Coffee shops, salons, small retailers",
  },
  {
    id: "silver",
    name: "Silver",
    priceKes: 250_000,
    icon: Crown,
    color: "from-gray-400 to-gray-500",
    borderColor: "border-gray-400/30",
    bgGlow: "bg-gray-400/10",
    popular: true,
    desc: "For growing businesses running regular campaigns",
    features: [
      {
        text: "Lifetime access — never pay again",
        included: true,
        highlight: true,
      },
      { text: "10 spin games", included: true },
      { text: "10 trivia challenges", included: true },
      { text: "10 active draws", included: true },
      { text: "25,000 engagements/month", included: true },
      { text: "24 prize slots on wheel", included: true },
      { text: "Full branding customization", included: true },
      { text: "Customer CSV + API + Webhooks", included: true },
      { text: "Live broadcast (OBS)", included: true },
      { text: "Bulk code generation", included: true },
      { text: "Advanced analytics", included: true },
      { text: "10 admin users", included: true },
      { text: "Priority support (email + chat)", included: true },
      { text: "API access", included: true },
      { text: "Dedicated support", included: false },
      { text: "Custom integrations", included: false },
    ],
    bestFor: "Restaurants, event venues, mid-size retailers",
  },
  {
    id: "gold",
    name: "Gold",
    priceKes: 500_000,
    icon: Rocket,
    color: "from-yellow-400 to-yellow-600",
    borderColor: "border-yellow-500/30",
    bgGlow: "bg-yellow-500/10",
    popular: false,
    desc: "For chains and high-volume venues with multiple locations",
    features: [
      {
        text: "Lifetime access — never pay again",
        included: true,
        highlight: true,
      },
      { text: "Unlimited spin games", included: true },
      { text: "Unlimited trivia challenges", included: true },
      { text: "Unlimited active draws", included: true },
      { text: "100,000 engagements/month", included: true },
      { text: "24 prize slots on wheel", included: true },
      { text: "Full white-label branding", included: true },
      { text: "Customer CSV + API + Webhooks", included: true },
      { text: "Live broadcast (OBS)", included: true },
      { text: "Bulk code generation", included: true },
      { text: "Advanced analytics + custom reports", included: true },
      { text: "Unlimited admin users", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "API access", included: true },
      { text: "Custom integrations", included: true },
      { text: "Multiple location support", included: true },
    ],
    bestFor: "Chains, franchises, agencies managing multiple clients",
  },
];

// ─── Comparison with regular pricing ────────────────────
const COMPARISON = [
  {
    label: "Monthly cost",
    bronze: "KES 9,900/mo",
    silver: "KES 9,900/mo",
    gold: "KES 25,900/mo",
  },
  {
    label: "Annual cost",
    bronze: "KES 118,800/year",
    silver: "KES 118,800/year",
    gold: "KES 310,800/year",
  },
  {
    label: "3-year cost",
    bronze: "KES 356,400",
    silver: "KES 356,400",
    gold: "KES 932,400",
  },
  {
    label: "You pay once",
    bronze: "KES 100,000",
    silver: "KES 250,000",
    gold: "KES 500,000",
  },
  {
    label: "You save (3 years)",
    bronze: "KES 256,400",
    silver: "KES 106,400",
    gold: "KES 432,400",
  },
];

// ─── FAQ ────────────────────────────────────────────────
const FAQS = [
  {
    q: "What does 'lifetime access' mean?",
    a: "You pay once and never pay again. Your account stays active for the lifetime of the Engage platform. No monthly bills, no annual renewals, no surprise price increases.",
  },
  {
    q: "Is this a limited-time offer?",
    a: "Yes. These early bird packages are only available during our launch period. Once we reach our target number of early adopters, these prices will never be offered again.",
  },
  {
    q: "What happens if I outgrow my package?",
    a: "You can upgrade to a higher tier at any time by paying the difference. Already paid KES 100K for Bronze? Upgrade to Silver by paying the KES 150K difference.",
  },
  {
    q: "Can I get a refund?",
    a: "We offer a 30-day money-back guarantee. If you're not satisfied within the first 30 days, we'll refund your full payment, no questions asked.",
  },
  {
    q: "How does this compare to the monthly plans?",
    a: "The Bronze package is equivalent to our Pro plan (KES 9,900/mo). At 3 years, you'd pay KES 356,400 on monthly billing. With Bronze, you pay KES 100,000 once and save KES 256,400.",
  },
  {
    q: "What if Engage shuts down?",
    a: "We're committed to the long haul. However, in the unlikely event we cease operations, we'll provide at least 12 months notice and help you export all your data. Your customer list always belongs to you.",
  },
  {
    q: "Are there any hidden fees?",
    a: "No. The price you see is the price you pay. No setup fees, no transaction fees, no hidden costs. You get everything listed in your package for life.",
  },
];

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
  const monthlyEquivalent = pkg.id === "gold" ? 25_900 : 9_900; // Pro for bronze/silver, Enterprise for gold
  const threeYearCost = monthlyEquivalent * 36;
  const savings = threeYearCost - pkg.priceKes;
  const monthsToBreakEven = Math.ceil(pkg.priceKes / monthlyEquivalent);

  return (
    <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 text-center">
      <p className="text-green-400 font-bold text-lg">
        Save KES {savings.toLocaleString()}
      </p>
      <p className="text-white/50 text-xs mt-1">
        Compared to 3 years of monthly billing (KES{" "}
        {monthlyEquivalent.toLocaleString()}/mo)
      </p>
      <p className="text-white/30 text-xs mt-2">
        Pays for itself in {monthsToBreakEven} months
      </p>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────
export default function EarlyBirdsPricingPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string>("silver");

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
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                      pkg.bgGlow,
                    )}
                  >
                    <pkg.icon
                      className={cn(
                        "h-6 w-6",
                        pkg.color.split(" ")[0].replace("from-", "text-"),
                      )}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                  <p className="text-white/40 text-sm mt-1">{pkg.desc}</p>

                  {/* Price */}
                  <div className="mt-4 mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">
                        {formatKES(pkg.priceKes)}
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
                      router.push(`/business/signup?plan=early-${pkg.id}`)
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
                      i === COMPARISON.length - 2 && "bg-green-500/5",
                      i === COMPARISON.length - 1 && "bg-amber-500/5",
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
                desc: "Bronze pays for itself in 10 months compared to Pro plan. After that, it's pure savings.",
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
              className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-lg px-8 hover:from-amber-400 hover:to-yellow-400"
              onClick={() => router.push("/business/signup?plan=early-silver")}
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
