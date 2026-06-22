// app/(public)/login/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Mail,
  Lock,
  User,
  RotateCcw,
  Brain,
  Trophy,
  Gift,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import GamingBackground from "@/components/GamingBackground";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Valid email required"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().min(1, "Email is required").email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// ─── Login Form ─────────────────────────────────────────
function LoginFormContent() {
  const searchParams = useSearchParams();
  const redirectedFrom =
    searchParams.get("redirectedFrom") ||
    searchParams.get("redirect") ||
    "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      const flat = parsed.error.flatten().fieldErrors;
      for (const [key, msgs] of Object.entries(flat)) {
        if (msgs?.length) fieldErrors[key] = msgs[0];
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      toast.success("Welcome back!");
      // If there's a pending code, redirect back to code-entry with fromLogin flag
      const pendingCode = sessionStorage.getItem("pendingCode");
      if (pendingCode) {
        window.location.href = `/code-entry?code=${pendingCode}&fromLogin=true`;
      } else {
        window.location.href = data.redirectTo || redirectedFrom;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-gray-700 dark:text-gray-300">Email</Label>
        <div className="relative mt-1.5">
          <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((p) => ({ ...p, email: "" }));
            }}
            placeholder="you@email.com"
            className={`pl-9 bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${
              errors.email ? "border-red-500 dark:border-red-500" : ""
            }`}
            disabled={loading}
          />
        </div>
        {errors.email && (
          <p className="text-red-500 dark:text-red-400 text-xs mt-1">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <Label className="text-gray-700 dark:text-gray-300">Password</Label>
        <div className="relative mt-1.5">
          <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((p) => ({ ...p, password: "" }));
            }}
            placeholder="••••••••"
            className={`pl-9 pr-10 bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${
              errors.password ? "border-red-500 dark:border-red-500" : ""
            }`}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-500 dark:text-red-400 text-xs mt-1">
            {errors.password}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Sign In <ArrowRight className="h-4 w-4 ml-1" />
          </>
        )}
      </Button>
    </form>
  );
}

// ─── Signup Form ────────────────────────────────────────
function SignupFormContent() {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref") || "";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = signupSchema.safeParse({ fullName, email, password });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      const flat = parsed.error.flatten().fieldErrors;
      for (const [key, msgs] of Object.entries(flat)) {
        if (msgs?.length) fieldErrors[key] = msgs[0];
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsed.data,
          referralCode: referralCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      toast.success("Account created! Check your email to verify.");
      // If there's a pending code, auto-redeem after email verification
      const pendingCode = sessionStorage.getItem("pendingCode");
      if (pendingCode) {
        // Store for after email confirmation
        sessionStorage.setItem("pendingCodeAfterVerify", pendingCode);
        sessionStorage.removeItem("pendingCode");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Signup failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Referral indicator */}
      {referralCode && (
        <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-center">
          <p className="text-purple-700 dark:text-purple-300 text-sm">
            🎉 You've been referred! You'll earn bonus points when you activate.
          </p>
        </div>
      )}

      <div>
        <Label className="text-gray-700 dark:text-gray-300">Full Name</Label>
        <div className="relative mt-1.5">
          <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <Input
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setErrors((p) => ({ ...p, fullName: "" }));
            }}
            placeholder="Jane Doe"
            className={`pl-9 bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${
              errors.fullName ? "border-red-500 dark:border-red-500" : ""
            }`}
            disabled={loading}
          />
        </div>
        {errors.fullName && (
          <p className="text-red-500 dark:text-red-400 text-xs mt-1">
            {errors.fullName}
          </p>
        )}
      </div>

      <div>
        <Label className="text-gray-700 dark:text-gray-300">Email</Label>
        <div className="relative mt-1.5">
          <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((p) => ({ ...p, email: "" }));
            }}
            placeholder="you@email.com"
            className={`pl-9 bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${
              errors.email ? "border-red-500 dark:border-red-500" : ""
            }`}
            disabled={loading}
          />
        </div>
        {errors.email && (
          <p className="text-red-500 dark:text-red-400 text-xs mt-1">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <Label className="text-gray-700 dark:text-gray-300">Password</Label>
        <div className="relative mt-1.5">
          <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((p) => ({ ...p, password: "" }));
            }}
            placeholder="Min. 6 characters"
            className={`pl-9 pr-10 bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${
              errors.password ? "border-red-500 dark:border-red-500" : ""
            }`}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-500 dark:text-red-400 text-xs mt-1">
            {errors.password}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Create Account <ArrowRight className="h-4 w-4 ml-1" />
          </>
        )}
      </Button>
    </form>
  );
}

// ─── Main Page ──────────────────────────────────────────
export default function LoginPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabParam === "signup" ? "signup" : "login",
  );

  return (
    <>
      <GamingBackground />
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left Column - Brand Banner */}
            <div className="hidden md:block text-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-8"
              >
                <div className="inline-flex items-center gap-2 mb-4">
                  <Sparkles className="h-10 w-10 text-purple-500 dark:text-purple-400" />
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    Engage
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Spin. Play. Win.
                </h2>
                <p className="max-w-sm mx-auto leading-relaxed text-gray-600 dark:text-gray-300">
                  Join the fun at your favorite local businesses. Enter codes,
                  spin wheels, play trivia, and win real prizes.
                </p>

                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                  {[
                    {
                      icon: RotateCcw,
                      label: "Spin & Win",
                      color: "text-purple-500 dark:text-purple-400",
                    },
                    {
                      icon: Brain,
                      label: "Live Trivia",
                      color: "text-blue-500 dark:text-blue-400",
                    },
                    {
                      icon: Trophy,
                      label: "Prize Draws",
                      color: "text-amber-500 dark:text-amber-400",
                    },
                    {
                      icon: Gift,
                      label: "Free Prizes",
                      color: "text-pink-500 dark:text-pink-400",
                    },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="p-3 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-center"
                    >
                      <item.icon
                        className={`h-5 w-5 mx-auto mb-1 ${item.color}`}
                      />
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        {item.label}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 max-w-sm mx-auto">
                  <p className="text-sm italic text-gray-700 dark:text-gray-300">
                    "I won a free coffee just by scanning a QR code at my local
                    café. Now I go back every day!"
                  </p>
                  <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
                    — Sarah, Nairobi
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Auth Forms */}
            <div>
              <div className="md:hidden text-center mb-6">
                <div className="inline-flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-purple-500 dark:text-purple-400" />
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    Engage
                  </span>
                </div>
              </div>

              <Card className="bg-white dark:bg-gray-900/95 border-gray-200 dark:border-gray-800 backdrop-blur-sm">
                <CardContent className="p-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 dark:bg-gray-800">
                      <TabsTrigger
                        value="login"
                        className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
                      >
                        Sign In
                      </TabsTrigger>
                      <TabsTrigger
                        value="signup"
                        className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
                      >
                        Create Account
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                      <Suspense
                        fallback={
                          <div className="text-gray-500 dark:text-gray-400 text-center py-4">
                            Loading...
                          </div>
                        }
                      >
                        <LoginFormContent />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="signup">
                      <Suspense
                        fallback={
                          <div className="text-gray-500 dark:text-gray-400 text-center py-4">
                            Loading...
                          </div>
                        }
                      >
                        <SignupFormContent />
                      </Suspense>
                    </TabsContent>
                  </Tabs>

                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 space-y-3 text-center">
                    {activeTab === "login" && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Don't have an account?{" "}
                        <button
                          onClick={() => setActiveTab("signup")}
                          className="text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          Create one
                        </button>
                      </p>
                    )}
                    {activeTab === "signup" && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Already have an account?{" "}
                        <button
                          onClick={() => setActiveTab("login")}
                          className="text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          Sign in
                        </button>
                      </p>
                    )}
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Have a code?{" "}
                      <Link
                        href="/spin"
                        className="text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        Enter it here
                      </Link>
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs">
                      Running a business?{" "}
                      <Link
                        href="/business/signup"
                        className="text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        Start free trial
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
