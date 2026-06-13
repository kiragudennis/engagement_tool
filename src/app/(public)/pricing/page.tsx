// app/(public)/pricing/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Check,
  Sparkles,
  Zap,
  Crown,
  Star,
  Users,
  RotateCcw,
  Brain,
  QrCode,
  Download,
  Mail,
  Globe,
  Headphones,
  ArrowRight,
  Shield,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Starter",
    price: 29,
    icon: Sparkles,
    color: "from-blue-500 to-cyan-500",
    borderColor: "border-blue-500/30",
    bgGlow: "bg-blue-500/10",
    popular: false,
    features: [
      { text: "1 active spin game", included: true },
      { text: "1 trivia challenge", included: true },
      { text: "500 spins per month", included: true },
      { text: "6 prize slots on wheel", included: true },
      { text: "20 trivia questions", included: true },
      { text: "Live broadcast (OBS)", included: true },
      { text: "Customer data CSV export", included: true },
      { text: "Basic branding", included: true },
      { text: "Custom slug", included: true },
      { text: "Remove branding", included: false },
      { text: "Custom domain", included: false },
      { text: "API access", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Pro",
    price: 79,
    icon: Crown,
    color: "from-purple-500 to-pink-500",
    borderColor: "border-purple-500/30",
    bgGlow: "bg-purple-500/10",
    popular: true,
    features: [
      { text: "3 active spin games", included: true },
      { text: "3 trivia challenges", included: true },
      { text: "5,000 spins per month", included: true },
      { text: "12 prize slots on wheel", included: true },
      { text: "100 trivia questions", included: true },
      { text: "Live broadcast (OBS)", included: true },
      { text: "Customer data CSV + API", included: true },
      { text: "Full branding", included: true },
      { text: "Remove branding", included: true },
      { text: "Custom domain", included: true },
      { text: "3 admin users", included: true },
      { text: "Analytics dashboard", included: true },
      { text: "Priority support", included: true },
      { text: "API access", included: false },
    ],
  },
  {
    name: "Enterprise",
    price: 199,
    icon: Zap,
    color: "from-amber-500 to-orange-500",
    borderColor: "border-amber-500/30",
    bgGlow: "bg-amber-500/10",
    popular: false,
    features: [
      { text: "Unlimited spin games", included: true },
      { text: "Unlimited trivia challenges", included: true },
      { text: "25,000 spins per month", included: true },
      { text: "24 prize slots on wheel", included: true },
      { text: "Unlimited trivia questions", included: true },
      { text: "Live broadcast (OBS)", included: true },
      { text: "Customer data CSV + API + Webhooks", included: true },
      { text: "Full white-label", included: true },
      { text: "Multiple locations", included: true },
      { text: "10 admin users", included: true },
      { text: "Dedicated support", included: true },
      { text: "API access", included: true },
      { text: "Custom integrations", included: true },
    ],
  },
];

const FAQS = [
  {
    q: "Can I switch plans later?",
    a: "Yes! Upgrade or downgrade anytime. Changes take effect immediately.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes, 14-day free trial on any plan. No credit card required.",
  },
  {
    q: "What counts as a spin?",
    a: "Each time a customer spins your wheel counts as one spin. The counter resets monthly.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. No contracts, no cancellation fees.",
  },
  {
    q: "Do you support M-Pesa?",
    a: "Yes! We accept M-Pesa, PayPal, and major credit cards.",
  },
];

export default function PricingPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );

  const getPrice = (basePrice: number) => {
    return billingCycle === "annual"
      ? Math.round((basePrice * 10) / 12)
      : basePrice;
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
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-white/60 max-w-xl mx-auto">
            Everything you need to engage your customers with live games and
            spin-to-win experiences
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
                    "h-full border transition-all hover:scale-[1.02] duration-300",
                    plan.popular
                      ? "border-purple-500/50 bg-purple-500/5"
                      : "border-white/10 bg-white/5",
                  )}
                >
                  <CardContent className="p-6 flex flex-col h-full">
                    {/* Plan Header */}
                    <div
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
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      {plan.name}
                    </h3>

                    {/* Price */}
                    <div className="mt-4 mb-6">
                      <span className="text-4xl font-bold text-white">
                        ${price}
                      </span>
                      <span className="text-white/40">/mo</span>
                      {billingCycle === "annual" && (
                        <p className="text-xs text-green-400 mt-1">
                          ${plan.price}/mo billed annually
                        </p>
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
                          `/business/signup?plan=${plan.name.toLowerCase()}`,
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

      {/* Why businesses choose us */}
      <div className="border-t border-white/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-12">
            Why businesses choose Engage
          </h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: RotateCcw,
                title: "No App Download",
                desc: "Customers play instantly from their phone browser",
              },
              {
                icon: Brain,
                title: "Live Game Shows",
                desc: "Turn your venue into a game show with OBS broadcast",
              },
              {
                icon: Users,
                title: "Customer Data",
                desc: "Every spin captures emails for your marketing list",
              },
              {
                icon: Shield,
                title: "No Integration",
                desc: "Zero setup. Create codes, share, start engaging.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-7 w-7 text-purple-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm">{item.desc}</p>
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
                <h3 className="text-white font-medium mb-1">{faq.q}</h3>
                <p className="text-white/50 text-sm">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-20 border-t border-white/5">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to engage your customers?
        </h2>
        <p className="text-white/60 mb-8">
          Start your 14-day free trial. No credit card required.
        </p>
        <Button
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-lg px-8"
          onClick={() => router.push("/business/signup")}
        >
          Create Your Free Account <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
