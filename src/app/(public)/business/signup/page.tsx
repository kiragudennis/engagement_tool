// app/(public)/business/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
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
} from "lucide-react";
import { toast } from "sonner";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function BusinessSignupPage() {
  const { supabase, profile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"form" | "creating" | "done">("form");
  const [formData, setFormData] = useState({
    businessName: "",
    adminName: "",
    email: "",
  });
  const [businessSlug, setBusinessSlug] = useState("");

  const handleSubmit = async () => {
    if (!formData.businessName.trim()) {
      toast.error("Business name is required");
      return;
    }

    setStep("creating");

    try {
      const slug = generateSlug(formData.businessName);
      setBusinessSlug(slug);

      // Create business record
      const { data: business, error } = await supabase
        .from("businesses")
        .insert({
          name: formData.businessName,
          slug,
          admin_email: formData.email || profile?.email || "",
          admin_name: formData.adminName || profile?.full_name || "",
          brand_color: "#8B5CF6",
          brand_secondary_color: "#EC4899",
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast.error(
            "This business name is already taken. Try a different one.",
          );
          setStep("form");
          return;
        }
        throw error;
      }

      // Add current user as owner
      if (profile?.id) {
        await supabase.from("business_admins").insert({
          business_id: business.id,
          user_id: profile.id,
          role: "owner",
          accepted_at: new Date().toISOString(),
        });
      }

      // Generate default QR code for the business
      await supabase.from("access_codes").insert({
        business_id: business.id,
        code: `${slug.toUpperCase().replace(/-/g, "")}-QR`,
        type: "qr",
        label: "In-Store QR Code",
        unlocks: "spin",
        max_uses: null,
        max_uses_per_user: 1,
        description: "Default QR code for in-store customers",
      });

      setStep("done");

      toast.success("Business created! Welcome to Engage!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create business");
      setStep("form");
    }
  };

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
            <CardContent className="p-4 text-center">
              <p className="text-white/60 text-sm mb-1">Your public page:</p>
              <p className="text-yellow-400 font-mono text-lg">
                engagespin.com/{businessSlug}/spin
              </p>
            </CardContent>
          </Card>
          <Button
            onClick={() => router.push(`/admin/${businessSlug}`)}
            className="mt-6 gap-2"
            size="lg"
          >
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    );
  }

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
              <Label className="text-white">Your Name</Label>
              <Input
                value={formData.adminName}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, adminName: e.target.value }))
                }
                placeholder={profile?.full_name || "John Doe"}
                className="mt-1 bg-white/5 border-white/10 text-white"
                disabled={step === "creating"}
              />
            </div>
            <div>
              <Label className="text-white">Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, email: e.target.value }))
                }
                placeholder={profile?.email || "you@email.com"}
                className="mt-1 bg-white/5 border-white/10 text-white"
                disabled={step === "creating"}
              />
            </div>

            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <p className="text-sm text-purple-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                14-day free trial · No credit card required
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={step === "creating" || !formData.businessName.trim()}
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
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
