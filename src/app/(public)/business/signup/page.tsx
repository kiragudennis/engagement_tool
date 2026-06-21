// app/(public)/business/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  Store,
  Sparkles,
  Loader2,
  ArrowRight,
  CheckCircle,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function BusinessSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "creating" | "done">("form");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    fullName: "",
    email: "",
    password: "",
  });
  const [businessSlug, setBusinessSlug] = useState("");

  const handleSubmit = async () => {
    if (!formData.businessName.trim()) {
      toast.error("Business name is required");
      return;
    }
    if (!formData.fullName.trim()) {
      toast.error("Your name is required");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setStep("creating");

    try {
      const res = await fetch("/api/business/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: formData.businessName,
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          toast.error(
            "This business name is already taken. Try a different one.",
          );
          setStep("form");
          return;
        }
        throw new Error(data.error || "Failed to create business");
      }

      setBusinessSlug(data.business.slug);
      setStep("done");
      toast.success("Business created! Check your email for details.");
    } catch (err: any) {
      toast.error(err.message || "Failed to create business");
      setStep("form");
    }
  };

  // ─── Done State ───────────────────────────────────────
  if (step === "done") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-center max-w-md"
        >
          <CheckCircle className="h-20 w-20 text-green-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">
            You're all set!
          </h1>
          <p className="text-purple-300 mb-2">
            Your business is ready to engage customers.
          </p>
          <Card className="bg-black/50 border-white/10 mt-6">
            <CardContent className="p-4 text-center space-y-3">
              <div>
                <p className="text-white/60 text-sm mb-1">Your public page:</p>
                <p className="text-yellow-400 font-mono text-lg">
                  engagespin.com/{businessSlug}/spin
                </p>
              </div>
              <div>
                <p className="text-white/60 text-sm mb-1">Your dashboard:</p>
                <p className="text-purple-400 font-mono text-sm">
                  engagespin.com/admin/{businessSlug}
                </p>
              </div>
            </CardContent>
          </Card>
          <Button
            onClick={() => {
              window.location.href = `/admin/${businessSlug}`;
            }}
            className="mt-6 gap-2"
            size="lg"
          >
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    );
  }

  // ─── Signup Form ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Store className="h-12 w-12 text-purple-400 mx-auto" />
          <h1 className="text-2xl font-bold text-white mt-4">
            Create Your Business
          </h1>
          <p className="text-purple-300 mt-2">
            Start engaging your customers in minutes
          </p>
        </div>

        <Card className="bg-black/50 backdrop-blur border-white/10">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-white">Business Name *</Label>
              <Input
                value={formData.businessName}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, businessName: e.target.value }))
                }
                placeholder="Brew & Bean Coffee"
                className="mt-1 bg-white/5 border-white/10 text-white"
                disabled={step === "creating"}
              />
              {formData.businessName && (
                <p className="text-xs text-white/40 mt-1">
                  Your page: engagespin.com/
                  {generateSlug(formData.businessName)}/spin
                </p>
              )}
            </div>

            <div>
              <Label className="text-white">Your Name *</Label>
              <div className="relative mt-1">
                <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <Input
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, fullName: e.target.value }))
                  }
                  placeholder="Jane Doe"
                  className="pl-9 bg-white/5 border-white/10 text-white"
                  disabled={step === "creating"}
                />
              </div>
            </div>

            <div>
              <Label className="text-white">Email *</Label>
              <div className="relative mt-1">
                <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="you@email.com"
                  className="pl-9 bg-white/5 border-white/10 text-white"
                  disabled={step === "creating"}
                />
              </div>
            </div>

            <div>
              <Label className="text-white">Password *</Label>
              <div className="relative mt-1">
                <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder="Min. 6 characters"
                  className="pl-9 pr-10 bg-white/5 border-white/10 text-white"
                  disabled={step === "creating"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <p className="text-sm text-purple-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> 14-day free trial · No credit
                card required
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={step === "creating"}
              className="w-full h-12 gap-2 bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {step === "creating" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Create Business <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>

            <p className="text-center text-white/30 text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-purple-400 hover:text-purple-300"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
