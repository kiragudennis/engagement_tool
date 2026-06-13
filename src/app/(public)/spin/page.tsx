// app/(public)/spin/page.tsx
"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Store,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

export default function PublicSpinPage() {
  const searchParams = useSearchParams();
  const prefillCode = searchParams.get("code") || "";

  const { supabase, profile } = useAuth();
  const router = useRouter();

  const [code, setCode] = useState(prefillCode.toUpperCase());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [signingUp, setSigningUp] = useState(false);

  const handleCodeSubmit = useCallback(async () => {
    if (!code.trim()) {
      setError("Please enter a code");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!profile?.id) {
        // User not logged in - validate code first, then show signup
        const { data: codeData } = await supabase
          .from("access_codes")
          .select(
            "id, business_id, code, unlocks, businesses!inner(id, name, slug, logo_url, brand_color)",
          )
          .eq("code", code.toUpperCase().trim())
          .eq("is_active", true)
          .single();

        if (!codeData) {
          setError(
            "Invalid or expired code. Ask the business for a valid code.",
          );
          setLoading(false);
          return;
        }

        setResult({
          business_name: codeData.businesses.name,
          business_slug: codeData.businesses.slug,
          business_logo: codeData.businesses.logo_url,
          business_color: codeData.businesses.brand_color,
          unlocks: codeData.unlocks,
          code: codeData.code,
        });
        setShowSignup(true);
        setLoading(false);
        return;
      }

      // User is logged in - redeem code immediately
      const { data, error: rpcError } = await supabase.rpc(
        "redeem_access_code",
        {
          p_code: code.toUpperCase().trim(),
          p_user_id: profile.id,
        },
      );

      if (rpcError) throw rpcError;

      if (!data.success) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setResult(data);
      toast.success(`Welcome to ${data.business_name}!`);

      // Redirect after short delay
      setTimeout(() => {
        router.push(data.redirect_url);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [code, profile?.id, supabase, router]);

  const handleSignup = async () => {
    if (
      !signupData.fullName.trim() ||
      !signupData.email.trim() ||
      !signupData.password.trim()
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    setSigningUp(true);
    try {
      // Create account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            full_name: signupData.fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create account");

      // Update profile
      await supabase
        .from("users")
        .update({
          full_name: signupData.fullName,
          onboarding_completed: false,
        })
        .eq("id", authData.user.id);

      // Redeem the code with new user ID
      const { data: redeemData, error: redeemError } = await supabase.rpc(
        "redeem_access_code",
        {
          p_code: code.toUpperCase().trim(),
          p_user_id: authData.user.id,
        },
      );

      if (redeemError) throw redeemError;
      if (!redeemData.success) throw new Error(redeemData.error);

      toast.success(`Account created! Welcome to ${redeemData.business_name}!`);

      setTimeout(() => {
        router.push(redeemData.redirect_url);
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
    } finally {
      setSigningUp(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block"
          >
            <Gift className="h-16 w-16 text-yellow-400 mx-auto" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mt-4">Spin & Win</h1>
          <p className="text-purple-300 mt-2">Enter your code to get started</p>
        </div>

        <Card className="bg-black/50 backdrop-blur border-white/10">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {!showSignup ? (
                <motion.div
                  key="code-entry"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Code Input */}
                  <div>
                    <Label className="text-white">Access Code</Label>
                    <Input
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                        setError(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
                      placeholder="e.g., BREW-FRIDAY"
                      className="mt-2 text-lg font-mono tracking-widest text-center bg-white/5 border-white/10 text-white placeholder:text-white/30 h-14"
                      autoFocus
                      disabled={loading}
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  {/* Success preview */}
                  {result && !showSignup && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20"
                    >
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                      <div>
                        <p className="text-green-400 font-medium">
                          Connected to {result.business_name}!
                        </p>
                        <p className="text-green-300/70 text-sm">
                          Redirecting...
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <Button
                    onClick={handleCodeSubmit}
                    disabled={loading || !code.trim()}
                    className="w-full h-12 text-lg gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Enter <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </Button>

                  {profile && (
                    <p className="text-xs text-center text-white/40">
                      Signed in as {profile.email}
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {/* Business Preview */}
                  <div className="text-center p-4 rounded-lg bg-white/5">
                    <div
                      className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg"
                      style={{
                        backgroundColor: result?.business_color || "#8B5CF6",
                      }}
                    >
                      {result?.business_name?.[0] || "?"}
                    </div>
                    <p className="text-white font-semibold">
                      {result?.business_name}
                    </p>
                    <p className="text-xs text-purple-300 mt-1">
                      You're about to join their{" "}
                      {result?.unlocks === "trivia"
                        ? "Trivia Night"
                        : "Spin & Win"}
                      !
                    </p>
                  </div>

                  {/* Signup Form */}
                  <div>
                    <Label className="text-white">Full Name</Label>
                    <Input
                      value={signupData.fullName}
                      onChange={(e) =>
                        setSignupData((p) => ({
                          ...p,
                          fullName: e.target.value,
                        }))
                      }
                      placeholder="Jane Doe"
                      className="mt-1 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Email</Label>
                    <Input
                      type="email"
                      value={signupData.email}
                      onChange={(e) =>
                        setSignupData((p) => ({ ...p, email: e.target.value }))
                      }
                      placeholder="jane@email.com"
                      className="mt-1 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Password</Label>
                    <Input
                      type="password"
                      value={signupData.password}
                      onChange={(e) =>
                        setSignupData((p) => ({
                          ...p,
                          password: e.target.value,
                        }))
                      }
                      placeholder="Min. 6 characters"
                      className="mt-1 bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <Button
                    onClick={handleSignup}
                    disabled={signingUp}
                    className="w-full h-12 text-lg gap-2 bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    {signingUp ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Create Account & Enter <Sparkles className="h-5 w-5" />
                      </>
                    )}
                  </Button>

                  <button
                    onClick={() => setShowSignup(false)}
                    className="w-full text-sm text-purple-400 hover:text-purple-300"
                  >
                    ← Back
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Don't have a code */}
        <p className="text-center text-white/30 text-sm mt-6">
          Don't have a code? Ask your favorite local business for one!
        </p>

        {/* Business CTA */}
        <div className="text-center mt-8 pt-8 border-t border-white/5">
          <p className="text-white/50 text-sm mb-3">Are you a business?</p>
          <Link href="/business/signup">
            <Button
              variant="outline"
              className="border-white/10 text-white/70 hover:text-white"
            >
              <Store className="h-4 w-4 mr-2" />
              Create Your Free Account
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
