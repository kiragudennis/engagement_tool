// app/(public)/docs/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  RotateCcw,
  Brain,
  Gift,
  Ticket,
  Store,
  Users,
  Check,
  Shield,
  Printer,
  ShoppingBag,
  Star,
  Crown,
  Diamond,
  Zap,
  Radio,
  FunnelPlus,
  CirclePause,
  Trophy,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const SECTIONS = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "business", label: "For Businesses", icon: Store },
  { id: "customer", label: "For Customers", icon: Users },
  { id: "codes", label: "How Codes Work", icon: Ticket },
  { id: "stickers", label: "Sticker System", icon: Printer },
  { id: "pos", label: "POS Integration", icon: ShoppingBag },
  { id: "engagement", label: "Engagement", icon: FunnelPlus },
  { id: "limits", label: "limits", icon: CirclePause },
  { id: "faq", label: "FAQ", icon: Shield },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950">
      {/* Hero - Full width with inner container */}
      <div className="w-full border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-0">
            Documentation
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How Engage Works
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Everything you need to know about turning your business into a
            gamified experience. From printing sticker codes to integrating with
            your POS system.
          </p>
        </div>
      </div>

      {/* Content - Full width with inner container */}
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation - Hidden on mobile, shown on desktop */}
            <nav className="hidden lg:block w-56 flex-shrink-0">
              <div className="sticky top-24 space-y-1">
                {SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      document
                        .getElementById(section.id)
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                      activeSection === section.id
                        ? "bg-purple-500/20 text-purple-400 font-medium"
                        : "text-white/40 hover:text-white/70 hover:bg-white/5",
                    )}
                  >
                    <section.icon className="h-4 w-4" />
                    {section.label}
                  </button>
                ))}
                <div className="pt-4 mt-4 border-t border-white/5">
                  <Link href="/docs/api">
                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/40 hover:text-purple-400 hover:bg-white/5 transition-colors text-left">
                      <Zap className="h-4 w-4" />
                      API Reference
                      <Badge className="ml-auto bg-purple-500/20 text-purple-400 text-xs border-0">
                        Dev
                      </Badge>
                    </button>
                  </Link>
                </div>
              </div>
            </nav>

            {/* Content - Full width on mobile, constrained on desktop */}
            <div className="flex-1 min-w-0 space-y-20">
              {/* ─── OVERVIEW ─────────────────────────────── */}
              <section id="overview">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-purple-400" /> Overview
                </h2>
                <div className="prose prose-invert max-w-none space-y-4">
                  <p className="text-white/60 leading-relaxed">
                    Engage is a customer retention platform that turns everyday
                    purchases into gamified experiences. Businesses print unique
                    codes on products or receipts. Customers scan these codes to
                    spin wheels, join trivia challenges, enter prize draws, and
                    earn loyalty points.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 not-prose">
                    {[
                      {
                        icon: RotateCcw,
                        title: "Spin & Win",
                        desc: "Customers spin your branded wheel for instant prizes",
                      },
                      {
                        icon: Brain,
                        title: "Live Trivia",
                        desc: "Host trivia nights with professional OBS broadcast",
                      },
                      {
                        icon: Gift,
                        title: "Prize Draws",
                        desc: "Customers enter draws by redeeming codes",
                      },
                    ].map((item, i) => (
                      <Card
                        key={i}
                        className="bg-white/5 border-white/10 text-center"
                      >
                        <CardContent className="p-4">
                          <item.icon className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                          <h4 className="text-white font-medium text-sm">
                            {item.title}
                          </h4>
                          <p className="text-white/40 text-xs mt-1">
                            {item.desc}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <h3 className="text-white font-semibold text-lg mt-8">
                    Two Ways to Use Engage
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
                    <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Printer className="h-5 w-5 text-purple-400" />
                          <Badge className="bg-purple-500/20 text-purple-400 border-0">
                            All Plans
                          </Badge>
                        </div>
                        <h4 className="text-white font-bold text-lg mb-2">
                          Sticker Model
                        </h4>
                        <p className="text-white/50 text-sm leading-relaxed">
                          Pre-print codes on products before customers arrive.
                          Zero staff involvement during rush hour. Customers
                          discover codes on their cups, bags, or packaging and
                          scan them at their convenience.
                        </p>
                        <ul className="mt-3 space-y-1 text-white/40 text-xs">
                          <li className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-green-400" /> No POS
                            needed
                          </li>
                          <li className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-green-400" /> Print
                            in bulk
                          </li>
                          <li className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-green-400" /> Rarity
                            tiers (Bronze→Diamond)
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <ShoppingBag className="h-5 w-5 text-blue-400" />
                          <Badge className="bg-blue-500/20 text-blue-400 border-0">
                            Pro & Enterprise
                          </Badge>
                        </div>
                        <h4 className="text-white font-bold text-lg mb-2">
                          POS Integration
                        </h4>
                        <p className="text-white/50 text-sm leading-relaxed">
                          Connect your existing POS system to Engage. Every
                          transaction automatically generates a unique code with
                          points based on the cart total. Printed directly on
                          your existing receipts.
                        </p>
                        <ul className="mt-3 space-y-1 text-white/40 text-xs">
                          <li className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-green-400" />{" "}
                            Automatic code generation
                          </li>
                          <li className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-green-400" /> Points
                            = Amount × Multiplier
                          </li>
                          <li className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-green-400" /> Works
                            with any POS
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </section>

              {/* ─── FOR BUSINESSES ───────────────────────── */}
              <section id="business">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Store className="h-6 w-6 text-purple-400" /> For Businesses
                </h2>
                <div className="space-y-6">
                  <StepCard
                    number={1}
                    title="Create Your Business Account"
                    description="Sign up at engagespin.com/business/signup. You'll get a 14-day free trial with full access to all features."
                  />
                  <StepCard
                    number={2}
                    title="Configure Your Spin Wheel"
                    description="Set up prizes on your spin wheel — free coffee, discounts, products. Choose what customers can win."
                  />
                  <StepCard
                    number={3}
                    title="Generate Codes"
                    description={
                      <span>
                        <strong className="text-white">Sticker model:</strong>{" "}
                        Use the Sticker Batch Generator to create rarity-tiered
                        codes (Bronze, Silver, Gold, Diamond). Print them on
                        thermal labels and stick them on your products.
                        <br />
                        <br />
                        <strong className="text-white">
                          POS model (Pro/Enterprise):
                        </strong>{" "}
                        Use our API to generate receipt codes automatically.
                        Send the cart total, get a code back with calculated
                        points.
                      </span>
                    }
                  />
                  <StepCard
                    number={4}
                    title="Share With Customers"
                    description="Customers discover codes on your products or receipts. They visit your Engage page, enter the code, and start playing."
                  />
                  <StepCard
                    number={5}
                    title="Watch Your Customer List Grow"
                    description="Every code redemption captures customer data. Export your list anytime. These are your customers — we never market to them."
                  />
                </div>
              </section>

              {/* ─── FOR CUSTOMERS ────────────────────────── */}
              <section id="customer">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6 text-purple-400" /> For Customers
                </h2>
                <div className="space-y-6">
                  <StepCard
                    number={1}
                    title="Get a Code"
                    description="Buy a product from your favorite local business. Find the code on the cup, bag, receipt, or packaging."
                  />
                  <StepCard
                    number={2}
                    title="Enter It Online"
                    description="Visit the business's Engage page or scan the QR code. Enter your code on your phone — no app download needed."
                  />
                  <StepCard
                    number={3}
                    title="Spin, Play, Win"
                    description="Spin the wheel for instant prizes, join live trivia nights, or enter prize draws. Every code gives you loyalty points."
                  />
                  <StepCard
                    number={4}
                    title="Come Back"
                    description="The more you engage, the more points you earn. Climb from Bronze to Platinum tier. Come back for new codes and new chances to win."
                  />
                </div>
              </section>

              {/* ─── HOW CODES WORK ───────────────────────── */}
              <section id="codes">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Ticket className="h-6 w-6 text-purple-400" /> How Codes Work
                </h2>

                <div className="space-y-6">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <h3 className="text-white font-semibold mb-4">
                        Code Types
                      </h3>
                      <p className="text-white/50 text-sm mb-4">
                        All codes are generated through a unified{" "}
                        <code className="text-purple-400">
                          business code generator
                        </code>
                        . The pattern includes your business prefix, plan type,
                        code subtype, sequence number, and a random string.
                      </p>
                      <div className="space-y-4">
                        {[
                          {
                            type: "Receipt Codes",
                            pattern: "{PREFIX}-{PLAN}R-{SEQ}-{RAND}",
                            example: "BREW-PR-00042-A7X9",
                            desc: "Generated via API from POS, e-commerce, or manual checkout. Points = Cart Amount × Business Multiplier. Activates the customer.",
                            tiers: "Calculated per transaction",
                            badge: "R",
                            color: "green",
                          },
                          {
                            type: "Sticker Codes",
                            pattern: "{PREFIX}-{PLAN}S-{SEQ}-{RAND}",
                            example: "BREW-PS-00001-B3K2",
                            desc: "Pre-printed on products. Each tier has a fixed point value. Activates the customer for 30 days.",
                            tiers:
                              "Bronze (5pts), Silver (25pts), Gold (100pts), Diamond (500pts)",
                            badge: "S",
                            color: "blue",
                          },
                          {
                            type: "Public Marketing Codes",
                            pattern: "{PREFIX}-{PLAN}P-{SEQ}-{RAND}",
                            example: "BREW-PP-00015-C7D1",
                            desc: "Shared on social media. Requires prior activation. Awards default points. Does NOT extend activation.",
                            tiers: "Business default points",
                            badge: "P",
                            color: "amber",
                          },
                          {
                            type: "QR Codes",
                            pattern: "{PREFIX}-{PLAN}Q-{SEQ}-{RAND}",
                            example: "BREW-PQ-00008-E5F3",
                            desc: "Printed at the counter. Activates new customers who scan it in-store.",
                            tiers: "Business default points",
                            badge: "Q",
                            color: "purple",
                          },
                        ].map((code, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-lg bg-white/5 border border-white/10"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                              <div className="flex items-center gap-2">
                                <h4 className="text-white font-medium">
                                  {code.type}
                                </h4>
                                <Badge
                                  className={cn(
                                    "text-xs border-0",
                                    code.badge === "R" &&
                                      "bg-green-500/20 text-green-400",
                                    code.badge === "S" &&
                                      "bg-blue-500/20 text-blue-400",
                                    code.badge === "P" &&
                                      "bg-amber-500/20 text-amber-400",
                                    code.badge === "Q" &&
                                      "bg-purple-500/20 text-purple-400",
                                  )}
                                >
                                  {code.badge}
                                </Badge>
                              </div>
                              <code className="text-purple-400 text-xs font-mono break-all">
                                {code.example}
                              </code>
                            </div>
                            <p className="text-white/50 text-sm mb-1">
                              {code.desc}
                            </p>
                            <p className="text-white/30 text-xs mb-1">
                              Pattern:{" "}
                              <code className="text-purple-400/60 font-mono">
                                {code.pattern}
                              </code>
                            </p>
                            <p className="text-white/30 text-xs">
                              Points: {code.tiers}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 p-3 rounded-lg bg-black/30">
                        <p className="text-white/40 text-xs">
                          <strong className="text-white">Plan Types:</strong>{" "}
                          S=Starter, P=Pro, E=Enterprise &nbsp;|&nbsp;
                          <strong className="text-white">
                            {" "}
                            Subtypes:
                          </strong>{" "}
                          R=Receipt, S=Sticker, P=Public, Q=QR &nbsp;|&nbsp;
                          <strong className="text-white"> Prefix:</strong> First
                          4 letters of your business slug
                        </p>
                        <p className="text-white/30 text-xs mt-2">
                          Example:{" "}
                          <code className="text-purple-400/60">
                            BREW-PR-00042-A7X9
                          </code>{" "}
                          = Business "Brew & Bean" (BREW) + Pro Plan (P) +
                          Receipt (R) + Sequence #42 + Random code A7X9
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <h3 className="text-white font-semibold mb-4">
                        Activation System
                      </h3>
                      <div className="space-y-3 text-white/60 text-sm leading-relaxed">
                        <p>
                          When a customer redeems a sticker, receipt, or QR
                          code, their account becomes
                          <strong className="text-white">
                            {" "}
                            "active" for your business for 30 days
                          </strong>
                          . While active, they can:
                        </p>
                        <ul className="space-y-1 pl-4">
                          <li className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-400 flex-shrink-0" />{" "}
                            Spin your wheel (within daily limits)
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-400 flex-shrink-0" />{" "}
                            Join trivia challenges
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-400 flex-shrink-0" />{" "}
                            Enter prize draws
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-400 flex-shrink-0" />{" "}
                            Redeem public marketing codes
                          </li>
                        </ul>
                        <p className="mt-3">
                          Public marketing codes{" "}
                          <strong className="text-white">require</strong> the
                          customer to already be active. This prevents random
                          people from using codes shared on social media without
                          ever having visited your business.
                        </p>
                        <p>
                          Each new sticker or receipt code{" "}
                          <strong className="text-white">extends</strong>
                          the activation by another 30 days (default). Loyal
                          customers stay active as long as they keep engaging.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* ─── STICKER SYSTEM ───────────────────────── */}
              <section id="stickers">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Printer className="h-6 w-6 text-purple-400" /> Sticker System
                </h2>

                <div className="space-y-6">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <h3 className="text-white font-semibold mb-4">
                        Rarity Tiers & Unlocks
                      </h3>
                      <p className="text-white/50 text-sm mb-4">
                        Create a treasure hunt experience by mixing different
                        rarity codes on your products. Higher tiers don't just
                        give more points — they unlock better experiences.
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          {
                            tier: "Bronze",
                            icon: Star,
                            color: "#CD7F32",
                            points: 5,
                            pct: "70%",
                            unlocks: "Points Only",
                            unlocksDesc: "Earn points, come back to spin",
                            desc: "Most common",
                          },
                          {
                            tier: "Silver",
                            icon: Sparkles,
                            color: "#C0C0C0",
                            points: 25,
                            pct: "20%",
                            unlocks: "Spin Access",
                            unlocksDesc: "Unlocks the spin wheel",
                            desc: "Uncommon",
                          },
                          {
                            tier: "Gold",
                            icon: Crown,
                            color: "#FFD700",
                            points: 100,
                            pct: "8%",
                            unlocks: "Spin + Draws",
                            unlocksDesc: "Spin wheel & auto-enter draws",
                            desc: "Rare",
                          },
                          {
                            tier: "Diamond",
                            icon: Diamond,
                            color: "#B9F2FF",
                            points: 500,
                            pct: "2%",
                            unlocks: "VIP Access",
                            unlocksDesc: "Spins, draws, VIP status",
                            desc: "Ultra rare",
                          },
                        ].map((t) => (
                          <div
                            key={t.tier}
                            className="p-4 rounded-xl bg-white/5 border text-center"
                            style={{ borderColor: `${t.color}30` }}
                          >
                            <t.icon
                              className="h-6 w-6 mx-auto mb-1"
                              style={{ color: t.color }}
                            />
                            <p className="text-white font-bold text-sm">
                              {t.tier}
                            </p>
                            <p className="text-white/40 text-xs">
                              {t.points} points
                            </p>
                            <Badge
                              className="mt-1 mb-1 text-xs"
                              style={{
                                backgroundColor: `${t.color}20`,
                                color: t.color,
                              }}
                            >
                              {t.pct} of codes
                            </Badge>
                            <p className="text-white/50 text-xs font-medium">
                              {t.unlocks}
                            </p>
                            <p className="text-white/30 text-xs mt-0.5">
                              {t.unlocksDesc}
                            </p>
                            <p className="text-white/20 text-xs mt-1">
                              {t.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <h3 className="text-white font-semibold mb-4">
                        How Unlocks Work
                      </h3>
                      <div className="space-y-3 text-white/60 text-sm leading-relaxed">
                        <p>
                          Each rarity tier can be configured with different{" "}
                          <strong className="text-white">unlock levels</strong>{" "}
                          that control what a customer can do after redeeming
                          that code:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                          {[
                            {
                              level: "Points Only",
                              icon: Coins,
                              desc: "Customer earns points but needs another code to access the spin wheel. Creates urgency to find more codes.",
                              example:
                                "Bronze stickers: 'You earned 5 points! Find a Silver code to unlock the spin wheel!'",
                            },
                            {
                              level: "Spin Access",
                              icon: RotateCcw,
                              desc: "Customer can spin the wheel. Good for mid-tier rewards that feel like a real prize unlock.",
                              example:
                                "Silver stickers: 'You unlocked the spin wheel! 25 bonus points!'",
                            },
                            {
                              level: "Spin + Draws",
                              icon: Gift,
                              desc: "Customer gets spin access AND is automatically entered into active prize draws. Premium experience.",
                              example:
                                "Gold/Diamond: 'JACKPOT! Spins, draws, and points!'",
                            },
                            {
                              level: "Draws Only",
                              icon: Trophy,
                              desc: "Customer is entered into draws but can't spin. Useful for special promotional stickers.",
                              example:
                                "Event stickers: 'You've been entered into our grand prize draw!'",
                            },
                          ].map((item, i) => (
                            <div key={i} className="p-3 rounded-lg bg-white/5">
                              <div className="flex items-center gap-2 mb-1">
                                <item.icon className="h-4 w-4 text-purple-400" />
                                <span className="text-white font-medium text-sm">
                                  {item.level}
                                </span>
                              </div>
                              <p className="text-white/50 text-xs mb-2">
                                {item.desc}
                              </p>
                              <p className="text-purple-400/60 text-xs italic">
                                {item.example}
                              </p>
                            </div>
                          ))}
                        </div>

                        <p className="mt-4">
                          <strong className="text-white">
                            Why this matters:
                          </strong>{" "}
                          A Diamond sticker shouldn't just give more points — it
                          should <em>feel</em> like finding a golden ticket. By
                          gating features behind rarity tiers, you create
                          genuine excitement when customers find rare codes.
                          They'll buy more products hoping for that Silver or
                          Gold sticker.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <h3 className="text-white font-semibold mb-4">
                        Customer Experience by Tier
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left p-2 text-white/40 font-medium">
                                Tier
                              </th>
                              <th className="text-left p-2 text-white/40 font-medium">
                                Points
                              </th>
                              <th className="text-left p-2 text-white/40 font-medium">
                                Unlocks
                              </th>
                              <th className="text-left p-2 text-white/40 font-medium">
                                Customer Sees
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              [
                                "🥉 Bronze",
                                "5 pts",
                                "Points Only",
                                "You earned 5 points! Come back with another code to spin!",
                              ],
                              [
                                "🥈 Silver",
                                "25 pts",
                                "Spin Access",
                                "You unlocked the spin wheel! 25 bonus points!",
                              ],
                              [
                                "🥇 Gold",
                                "100 pts",
                                "Spin + Draws",
                                "You unlocked spins AND entered our monthly draw! 100 points!",
                              ],
                              [
                                "💎 Diamond",
                                "500 pts",
                                "VIP Access",
                                "JACKPOT! Spins, draws, and 500 points! You're a VIP!",
                              ],
                            ].map((row, i) => (
                              <tr key={i} className="border-b border-white/5">
                                <td className="p-2 text-white/70">{row[0]}</td>
                                <td className="p-2 text-white/50">{row[1]}</td>
                                <td className="p-2 text-purple-400">
                                  {row[2]}
                                </td>
                                <td className="p-2 text-white/40 text-xs">
                                  {row[3]}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <h3 className="text-white font-semibold mb-4">
                        How to Print
                      </h3>
                      <ol className="space-y-4 text-white/60 text-sm">
                        <li className="flex gap-3">
                          <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs flex-shrink-0">
                            1
                          </span>
                          <span>
                            Get a thermal label printer (YCP-58 or similar, ~KES
                            5,000-15,000) and thermal sticker rolls.
                          </span>
                        </li>
                        <li className="flex gap-3">
                          <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs flex-shrink-0">
                            2
                          </span>
                          <span>
                            Use the{" "}
                            <strong className="text-white">
                              Sticker Batch Generator
                            </strong>{" "}
                            in your dashboard to create batches with your chosen
                            rarity distribution and per-tier unlocks.
                          </span>
                        </li>
                        <li className="flex gap-3">
                          <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs flex-shrink-0">
                            3
                          </span>
                          <span>
                            Each sticker is printed with its rarity color, point
                            value, unlock level, QR code, and unique code.
                            Customers can immediately see what they've won.
                          </span>
                        </li>
                        <li className="flex gap-3">
                          <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs flex-shrink-0">
                            4
                          </span>
                          <span>
                            Customers discover codes on their purchases and scan
                            them at home. No staff involvement during rush hour.
                          </span>
                        </li>
                      </ol>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* ─── POS INTEGRATION ──────────────────────── */}
              <section id="pos">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <ShoppingBag className="h-6 w-6 text-purple-400" /> POS
                  Integration
                </h2>

                <Card className="bg-white/5 border-white/10 mb-6">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-500/20 text-blue-400 border-0">
                        Pro & Enterprise
                      </Badge>
                    </div>
                    <p className="text-white/50 text-sm">
                      Connect your existing POS system to Engage. Every
                      transaction automatically generates a unique code with
                      points based on the cart total. Printed directly on your
                      existing receipts.
                    </p>

                    {/* What the customer gets based on what you send */}
                    <Card className="bg-white/5 border-white/10">
                      <CardContent className="p-4">
                        <h4 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                          <Gift className="h-4 w-4 text-purple-400" />
                          What Your Customer Gets
                        </h4>
                        <p className="text-white/50 text-xs mb-3">
                          When your POS sends a request to Engage, you can
                          control exactly what the customer unlocks by setting
                          the <code className="text-purple-400">unlocks</code>{" "}
                          parameter. This lets you tailor the experience based
                          on purchase value, customer loyalty, or promotional
                          campaigns.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            {
                              unlock: "points",
                              icon: Coins,
                              desc: "Customer earns points only. They'll need another code (sticker or receipt) to access the spin wheel. Best for small purchases where you want to encourage repeat visits.",
                              example: "Cart total < KES 100 → Points only",
                              label: "Points Only",
                            },
                            {
                              unlock: "spin",
                              icon: RotateCcw,
                              desc: "Customer unlocks the spin wheel immediately. Great for mid-tier purchases that deserve a reward.",
                              example: "Cart total KES 100-500 → Spin access",
                              label: "Spin Access",
                            },
                            {
                              unlock: "draw",
                              icon: Trophy,
                              desc: "Customer is automatically entered into your active prize draws but can't spin. Perfect for promotional periods or when you want to build anticipation.",
                              example: "Weekend promotion → Draw entry",
                              label: "Draw Entry",
                            },
                            {
                              unlock: "spin_draw",
                              icon: Crown,
                              desc: "The premium experience — customer gets both spin access AND automatic entry into prize draws. Use this for high-value purchases or VIP customers.",
                              example: "Cart total > KES 500 → Spin + Draw",
                              label: "Spin + Draw (Premium)",
                            },
                          ].map((item, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-lg bg-white/5 border border-white/10"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <item.icon className="h-4 w-4 text-purple-400" />
                                <Badge
                                  className={cn(
                                    "text-xs border-0",
                                    item.unlock === "points" &&
                                      "bg-gray-500/20 text-gray-400",
                                    item.unlock === "spin" &&
                                      "bg-blue-500/20 text-blue-400",
                                    item.unlock === "draw" &&
                                      "bg-amber-500/20 text-amber-400",
                                    item.unlock === "spin_draw" &&
                                      "bg-purple-500/20 text-purple-400",
                                  )}
                                >
                                  {item.label}
                                </Badge>
                              </div>
                              <p className="text-white/50 text-xs mb-2">
                                {item.desc}
                              </p>
                              <p className="text-purple-400/60 text-xs italic">
                                {item.example}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                          <h5 className="text-purple-400 font-medium text-xs mb-1">
                            💡 How to Use This
                          </h5>
                          <ul className="space-y-1 text-purple-400/60 text-xs">
                            <li>
                              •{" "}
                              <strong className="text-purple-300">
                                Lower spend:
                              </strong>{" "}
                              Send{" "}
                              <code className="text-purple-400">
                                "unlocks": "points"
                              </code>{" "}
                              — customer earns points, needs to come back
                            </li>
                            <li>
                              •{" "}
                              <strong className="text-purple-300">
                                Mid spend:
                              </strong>{" "}
                              Send{" "}
                              <code className="text-purple-400">
                                "unlocks": "spin"
                              </code>{" "}
                              — customer can spin immediately
                            </li>
                            <li>
                              •{" "}
                              <strong className="text-purple-300">
                                High spend:
                              </strong>{" "}
                              Send{" "}
                              <code className="text-purple-400">
                                "unlocks": "spin_draw"
                              </code>{" "}
                              — premium experience rewards loyalty
                            </li>
                            <li>
                              •{" "}
                              <strong className="text-purple-300">
                                Promotions:
                              </strong>{" "}
                              Send{" "}
                              <code className="text-purple-400">
                                "unlocks": "draw"
                              </code>{" "}
                              — build excitement for upcoming events
                            </li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>

                    {/* What Engage needs from your POS */}
                    <Card className="bg-white/5 border-white/10">
                      <CardContent className="p-4">
                        <h4 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4 text-blue-400" />
                          What Engage Needs From Your POS
                        </h4>
                        <p className="text-white/50 text-xs mb-3">
                          Engage does{" "}
                          <strong className="text-white">not</strong> record
                          your receipts or store your sales data. We only need
                          the <strong className="text-white">cart total</strong>{" "}
                          to calculate points. Everything else is optional.
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                            <h5 className="text-green-400 font-medium text-xs mb-2 flex items-center gap-1">
                              <Check className="h-3 w-3" /> Required
                            </h5>
                            <ul className="space-y-1 text-white/50 text-xs">
                              <li>
                                • <code className="text-green-400">amount</code>{" "}
                                — Cart total (KES)
                              </li>
                            </ul>
                          </div>
                          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                            <h5 className="text-blue-400 font-medium text-xs mb-2 flex items-center gap-1">
                              <Zap className="h-3 w-3" /> Optional (for control)
                            </h5>
                            <ul className="space-y-1 text-white/50 text-xs">
                              <li>
                                • <code className="text-blue-400">unlocks</code>{" "}
                                — What customer gets (default: "points")
                              </li>
                              <li>
                                •{" "}
                                <code className="text-blue-400">
                                  pointsOverride
                                </code>{" "}
                                — Set exact points
                              </li>
                              <li>
                                • <code className="text-blue-400">items</code> —
                                Line items (for your records)
                              </li>
                              <li>
                                •{" "}
                                <code className="text-blue-400">
                                  customerPhone
                                </code>{" "}
                                — Pre-fill customer info
                              </li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <p className="text-white/50 text-sm">
                      Points are automatically calculated based on your
                      configured multiplier (e.g., 2.0 × KES 250 = 500 points).
                      You can override this with{" "}
                      <code className="text-purple-400">pointsOverride</code> if
                      needed.
                    </p>

                    <Link href="/docs/api">
                      <Button
                        variant="outline"
                        className="border-purple-500/30 text-purple-400 gap-2"
                      >
                        <Zap className="h-4 w-4" /> Full API Reference
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Example scenarios */}
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-6">
                    <h3 className="text-white font-semibold mb-4">
                      Real-World Examples
                    </h3>
                    <div className="space-y-4">
                      {[
                        {
                          scenario: "Coffee Shop: Regular Customer",
                          amount: "KES 150",
                          multiplier: "2.0",
                          points: "300",
                          unlocks: "spin",
                          result:
                            "Spin the wheel for a chance to win a free drink next visit",
                        },
                        {
                          scenario: "Restaurant: Big Group Order",
                          amount: "KES 2,500",
                          multiplier: "1.5",
                          points: "3,750",
                          unlocks: "spin_draw",
                          result:
                            "Spin the wheel AND entered into the monthly dinner draw",
                        },
                        {
                          scenario: "Retail: Small Purchase (Promo Period)",
                          amount: "KES 50",
                          multiplier: "1.0",
                          points: "50",
                          unlocks: "draw",
                          result:
                            "Entered into the weekend prize draw, no spin access",
                        },
                        {
                          scenario: "Loyalty Program: Points Only",
                          amount: "KES 75",
                          multiplier: "3.0 (Double points week)",
                          points: "225",
                          unlocks: "points",
                          result:
                            "Earn 225 loyalty points. Collect more codes to unlock the wheel!",
                        },
                      ].map((example, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-lg bg-white/5 border border-white/10"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div>
                              <h4 className="text-white font-medium text-sm">
                                {example.scenario}
                              </h4>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge className="bg-white/10 text-white/60 text-xs">
                                  Amount: {example.amount}
                                </Badge>
                                <Badge className="bg-white/10 text-white/60 text-xs">
                                  Multiplier: {example.multiplier}
                                </Badge>
                                <Badge className="bg-green-500/20 text-green-400 text-xs">
                                  Points: {example.points}
                                </Badge>
                                <Badge
                                  className={cn(
                                    "text-xs border-0",
                                    example.unlocks === "points" &&
                                      "bg-gray-500/20 text-gray-400",
                                    example.unlocks === "spin" &&
                                      "bg-blue-500/20 text-blue-400",
                                    example.unlocks === "draw" &&
                                      "bg-amber-500/20 text-amber-400",
                                    example.unlocks === "spin_draw" &&
                                      "bg-purple-500/20 text-purple-400",
                                  )}
                                >
                                  {example.unlocks.replace("_", " + ")}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-white/50 text-sm flex-shrink-0">
                              <span className="text-white/30">→</span>{" "}
                              {example.result}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* ─── ENGAGEMENT ───────────────────────────────────── */}
              <section id="engagement">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <FunnelPlus className="h-6 w-6 text-purple-400" /> The Full
                  Engagement Flow
                </h2>

                <p className="text-white/50 text-sm mb-8 leading-relaxed">
                  Here's how everything connects, from code redemption to live
                  broadcast. Engage works both for everyday engagement and live
                  events streamed on social media.
                </p>

                {/* Spin & Win */}
                <Card className="bg-white/5 border-white/10 mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <RotateCcw className="h-5 w-5 text-purple-400" />
                      <h3 className="text-white font-bold text-lg">
                        Spin & Win
                      </h3>
                      <Badge className="bg-purple-500/20 text-purple-400 text-xs border-0">
                        Instant
                      </Badge>
                    </div>

                    <div className="space-y-3 text-white/50 text-sm leading-relaxed">
                      <p>
                        <strong className="text-white">Setup:</strong> Business
                        configures their spin wheel in the dashboard: sets
                        prizes, probabilities, colors, and daily spin limits.
                      </p>
                      <p>
                        <strong className="text-white">Customer flow:</strong>{" "}
                        Redeems a code → directed to the spin page → taps "Spin"
                        → wheel spins on their phone → wins prize → shows prize
                        to claim.
                      </p>
                      <p>
                        <strong className="text-white">Live event flow:</strong>{" "}
                        Host opens the Host Controls panel → selects a customer
                        → calls the next participant by name → participant spins
                        → spin reveals the winner → leaderboard updates in
                        real-time.
                      </p>
                      <p>
                        <strong className="text-white">OBS Broadcast:</strong>{" "}
                        Open the spin live URL in OBS as a browser source. The
                        display shows the current participant, leaderboard, and
                        winners reveals — all updating in real-time. Stream this
                        to TikTok, Instagram, or YouTube.
                      </p>
                      <p>
                        <strong className="text-white">Points:</strong> Correct
                        answers earn points + speed bonuses. Wrong answers still
                        earn 5 consolation points. The leaderboard ranks players
                        by total score.
                      </p>
                      <p>
                        <strong className="text-white">
                          Behind the scenes:
                        </strong>{" "}
                        The{" "}
                        <code className="text-purple-400 text-xs">System</code>{" "}
                        selects a prize based on probability, records the
                        attempt, updates loyalty points if they win points, and
                        adds to the live ticker.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Live Trivia */}
                <Card className="bg-white/5 border-white/10 mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Brain className="h-5 w-5 text-blue-400" />
                      <h3 className="text-white font-bold text-lg">
                        Live Trivia
                      </h3>
                      <Badge className="bg-blue-500/20 text-blue-400 text-xs border-0">
                        Event
                      </Badge>
                    </div>

                    <div className="space-y-3 text-white/50 text-sm leading-relaxed">
                      <p>
                        <strong className="text-white">Setup:</strong> Business
                        creates a trivia challenge, adds questions (multiple
                        choice, true/false, or open-ended), and links a spin
                        game for ticket entry. Customers win trivia tickets by
                        spinning the linked wheel and landing on "Trivia
                        Ticket."
                      </p>
                      <p>
                        <strong className="text-white">
                          How tickets work:
                        </strong>{" "}
                        The spin wheel has a "trivia_ticket" prize type. When a
                        customer lands on it,{" "}
                        <code className="text-purple-400 text-xs">System</code>{" "}
                        calls
                        <code className="text-purple-400 text-xs">
                          add trivia participant from spin
                        </code>{" "}
                        which assigns them a ticket number and places them in
                        the trivia queue.
                      </p>
                      <p>
                        <strong className="text-white">Live event flow:</strong>{" "}
                        Host opens the Host Controls panel → selects a question
                        → calls the next participant by ticket number →
                        participant answers on their phone → host reveals the
                        answer → leaderboard updates in real-time.
                      </p>
                      <p>
                        <strong className="text-white">OBS Broadcast:</strong>{" "}
                        Open the trivia live URL in OBS as a browser source. The
                        display shows the current question, countdown timer,
                        contestant queue, leaderboard, and winner reveals — all
                        updating in real-time. Stream this to TikTok, Instagram,
                        or YouTube.
                      </p>
                      <p>
                        <strong className="text-white">Points:</strong> Correct
                        answers earn points + speed bonuses. Wrong answers still
                        earn 5 consolation points. The leaderboard ranks players
                        by total score.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Prize Draws */}
                <Card className="bg-white/5 border-white/10 mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Gift className="h-5 w-5 text-amber-400" />
                      <h3 className="text-white font-bold text-lg">
                        Prize Draws
                      </h3>
                      <Badge className="bg-amber-500/20 text-amber-400 text-xs border-0">
                        Campaign
                      </Badge>
                    </div>

                    <div className="space-y-3 text-white/50 text-sm leading-relaxed">
                      <p>
                        <strong className="text-white">Setup:</strong> Business
                        creates a draw — sets prize, entry period, draw date,
                        and entry rules. Codes can be linked to draws so
                        customers are automatically entered when they redeem.
                      </p>
                      <p>
                        <strong className="text-white">Entry methods:</strong>
                      </p>
                      <ul className="space-y-1 pl-4">
                        <li>
                          •{" "}
                          <strong className="text-white">
                            Code redemption:
                          </strong>{" "}
                          Customer redeems a code linked to a draw →
                          automatically entered
                        </li>
                        <li>
                          • <strong className="text-white">POS receipt:</strong>{" "}
                          Higher spend = more entries (via amount × multiplier)
                        </li>
                        <li>
                          • <strong className="text-white">Manual:</strong>{" "}
                          Business can manually add entries from the dashboard
                        </li>
                      </ul>
                      <p>
                        <strong className="text-white">
                          Live Draw Broadcast (3 stages):
                        </strong>
                      </p>
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        {[
                          {
                            stage: "1. Entry Collection",
                            desc: "Live ticker shows entries in real-time. Leaderboard shows top entrants. Scrolling marquee of recent entries.",
                          },
                          {
                            stage: "2. Entries Locked",
                            desc: "Countdown to draw. Dramatic 'START DRAW' button. Entries are frozen.",
                          },
                          {
                            stage: "3. Winner Reveal",
                            desc: "Name shuffling animation. Confetti. Winner displayed with fanfare. Runner-ups listed. Consolation points awarded.",
                          },
                        ].map((s, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-lg bg-white/5 text-center"
                          >
                            <p className="text-white font-medium text-xs mb-1">
                              {s.stage}
                            </p>
                            <p className="text-white/40 text-xs leading-relaxed">
                              {s.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                      <p>
                        <strong className="text-white">OBS Broadcast:</strong>{" "}
                        Open the draw live URL in OBS. The 3-stage display is
                        designed for streaming — professional visuals, dramatic
                        pacing, and winner celebration effects.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Offline & Online Modes */}
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Radio className="h-5 w-5 text-green-400" />
                      <h3 className="text-white font-bold text-lg">
                        Offline & Online Modes
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-white font-medium text-sm mb-2">
                          🏪 Offline (In-Store)
                        </h4>
                        <ul className="space-y-2 text-white/50 text-xs">
                          <li>• Customer buys product with sticker code</li>
                          <li>• Scans code at home on their phone</li>
                          <li>• Spins wheel, wins prizes</li>
                          <li>• Returns to store to claim</li>
                          <li>• No staff involvement needed</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-white font-medium text-sm mb-2">
                          📺 Online (Live Stream)
                        </h4>
                        <ul className="space-y-2 text-white/50 text-xs">
                          <li>• Business schedules a live event</li>
                          <li>• Opens OBS display on their stream</li>
                          <li>• Host runs trivia or draw from dashboard</li>
                          <li>• Customers play from their phones at home</li>
                          <li>• Streamed on TikTok, Instagram, YouTube</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section id="limits">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <CirclePause className="h-8 w-8 text-purple-400" /> Engagement
                  Limits & Game Capacity
                </h2>

                <Card className="bg-white/5 border-white/10 mb-6">
                  <CardContent className="p-6">
                    <h3 className="text-white font-semibold mb-4">
                      How Limits Work
                    </h3>
                    <p className="text-white/50 text-sm mb-4">
                      Each plan has limits on how many games you can run and how
                      many customer engagements you can process per month. The
                      system automatically manages capacity.
                    </p>

                    <div className="overflow-x-auto mb-6">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left p-3 text-white/40 font-medium">
                              Limit
                            </th>
                            <th className="text-center p-3 text-white/40 font-medium">
                              Starter
                            </th>
                            <th className="text-center p-3 text-white/40 font-medium">
                              Pro
                            </th>
                            <th className="text-center p-3 text-white/40 font-medium">
                              Enterprise
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ["Spin Games", "3", "10", "Unlimited"],
                            ["Trivia Challenges", "3", "10", "Unlimited"],
                            ["Active Draws", "3", "10", "Unlimited"],
                            ["Engagements/month", "1,000", "10,000", "50,000"],
                            ["Prize Slots", "12", "24", "36"],
                            ["Trivia Questions", "50", "200", "Unlimited"],
                            ["Access Codes", "50", "200", "Unlimited"],
                            ["Admin Users", "1", "5", "20"],
                            ["API Access", "❌", "❌", "✅"],
                            ["POS Integration", "❌", "✅", "✅"],
                          ].map((row, i) => (
                            <tr key={i} className="border-b border-white/5">
                              <td className="p-3 text-white/70">{row[0]}</td>
                              <td className="p-3 text-center text-white/50">
                                {row[1]}
                              </td>
                              <td className="p-3 text-center text-white/50">
                                {row[2]}
                              </td>
                              <td className="p-3 text-center text-white/50">
                                {row[3]}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 mb-6">
                  <CardContent className="p-6">
                    <h3 className="text-white font-semibold mb-4">
                      Game Capacity & Auto-Selection
                    </h3>

                    <div className="space-y-4 text-white/50 text-sm leading-relaxed">
                      <p>
                        <strong className="text-white">Spin Games:</strong> When
                        you have multiple spin games active, customers are
                        directed to the first available game. If a game reaches
                        its engagement limit, the next game automatically starts
                        accepting players.
                      </p>

                      <p>
                        <strong className="text-white">
                          Trivia Challenges:
                        </strong>{" "}
                        Each trivia challenge can be linked to a specific spin
                        game for ticket entry. When the linked spin game's slots
                        fill up, new players are directed to the next available
                        trivia challenge.
                      </p>

                      <p>
                        <strong className="text-white">Draws:</strong> The{" "}
                        <code className="text-purple-400 text-xs">system</code>
                        automatically enters customers into the first open draw
                        for your business. If a draw is full or closed, it moves
                        to the next one.
                      </p>

                       <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                         <h4 className="text-purple-400 font-medium text-sm mb-2">
                           💡 Pro Tip: Calendar Planning
                         </h4>
                         <p className="text-purple-400/60 text-xs">
                           Schedule your games like a content calendar. Run a
                           spin game all week, host trivia on Friday nights, and
                           run a monthly draw. The system automatically manages
                           capacity across all active games.
                         </p>
                         <p className="text-purple-400/60 text-xs mt-2">
                           <strong>Queue mode:</strong> For high-traffic venues,
                           enable queue mode on your spin game to call customers
                           one-by-one by name. This prevents overcrowding and
                           creates a live show experience.
                         </p>
                       </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-6">
                    <h3 className="text-white font-semibold mb-4">
                      What Counts as an Engagement?
                    </h3>

                    <div className="grid grid-cols-3 gap-4">
                      {[
                        {
                          action: "Spin",
                          count: "1 engagement per spin",
                          desc: "Free or paid spins count the same",
                        },
                        {
                          action: "Trivia Answer",
                          count: "1 engagement per answer",
                          desc: "Whether correct or wrong",
                        },
                        {
                          action: "Draw Entry",
                          count: "1 engagement per entry",
                          desc: "Code redemption or manual entry",
                        },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-lg bg-white/5 text-center"
                        >
                          <p className="text-white font-medium text-sm mb-1">
                            {item.action}
                          </p>
                          <p className="text-purple-400 text-xs mb-1">
                            {item.count}
                          </p>
                          <p className="text-white/30 text-xs">{item.desc}</p>
                        </div>
                      ))}
                    </div>

                      <p className="text-white/40 text-xs mt-4">
                        Engagement counters reset on the 1st of each month. You'll
                        receive a notification when you reach 80% of your monthly
                        limit. Upgrade anytime to increase your limits
                        immediately.
                      </p>
                      <p className="text-white/40 text-xs mt-2">
                        <strong className="text-white">Prize slots</strong> control
                        how many segments appear on your spin wheel. Each slot
                        represents a distinct prize type (points, discount, free
                        service, etc.). Higher plans unlock more slots so you can
                        offer richer, more varied rewards.
                      </p>
                  </CardContent>
                </Card>
              </section>

              {/* ─── FAQ ───────────────────────────────────── */}
              <section id="faq">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Shield className="h-6 w-6 text-purple-400" /> Frequently
                  Asked Questions
                </h2>
                <div className="space-y-3">
                  {[
                    {
                      q: "Do customers need to download an app?",
                      a: "No. Everything works in a phone browser. They scan a QR code or visit a link.",
                    },
                    {
                      q: "How do sticker codes prevent fraud?",
                      a: "Each sticker code is single-use. Once redeemed, it cannot be used again. The unique pattern (BREW-S-0001-A7X9) ensures no duplicates.",
                    },
                    {
                      q: "What happens when a customer's activation expires?",
                      a: "They need a new sticker or receipt code to reactivate. This encourages repeat purchases.",
                    },
                    {
                      q: "Can I use both stickers and POS integration?",
                      a: "Yes. Pro and Enterprise plans support both. Use stickers for quick-serve items and POS for full receipts.",
                    },
                    {
                      q: "Who owns the customer data?",
                      a: "You do. Every email and engagement history belongs to your business. Export anytime. We never market to your customers.",
                    },
                    {
                      q: "What if I run out of stickers?",
                      a: "Generate and print more anytime from your dashboard. Keep extras ready for busy periods.",
                    },
                  ].map((faq, i) => (
                    <Card key={i} className="bg-white/5 border-white/10">
                      <CardContent className="p-4">
                        <h4 className="text-white font-medium mb-1">{faq.q}</h4>
                        <p className="text-white/50 text-sm">{faq.a}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* CTA */}
              <div className="text-center py-12 border-t border-white/5">
                <h3 className="text-xl font-bold text-white mb-3">
                  Ready to get started?
                </h3>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    asChild
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    <Link href="/business/signup">Create Your Business</Link>
                  </Button>
                  <Button asChild variant="outline" className="border-white/10">
                    <Link href="/docs/api">API Reference</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
        <span className="text-purple-400 font-bold">{number}</span>
      </div>
      <div>
        <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
        <div className="text-white/50 text-sm leading-relaxed">
          {description}
        </div>
      </div>
    </div>
  );
}
