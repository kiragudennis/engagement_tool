// app/(public)/page.tsx
"use client";

import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
  RotateCcw,
  Gift,
  Users,
  ArrowRight,
  Star,
  Shield,
  Smartphone,
  Brain,
  TrendingUp,
  Check,
  ChevronRight,
  Coffee,
  Scissors,
  UtensilsCrossed,
  ShoppingBag,
  Building2,
  Music,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PLANS, formatPrice } from "@/lib/config/plans";
import { DemoWheel } from "@/components/landing/demo-wheel";
import Header from "@/components/layout/Header";
// import spinAnimation from "@/assets/lottie/spin-1.json";
// import challengesAnimation from "@/assets/lottie/challenges.json";
// import drawsAnimation from "@/assets/lottie/draws.json";
// import bundlesAnimation from "@/assets/lottie/bundles.json";
// import dealsAnimation from "@/assets/lottie/deals.json";
// import { LottieIcon } from "@/components/ui/lottie-icon";

// ─── Product Suite ─────────────────────────────────────
const PRODUCT_SUITE = [
  {
    icon: RotateCcw,
    title: "Spin & Win",
    tagline: "Daily habit builder",
    description:
      "Customers spin your branded wheel from their phones. Every spin captures their email. They come back daily for another chance to win.",
    benefit: "47 emails captured this week",
    color: "from-purple-500 to-pink-500",
    bgGlow: "bg-purple-500/10 dark:bg-purple-500/10",
    step: "Print QR → Customer scans → Spins → You get email",
  },
  {
    icon: Brain,
    title: "Live Trivia",
    tagline: "Community event builder",
    description:
      "Host trivia nights with a professional broadcast display. Customers answer from their phones. Leaderboard projects behind you.",
    benefit: "Friday nights are now packed",
    color: "from-blue-500 to-cyan-500",
    bgGlow: "bg-blue-500/10 dark:bg-blue-500/10",
    step: "Set questions → Share code → Go live → Crowd goes wild",
  },
  {
    icon: Gift,
    title: "Prize Draws",
    tagline: "Purchase incentive builder",
    description:
      "Every receipt becomes a raffle entry. More purchases = more entries. Broadcast the draw live. Turn transactions into excitement.",
    benefit: "Sales up 30% during draw periods",
    color: "from-amber-500 to-orange-500",
    bgGlow: "bg-amber-500/10 dark:bg-amber-500/10",
    step: "Set prize → Give codes on receipts → Draw live → Winner announced",
  },
];

const BUSINESS_TYPES = [
  {
    icon: Coffee,
    label: "Coffee Shops",
    useCase: "Receipt codes for daily spins & monthly draws",
  },
  {
    icon: UtensilsCrossed,
    label: "Restaurants",
    useCase: "Trivia nights & happy hour spin-to-win",
  },
  {
    icon: Scissors,
    label: "Salons & Barbers",
    useCase: "Post-appointment spins & product giveaways",
  },
  {
    icon: ShoppingBag,
    label: "Retail Stores",
    useCase: "Holiday draws & in-store engagement events",
  },
  {
    icon: Building2,
    label: "Hotels & Venues",
    useCase: "Guest entertainment & loyalty programs",
  },
  {
    icon: Music,
    label: "Bars & Nightlife",
    useCase: "Live trivia, drink giveaways & weekend draws",
  },
];

const RESULTS = [
  { metric: "300%", label: "Average email list growth", icon: TrendingUp },
  { metric: "30%", label: "Increase in repeat visits", icon: Users },
  { metric: "5 min", label: "Setup time", icon: Timer },
  { metric: "0", label: "App downloads required", icon: Smartphone },
];

const TESTIMONIALS = [
  {
    quote:
      "I was giving away free coffees to regulars anyway. Now I get their email too. My list went from 0 to 200 in a month.",
    name: "Sarah K.",
    business: "Brew & Bean Coffee",
    icon: Coffee,
  },
  {
    quote:
      "We run trivia every Friday. Customers bring friends. Sales have doubled on Friday nights since we started.",
    name: "James M.",
    business: "Tony's Pizza",
    icon: UtensilsCrossed,
  },
  {
    quote:
      "The holiday draw was insane. People were buying extra just to get more entries. Best December we've ever had.",
    name: "Grace W.",
    business: "Savvy Styles Boutique",
    icon: ShoppingBag,
  },
];

const FAQ = [
  {
    q: "How does this actually bring customers back?",
    a: "When someone spins and wins '10% Off', they have to come back to claim it. When they enter a draw, they check back to see if they won. Trivia nights become a weekly ritual. Each tool creates a reason to return.",
  },
  {
    q: "Do customers need to download anything?",
    a: "No. Everything works in a phone browser. They scan a QR code or visit a link. That's it.",
  },
  {
    q: "Who owns the customer emails?",
    a: "You do. Every email captured through spins, trivia, or draws belongs to your business. Export anytime. We never market to them.",
  },
  {
    q: "How do customers find my business on Engage?",
    a: "They don't browse. You give them a code or QR link. No code, no access. Your customers stay yours.",
  },
  {
    q: "Can I run all three—spins, trivia, and draws?",
    a: "Yes. They work together. Spins build daily habits. Trivia builds community. Draws drive purchases. Use one or all three.",
  },
];

// ─── Main Component ─────────────────────────────────────
export default function LandingPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <div className="min-h-screen">
      {/* ─── NAV ─────────────────────────────────────── */}
      <Header />
      {/* ─── HERO ────────────────────────────────────── */}
      <section ref={heroRef} className="relative pt-32 pb-24 overflow-hidden">
        {/* Background image with theme-aware overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
          style={{ backgroundImage: "url('/images/happy-people-banner.jpg')" }}
        />

        {/* Theme-aware overlay - light mode */}
        <div className="absolute inset-0 bg-white/80 dark:hidden" />

        {/* Theme-aware overlay - dark mode */}
        <div className="absolute inset-0 hidden dark:block bg-black/80" />

        {/* Decorative blur effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-pink-100 dark:bg-pink-400/20 rounded-full blur-3xl" />

        <motion.div
          style={{ opacity: heroOpacity }}
          className="container mx-auto px-4 relative z-10"
        >
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Badge className="mb-6 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 text-sm py-1.5 border-0">
                  🎉 Spins · Trivia · Draws · & Expanding
                </Badge>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
              >
                Customers who play{" "}
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 bg-clip-text text-transparent">
                  come back
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg mt-6 leading-relaxed max-w-lg
                font-semibold"
              >
                Give your customers a reason to return.{" "}
                <span className="relative inline-block">
                  Spin wheels
                  <motion.span
                    className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                  />
                </span>
                ,{" "}
                <span className="relative inline-block">
                  trivia nights
                  <motion.span
                    className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-pink-500 to-amber-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 1.0, duration: 0.8 }}
                  />
                </span>
                , and{" "}
                <span className="relative inline-block">
                  prize draws
                  <motion.span
                    className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-amber-500 to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                  />
                </span>
                . You capture their phone and emails. They come back to claim
                prizes.{" "}
                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                  Everyone wins.
                </span>
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-3 mt-8"
              >
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-lg px-8 h-14"
                >
                  <Link href="/business/signup">
                    Start Free Trial <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-gray-200 dark:border-white/10 text-gray-700 dark:text-white h-14"
                >
                  <Link href="#how-it-works">See How It Works</Link>
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-6 mt-8 text-xs sm:text-sm"
              >
                <span className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-500" /> 14-day free trial
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-500" /> No credit card
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-500" /> Setup in 5
                  minutes
                </span>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <DemoWheel />
            </motion.div>
          </div>
        </motion.div>
      </section>
      {/* ─── RESULTS BAR ─────────────────────────────── */}
      <section className="border-t border-gray-100 dark:border-white/5 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {RESULTS.map((result, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <result.icon className="h-5 w-5 text-purple-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {result.metric}
                </p>
                <p className="text-gray-400 dark:text-white/40 text-xs mt-1">
                  {result.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* ─── PRODUCT SUITE ───────────────────────────── */}
      <section
        id="how-it-works"
        className="border-t border-gray-100 dark:border-white/5 py-24 bg-gray-50/50 dark:bg-transparent"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border-0">
              The Platform
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Three tools. One goal:{" "}
              <span className="text-purple-600 dark:text-purple-400">
                bring them back.
              </span>
            </h2>
            <p className="text-gray-500 dark:text-white/40 max-w-xl mx-auto">
              Choose what works for your business. Use one or combine all three.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PRODUCT_SUITE.map((product, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-purple-300 dark:hover:border-white/20 transition-all h-full group shadow-sm dark:shadow-none">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div
                      className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center mb-5",
                        product.bgGlow,
                      )}
                    >
                      <product.icon
                        className={cn(
                          "h-7 w-7",
                          product.color.split(" ")[0].replace("from-", "text-"),
                        )}
                      />
                    </div>
                    <Badge className="mb-3 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/40 border-0 self-start text-xs">
                      {product.tagline}
                    </Badge>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      {product.title}
                    </h3>
                    <p className="text-gray-500 dark:text-white/50 text-sm leading-relaxed flex-1">
                      {product.description}
                    </p>
                    <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                      <p className="text-gray-400 dark:text-white/30 text-xs font-mono">
                        {product.step}
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                        {product.benefit}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* ─── WHO IT'S FOR ────────────────────────────── */}
      <section className="border-t border-gray-100 dark:border-white/5 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Built for{" "}
              <span className="text-purple-600 dark:text-purple-400">your</span>{" "}
              business
            </h2>
            <p className="text-gray-500 dark:text-white/40 max-w-xl mx-auto">
              If customers walk through your door, Engage works for you.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {BUSINESS_TYPES.map((biz, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-center h-full shadow-sm dark:shadow-none">
                  <CardContent className="p-5">
                    <biz.icon className="h-6 w-6 text-purple-500 mx-auto mb-3" />
                    <p className="text-gray-900 dark:text-white font-medium">
                      {biz.label}
                    </p>
                    <p className="text-gray-400 dark:text-white/30 text-xs mt-2 leading-relaxed">
                      {biz.useCase}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* ─── TESTIMONIALS ────────────────────────────── */}
      <section className="border-t border-gray-100 dark:border-white/5 py-24 bg-gray-50/50 dark:bg-transparent">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Real businesses, real results
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 h-full shadow-sm dark:shadow-none">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star
                          key={j}
                          className="h-4 w-4 text-yellow-400 fill-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-gray-600 dark:text-white/70 text-sm leading-relaxed flex-1">
                      "{t.quote}"
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                        <t.icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium text-sm">
                          {t.name}
                        </p>
                        <p className="text-gray-400 dark:text-white/40 text-xs">
                          {t.business}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── UPDATED PRICING SECTION ─── */}
      <section className="border-t border-gray-100 dark:border-white/5 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-300 border-0">
              Pricing
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Pay for usage, not features
            </h2>
            <p className="text-gray-500 dark:text-white/40 max-w-xl mx-auto">
              All plans include spins, trivia, and draws. 14-day free trial.
            </p>
            <p className="text-sm text-gray-400 dark:text-white/20 mt-3">
              💳 All prices in KES. International cards charged in USD at
              prevailing exchange rate.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  className={cn(
                    "h-full border transition-all shadow-sm dark:shadow-none",
                    plan.popular
                      ? "border-purple-300 dark:border-purple-500/50 bg-purple-50/50 dark:bg-purple-500/5 scale-105"
                      : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/5",
                  )}
                >
                  <CardContent className="flex flex-col h-full relative pt-8">
                    {plan.popular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border-0">
                        Most Popular
                      </Badge>
                    )}
                    <h3 className="text-gray-900 dark:text-white font-bold text-xl">
                      {plan.name}
                    </h3>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="text-gray-400 dark:text-white/40 text-lg">
                        /mo
                      </span>
                      <p className="text-sm text-gray-400 dark:text-white/30 mt-1">
                        ≈ ... KES
                      </p>
                    </div>
                    <p className="text-gray-500 dark:text-white/40 text-sm mt-1">
                      {plan.desc}
                    </p>
                    <ul className="mt-6 space-y-3 flex-1">
                      {plan.features
                        .filter((f) => f.included)
                        .slice(0, 6)
                        .map((f, j) => (
                          <li
                            key={j}
                            className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/60"
                          >
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            {f.text}
                          </li>
                        ))}
                    </ul>
                    <Button
                      asChild
                      className={cn(
                        "mt-6 w-full",
                        plan.popular
                          ? "bg-gradient-to-r from-purple-600 to-pink-600"
                          : "bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white",
                      )}
                    >
                      <Link href={`/business/signup?plan=${plan.id}`}>
                        Start Free Trial
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* ─── DATA OWNERSHIP ──────────────────────────── */}
      <section className="border-t border-gray-100 dark:border-white/5 py-24 bg-gray-50/50 dark:bg-transparent">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Your customers. Your data.
          </h2>
          <p className="text-gray-500 dark:text-white/50 leading-relaxed mb-8 max-w-xl mx-auto">
            Every email captured through spins, trivia, and draws belongs to
            you—not us. Export your customer list anytime. We never email your
            customers or sell their data.
            <span className="text-gray-700 dark:text-white/70">
              {" "}
              They're your customers, period.
            </span>
          </p>
        </div>
      </section>
      {/* ─── FAQ ─────────────────────────────────────── */}
      <section className="border-t border-gray-100 dark:border-white/5 py-24">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full p-5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-left hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 dark:text-white font-medium pr-4">
                      {item.q}
                    </span>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 text-gray-400 dark:text-white/40 transition-transform flex-shrink-0",
                        faqOpen === i && "rotate-90",
                      )}
                    />
                  </div>
                  {faqOpen === i && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-gray-500 dark:text-white/50 text-sm mt-4 leading-relaxed"
                    >
                      {item.a}
                    </motion.p>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* ─── CTA ─────────────────────────────────────── */}
      <section className="border-t border-gray-100 dark:border-white/5 py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to make your customers come back?
            </h2>
            <p className="text-lg text-gray-500 dark:text-white/40 mb-8 max-w-lg mx-auto">
              Spins. Trivia. Draws. One platform. Start your 14-day free trial.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-lg px-8 h-14"
              >
                <Link href="/business/signup">
                  Start Free Trial <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-gray-200 dark:border-white/10 text-gray-700 dark:text-white h-14"
              >
                <Link href="/code-entry">I Have a Code</Link>
              </Button>
            </div>
            <p className="text-gray-400 dark:text-white/30 text-sm mt-6">
              No credit card · 14-day trial · Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
