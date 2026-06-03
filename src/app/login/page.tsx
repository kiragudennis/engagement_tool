// app/login/page.tsx

"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "@/components/auth/LoginForm";
import SignUpForm from "@/components/auth/SignUpForm";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Target,
  Zap,
  Shield,
  Gift,
  Award,
  Star,
  Users,
  Coins,
  Trophy,
  Ticket,
  Sparkles,
  CheckCircle,
  Crown,
  TrendingUp,
  Heart,
} from "lucide-react";
import { useStore } from "@/lib/context/StoreContext";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; message?: string; ref?: string }>;
}) {
  const { profile } = useAuth();
  const router = useRouter();
  const searchParam = use(searchParams);
  const { redirect, message, ref } = searchParam;
  const [panel, setPanel] = useState<"signin" | "signup">("signin");
  const { state } = useStore();
  const orderData = state.pendingOrder;

  useEffect(() => {
    if (profile) {
      const redirectPath =
        redirect || profile.role === "admin"
          ? `/admin`
          : orderData
            ? "/checkout/payment"
            : "/";
      router.push(redirectPath);
    }
  }, [profile, router, orderData, redirect]);

  const handleTabChange = (value: string) => {
    if (value === "signin" || value === "signup") {
      setPanel(value);
    }
  };

  const getMessage = () => {
    switch (message) {
      case "verified":
        return "🎉 Email verified successfully! You can now log in and start earning points.";
      case "already-verified":
        return "✅ Your email is already verified. Welcome back!";
      case "verification-expired":
        return "⏰ Verification link expired. Please sign up again.";
      default:
        return message;
    }
  };

  // Engagement features for the right column
  const engagementFeatures = [
    {
      icon: Target,
      title: "Spin to Win",
      description: "Daily free spins for points and prizes",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Trophy,
      title: "Live Challenges",
      description: "Compete in real-time trivia",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Ticket,
      title: "Lucky Draws",
      description: "Enter giveaways with multiple methods",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Gift,
      title: "Mystery Bundles",
      description: "Curated products with surprise reveals",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Zap,
      title: "Flash Deals",
      description: "Limited-time offers with live countdowns",
      color: "from-amber-500 to-yellow-500",
    },
  ];

  const benefits = [
    {
      icon: Coins,
      title: "Earn Loyalty Points",
      description: "Every purchase earns points redeemable for discounts",
    },
    {
      icon: Crown,
      title: "Tier Benefits",
      description: "Unlock Silver, Gold, and Platinum rewards",
    },
    {
      icon: TrendingUp,
      title: "Engagement Stats",
      description: "Track your activity across all modules",
    },
    {
      icon: Heart,
      title: "Community Access",
      description: "Join live events and compete with others",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 py-8">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column - Auth Forms */}
          <div className="w-full max-w-md mx-auto">
            <Card className="shadow-xl border-purple-200 dark:border-purple-900/50">
              <CardHeader className="text-center space-y-4">
                <div className="flex justify-center items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                    <img
                      src="/favicon-32x32.png"
                      alt="Northwind Systems"
                      className="h-12 w-12"
                    />
                  </div>
                  <div className="h-8 w-px bg-gray-300 dark:bg-gray-700"></div>
                  <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  Northwind Systems
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Sign in to access all 5 engagement modules and earn loyalty
                  points
                </CardDescription>

                {message && (
                  <div
                    className={`rounded-lg p-3 ${
                      message === "verified" || message === "already-verified"
                        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
                        : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
                    }`}
                  >
                    <p className="text-sm">{getMessage()}</p>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs
                  value={panel}
                  onValueChange={handleTabChange}
                  defaultValue={panel}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
                    <TabsTrigger
                      value="signin"
                      className="data-[state=active]:bg-white data-[state=active]:text-blue-600 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-400"
                    >
                      Login
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="data-[state=active]:bg-white data-[state=active]:text-blue-600 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-400"
                    >
                      Create Account
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="space-y-4">
                    <LoginForm />
                  </TabsContent>

                  <TabsContent value="signup" className="space-y-6">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full flex items-center justify-center mx-auto">
                        <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Join the Community
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Create your account to start earning points and
                        participating in engagement modules
                      </p>
                    </div>

                    <SignUpForm
                      onSuccess={() => setPanel("signin")}
                      ref={ref}
                    />
                  </TabsContent>
                </Tabs>

                {/* Guest Checkout Option */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-3">
                    Want to shop without an account?
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    <Link href="/">Continue as Guest</Link>
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-2">
                    Create an account later to earn points on your purchase
                  </p>
                </div>

                {/* Support Links */}
                <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    By signing in, you agree to our{" "}
                    <Link
                      href="#"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="#"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Need help?{" "}
                    <a
                      href="mailto:hello@noreply.yunobase.com"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Contact Support
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Engagement Features */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                <span>5 Engagement Modules • Enterprise Platform</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to the Future of E-commerce
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Access all 5 engagement modules, earn loyalty points, and become
                part of a community-driven shopping experience.
              </p>
            </div>

            {/* Engagement Modules Grid */}
            <div className="grid grid-cols-1 gap-3">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Engagement Modules
              </h3>
              {engagementFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {feature.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-2 gap-3">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <Icon className="w-5 h-5 text-blue-500 mb-2" />
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                      {benefit.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Business Account CTA */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold mb-1">Enterprise Solutions</h3>
                  <p className="text-sm opacity-90 mb-3">
                    Custom deployments, white-label solutions, and dedicated
                    support for businesses.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="border-white/30 text-black"
                  >
                    <Link href="/about/module/consultation">
                      Schedule Consultation →
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Testimonial */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">JD</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Jane D., Store Owner
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Using all 5 modules • 3 months
                  </p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm italic">
                "The spin wheel alone increased our daily active users by 65%.
                Adding challenges and draws created a community around our
                brand. Best investment we've made."
              </p>
              <div className="flex mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-3 h-3 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
