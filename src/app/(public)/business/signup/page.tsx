// app/(public)/business/signup/page.tsx
"use client";

import { useEffect, useState } from "react";
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
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function BusinessSignupPage() {
  const [step, setStep] = useState<"form" | "creating" | "done">("form");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    fullName: "",
    email: "",
    password: "",
    type: "retail",
  });
  const [businessSlug, setBusinessSlug] = useState("");
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") || "";
  const isEarlyBird = planParam.startsWith("early_");
  const router = useRouter();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const { profile, loading } = useAuth();

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (profile && profile.role === "business" && profile.business_slug) {
      if (isEarlyBird) {
        router.push(
          `/admin/${profile.business_slug}/billing?plan=${planParam}&businessId=${businessId}&slug=${profile.business_slug}`,
        );
      } else {
        router.push(`/admin/${profile.business_slug}`);
      }
    }
  }, [profile, loading, isEarlyBird, planParam, businessId, router]);

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
          type: formData.type,
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

      setBusinessId(data.business.id);
      setBusinessSlug(data.business.slug);
      setStep("done");
      toast.success("Business created! Check your email for details.");
    } catch (err: any) {
      toast.error(err.message || "Failed to create business");
      setStep("form");
    }
  };

  const items = [
    { label: "Select a business type", value: "" },
    { label: "Retail", value: "retail" },
    { label: "Restaurant", value: "restaurant" },
    { label: "Service", value: "service" },
    { label: "Event", value: "event" },
    { label: "Other", value: "other" },
  ];

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // If user is logged in, show nothing (will redirect in useEffect)
  if (profile) {
    return null;
  }

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
            Business Created!
          </h1>
          <p className="text-purple-300 mb-2">
            {isEarlyBird
              ? "Now let's lock in your lifetime price."
              : "Your 14-day free trial is active. No credit card required."}
          </p>
          <Card className="bg-black/50 border-white/10 mt-6">
            <CardContent className="p-4 text-center space-y-3">
              <div>
                <p className="text-white/60 text-sm mb-1">Your public page:</p>
                <p className="text-yellow-400 font-mono text-lg">
                  engagespin.com/{businessSlug}/code-entry
                </p>
              </div>
              {!isEarlyBird && (
                <div>
                  <p className="text-white/60 text-sm mb-1">Your dashboard:</p>
                  <p className="text-purple-400 font-mono text-sm">
                    engagespin.com/admin/{businessSlug}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 mt-6">
            {isEarlyBird ? (
              <Button
                onClick={() =>
                  (window.location.href = `/admin/${businessSlug}/billing?plan=${planParam}&businessId=${businessId}&slug=${businessSlug}`)
                }
                className="gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black"
                size="lg"
              >
                Continue to Payment <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() =>
                  (window.location.href = `/admin/${businessSlug}`)
                }
                className="gap-2"
                size="lg"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
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
          <CardContent className="space-y-4">
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
                  {generateSlug(formData.businessName)}/code-entry
                </p>
              )}
            </div>

            <div>
              <Label className="text-white">Business Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(e) => setFormData((p) => ({ ...p, type: e }))}
              >
                <SelectTrigger className="w-full max-w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Fruits</SelectLabel>
                    {items.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
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
