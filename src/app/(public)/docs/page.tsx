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
  AlertTriangle,
  CreditCard,
  Bell,
  ExternalLink,
  ArrowRight,
  TriangleAlert,
  BadgeDollarSign,
  Info,
  Scale,
  Timer,
  BicepsFlexed,
  Puzzle,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const SECTIONS = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "verification", label: "Verification", icon: Shield },
  { id: "rules", label: "Rules & Fair Play", icon: Scale },
  { id: "business", label: "For Businesses", icon: Store },
  { id: "customer", label: "For Customers", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "codes", label: "How Codes Work", icon: Ticket },
  { id: "stickers", label: "Sticker System", icon: Printer },
  { id: "pos", label: "POS Integration", icon: ShoppingBag },
  { id: "engagement", label: "Engagement", icon: FunnelPlus },
  { id: "limits", label: "limits", icon: CirclePause },
  { id: "referral-program", label: "Referral Program", icon: BadgeDollarSign },
  { id: "consultations", label: "Consultations", icon: MessageCircle },
  { id: "faq", label: "FAQ", icon: Shield },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950">
      {/* Hero - Full width with inner container */}
      <div className="w-full border-b border-white/5">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-16 text-center">
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-12">
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
              <section id="overview" className="scroll-mt-20">
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
                      <CardContent>
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
                      <CardContent>
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

              {/* ─── VERIFICATION & SECURITY ───────────────── */}
              <section id="verification" className="scroll-mt-20">
                <h2 className="text-2xl font-bold text-white mb-4 flex gap-2">
                  <Shield className="h-6 w-6 text-purple-400 mt-1" />{" "}
                  <>Verification & Security</>
                </h2>
                <div className="space-y-6">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="space-y-4">
                      <h3 className="text-white font-semibold text-lg">
                        How Engage Protects Your Business &amp; Customer Data
                      </h3>
                      <p className="text-white/50 text-sm leading-relaxed">
                        Engage uses a business-led verification model. We do not
                        perform facial recognition or biometric checks. Instead,
                        businesses verify customer identity at the point of
                        prize collection using the email, phone, and national ID
                        or driver's license number captured during signup.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                          <h4 className="text-purple-400 font-medium text-sm mb-2">
                            At Signup
                          </h4>
                          <ul className="space-y-2 text-white/50 text-xs">
                            <li className="flex items-start gap-2">
                              <Check className="h-3 w-3 text-green-400 mt-0.5" />
                              <span>
                                Customers enter email, phone, and national ID or
                                driver's license number
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-3 w-3 text-green-400 mt-0.5" />
                              <span>
                                Email is verified before account becomes active
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-3 w-3 text-green-400 mt-0.5" />
                              <span>
                                Phone and ID number are locked once entered —
                                cannot be changed
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-3 w-3 text-green-400 mt-0.5" />
                              <span>
                                Duplicate emails, phones, or ID numbers are
                                blocked automatically
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-3 w-3 text-green-400 mt-0.5" />
                              <span>
                                These identifiers are stored encrypted at rest
                                (AES-256) and only used for customer-business
                                uniqueness
                              </span>
                            </li>
                          </ul>
                        </div>

                        <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                          <h4 className="text-blue-400 font-medium text-sm mb-2">
                            At Prize Collection
                          </h4>
                          <ul className="space-y-2 text-white/50 text-xs">
                            <li className="flex items-start gap-2">
                              <Check className="h-3 w-3 text-green-400 mt-0.5" />
                              <span>
                                Admin checks customer's physical ID against
                                account details
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-3 w-3 text-green-400 mt-0.5" />
                              <span>
                                Admin verifies phone matches the registered
                                number (use Truecaller for name lookup)
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-3 w-3 text-green-400 mt-0.5" />
                              <span>
                                If details match → admin marks identity as
                                verified
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-3 w-3 text-green-400 mt-0.5" />
                              <span>
                                If mismatch → admin flags account for other
                                businesses to see
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                        <h4 className="text-amber-400 font-medium text-sm mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Business Responsibilities
                        </h4>
                        <p className="text-white/50 text-xs leading-relaxed">
                          Businesses have the right and responsibility to verify
                          that the person collecting a prize matches the account
                          holder. Engage provides the tools to look up customers
                          and mark them as verified, but the final check is
                          yours. If you suspect fraud, flag the account — other
                          businesses will see the flag and can take caution.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="space-y-4">
                      <h3 className="text-white font-semibold text-lg">
                        Flagged Accounts
                      </h3>
                      <p className="text-white/50 text-sm leading-relaxed">
                        When a business flags an account, it becomes visible to
                        all other businesses in the system. This is a shared
                        safety mechanism that helps prevent fraud across the
                        Engage network.
                      </p>
                      <div className="space-y-2">
                        {[
                          "Flagged accounts show a red warning badge in the admin panel",
                          "Other businesses can see the flag reason and timestamp",
                          "Flagged accounts cannot participate in new activations",
                          "Admins can still view history but cannot verify or award prizes",
                          "Support review is recommended for all flagged accounts",
                        ].map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-white/50 text-sm"
                          >
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="space-y-4">
                      <h3 className="text-white font-semibold text-lg">
                        Using Truecaller for Quick Verification
                      </h3>
                      <p className="text-white/50 text-sm leading-relaxed">
                        We recommend installing the Truecaller mobile app at
                        your business. When a customer provides a phone number,
                        Truecaller displays the registered name instantly — a
                        quick way to confirm the person in front of you matches
                        their account.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* ─── RULES & FAIR PLAY ────────────────────────── */}
              <section id="rules" className="scroll-mt-20">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Scale className="h-6 w-6 text-purple-400" /> Rules & Fair
                  Play
                </h2>

                <div className="space-y-6">
                  {/* Intro */}
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="space-y-4">
                      <h3 className="text-white font-semibold text-lg">
                        Our Commitment to Fair Play
                      </h3>
                      <p className="text-white/50 text-sm leading-relaxed">
                        Every spin, trivia answer, and draw entry is recorded
                        permanently on our servers. In case of any dispute,
                        businesses and customers can request a full audit of any
                        game session. We take fairness seriously, here's exactly
                        how each game type works.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Spin Wheel Rules */}
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="space-y-4">
                      <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                        <span className="text-2xl">🎡</span> Spin Wheel Rules
                      </h3>

                      <div className="space-y-4">
                        {/* How It Works */}
                        <div>
                          <h4 className="text-white/80 font-medium mb-2">
                            How Spinning Works
                          </h4>
                          <ol className="space-y-2 text-white/50 text-sm list-decimal list-inside">
                            <li>
                              <strong className="text-white">
                                Prize Selection:
                              </strong>{" "}
                              When you spin, our server instantly selects your
                              prize based on the odds the business has
                              configured. Each prize has a probability
                              percentage, for example, "10% Off" might have a
                              30% chance, while "VIP Pass" might have a 5%
                              chance.
                            </li>
                            <li>
                              <strong className="text-white">
                                Visual Display:
                              </strong>{" "}
                              What you see on the wheel is a shuffled version of
                              the prizes. This is a security measure that
                              prevents anyone from predicting or manipulating
                              where the wheel will land.
                            </li>
                            <li>
                              <strong className="text-white">
                                Result Reveal:
                              </strong>{" "}
                              After the wheel stops, you'll see what you've won.
                              The prize you see is your actual prize, the system
                              has already recorded it permanently.
                            </li>
                          </ol>
                        </div>

                        {/* Why We Shuffle */}
                        <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                          <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                            <Info className="h-4 w-4" /> Why Does the Wheel Look
                            Different?
                          </h4>
                          <p className="text-blue-300/80 text-sm leading-relaxed">
                            You may notice that the prizes on the wheel don't
                            match their original positions. This is intentional,
                            we shuffle the display of prizes on every spin to
                            prevent cheating. Think of it like a deck of cards
                            being shuffled before each hand.
                          </p>
                          <p className="text-blue-300/80 text-sm leading-relaxed mt-2">
                            <strong>Important:</strong> The prize you win is
                            determined before the wheel even starts spinning.
                            The wheel animation is purely visual, it always
                            lands on the correct display slot that corresponds
                            to your actual prize.
                          </p>
                        </div>

                        {/* Prize Guarantee */}
                        <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                          <h4 className="text-green-400 font-medium mb-2 flex items-center gap-2">
                            <Shield className="h-4 w-4" /> Prize Guarantee
                          </h4>
                          <ul className="space-y-2 text-green-300/80 text-sm">
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                              <span>
                                <strong>Your prize is locked in</strong> the
                                moment you press spin. No amount of refreshing,
                                closing the browser, or connection issues won't
                                change what you've won.
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                              <span>
                                <strong>Every spin is recorded</strong> with a
                                unique ID and timestamp. Both you and the
                                business can verify any spin result.
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                              <span>
                                <strong>
                                  Points and prizes are awarded instantly
                                </strong>{" "}
                                - if you win points, they're added to your
                                balance immediately. If you win a physical
                                prize, it's reserved for you.
                              </span>
                            </li>
                          </ul>
                        </div>

                        <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                          <h3 className="text-purple-400 font-medium mb-2 flex items-center gap-2">
                            <Zap className="h-4 w-4" /> Master the Spin
                          </h3>
                          <p className="text-purple-300/80 text-sm leading-relaxed">
                            While our wheel uses advanced physics and
                            cryptographic randomness to ensure fair play,
                            skilled spinners can develop techniques to improve
                            their experience:
                          </p>
                          <ul className="space-y-2 text-purple-300/80 text-sm mt-2">
                            <li className="flex items-start gap-2">
                              <BicepsFlexed className="h-4 w-4 text-purple-400 mt-0.5" />
                              <span>
                                <strong>Strength Control:</strong> Learn to
                                apply consistent pressure for your preferred
                                spin speed. Different strengths create different
                                visual experiences!
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Timer className="h-4 w-4 text-purple-400 mt-0.5" />
                              <span>
                                <strong>Timing Awareness:</strong> While
                                outcomes are determined by fair RNG, your spin
                                strength affects the animation duration and
                                reveal timing. Find your signature style!
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Puzzle className="h-4 w-4 text-purple-400 mt-0.5" />
                              <span>
                                <strong>Pattern Recognition:</strong> Study the
                                wheel's behavior to understand probability
                                distribution. Knowledge is power!
                              </span>
                            </li>
                          </ul>
                          <p className="text-purple-300/60 text-xs mt-2 italic">
                            Note: All outcomes are determined by
                            cryptographically-secure random number generation.
                            Skill affects the experience, not the outcome. This
                            ensures fair play for everyone.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trivia Rules */}
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="space-y-4">
                      <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                        <span className="text-2xl">🧠</span> Trivia Challenge
                        Rules
                      </h3>

                      <div className="space-y-4">
                        <ol className="space-y-3 text-white/50 text-sm list-decimal list-inside">
                          <li>
                            <strong className="text-white">Entry:</strong> You
                            need a trivia ticket to participate. Tickets are won
                            through spin wheels or given out by businesses
                            directly.
                          </li>
                          <li>
                            <strong className="text-white">Timing:</strong>{" "}
                            Trivia challenges have a specific start time and
                            duration. You must be present and active during the
                            challenge window to participate.
                          </li>
                          <li>
                            <strong className="text-white">Scoring:</strong>{" "}
                            Each question has a time limit. Points are awarded
                            based on correct answers AND speed. The faster you
                            answer correctly, the more points you earn.
                          </li>
                          <li>
                            <strong className="text-white">Tiebreakers:</strong>{" "}
                            If multiple participants have the same score, the
                            tiebreaker is based on total response time — whoever
                            answered faster overall ranks higher.
                          </li>
                          <li>
                            <strong className="text-white">Anti-Cheat:</strong>{" "}
                            We monitor for automated responses, multiple
                            accounts, and suspicious patterns. Violations result
                            in disqualification and potential account
                            suspension.
                          </li>
                        </ol>

                        <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                          <h4 className="text-yellow-400 font-medium mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> Important
                            Notes
                          </h4>
                          <ul className="space-y-2 text-yellow-300/80 text-sm">
                            <li className="flex items-start gap-2">
                              <span className="text-yellow-400 mt-0.5">•</span>
                              <span>
                                Once a trivia challenge starts, you cannot join
                                late. Make sure you're registered and present
                                before the start time.
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-yellow-400 mt-0.5">•</span>
                              <span>
                                If you lose internet connection during a
                                challenge, you can reconnect and continue, but
                                the timer on the current question continues
                                running.
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Prize Draws Rules */}
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="space-y-4">
                      <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                        <span className="text-2xl">🎟️</span> Prize Draw Rules
                      </h3>

                      <div className="space-y-4">
                        <ol className="space-y-3 text-white/50 text-sm list-decimal list-inside">
                          <li>
                            <strong className="text-white">
                              Entry Tickets:
                            </strong>{" "}
                            You earn draw entries by redeeming codes, spinning
                            the wheel, or purchasing entries with points. Each
                            ticket is one entry into the draw.
                          </li>
                          <li>
                            <strong className="text-white">
                              Multiple Entries:
                            </strong>{" "}
                            You can have multiple entries in the same draw. Each
                            entry increases your chances of winning
                            proportionally.
                          </li>
                          <li>
                            <strong className="text-white">
                              Draw Process:
                            </strong>{" "}
                            When the draw date arrives, winners are selected
                            randomly by our system. The selection is verifiable
                            and uses cryptographic randomness.
                          </li>
                          <li>
                            <strong className="text-white">
                              Winner Notification:
                            </strong>{" "}
                            Winners are notified via email and phone immediately
                            after the draw. Results are also published on the
                            business's Engage page.
                          </li>
                          <li>
                            <strong className="text-white">
                              Prize Collection:
                            </strong>{" "}
                            You have 30 days from the draw date to claim your
                            prize. Unclaimed prizes may be redrawn or forfeited
                            based on the business's policy.
                          </li>
                        </ol>

                        <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                          <h4 className="text-purple-400 font-medium mb-2">
                            Draw Transparency
                          </h4>
                          <p className="text-purple-300/80 text-sm leading-relaxed">
                            Every draw result includes a verification hash that
                            proves the winner was selected fairly. You can
                            verify any draw result using our public verifier
                            tool — ask the business for the draw verification
                            code.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* General Rules */}
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="space-y-4">
                      <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                        <span className="text-2xl">📋</span> General Rules
                      </h3>

                      <div className="space-y-4">
                        {/* Account Rules */}
                        <div>
                          <h4 className="text-white/80 font-medium mb-2">
                            Account & Identity
                          </h4>
                          <ul className="space-y-2 text-white/50 text-sm">
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                              <span>
                                One person, one account. Multiple accounts per
                                person are not allowed and will result in all
                                associated accounts being banned.
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                              <span>
                                You must provide accurate information during
                                signup. False information may result in prize
                                forfeiture.
                              </span>
                            </li>
                          </ul>
                        </div>

                        {/* Business Rules */}
                        <div>
                          <h4 className="text-white/80 font-medium mb-2">
                            Business Rules
                          </h4>
                          <ul className="space-y-2 text-white/50 text-sm">
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                              <span>
                                Businesses set their own prize odds, point
                                values, and game durations. These are locked
                                once a game goes live and cannot be changed.
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                              <span>
                                Businesses are responsible for honoring all
                                prizes. Engage records all transactions as proof
                                of what was won.
                              </span>
                            </li>
                          </ul>
                        </div>

                        {/* Dispute Resolution */}
                        <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                          <h4 className="text-red-400 font-medium mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> Disputes &
                            Verification
                          </h4>
                          <p className="text-red-300/80 text-sm leading-relaxed">
                            All game activities — spins, trivia answers, draw
                            entries, and prize awards — are permanently recorded
                            with timestamps and unique identifiers. In case of
                            any dispute:
                          </p>
                          <ul className="space-y-2 text-red-300/80 text-sm mt-2">
                            <li className="flex items-start gap-2">
                              <span className="text-red-400 mt-0.5">1.</span>
                              <span>
                                <strong>Customers:</strong> Contact the business
                                with your spin/draw ID or the date and time of
                                the activity. The business can verify everything
                                in their admin panel.
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-400 mt-0.5">2.</span>
                              <span>
                                <strong>Businesses:</strong> You have full
                                access to all customer activity logs. Every
                                spin, win, and point transaction is recorded and
                                cannot be modified.
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-400 mt-0.5">3.</span>
                              <span>
                                <strong>Escalation:</strong> If a dispute cannot
                                be resolved between customer and business,
                                Engage support can provide verified activity
                                records as an impartial third party.
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* For Businesses: Setting Fair Odds */}
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="space-y-4">
                      <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                        <span className="text-2xl">⚖️</span> For Businesses:
                        Setting Fair Odds
                      </h3>

                      <div className="space-y-4">
                        <p className="text-white/50 text-sm leading-relaxed">
                          When you configure a spin wheel, you control the
                          probability of each prize. Here are best practices for
                          fair and engaging games:
                        </p>

                        <ul className="space-y-3 text-white/50 text-sm">
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                            <span>
                              <strong className="text-white">
                                Probabilities must total 100%:
                              </strong>
                              The sum of all prize probabilities must equal
                              exactly 100%. Our system validates this before
                              your game goes live.
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                            <span>
                              <strong className="text-white">
                                Common prizes should have higher odds:
                              </strong>
                              Small discounts (10% off) or low-point rewards
                              should appear more frequently (30-40%). Big prizes
                              (VIP Passes) should be rare (2-5%).
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                            <span>
                              <strong className="text-white">
                                Include a "Try Again" segment:
                              </strong>
                              Not every spin needs to win. A "Try Again" with
                              20-30% probability keeps the game sustainable.
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                            <span>
                              <strong className="text-white">
                                Odds are locked once live:
                              </strong>
                              After your game goes live, you cannot change the
                              probabilities. Plan carefully and test with demo
                              spins first.
                            </span>
                          </li>
                        </ul>

                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                          <p className="text-white/40 text-xs font-mono">
                            Example: Good Prize Distribution
                            <br />
                            • 10% Off — 35% probability
                            <br />
                            • 25 Points — 25% probability
                            <br />
                            • Free Drink — 15% probability
                            <br />
                            • Try Again — 20% probability
                            <br />
                            • VIP Pass — 5% probability
                            <br />
                            <span className="text-green-400">
                              Total: 100% ✓
                            </span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* ─── FOR BUSINESSES ───────────────────────── */}
              <section id="business" className="scroll-mt-20">
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
              <section id="customer" className="scroll-mt-20">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6 text-purple-400" /> For Customers
                </h2>
                <div className="space-y-6 mb-6">
                  <StepCard
                    number={1}
                    title="Get a Code"
                    description="Buy a product from your favorite local business. Find the code on the cup, bag, receipt, or packaging."
                  />
                  <StepCard
                    number={2}
                    title="Enter It Online"
                    description="Visit the business's Engage page or scan the QR code. Enter your code on your phone — no app download needed. You'll create your account with email, phone, and national ID or license for uniqueness."
                  />
                  <StepCard
                    number={3}
                    title="Spin, Play, Win"
                    description="Spin the wheel for instant prizes, join live trivia nights, or enter prize draws. Every code gives you loyalty points."
                  />
                  <StepCard
                    number={4}
                    title="Collect & Come Back"
                    description="Redeem points or claim prizes in-store. The business verifies your identity (email, phone, ID) and follows up using your contact info. The more you engage, the more points you earn."
                  />
                </div>

                <div className="space-y-6">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="space-y-4">
                      <h3 className="text-white font-semibold text-lg">
                        Your Engagement Summary
                      </h3>
                      <p className="text-white/50 text-sm leading-relaxed">
                        Your Engage account shows every business you have ever
                        engaged with — not just active ones. On your profile,
                        you will see:
                      </p>
                      <ul className="space-y-2 text-white/50 text-sm">
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-400 mt-0.5" />
                          <span>
                            <strong className="text-white">
                              All businesses
                            </strong>{" "}
                            you have ever redeemed codes from
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-400 mt-0.5" />
                          <span>
                            <strong className="text-white">
                              Current points
                            </strong>{" "}
                            balance per business
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-400 mt-0.5" />
                          <span>
                            <strong className="text-white">Points worth</strong>{" "}
                            calculated using each business's point value
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-400 mt-0.5" />
                          <span>
                            <strong className="text-white">History</strong> of
                            spins, draws, trivia participation, and codes
                            redeemed
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-400 mt-0.5" />
                          <span>
                            <strong className="text-white">
                              Account ownership
                            </strong>{" "}
                            Your customer account is primary; business accounts
                            are secondary and referenced to yours. If your
                            account is banned or deleted, all associated
                            business accounts are also removed.
                          </span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="space-y-4">
                      <h3 className="text-white font-semibold text-lg">
                        How to Redeem / Withdraw Points
                      </h3>
                      <p className="text-white/50 text-sm leading-relaxed">
                        Points and prizes are redeemed directly with the
                        business. Here is the full flow from winning to
                        collecting your prize:
                      </p>
                      <ol className="space-y-3 text-white/50 text-sm list-decimal list-inside">
                        <li>
                          You win a prize or accumulate points at a business
                          through spins, draws, or trivia.
                        </li>
                        <li>
                          When you want to use your points or claim a prize,
                          tell the cashier or business owner.
                        </li>
                        <li>
                          The business looks up your account in their admin
                          panel (or via their POS/e-commerce API) using your
                          email, phone, or ID number.
                        </li>
                        <li>
                          They verify your identity against the physical ID you
                          provide, matching it to the details on your account.
                        </li>
                        <li>
                          They deduct the points from your balance for that
                          specific business and apply them as a discount toward
                          your purchase, or hand you your physical prize.
                        </li>
                        <li>
                          The business follows up with you using the contact
                          information you provided at signup (email, phone).
                          This is their data to use — Engage does not facilitate
                          or monitor these communications.
                        </li>
                      </ol>
                      <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                        <p className="text-purple-400 text-sm">
                          <strong>Note:</strong> Points cannot be transferred
                          between businesses. They are tied to the specific
                          business where they were earned. Your customer account
                          is primary — business accounts are secondary and
                          referenced to yours. If your account is banned or
                          permanently deleted, all associated business accounts
                          are also removed.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="space-y-4">
                      <h3 className="text-white font-semibold text-lg">
                        Point Value
                      </h3>
                      <p className="text-white/50 text-sm leading-relaxed">
                        Each business sets its own point value. This defines how
                        much each point is worth in real currency. For example:
                      </p>
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-white text-sm font-mono">
                          100 points = 0.1 USD/KES
                        </p>
                        <p className="text-white/40 text-xs mt-1">
                          This means each point is worth 0.001 USD/KES. If you
                          have 500 points, that is worth 0.50 USD/KES.
                        </p>
                      </div>
                      <p className="text-white/50 text-sm leading-relaxed">
                        The point value is set by the business and can be found
                        in your profile under each business's card. This value
                        is used when points are redeemed at checkout.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* ─── NOTIFICATIONS ────────────────────────── */}
              <section id="notifications" className="scroll-mt-20">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Bell className="h-6 w-6 text-purple-400" /> Notifications
                </h2>
                <div className="space-y-6">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="space-y-4">
                      <h3 className="text-white font-semibold text-lg">
                        How Notifications Work
                      </h3>
                      <p className="text-white/50 text-sm leading-relaxed">
                        Engage sends two types of notifications:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                          <h4 className="text-purple-400 font-medium text-sm mb-2">
                            In-App Notifications
                          </h4>
                          <p className="text-white/50 text-xs leading-relaxed">
                            These appear in your Engage account notification
                            center. They cover draw wins, spin results, points
                            changes, account status updates, and engagement
                            milestones.
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                          <h4 className="text-blue-400 font-medium text-sm mb-2">
                            External Notifications (Email / SMS)
                          </h4>
                          <p className="text-white/50 text-xs leading-relaxed">
                            For important Engage events — such as prize wins or
                            account security alerts — we may send an email or
                            SMS. These are rare and only for high-priority
                            events.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="space-y-4">
                      <h3 className="text-white font-semibold text-lg">
                        Business-Specific Notifications
                      </h3>
                      <p className="text-white/50 text-sm leading-relaxed">
                        Some notifications are tied to a specific business. For
                        example, if you win a prize in a business's draw, that
                        notification is tagged with that business's ID. This
                        helps keep your notifications organized and relevant.
                      </p>
                      <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                        <p className="text-green-400 text-sm">
                          <strong>Note:</strong> Businesses are responsible for
                          their own marketing and customer communications
                          outside of Engage. Your customer list is available in
                          the business dashboard for export, and businesses can
                          use their own tools for newsletters and promotions.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="space-y-4">
                      <h3 className="text-white font-semibold text-lg">
                        Notification Types
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          {
                            type: "Draws",
                            examples:
                              "draw_win, draw_reminder, draw_entry_confirmed",
                          },
                          {
                            type: "Spins",
                            examples: "spin_win, spin_prize_ready",
                          },
                          {
                            type: "Trivia",
                            examples: "trivia_correct, trivia_rank_improved",
                          },
                          {
                            type: "Points",
                            examples:
                              "points_earned, points_redeemed, loyalty_tier_upgrade",
                          },
                          {
                            type: "Account",
                            examples:
                              "account_activated, id_verified, account_flagged",
                          },
                          {
                            type: "System",
                            examples: "system_alert, new_code_available",
                          },
                        ].map((group, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-lg bg-white/5 border border-white/10"
                          >
                            <h4 className="text-white text-sm font-medium mb-1">
                              {group.type}
                            </h4>
                            <p className="text-white/40 text-xs font-mono">
                              {group.examples}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* ─── HOW CODES WORK ───────────────────────── */}
              <section id="codes" className="scroll-mt-20">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Ticket className="h-6 w-6 text-purple-400" /> How Codes Work
                </h2>

                <div className="space-y-6">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent>
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
                            desc: "Shared on social media. Optionally requires prior activation (configurable). Awards default points. Does NOT extend activation.",
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
                          R=Receipt (POS), S=Sticker, P=Public, Q=QR
                          &nbsp;|&nbsp;
                          <strong className="text-white"> Limits:</strong>{" "}
                          Sticker codes and POS codes have separate per-plan
                          caps. Public codes share the general access code
                          limit. &nbsp;|&nbsp;
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
                    <CardContent>
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
                        <p>
                          Public marketing codes can be configured to &nbsp;
                          <strong className="text-white">
                            require activation
                          </strong>
                          &nbsp; or &nbsp;
                          <strong className="text-white">
                            not require activation
                          </strong>
                          &nbsp; from the dashboard. When activation is
                          required, the user must already be an active customer
                          of your business &nbsp;
                          <strong className="text-white">
                            (30-day window)
                          </strong>
                          . This prevents random people from using codes shared
                          on social media without ever having visited your
                          business. When activation is not required, any
                          customer can redeem the code to earn points
                          immediately.
                        </p>
                        <p>
                          Each new sticker or receipt code &nbsp;
                          <strong className="text-white">extends</strong>&nbsp;
                          the activation by another 30 days (default). Loyal
                          customers stay active as long as they keep engaging.
                        </p>
                        <p>
                          <strong className="text-white">Spin limits:</strong>
                          &nbsp; Set a maximum number of spins per user for this
                          game. This limit applies to <strong>
                            all spins
                          </strong>{" "}
                          (free spins and points-paid spins) combined. When set
                          to <strong>0</strong>, users can spin unlimited times
                          during the game's active period.
                        </p>
                        <p>
                          <strong className="text-white">
                            Points per redemption:
                          </strong>
                          &nbsp; Every successful code redemption grants loyalty
                          points. If the code has a specific point value, that
                          is used; otherwise the business default &nbsp;
                          <code className="text-purple-400 text-xs">
                            points per redemption
                          </code>
                          &nbsp; setting is applied.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* ─── STICKER SYSTEM ───────────────────────── */}
              <section id="stickers" className="scroll-mt-20">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Printer className="h-6 w-6 text-purple-400" /> Sticker System
                </h2>

                <div className="space-y-6">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent>
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
                            unlocksDesc: "Spins, draws, trivia, VIP status",
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
                    <CardContent>
                      <h3 className="text-white font-semibold mb-4">
                        How Unlocks Work
                      </h3>
                      <div className="space-y-3 text-white/60 text-sm leading-relaxed">
                        <p>
                          Each rarity tier can be configured with different{" "}
                          <strong className="text-white">unlock levels</strong>{" "}
                          that control what a customer can do after redeeming
                          that code. Codes with{" "}
                          <code className="text-purple-400 text-xs">
                            unlocks: "all"
                          </code>{" "}
                          unlock every experience at once.
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
                                "Gold/Diamond: 'JACKPOT! Spins, draws, trivia, and points!'",
                            },
                            {
                              level: "Draws Only",
                              icon: Trophy,
                              desc: "Customer is entered into draws but can't spin. Useful for special promotional stickers.",
                              example:
                                "Event stickers: 'You've been entered into our grand prize draw!'",
                            },
                            {
                              level: "Trivia Access",
                              icon: Brain,
                              desc: "Customer is added directly to a trivia challenge queue. Great for building community through live knowledge battles.",
                              example:
                                "Event code: 'You are entered into tonight's trivia challenge!'",
                            },
                            {
                              level: "Everything (All)",
                              icon: Gift,
                              desc: "Customer unlocks spins, trivia participation, and draw entries all at once. The ultimate reward.",
                              example:
                                "VIP code: 'Jackpot! Spins, trivia, and draws - you get everything!'",
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
                    <CardContent>
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
                                "JACKPOT! Spins, draws, trivia, and 500 points! You're a VIP!",
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
                    <CardContent>
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
              <section id="pos" className="scroll-mt-20">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <ShoppingBag className="h-6 w-6 text-purple-400" /> POS
                  Integration
                </h2>

                <Card className="bg-white/5 border-white/10 mb-6">
                  <CardContent className="space-y-4">
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

                        {/* Points note - ALWAYS awarded */}
                        <div className="mb-3 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                          <p className="text-amber-400/80 text-xs flex items-center gap-2">
                            <Coins className="h-3 w-3 flex-shrink-0" />
                            <span>
                              <strong className="text-amber-300">
                                Points are always awarded
                              </strong>{" "}
                              on every redemption. The{" "}
                              <code className="text-amber-400">unlocks</code>{" "}
                              parameter determines what{" "}
                              <strong>additional access</strong> the customer
                              receives:
                            </span>
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            {
                              unlock: "spin",
                              icon: RotateCcw,
                              desc: "Customer unlocks the spin wheel immediately. Great for mid-tier purchases that deserve an instant reward.",
                              example: "Cart total KES 100-500 → Spin access",
                              label: "Spin Access",
                              color: "blue",
                            },
                            {
                              unlock: "draw",
                              icon: Trophy,
                              desc: "Customer is automatically entered into your active prize draws. Perfect for promotional periods or building anticipation.",
                              example: "Weekend promotion → Draw entry",
                              label: "Draw Entry",
                              color: "amber",
                            },
                            {
                              unlock: "trivia",
                              icon: Brain,
                              desc: "Customer gets direct access to your trivia challenge. Great for engagement campaigns and testing customer knowledge.",
                              example: "Quiz night → Trivia access",
                              label: "Trivia Access",
                              color: "green",
                            },
                            {
                              unlock: "all",
                              icon: Crown,
                              desc: "The premium experience — customer gets spin access, trivia entry, AND automatic draw entry. Use this for high-value purchases or VIP customers.",
                              example: "Cart total > KES 500 → All access",
                              label: "All Access (Premium)",
                              color: "purple",
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
                                    item.color === "blue" &&
                                      "bg-blue-500/20 text-blue-400",
                                    item.color === "amber" &&
                                      "bg-amber-500/20 text-amber-400",
                                    item.color === "green" &&
                                      "bg-green-500/20 text-green-400",
                                    item.color === "purple" &&
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
                              — customer earns points only, no extra access
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
                                Promotions:
                              </strong>{" "}
                              Send{" "}
                              <code className="text-purple-400">
                                "unlocks": "draw"
                              </code>{" "}
                              — build excitement for prize events
                            </li>
                            <li>
                              •{" "}
                              <strong className="text-purple-300">
                                Engagement:
                              </strong>{" "}
                              Send{" "}
                              <code className="text-purple-400">
                                "unlocks": "trivia"
                              </code>{" "}
                              — interactive trivia for customer engagement
                            </li>
                            <li>
                              •{" "}
                              <strong className="text-purple-300">
                                High spend / VIP:
                              </strong>{" "}
                              Send{" "}
                              <code className="text-purple-400">
                                "unlocks": "all"
                              </code>{" "}
                              — spin + trivia + draw in one code
                            </li>
                            <li className="text-amber-400/60 border-t border-white/5 pt-1 mt-1">
                              ⚡ <strong>Remember:</strong> Points are always
                              awarded regardless of the unlock type selected.
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        <p className="text-white/50 text-sm mt-4">
                          Points are automatically calculated based on your
                          configured multiplier (e.g., 2.0 × KES 250 = 500
                          points). You can override this with{" "}
                          <code className="text-purple-400">
                            pointsOverride
                          </code>{" "}
                          if needed.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/10">
                      <CardContent className="space-y-4">
                        <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-purple-400" />
                          Points Redemption at Checkout
                        </h3>
                        <p className="text-white/50 text-sm leading-relaxed">
                          Engage also provides APIs for POS and e-commerce
                          systems to look up customers and deduct points at
                          checkout. This lets customers pay with their Engage
                          points directly in your store or website.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                            <h4 className="text-green-400 font-medium text-sm mb-2">
                              Look Up Customer
                            </h4>
                            <p className="text-white/50 text-xs mb-2">
                              Find a customer by phone, email, or ID number.
                              Returns their points balance and engagement
                              summary.
                            </p>
                            <code className="block text-green-400 text-xs break-all">
                              POST /api/business/customers/lookup
                            </code>
                          </div>
                          <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                            <h4 className="text-blue-400 font-medium text-sm mb-2">
                              Deduct Points
                            </h4>
                            <p className="flex flex-wrap text-white/50 text-xs mb-2">
                              Deduct points from a customer's balance for a
                              purchase. Creates a transaction record for audit.
                            </p>
                            <code className="block text-blue-400 text-xs break-all">
                              POST /api/business/customers/points/deduct
                            </code>
                          </div>
                        </div>

                        <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                          <h4 className="text-purple-400 font-medium text-sm mb-2">
                            How It Works
                          </h4>
                          <ol className="space-y-2 text-white/50 text-xs list-decimal list-inside">
                            <li>
                              Customer checks out and says they want to pay with
                              points
                            </li>
                            <li>
                              Your POS/e-commerce system calls{" "}
                              <code className="block text-purple-400 text-xs break-all">
                                /api/business/customers/lookup
                              </code>{" "}
                              with their phone/email/ID
                            </li>
                            <li>
                              System returns their current points balance and
                              point value
                            </li>
                            <li>
                              If they have enough points, call{" "}
                              <code className="text-purple-400 block text-xs break-all">
                                /api/business/customers/points/deduct
                              </code>{" "}
                              with the amount to deduct
                            </li>
                            <li>
                              Points are deducted and a transaction record is
                              created
                            </li>
                          </ol>
                        </div>
                      </CardContent>
                    </Card>

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
                  <CardContent>
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
              <section id="engagement" className="scroll-mt-20">
                <h2 className="text-2xl font-bold text-white mb-6 flex gap-2">
                  <FunnelPlus className="h-6 w-6 text-purple-400" />{" "}
                  <>The Full Engagement Flow</>
                </h2>

                <p className="text-white/50 text-sm mb-8 leading-relaxed">
                  Here's how everything connects, from code redemption to live
                  broadcast. Engage works both for everyday engagement and live
                  events streamed on social media.
                </p>

                {/* Spin & Win */}
                <Card className="bg-white/5 border-white/10 mb-6">
                  <CardContent>
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
                  <CardContent>
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
                        There are two ways to get a trivia ticket.
                        <strong className="text-white"> Spin-based:</strong> The
                        spin wheel has a{" "}
                        <code className="text-purple-400 text-xs">
                          trivia ticket
                        </code>{" "}
                        prize type. When a customer lands on it,{" "}
                        <code className="text-purple-400 text-xs">System</code>{" "}
                        calls{" "}
                        <code className="text-purple-400 text-xs">
                          add trivia participant from spin
                        </code>{" "}
                        which assigns them a ticket number and places them in
                        the trivia queue.
                        <strong className="text-white">
                          {" "}
                          Code-based:
                        </strong>{" "}
                        Customers redeem an access code that unlocks trivia
                        directly. This assigns a ticket number and adds them to
                        the trivia queue without spinning.{" "}
                        <strong className="text-purple-400 text-xs">
                          Both paths count as 1 engagement each.
                        </strong>
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
                  <CardContent>
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
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
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
                  <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                      <Radio className="h-5 w-5 text-green-400" />
                      <h3 className="text-white font-bold text-lg">
                        Offline & Online Modes
                      </h3>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 sm:gap-6">
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
                    <p className="text-white/40 text-xs mt-3">
                      <strong className="text-white">Internal streams</strong>
                      &nbsp; supports audio for host narration. Video is not
                      available on internal streams because&nbsp;
                      <strong className="text-white/60">Engage</strong>
                      &nbsp; encourages businesses to broadcast on social media
                      (TikTok, Instagram, YouTube) to maximize organic reach.
                    </p>
                  </CardContent>
                </Card>
              </section>

              <section id="limits" className="scroll-mt-20">
                <h2 className="text-2xl font-bold text-white mb-6 flex gap-2">
                  <CirclePause className="h-8 w-8 text-purple-400 mt-1" />{" "}
                  <>Engagement Limits & Game Capacity</>
                </h2>

                <Card className="bg-white/5 border-white/10 mb-6">
                  <CardContent>
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
                            ["Engagements/month", "5,000", "50,000", "500,000"],
                            ["Prize Slots", "12", "24", "36"],
                            ["Trivia Questions", "50", "200", "Unlimited"],
                            ["Sticker Codes", "500", "1,000", "Unlimited"],
                            ["POS Codes", "0", "5,000", "Unlimited"],
                            ["Access Codes (Public)", "20", "30", "Unlimited"],
                            ["Admin Users", "1", "5", "20"],
                            ["API Access", "✗", "✓", "✓"],
                            [
                              "POS Integration",
                              "✗",
                              "Spin to win",
                              "Spin to win",
                            ],
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

                    <p className="text-white/30 text-xs mt-2">
                      <strong className="text-white/60">POS Integration</strong>{" "}
                      is not included in Pro or Enterprise plans. Businesses can
                      win POS integration access by spinning{" "}
                      <strong className="text-white/80">
                        <a href="https://engagespin.com/engage/spin">
                          engagespin.com/engage/spin
                        </a>
                      </strong>{" "}
                      — look for the POS Integration prize card. Your business
                      must be at least free-tier active to participate.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 mb-6">
                  <CardContent>
                    <h3 className="text-white font-semibold mb-4">
                      Game Capacity & Auto-Selection
                    </h3>

                    <div className="space-y-4 text-white/50 text-sm leading-relaxed">
                      <p>
                        <strong className="text-white">Spin Games:</strong> When
                        you have multiple spin games with{" "}
                        <span className="text-purple-400 font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">
                          participant limit
                        </span>
                        , customers are automatically enrolled into the first
                        available game that still has capacity when they redeem
                        their code. If{" "}
                        <span className="text-purple-400 font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">
                          participant limit
                        </span>{" "}
                        is left empty (unlimited), the system enrolls{" "}
                        <strong className="text-white">everyone</strong> whose
                        code unlocks a spin experience into that game — no
                        capacity check is performed. If all games with limits
                        are full, a{" "}
                        <strong className="text-white">"all games full"</strong>{" "}
                        message is shown to customers. Each enrolled participant
                        gets a ticket number and must be enrolled before they
                        can spin.
                      </p>

                      <p>
                        <strong className="text-white">
                          Trivia Challenges:
                        </strong>{" "}
                        Each challenge can set a{" "}
                        <span className="text-purple-400 font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">
                          max participants
                        </span>{" "}
                        limit. The system auto-enrolls customers into the first
                        open challenge with available space. If no limit is set,
                        unlimited participants are accepted.
                      </p>

                      <p>
                        <strong className="text-white">Draws:</strong> The
                        system automatically enters customers into the first
                        open draw for your business. Draws can set{" "}
                        <span className="text-purple-400 font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">
                          participant limit
                        </span>{" "}
                        (unique participants) and{" "}
                        <span className="text-purple-400 font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">
                          max entries
                        </span>{" "}
                        (total entries). If a draw is full, it moves to the next
                        available one.
                      </p>

                      {/* ⭐ CRITICAL: Calendar Planning Section */}
                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <h4 className="text-amber-400 font-medium text-sm mb-2 flex gap-2">
                          <TriangleAlert className="h-5 w-5" />
                          <span>Important: Plan Your Games at Month Start</span>
                        </h4>
                        <p className="text-amber-400/80 text-xs">
                          <strong className="text-amber-300">
                            Why this matters:
                          </strong>{" "}
                          Engage distributes participants across your available
                          games based on capacity. If you{" "}
                          <strong className="text-amber-300">
                            leave the participant limit empty
                          </strong>
                          , the system will funnel{" "}
                          <strong className="text-amber-300">all</strong>{" "}
                          customers into the first game it finds — leaving your
                          other games empty and wasting engagement
                          opportunities.
                        </p>
                        <div className="mt-2 p-2 rounded bg-amber-500/5 border border-amber-500/10">
                          <p className="text-amber-400/70 text-xs">
                            <strong className="text-amber-300">
                              Best practice:
                            </strong>
                            &nbsp; At the beginning of each month (or as soon as
                            your subscription activates), set up all your games
                            with{" "}
                            <span className="text-amber-400 font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">
                              participant limit
                            </span>{" "}
                            values. This ensures participants are distributed
                            evenly across your available games and helps you
                            stay within your subscription limits.
                          </p>
                        </div>
                        <div className="mt-2 grid sm:grid-cols-3 gap-2">
                          <div className="p-2 rounded bg-white/5 border border-white/10 text-center">
                            <span className="text-xs text-white/60">
                              Starter Plan
                            </span>
                            <div className="text-xs text-white/40">
                              3 spins · 3 trivia · 3 draws
                            </div>
                          </div>
                          <div className="p-2 rounded bg-white/5 border border-white/10 text-center">
                            <span className="text-xs text-white/60">
                              Pro Plan
                            </span>
                            <div className="text-xs text-white/40">
                              10 spins · 10 trivia · 10 draws
                            </div>
                          </div>
                          <div className="p-2 rounded bg-white/5 border border-white/10 text-center">
                            <span className="text-xs text-white/60">
                              Enterprise
                            </span>
                            <div className="text-xs text-white/40">
                              Unlimited
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                        <h4 className="text-purple-400 font-medium text-sm mb-2">
                          💡 Pro Tip: Queue Mode for Live Events
                        </h4>
                        <p className="text-purple-400/60 text-xs">
                          For high-traffic venues, enable{" "}
                          <span className="text-purple-400 font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">
                            queue mode
                          </span>{" "}
                          on your spin game to call customers one-by-one by
                          name. This prevents overcrowding and creates a live
                          show experience.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="space-y-4">
                    <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-purple-400" />
                      Data Breach Prevention
                    </h3>
                    <p className="text-white/50 text-sm leading-relaxed">
                      Engage stores sensitive customer data including email,
                      phone, and national ID or driver's license numbers. A data
                      breach exposing this information could result in identity
                      theft, regulatory fines (GDPR, KDPA), and loss of Merchant
                      trust.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                        <h4 className="text-green-400 font-medium text-xs mb-1">
                          Measures We Take
                        </h4>
                        <ul className="space-y-1 text-white/50 text-xs">
                          <li>• AES-256 encryption at rest for all PII</li>
                          <li>• TLS encryption in transit</li>
                          <li>• Row Level Security (RLS) for data isolation</li>
                          <li>• HTTP-only, Secure, SameSite cookies</li>
                          <li>• Audit logging on all data access</li>
                        </ul>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                        <h4 className="text-amber-400 font-medium text-xs mb-1">
                          Breach Notification
                        </h4>
                        <ul className="space-y-1 text-white/50 text-xs">
                          <li>• 72-hour notification to regulators required</li>
                          <li>
                            • Customer notification when PII is compromised
                          </li>
                          <li>
                            • Engage reserves right to terminate compromised
                            accounts
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent>
                    <h3 className="text-white font-semibold mb-4">
                      What Counts as an Engagement?
                    </h3>

                    <div className="grid sm:grid-cols-3 gap-4">
                      {[
                        {
                          action: "Spin",
                          count: "1 engagement per spin",
                          desc: "Free or paid spins count the same",
                        },
                        {
                          action: "Draw Entry",
                          count: "1 engagement per entry",
                          desc: "Code redemption or manual entry",
                        },
                        {
                          action: "Trivia Answer",
                          count: "1 engagement per answer",
                          desc: "Whether correct or wrong",
                        },
                        {
                          action: "Code Redemption",
                          count: "1 engagement per redemption",
                          desc: "Codes unlocking spin, trivia, draw, or points",
                        },
                        {
                          action: "Viewer Prize Claim",
                          count: "1 engagement per claim",
                          desc: "When a viewer claims their prize after watching",
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
                      <strong className="text-white">Code types</strong> — Two
                      types with separate limits: sticker codes
                      (batch-generated, no API needed) and POS codes (API-based
                      receipt scanning). Sticker codes are ideal for small
                      businesses; POS codes integrate directly with your
                      checkout system.
                    </p>
                    <p className="text-white/40 text-xs mt-4">
                      <strong className="text-white">
                        Engagement counters
                      </strong>{" "}
                      reset on the 1st of each month. You'll receive a
                      notification when you reach 80% of your monthly limit.
                      Upgrade anytime to increase your limits immediately.
                    </p>
                    <p className="text-white/40 text-xs mt-2">
                      <strong className="text-white">Prize slots</strong>{" "}
                      control how many segments appear on your spin wheel. Each
                      slot represents a distinct prize type (points, discount,
                      free service, etc.). Higher plans unlock more slots so you
                      can offer richer, more varied rewards.
                    </p>
                    <p className="text-white/40 text-xs mt-2">
                      <strong className="text-white">Viewers</strong> count as
                      engagements only for internal streams (not external social
                      media). When your live page is embedded on your own site,
                      every unique viewer is counted. You can decide per game
                      whether the stream is internal-only or shared externally.
                      External viewers (e.g., social media) are not counted.
                    </p>
                    <p className="text-white/40 text-xs mt-2">
                      <strong className="text-white">Viewer Prizes</strong> —
                      Businesses set a prize (default: points) and a minimum
                      watch duration. When the stream ends, a{" "}
                      <em>"Claim Prize"</em> button appears abruptly for
                      eligible viewers. Each claim is timestamped and counts as
                      1 engagement.{" "}
                      <span className="text-purple-400/60 text-xs">System</span>{" "}
                      notifies viewers in real time so the button appears during
                      the stream at the configured moment. Viewers who claim are
                      recorded in{" "}
                      <code className="bg-white/10 px-1 rounded text-white/60">
                        viewer_engagements
                      </code>{" "}
                      with{" "}
                      <code className="bg-white/10 px-1 rounded text-white/60">
                        claimed_at
                      </code>
                      .
                    </p>
                    <p className="text-white/40 text-xs mt-2">
                      <strong className="text-white">Trivia challenges</strong>{" "}
                      are limited per billing period (monthly). If you created
                      challenges earlier in the month, they count toward your
                      limit. Unused slots roll over only if you stay on the same
                      plan. Trivia challenges created during your current
                      billing period (from last payment to next billing) are
                      counted, not lifetime total.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Referral Program Section */}
              <section className="mb-16 scroll-mt-20" id="referral-program">
                <h2 className="text-2xl font-bold text-white flex items-center mb-6">
                  <BadgeDollarSign className="h-6 w-6 text-purple-400" />
                  &nbsp; Referral Program
                </h2>

                <p className="text-sm text-white/70 max-w-3xl mb-8">
                  Engage's referral program lets you earn rewards for bringing
                  new businesses to the platform. Share your unique referral
                  link, and when a referred business subscribes to a paid plan,
                  you earn a commission.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="text-center">
                      <Gift className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                      <h3 className="text-white font-semibold mb-1">
                        Choose Your Commission
                      </h3>
                      <p className="text-white/50 text-sm">
                        Choose between{" "}
                        <span className="text-green-400">50% one-time</span> on
                        first payment or{" "}
                        <span className="text-blue-400">10% recurring</span> on
                        every payment
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="text-center">
                      <Coins className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                      <h3 className="text-white font-semibold mb-1">
                        Loyalty Points Always
                      </h3>
                      <p className="text-white/50 text-sm">
                        Both options earn loyalty points = Cash commission ×
                        100, awarded immediately for Engage experiences
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="text-center">
                      <ExternalLink className="h-8 w-8 text-pink-400 mx-auto mb-2" />
                      <h3 className="text-white font-semibold mb-1">
                        Easy Sharing
                      </h3>
                      <p className="text-white/50 text-sm">
                        Share via link, social media, or QR code — anyone can
                        become a referrer
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white/5 border-white/10 mb-8">
                  <CardContent>
                    <h3 className="text-lg font-bold text-white mb-4">
                      How It Works
                    </h3>
                    <ol className="space-y-3 text-white/70 text-sm">
                      <li className="flex items-start gap-3">
                        <span className="text-purple-400 font-bold">1.</span>
                        <span>
                          <strong className="text-white">
                            Enroll in the program
                          </strong>
                          — Visit{" "}
                          <Link
                            href="/account/referral"
                            className="text-purple-400 underline"
                          >
                            your referral dashboard
                          </Link>{" "}
                          and choose your commission preference:
                          <ul className="list-disc list-inside mt-1 space-y-1 text-white/60">
                            <li>
                              <span className="text-green-400">One-time:</span>{" "}
                              50% on first payment only
                            </li>
                            <li>
                              <span className="text-blue-400">Recurring:</span>{" "}
                              10% on every payment
                            </li>
                          </ul>
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-purple-400 font-bold">2.</span>
                        <span>
                          <strong className="text-white">
                            Share your link
                          </strong>
                          — Find your referral code in your account dashboard.
                          Share the link ({" "}
                          <code className="bg-black/30 px-1 rounded text-xs">
                            engagespin.com/business/signup?ref=ENGXXXXXXXX
                          </code>
                          ).
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-purple-400 font-bold">3.</span>
                        <span>
                          <strong className="text-white">
                            Business signs up
                          </strong>{" "}
                          — The referred business creates an account using your
                          link.
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-purple-400 font-bold">4.</span>
                        <span>
                          <strong className="text-white">They subscribe</strong>{" "}
                          — When the business pays for a subscription, you earn
                          your commission based on your chosen preference.
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-purple-400 font-bold">5.</span>
                        <div>
                          <strong className="text-white">You get paid</strong> —
                          You receive:
                          <ul className="list-disc list-inside mt-1 space-y-1 text-white/80">
                            <li>
                              <span className="text-green-400 font-medium">
                                Cash commission:
                              </span>{" "}
                              <span className="text-green-400">
                                50% one-time
                              </span>{" "}
                              on first payment{" "}
                              <span className="text-white/40">OR</span>{" "}
                              <span className="text-blue-400">
                                10% recurring
                              </span>{" "}
                              on every payment
                              <span className="text-white/40 text-xs block">
                                (based on your enrollment choice)
                              </span>
                            </li>
                            <li>
                              <span className="text-purple-400 font-medium">
                                Loyalty points:
                              </span>{" "}
                              Commission × 100, awarded immediately regardless
                              of your choice
                            </li>
                          </ul>
                        </div>
                      </li>
                    </ol>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent>
                    <h3 className="text-lg font-bold text-white mb-4">
                      Commission Structure
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-white font-semibold pb-2 pr-4">
                              Plan
                            </th>
                            <th className="text-white font-semibold pb-2 pr-4">
                              Price
                            </th>
                            <th className="text-white font-semibold pb-2 pr-4">
                              One-Time (50%)
                            </th>
                            <th className="text-white font-semibold pb-2 pr-4">
                              Recurring (10%)
                            </th>
                            <th className="text-white font-semibold pb-2 pr-4">
                              Points (×100)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="space-y-1">
                          <tr className="border-b border-white/5">
                            <td className="py-2 text-white/70 pr-4">Starter</td>
                            <td className="py-2 text-white/70 pr-4">$29/mo</td>
                            <td className="py-2 text-green-400 pr-4">$14.50</td>
                            <td className="py-2 text-blue-400 pr-4">
                              $2.90/mo
                            </td>
                            <td className="py-2 text-white/70 pr-4">
                              1,450 pts
                            </td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-2 text-white/70 pr-4">Pro</td>
                            <td className="py-2 text-white/70 pr-4">$79/mo</td>
                            <td className="py-2 text-green-400 pr-4">$39.50</td>
                            <td className="py-2 text-blue-400 pr-4">
                              $7.90/mo
                            </td>
                            <td className="py-2 text-white/70 pr-4">
                              3,950 pts
                            </td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-2 text-white/70 pr-4">
                              Enterprise
                            </td>
                            <td className="py-2 text-white/70 pr-4">$194/mo</td>
                            <td className="py-2 text-green-400 pr-4">$97.00</td>
                            <td className="py-2 text-blue-400 pr-4">
                              $19.40/mo
                            </td>
                            <td className="py-2 text-white/70 pr-4">
                              9,700 pts
                            </td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-2 text-white/70 pr-4">Bronze</td>
                            <td className="py-2 text-white/70 pr-4">
                              $697 one-time
                            </td>
                            <td className="py-2 text-green-400 pr-4">
                              $348.50
                            </td>
                            <td className="py-2 text-white/40 pr-4">N/A</td>
                            <td className="py-2 text-white/70 pr-4">
                              34,850 pts
                            </td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-2 text-white/70 pr-4">Silver</td>
                            <td className="py-2 text-white/70 pr-4">
                              $1,797 one-time
                            </td>
                            <td className="py-2 text-green-400 pr-4">
                              $898.50
                            </td>
                            <td className="py-2 text-white/40 pr-4">N/A</td>
                            <td className="py-2 text-white/70 pr-4">
                              89,850 pts
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 text-white/70 pr-4">Gold</td>
                            <td className="py-2 text-white/70 pr-4">
                              $4,997 one-time
                            </td>
                            <td className="py-2 text-green-400 pr-4">
                              $2,498.50
                            </td>
                            <td className="py-2 text-white/40 pr-4">N/A</td>
                            <td className="py-2 text-white/70 pr-4">
                              249,850 pts
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-white/40 mt-3">
                      <strong className="text-white">Dual Rewards:</strong>{" "}
                      <span className="text-green-400">Cash</span> — choose{" "}
                      <span className="text-green-400">50% one-time</span> on
                      first payment <span className="text-white/40">OR</span>{" "}
                      <span className="text-blue-400">10% recurring</span> on
                      every payment. Tracked for Paystack/M-Pesa payout (min.
                      $100 threshold).
                      <span className="text-yellow-400"> Points</span> — Cash
                      commission × 100, awarded immediately as loyalty points.
                      Both options earn points.
                    </p>
                    <div className="mt-2 text-xs text-white/30">
                      <span className="font-medium text-white/50">
                        Example:
                      </span>{" "}
                      Refer a Pro plan ($79/mo) —
                      <span className="text-green-400"> One-time: $39.50</span>{" "}
                      <span className="text-white/30">|</span>{" "}
                      <span className="text-blue-400">
                        {" "}
                        Recurring: $7.90/mo
                      </span>
                      <span className="text-white/30"> | </span>
                      <span className="text-purple-400"> Both: 3,950 pts</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/20 mt-6">
                  <CardContent>
                    <h3 className="text-lg font-bold text-white mb-2">
                      What can I do with loyalty points?
                    </h3>
                    <p className="text-white/50 text-sm mb-3">
                      Points are awarded to the system "Engage" business entity.
                      They function exactly like points at any other business.
                      Use them for spins, draws, trivia, and more — regardless
                      of which commission option you chose.
                    </p>
                    <ul className="text-white/70 space-y-1 text-sm">
                      <li>
                        • <strong>Spin to win</strong> — Free spins on the
                        Engage wheel for prizes, discounts, and subscription
                        credits
                      </li>
                      <li>
                        • <strong>Enter draws</strong> — Monthly and special
                        promotion draws across the Engage ecosystem
                      </li>
                      <li>
                        • <strong>Play trivia</strong> — Access exclusive trivia
                        challenges with point-based leaderboards
                      </li>
                      <li>
                        • <strong>Early access</strong> — Priority access to new
                        features, beta releases, and special events
                      </li>
                    </ul>

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="mt-4 border-yellow-500/20 text-yellow-400"
                    >
                      <Link href="/account/referral">
                        View Your Referral Dashboard
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </section>

              {/* ─── CONSULTATIONS ────────────────────────────── */}
              <section id="consultations" className="scroll-mt-20">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <MessageCircle className="h-6 w-6 text-purple-400" />{" "}
                  Consultations
                </h2>

                <div className="space-y-6">
                  <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                    <CardContent className="space-y-4">
                      <h3 className="text-white font-semibold text-lg">
                        Hey there👋, we see you, and we get it.
                      </h3>
                      <p className="text-white/60 text-sm leading-relaxed">
                        Every business is beautifully unique. Your staff, your
                        systems, your customers, your rhythm; none of it is
                        one-size-fits-all. And honestly? That is exactly why
                        Engage exists. Not to force you into a box, but to meet
                        you right where you are.
                      </p>
                      <p className="text-white/60 text-sm leading-relaxed">
                        Not every feature, plan, or setup works for every
                        business; and that is completely okay. Before you even
                        pick a plan or worry about connecting your existing
                        systems to your Engage business account, we want to sit
                        down virtually and really understand your world. This is
                        not a sales call. This is a{" "}
                        <span className="text-purple-400">
                          let us help you succeed
                        </span>{" "}
                        call.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="space-y-4">
                      <h3 className="text-white font-semibold text-lg">
                        What to Expect in Your Consultation Call
                      </h3>
                      <p className="text-white/50 text-sm leading-relaxed">
                        When you book a consultation, here is exactly what
                        happens; no surprises, no pressure, just a real
                        conversation:
                      </p>
                      <div className="space-y-4">
                        {[
                          {
                            step: "1",
                            title: "We Ask Great Questions",
                            desc: "We will learn about your business model, your team's technical comfort level, your current tools, and what success looks like for you. No question is too small or too big.",
                          },
                          {
                            step: "2",
                            title: "We Assess Together",
                            desc: "Together we will walk through your existing setup; your POS, your receipt system, your sticker workflow, whatever you have. We will look at what is working, what could be smoother, and where Engage fits in.",
                          },
                          {
                            step: "3",
                            title: "We Explain Engage 101",
                            desc: "We will break down exactly how Engage works, tailored to your staff's level. Whether your team is super technical or just getting started, we will meet you there and build your confidence from the ground up.",
                          },
                          {
                            step: "4",
                            title: "You Leave With Clarity",
                            desc: "By the end of the call, you will know exactly what is possible, what makes sense for your business, and what your next steps look like. No fine print, no confusion. A clear path forward.",
                          },
                        ].map((item) => (
                          <div
                            key={item.step}
                            className="flex gap-4 p-4 rounded-lg bg-white/5 border border-white/10"
                          >
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-purple-400 font-bold text-sm">
                                {item.step}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-white font-medium text-sm mb-1">
                                {item.title}
                              </h4>
                              <p className="text-white/50 text-xs leading-relaxed">
                                {item.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                        <p className="text-green-400 text-sm">
                          <strong>Why we recommend this:</strong> Consultations
                          are the sweet spot for getting the most out of Engage.
                          When we understand your business from the inside out,
                          we can set you up for success, technically and
                          strategically. Your team gains confidence, your setup
                          actually fits your workflow, and you avoid the
                          frustrating trial-and-error that can come with diving
                          in blind.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500/20 text-blue-400 border-0">
                          Consultation + Integration Plan
                        </Badge>
                      </div>
                      <h3 className="text-white font-semibold text-lg">
                        Need Someone to Handle the Heavy Lifting?
                      </h3>
                      <p className="text-white/50 text-sm leading-relaxed">
                        If your business needs hands-on help connecting your
                        existing systems: your POS, your e-commerce platform,
                        your receipt printers, your custom code, whatever you
                        are working with, our{" "}
                        <span className="text-blue-400">
                          Consultation + Integration plan
                        </span>{" "}
                        is where the magic happens.
                      </p>
                      <p className="text-white/50 text-sm leading-relaxed">
                        Here is how it works:
                      </p>
                      <div className="space-y-3">
                        {[
                          "You choose the Consultation + Integration plan during signup.",
                          "During your consultation call, we assess your existing systems and understand exactly what needs to connect to Engage.",
                          "We reach out to our trusted network of experienced Engage developers; real humans who know the platform inside and out.",
                          "One of our developers is assigned to your project and becomes your dedicated point of contact.",
                          "They will work directly with you and your team to handle the full integration; including reviewing and working with your existing codebase, systems, and workflows.",
                          "Your business is in safe hands. We treat your systems with the same care we would our own.",
                        ].map((item, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-white/50 text-sm"
                          >
                            <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                            {item}
                          </div>
                        ))}
                      </div>
                      <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                        <h4 className="text-amber-400 font-medium text-sm mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" /> What to Prepare
                        </h4>
                        <p className="text-amber-300/80 text-xs leading-relaxed">
                          If you have existing systems, code, or integrations
                          you would like us to work with, please have them
                          ready. Access to your codebase, API keys, or system
                          documentation helps our developers hit the ground
                          running. Rest assured, everything shared is handled
                          with strict confidentiality and security.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="space-y-4">
                      <h3 className="text-white font-semibold text-lg">
                        Real Talk: Why This Matters
                      </h3>
                      <p className="text-white/50 text-sm leading-relaxed">
                        We have seen businesses jump into new platforms without
                        the right support, and it rarely ends well. Time gets
                        wasted, integrations break, and frustration grows. Our
                        consultation process is designed to prevent all of that.
                      </p>
                      <p className="text-white/50 text-sm leading-relaxed">
                        Think of it this way: you would not build a house
                        without talking to an architect first. Your business
                        systems are no different. A quick chat with our team can
                        save you hours of headaches and set you up with a setup
                        that actually feels like <em>yours</em>.
                      </p>
                      <p className="text-white/50 text-sm leading-relaxed">
                        Whether you are a tiny coffee shop with a simple receipt
                        printer, or a growing retail chain with custom POS
                        software; we will meet you where you are, and help you
                        get where you want to go.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* ─── FAQ ───────────────────────────────────── */}
              <section id="faq" className="scroll-mt-20">
                <h2 className="text-2xl font-bold text-white mb-4 flex gap-2">
                  <Shield className="h-6 w-6 text-purple-400 mt-1" />{" "}
                  <>Frequently Asked Questions</>
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
                      a: "You do. Every email, phone, and ID number belongs to your business. Export anytime. We never market to your customers.",
                    },
                    {
                      q: "What if I run out of stickers?",
                      a: "Generate and print more anytime from your dashboard. Keep extras ready for busy periods.",
                    },
                    {
                      q: "How does customer verification work?",
                      a: "Engage captures email, phone, and national ID or driver's license number at signup for customer-business uniqueness. When collecting prizes, businesses verify identity against these details. If there's a mismatch, you can flag the account — other businesses will be alerted.",
                    },
                    {
                      q: "What happens if my account is banned or deleted?",
                      a: "Engage reserves the right to ban or permanently delete any customer or business account. Since business accounts are secondary and referenced to the customer account, deleting a customer account also terminates all associated business accounts.",
                    },
                    {
                      q: "How does the referral payment flow work?",
                      a: "Choose your commission structure: 50% one-time on first payment OR 10% recurring on every payment. Both earn loyalty points (commission × 100) immediately. Cash payouts via Paystack/M-Pesa (min. $100 threshold).",
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
