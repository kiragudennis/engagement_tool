// app/(public)/page.tsx
"use client";

import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Sparkles,
  RotateCcw,
  Gift,
  Users,
  Radio,
  Store,
  Ticket,
  Trophy,
  ArrowRight,
  Star,
  Shield,
  QrCode,
  Smartphone,
  Brain,
  Zap,
  TrendingUp,
  Check,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Coffee,
  Scissors,
  UtensilsCrossed,
  ShoppingBag,
  Building2,
  Music,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DemoWheel } from "@/components/landing/demo-wheel";

// ─── Demo Spin Wheel (mini) ────────────────────────────
function MiniWheel() {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  const segments = [
    { label: "Free Coffee", color: "#8B5CF6" },
    { label: "10% Off", color: "#EC4899" },
    { label: "Free Donut", color: "#F59E0B" },
    { label: "Try Again", color: "#10B981" },
    { label: "Free Latte", color: "#3B82F6" },
    { label: "20% Off", color: "#EF4444" },
  ];

  const handleDemoSpin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    const spins = 5 + Math.floor(Math.random() * 3);
    const target = Math.floor(Math.random() * segments.length);
    const segmentAngle = 360 / segments.length;
    const targetAngle =
      360 * spins + (360 - target * segmentAngle - segmentAngle / 2);
    setRotation((prev) => prev + targetAngle);

    setTimeout(() => {
      setResult(segments[target].label);
      setSpinning(false);
    }, 4000);
  };

  return (
    <div className="relative w-64 h-64 mx-auto">
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
        <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-purple-500 drop-shadow-lg" />
      </div>

      {/* Wheel */}
      <motion.div
        className="w-full h-full rounded-full relative overflow-hidden border-4 border-purple-500/30 shadow-2xl"
        style={{ boxShadow: "0 0 40px rgba(139, 92, 246, 0.2)" }}
        animate={{ rotate: rotation }}
        transition={{ duration: 4, ease: [0.15, 0.85, 0.25, 1] }}
      >
        {segments.map((seg, i) => {
          const angle = (i * 60 * Math.PI) / 180;
          const nextAngle = ((i + 1) * 60 * Math.PI) / 180;
          return (
            <div
              key={i}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(angle)}% ${50 + 50 * Math.sin(angle)}%, ${50 + 50 * Math.cos(nextAngle)}% ${50 + 50 * Math.sin(nextAngle)}%)`,
                backgroundColor: seg.color,
              }}
            >
              <span
                className="text-white text-[10px] font-bold absolute whitespace-nowrap"
                style={{
                  left: "60%",
                  top: "50%",
                  transform: "translate(-50%, -50%) rotate(90deg)",
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                {seg.label}
              </span>
            </div>
          );
        })}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-inner">
          <Sparkles className="h-5 w-5 text-purple-500" />
        </div>
      </motion.div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap shadow-lg"
        >
          🎉 {result}!
        </motion.div>
      )}
    </div>
  );
}

// ─── Business Types ─────────────────────────────────────
const BUSINESS_TYPES = [
  {
    icon: Coffee,
    label: "Coffee Shops",
    desc: "Receipt codes for loyalty spins",
  },
  {
    icon: UtensilsCrossed,
    label: "Restaurants",
    desc: "Trivia nights & happy hour games",
  },
  {
    icon: Scissors,
    label: "Salons & Barbers",
    desc: "Post-appointment spin-to-win",
  },
  {
    icon: ShoppingBag,
    label: "Retail Stores",
    desc: "In-store engagement events",
  },
  {
    icon: Building2,
    label: "Hotels & Venues",
    desc: "Guest entertainment & events",
  },
  {
    icon: Music,
    label: "Bars & Nightlife",
    desc: "Live trivia & drink giveaways",
  },
];

// ─── Testimonials ───────────────────────────────────────
const TESTIMONIALS = [
  {
    quote:
      "We run trivia every Friday now. Customers love seeing their name on the big screen. We've doubled our Friday night traffic.",
    name: "Sarah K.",
    business: "Brew & Bean Coffee",
    type: "Coffee Shop",
  },
  {
    quote:
      "I print codes on every receipt. Customers come back just to spin. My email list has grown 300% in two months.",
    name: "James M.",
    business: "Fresh Cuts Barbershop",
    type: "Barber Shop",
  },
  {
    quote:
      "We projected the leaderboard during our anniversary event. People were cheering. It felt like a game show in our store.",
    name: "Grace W.",
    business: "Savvy Styles Boutique",
    type: "Retail Store",
  },
];

// ─── Pricing Cards (compact) ────────────────────────────
const PLANS = [
  {
    name: "Starter",
    price: 29,
    desc: "For small businesses getting started",
    highlight: false,
  },
  {
    name: "Pro",
    price: 79,
    desc: "For growing businesses with regular events",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: 199,
    desc: "For chains and high-volume venues",
    highlight: false,
  },
];

// ─── FAQ ────────────────────────────────────────────────
const FAQ = [
  {
    q: "Do my customers need to download an app?",
    a: "No. Everything works in a phone browser. They just scan a QR code or visit a link.",
  },
  {
    q: "How do customers find my business on Engage?",
    a: "They don't browse. You give them a code or QR link. No code, no access. Your customers stay yours.",
  },
  {
    q: "Who owns the customer data?",
    a: "You do. Every email collected is yours. Export anytime. We never market to your customers.",
  },
  {
    q: "Can I customize the look?",
    a: "Yes. Your logo, colors, and branding appear on your spin page and live display.",
  },
  {
    q: "What about prizes?",
    a: "You decide the prizes. Free coffee, discounts, products. You fulfill them however you like.",
  },
];

// ─── Main Component ─────────────────────────────────────
export default function LandingPage() {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* ─── NAV ─────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <span className="text-white font-bold text-lg">Engage</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/how-it-works"
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/pricing"
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              About
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/spin"
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              Enter Code
            </Link>
            <Button
              asChild
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <Link href="/business/signup">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ────────────────────────────────────── */}
      <section ref={heroRef} className="relative pt-32 pb-20 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-3xl" />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="container mx-auto px-4 relative z-10"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Badge className="mb-4 bg-purple-500/20 text-purple-300 text-sm px-4 py-1.5 border-0">
                  🎉 New: Live Trivia Mode
                </Badge>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
              >
                Turn your business into a{" "}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  live game show
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-white/50 mt-6 leading-relaxed max-w-lg"
              >
                Customers spin your wheel from their phones. You project the
                leaderboard behind you. No app download. No complex setup. Just
                engagement that fills your venue.
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
                  className="border-white/10 text-white h-14"
                >
                  <Link href="/how-it-works">
                    <Play className="h-4 w-4 mr-2" /> See How It Works
                  </Link>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-6 mt-8 text-sm text-white/40"
              >
                <span className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-400" /> 14-day free trial
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-400" /> No credit card
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-400" /> Setup in minutes
                </span>
              </motion.div>
            </div>

            {/* Right: Demo Wheel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-col items-center gap-4"
            >
              <DemoWheel />
              <p className="text-white/30 text-xs mt-2">
                This is a demo. Spin to see how it works!
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ─── SOCIAL PROOF ────────────────────────────── */}
      <section className="border-t border-white/5 py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/30 text-sm mb-6">
            Trusted by businesses across Kenya
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            {[
              "Brew & Bean",
              "Fresh Cuts",
              "Savvy Styles",
              "The Daily Grind",
              "Glamour Salon",
              "Tony's Pizza",
            ].map((name) => (
              <span key={name} className="text-white/20 font-semibold text-sm">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────── */}
      <section className="border-t border-white/5 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-0">
              How It Works
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              From setup to live event in minutes
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              No technical skills needed. No app for customers to download.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                icon: Store,
                title: "Create Your Page",
                desc: "Set your branding, configure prizes, and generate access codes. Takes less than 5 minutes.",
              },
              {
                step: "2",
                icon: QrCode,
                title: "Share With Customers",
                desc: "Print a QR code for your counter, put codes on receipts, or share on social media.",
              },
              {
                step: "3",
                icon: Radio,
                title: "Go Live",
                desc: "Project the leaderboard behind you. Customers play from their phones. You capture their emails.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-400 font-bold text-xl">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  {item.title}
                </h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHO IT'S FOR ────────────────────────────── */}
      <section className="border-t border-white/5 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Built for every local business
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              If you have customers and want to engage them better, Engage works
              for you.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {BUSINESS_TYPES.map((biz, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors text-center h-full">
                  <CardContent className="p-4">
                    <biz.icon className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-white font-medium text-sm">
                      {biz.label}
                    </p>
                    <p className="text-white/30 text-xs mt-1 hidden md:block">
                      {biz.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ────────────────────────────── */}
      <section className="border-t border-white/5 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Loved by businesses
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
                <Card className="bg-white/5 border-white/10 h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star
                          key={j}
                          className="h-4 w-4 text-yellow-400 fill-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed flex-1">
                      "{t.quote}"
                    </p>
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-white font-medium text-sm">{t.name}</p>
                      <p className="text-white/40 text-xs">
                        {t.business} · {t.type}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────── */}
      <section className="border-t border-white/5 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-500/20 text-green-300 border-0">
              Pricing
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              14-day free trial on any plan. No credit card required.
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
                    "h-full border transition-all",
                    plan.highlight
                      ? "border-purple-500/50 bg-purple-500/5 scale-105"
                      : "border-white/10 bg-white/5",
                  )}
                >
                  <CardContent className="p-6 flex flex-col h-full text-center">
                    {plan.highlight && (
                      <Badge className="mb-3 bg-purple-500/20 text-purple-300 border-0 mx-auto">
                        Most Popular
                      </Badge>
                    )}
                    <h3 className="text-white font-bold text-lg">
                      {plan.name}
                    </h3>
                    <p className="text-4xl font-bold text-white mt-4">
                      ${plan.price}
                      <span className="text-white/40 text-lg">/mo</span>
                    </p>
                    <p className="text-white/40 text-sm mt-2">{plan.desc}</p>
                    <Button
                      asChild
                      className={cn(
                        "mt-6",
                        plan.highlight
                          ? "bg-gradient-to-r from-purple-600 to-pink-600"
                          : "bg-white/10 hover:bg-white/20 text-white",
                      )}
                    >
                      <Link href="/business/signup">Start Free Trial</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DATA OWNERSHIP ──────────────────────────── */}
      <section className="border-t border-white/5 py-24">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <Shield className="h-12 w-12 text-purple-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Your customers. Your data.
          </h2>
          <p className="text-white/50 leading-relaxed mb-8 max-w-xl mx-auto">
            We're a tool for businesses, not a marketplace. Customers only
            access your experience with a code you give them. Every email
            collected belongs to you. We never market to your customers or sell
            their data.{" "}
            <span className="text-white/70">
              They're your customers, not ours.
            </span>
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            {["You own the data", "Export anytime", "We never market"].map(
              (text, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-white/60"
                >
                  <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                  {text}
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────── */}
      <section className="border-t border-white/5 py-24">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
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
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{item.q}</span>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 text-white/40 transition-transform",
                        faqOpen === i && "rotate-90",
                      )}
                    />
                  </div>
                  {faqOpen === i && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-white/50 text-sm mt-3 leading-relaxed"
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
      <section className="border-t border-white/5 py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Ready to engage your customers?
            </h2>
            <p className="text-lg text-white/40 mb-8 max-w-lg mx-auto">
              Start your 14-day free trial. Set up in minutes. Your customers
              will love it.
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
                className="border-white/10 text-white h-14"
              >
                <Link href="/spin">I Have a Code</Link>
              </Button>
            </div>
            <p className="text-white/30 text-sm mt-6">
              No credit card required · 14-day trial · Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
