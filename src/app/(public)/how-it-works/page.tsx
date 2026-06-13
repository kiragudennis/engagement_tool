// app/(public)/how-it-works/page.tsx
"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
  Ticket,
  Gift,
  Smartphone,
  Users,
  QrCode,
  Store,
  ArrowRight,
  Shield,
  Star,
  Radio,
  RotateCcw,
  Trophy,
} from "lucide-react";

const FOR_CUSTOMERS = [
  {
    icon: Ticket,
    title: "Get a Code",
    description:
      "Visit your favorite local business—a coffee shop, salon, or store. They'll give you a code on your receipt, a QR code at the counter, or share one on their social media.",
  },
  {
    icon: Smartphone,
    title: "Enter It Here",
    description:
      "Go to engagespin.com on your phone, enter the code, and create an account. That's it—no app to download, no payment needed.",
  },
  {
    icon: Gift,
    title: "Spin & Win",
    description:
      "Spin the business's custom wheel and win real prizes—free coffee, discounts, products. Show your phone to claim your prize right there.",
  },
  {
    icon: Radio,
    title: "Join Live Events",
    description:
      "Some businesses host live trivia nights. Join from your phone, answer questions, and watch the leaderboard on the big screen behind the host.",
  },
  {
    icon: Star,
    title: "Earn Points",
    description:
      "Every spin and trivia answer earns you loyalty points. Redeem them for extra spins, VIP badges, and other perks across any business on Engage.",
  },
];

const FOR_BUSINESSES = [
  {
    icon: Store,
    title: "Set Up Your Page",
    description:
      "Create your business profile, upload your logo, and configure your spin wheel with prizes your customers actually want.",
  },
  {
    icon: QrCode,
    title: "Share Codes",
    description:
      "Print QR codes for your counter, generate single-use codes for receipts, or post a code on Instagram. You control who accesses your experience.",
  },
  {
    icon: Users,
    title: "Build Your List",
    description:
      "Every customer who spins gives you their email. Export your customer list anytime. These are your customers—we never market to them.",
  },
  {
    icon: Trophy,
    title: "Go Live",
    description:
      "Host trivia nights with a professional broadcast display. Project the leaderboard, call participants by ticket number, and create an unforgettable experience.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950">
      {/* Hero */}
      <div className="text-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How Engage Works
          </h1>
          <p className="text-lg text-white/50 max-w-xl mx-auto">
            A simple tool that turns your business into an interactive
            experience—and your customers love it.
          </p>
        </motion.div>
      </div>

      {/* For Customers */}
      <div className="border-t border-white/5 py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-0">
              For Customers
            </Badge>
            <h2 className="text-3xl font-bold text-white mb-4">How to Play</h2>
            <p className="text-white/50">
              You don't browse businesses on Engage. You come here because a
              business you know invited you.
            </p>
          </div>

          <div className="space-y-12">
            {FOR_CUSTOMERS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`flex gap-8 items-center ${i % 2 === 0 ? "" : "flex-row-reverse"}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <span className="text-purple-400 font-bold">{i + 1}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-white/50 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                <div className="w-24 h-24 rounded-2xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <step.icon className="h-10 w-10 text-purple-400" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* For Businesses */}
      <div className="border-t border-white/5 py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-500/20 text-green-300 border-0">
              For Businesses
            </Badge>
            <h2 className="text-3xl font-bold text-white mb-4">
              How to Engage
            </h2>
            <p className="text-white/50">
              Set up in minutes. Your customers play from their phones. You
              capture their data.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {FOR_BUSINESSES.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 h-full">
                  <CardContent className="p-6">
                    <step.icon className="h-8 w-8 text-green-400 mb-4" />
                    <h3 className="text-white font-semibold text-lg mb-2">
                      {step.title}
                    </h3>
                    <p className="text-white/50 text-sm leading-relaxed">
                      {step.description}
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
            Common Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Do I need to download an app?",
                a: "No. Everything works in your phone's browser. Just go to engagespin.com.",
              },
              {
                q: "Can I use Engage without a code?",
                a: "No. Every experience on Engage is accessed through a code given by a business. This keeps things personal and prevents spam.",
              },
              {
                q: "Is my email shared with other businesses?",
                a: "No. Each business only sees customers who activated with their specific code. Your activity with one business is never visible to another.",
              },
              {
                q: "What if I win a prize?",
                a: "Show your phone screen to the business to claim your prize. They handle fulfillment however they like.",
              },
              {
                q: "Can businesses see all my activity?",
                a: "A business can only see your spins and trivia participation with them—not with other businesses.",
              },
              {
                q: "How do I delete my account?",
                a: "Contact us at privacy@engagespin.com and we'll delete your account and all associated data.",
              },
            ].map((faq, i) => (
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
      <div className="border-t border-white/5 py-20 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Have a code? Let's go.
        </h2>
        <Button
          asChild
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-lg px-8"
        >
          <Link href="/spin">
            Enter Your Code <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}
