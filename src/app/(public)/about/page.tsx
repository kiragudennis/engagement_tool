// app/(public)/about/page.tsx
"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
  Store,
  Users,
  Gift,
  Shield,
  Smartphone,
  Radio,
  ArrowRight,
  Sparkles,
  Star,
  Heart,
} from "lucide-react";

const VALUES = [
  {
    icon: Store,
    title: "Your Customers, Your Data",
    description:
      "Every email, every spin, every trivia answer belongs to you. We don't market to your customers. We don't sell their data. They're yours.",
  },
  {
    icon: Shield,
    title: "Tool, Not a Platform",
    description:
      "Engage isn't a marketplace where customers browse businesses. It's a tool businesses use to engage their own audience. No code = no access.",
  },
  {
    icon: Radio,
    title: "Built for Live Experiences",
    description:
      "Project the leaderboard behind your host. Customers play from their phones. It's a shared social experience, not another app to scroll.",
  },
  {
    icon: Gift,
    title: "Simple Rewards, Real Results",
    description:
      "No complex loyalty programs. Customers spin, win prizes, and you fulfill them however you want. Free coffee, discount codes, swag - you decide.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Create your business page",
    description:
      "Sign up, set your branding, and configure your spin wheel with prizes your customers actually want.",
  },
  {
    step: "2",
    title: "Generate access codes",
    description:
      "Print QR codes for your counter, generate single-use codes for receipts, or share a code on social media.",
  },
  {
    step: "3",
    title: "Customers play from their phones",
    description:
      "No app download. They scan a QR code or enter a code on our site. They spin, win, and you capture their email.",
  },
  {
    step: "4",
    title: "Broadcast live events",
    description:
      "Host trivia nights with a professional live display. Project the leaderboard. Your customers compete from their phones.",
  },
  {
    step: "5",
    title: "Export your customer data",
    description:
      "Every email collected is yours. Export to CSV anytime. Use it for your own marketing. We never touch it.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950">
      {/* Hero */}
      <div className="text-center py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Badge className="mb-4 bg-purple-500/20 text-purple-300 text-sm px-4 py-1.5 border-0">
            Built for businesses, not for us
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Turn your business into
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              a live game show
            </span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Engage is a retention tool that helps local businesses create
            gamified experiences—spin wheels, trivia nights, and live
            events—that customers play from their phones. No app download. No
            marketplace. Just you and your customers.
          </p>
        </motion.div>
      </div>

      {/* The Problem */}
      <div className="border-t border-white/5 py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Why We Built This
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto leading-relaxed">
              Local businesses have a retention problem. Punch cards get lost.
              Social media reach keeps dropping. Email lists are hard to grow.
              We wanted to give businesses a way to make customer engagement
              <span className="text-white/70"> fun, social, and live</span>
              —without needing a tech team.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {VALUES.map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 h-full">
                  <CardContent className="p-6">
                    <value.icon className="h-8 w-8 text-purple-400 mb-4" />
                    <h3 className="text-white font-semibold text-lg mb-2">
                      {value.title}
                    </h3>
                    <p className="text-white/50 text-sm leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="border-t border-white/5 py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-white text-center mb-16">
            How It Works
          </h2>
          <div className="space-y-8">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-6 items-start"
              >
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-400 font-bold text-lg">
                    {step.step}
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">
                    {step.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Ownership */}
      <div className="border-t border-white/5 py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-8 text-center"
          >
            <Shield className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Your Customer Data Belongs to You
            </h2>
            <p className="text-white/60 leading-relaxed mb-6">
              When a customer activates their account with your business code,
              their email and engagement history becomes part of{" "}
              <span className="text-white/80">your</span> customer list. You can
              export it anytime. We don't email your customers. We don't analyze
              their behavior for our benefit. We don't sell or share their data.{" "}
              <span className="text-white/80">
                They're your customers, not ours.
              </span>
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-white font-bold text-lg">✅</p>
                <p className="text-white/50 text-sm">You own the data</p>
              </div>
              <div>
                <p className="text-white font-bold text-lg">✅</p>
                <p className="text-white/50 text-sm">You export anytime</p>
              </div>
              <div>
                <p className="text-white font-bold text-lg">✅</p>
                <p className="text-white/50 text-sm">We never market to them</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-white/5 py-20 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to engage your customers?
        </h2>
        <p className="text-white/60 mb-8">
          Start your 14-day free trial. No credit card required.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-lg px-8"
        >
          <Link href="/business/signup">
            Create Your Business <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
