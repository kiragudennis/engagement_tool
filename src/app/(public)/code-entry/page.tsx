// app/(public)/code-entry/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, AlertCircle, QrCode, Store } from "lucide-react";
import Link from "next/link";
import GamingBackground from "@/components/GamingBackground";

export default function CodeEntryPage() {
  const searchParams = useSearchParams();
  const prefillCode = searchParams.get("code") || "";
  const fromLogin = searchParams.get("fromLogin") === "true";

  const { profile, setCodeResponse, codeResponse } = useAuth();
  const router = useRouter();

  const [code, setCode] = useState(prefillCode.toUpperCase());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill code from URL
  useEffect(() => {
    if (prefillCode) setCode(prefillCode.toUpperCase());
  }, [prefillCode]);

  // Auto-process if coming back from login
  useEffect(() => {
    if (fromLogin && profile?.id) {
      const storedCode = sessionStorage.getItem("pendingCode");
      if (storedCode && codeResponse) {
        sessionStorage.removeItem("pendingCode");
        setCode(storedCode);
        // User IS logged in — redirect to business code-entry with code
        router.push(
          `/${codeResponse.business_slug}/code-entry?code=${codeResponse.code}`,
        );
      }
    }
  }, [fromLogin, profile?.id]);

  // ─── Look up code via backend ─────────────────────────
  const handleLookup = async (codeToUse: string) => {
    if (!codeToUse.trim()) {
      setError("Please enter a code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/customer/code-lookup?code=${encodeURIComponent(codeToUse.toUpperCase().trim())}`,
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid code");
        setLoading(false);
        return;
      }

      // Set code response
      setCodeResponse(data);

      // If user is NOT logged in, store code and redirect to login
      if (!profile?.id) {
        sessionStorage.setItem("pendingCode", data.code);

        router.push(
          `/login?tab=signup&redirect=${encodeURIComponent(`/code-entry?code=${data.code}&fromLogin=true`)}`,
        );
        return;
      }

      // User IS logged in — redirect to business code-entry with code
      router.push(`/${data.business_slug}/code-entry?code=${data.code}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => handleLookup(code);

  return (
    <>
      <GamingBackground />
      <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block"
            >
              <QrCode className="h-16 w-16 text-purple-500 mx-auto" />
            </motion.div>
            <h1 className="text-3xl font-bold mt-4">Enter Your Code</h1>
            <p className="text-purple-300 mt-2">
              Got a code from a business? Enter it here.
            </p>
          </div>

          <Card className="bg-black/50 backdrop-blur border-white/10">
            <CardContent className="p-6 space-y-4">
              {/* Code Input */}
              <div>
                <Label className="text-white">Access Code</Label>
                <Input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
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

              <Button
                onClick={handleSubmit}
                disabled={loading || !code.trim()}
                className="w-full h-12 text-lg gap-2 bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Continue <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>

              {profile && (
                <p className="text-xs text-center text-white/60">
                  Signed in as {profile.email}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-sm mt-6">
            Don't have a code? Ask your favorite local business for one!
          </p>

          <div className="text-center mt-8 pt-8 border-t border-white/5">
            <p className="text-sm mb-3">Are you a business?</p>
            <Link href="/business/signup">
              <Button variant="outline" className="border-white/10">
                <Store className="h-4 w-4 mr-2" />
                Create Your Free Account
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
