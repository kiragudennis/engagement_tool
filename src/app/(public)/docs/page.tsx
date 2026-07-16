// app/(public)/docs/page.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
            gamified experience — from printing sticker codes to integrating
            with your POS system.
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
                      <div className="space-y-4">
                        {[
                          {
                            type: "Sticker Codes",
                            pattern: "BREW-S-0001-A7X9",
                            desc: "Pre-printed on products. Each tier has a fixed point value. Activates the customer for 30 days.",
                            tiers:
                              "Bronze (5pts), Silver (25pts), Gold (100pts), Diamond (500pts)",
                          },
                          {
                            type: "Receipt Codes",
                            pattern: "BREW-R-260714-A7X9",
                            desc: "Generated via POS API. Points = Cart Amount × Business Multiplier. Activates the customer.",
                            tiers: "Calculated per transaction",
                          },
                          {
                            type: "Public Marketing Codes",
                            pattern: "BREW-PUB-WEEKEND",
                            desc: "Shared on social media. Requires prior activation. Awards default points. Does NOT extend activation.",
                            tiers: "Business default points",
                          },
                          {
                            type: "QR Codes",
                            pattern: "BREW-QR-0001",
                            desc: "Printed at the counter. Activates new customers who scan it in-store.",
                            tiers: "Business default points",
                          },
                        ].map((code, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-lg bg-white/5 border border-white/10"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                              <h4 className="text-white font-medium">
                                {code.type}
                              </h4>
                              <code className="text-purple-400 text-xs font-mono break-all">
                                {code.pattern}
                              </code>
                            </div>
                            <p className="text-white/50 text-sm mb-2">
                              {code.desc}
                            </p>
                            <p className="text-white/30 text-xs">
                              Points: {code.tiers}
                            </p>
                          </div>
                        ))}
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
                          the activation by another 30 days. Loyal customers
                          stay active as long as they keep engaging.
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
                        Rarity Tiers
                      </h3>
                      <p className="text-white/50 text-sm mb-4">
                        Create a treasure hunt experience by mixing different
                        rarity codes on your products.
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          {
                            tier: "Bronze",
                            icon: Star,
                            color: "#CD7F32",
                            points: 5,
                            pct: "70%",
                            desc: "Most common",
                          },
                          {
                            tier: "Silver",
                            icon: Sparkles,
                            color: "#C0C0C0",
                            points: 25,
                            pct: "20%",
                            desc: "Uncommon",
                          },
                          {
                            tier: "Gold",
                            icon: Crown,
                            color: "#FFD700",
                            points: 100,
                            pct: "8%",
                            desc: "Rare",
                          },
                          {
                            tier: "Diamond",
                            icon: Diamond,
                            color: "#B9F2FF",
                            points: 500,
                            pct: "2%",
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
                              className="mt-1 text-xs"
                              style={{
                                backgroundColor: `${t.color}20`,
                                color: t.color,
                              }}
                            >
                              {t.pct} of codes
                            </Badge>
                            <p className="text-white/30 text-xs mt-1">
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
                            rarity distribution.
                          </span>
                        </li>
                        <li className="flex gap-3">
                          <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs flex-shrink-0">
                            3
                          </span>
                          <span>
                            Print the stickers and apply them to your products
                            before customers arrive.
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

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-500/20 text-blue-400 border-0">
                        Pro & Enterprise
                      </Badge>
                    </div>
                    <p className="text-white/50 text-sm">
                      Available on Pro and Enterprise plans. Your POS system
                      sends the cart total to Engage, and we return a unique
                      code with calculated points.
                    </p>

                    <div className="p-4 rounded-lg bg-black/30 font-mono text-sm overflow-x-auto">
                      <p className="text-white/40 mb-2">
                        // Example: Your POS sends this to Engage
                      </p>
                      <p className="text-green-400">POST</p>
                      <p className="text-yellow-400">
                        https://engagespin.com/api/business/receipt/generate
                      </p>
                      <p className="text-white/40 mt-2">Headers:</p>
                      <p className="text-purple-400">
                        {" "}
                        x-api-key: engage_live_abc123...
                      </p>
                      <p className="text-purple-400">
                        {" "}
                        Content-Type: application/json
                      </p>
                      <p className="text-white/40 mt-2">Body:</p>
                      <p className="text-white/60 whitespace-pre-wrap">{`{
  "amount": 250.00,
  "items": [
    { "name": "Latte", "qty": 2, "price": 125.00 }
  ],
  "cashier": "Jane"
}`}</p>
                      <p className="text-white/40 mt-2">Response:</p>
                      <p className="text-white/60 whitespace-pre-wrap">{`{
  "success": true,
  "receipt": {
    "code": "BREW-R-260714-A7X9",
    "points_earned": 500,
    "amount": 250.00
  }
}`}</p>
                    </div>

                    <p className="text-white/50 text-sm">
                      Your POS prints the code on the existing receipt. Points
                      are automatically calculated based on your configured
                      multiplier (e.g., 2.0 × KES 250 = 500 points).
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
              </section>

              {/* ─── ENGAGEMENT ───────────────────────────────────── */}
              <section id="engagement">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Radio className="h-6 w-6 text-purple-400" /> The Full
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
