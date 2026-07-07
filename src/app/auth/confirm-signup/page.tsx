// app/auth/confirm-signup/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Phone,
  ArrowRight,
  Mail,
  Sparkles,
  Gift,
  Ticket,
  BadgeCheck,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { motion } from "framer-motion";
import GamingBackground from "@/components/GamingBackground";
import { cn } from "@/lib/utils";

// Simplified phone input using native input with country code
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

type Step =
  | "validating"
  | "email-confirmed"
  | "phone-input"
  | "phone-verify"
  | "complete"
  | "error";

export default function ConfirmSignupPage() {
  const router = useRouter();
  const { supabase } = useAuth();

  const [step, setStep] = useState<Step>("validating");
  const [errorMessage, setErrorMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const processedRef = useRef(false);

  // ─── Step 1: Validate magic link ──────────────────────
  useEffect(() => {
    const handleMagicLink = async () => {
      if (processedRef.current) return;

      try {
        const hash = window.location.hash.substring(1);
        if (!hash) {
          router.push("/");
          return;
        }

        const params = new URLSearchParams(hash);
        const type = params.get("type");
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (type !== "magiclink" || !access_token) {
          throw new Error("Invalid or expired confirmation link");
        }

        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token: refresh_token || "",
        });
        if (sessionError) throw sessionError;

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("User not found");

        setUserEmail(user.email || "");
        setUserName(user.user_metadata?.full_name || "");

        await supabase
          .from("users")
          .update({
            email_verified: true,
            last_login: new Date().toISOString(),
          })
          .eq("id", user.id);

        // Check if phone already verified
        const { data: profile } = await supabase
          .from("users")
          .select("phone, phone_verified")
          .eq("id", user.id)
          .single();

        if (profile?.phone_verified) {
          processedRef.current = true;
          setStep("complete");
          setTimeout(() => router.push("/account"), 2000);
          return;
        }

        processedRef.current = true;
        setStep("email-confirmed");
        toast.success(
          "Email confirmed! Let's secure your account with your phone.",
        );
      } catch (err: any) {
        console.error("Confirmation error:", err);
        setStep("error");
        setErrorMessage(err.message || "Failed to confirm your email");
      }
    };

    handleMagicLink();
  }, [supabase, router]);

  // ─── Complete step ─────────────────────────────────────────
  useEffect(() => {
    if (step === "complete") {
      const pendingCode = sessionStorage.getItem("pendingCodeAfterVerify");
      if (pendingCode) {
        sessionStorage.removeItem("pendingCodeAfterVerify");
        // Redirect to code-entry with the code
        setTimeout(
          () => router.push(`/code-entry?code=${pendingCode}&fromLogin=true`),
          1000,
        );
      }
    }
  }, [step, router]);

  // ─── Send verification code ───────────────────────────
  const handleSendCode = async () => {
    if (!phone || phone.length < 8) {
      setPhoneError("Enter a valid phone number");
      return;
    }

    setPhoneError("");
    setSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Session expired");

      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send code");

      setStep("phone-verify");
      toast.success("Verification code sent!");

      // Start resend cooldown
      setResendCooldown(30);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Verify code ──────────────────────────────────────
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length < 4) {
      setCodeError("Enter the verification code");
      return;
    }

    setCodeError("");
    setSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Session expired");

      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ phone, code: verificationCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");

      setStep("complete");
      toast.success("Account secured! Welcome to Engage!");
      setTimeout(() => router.push("/account"), 2500);
    } catch (err: any) {
      setCodeError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading ──────────────────────────────────────────
  if (step === "validating") {
    return (
      <>
        <GamingBackground />
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center bg-white dark:bg-gray-900/95 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin" />
              </div>
              <CardTitle className="text-gray-900 dark:text-white">
                Verifying Your Email
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Please wait while we confirm your email address...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </>
    );
  }

  // ─── Email Confirmed ──────────────────────────────────
  if (step === "email-confirmed" || step === "phone-input") {
    return (
      <>
        <GamingBackground />
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            {/* Progress */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <StepIndicator icon={CheckCircle} label="Email" active done />
              <StepDivider done />
              <StepIndicator icon={Phone} label="Phone" active />
              <StepDivider />
              <StepIndicator icon={Gift} label="Done" />
            </div>

            <Card className="bg-white dark:bg-gray-900/95 border-gray-200 dark:border-gray-800">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-14 h-14 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-3">
                  <Mail className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-gray-900 dark:text-white text-xl">
                  Email Confirmed!
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  {userEmail}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 pt-4">
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-500/20">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-gray-900 dark:text-white font-medium text-sm">
                        One Account, One Phone
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 leading-relaxed">
                        Your phone number ensures you have{" "}
                        <strong className="text-gray-900 dark:text-white">
                          one unique account
                        </strong>
                        . When you win prizes, businesses know exactly who to
                        contact. We'll never share your number.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-gray-300">
                    Phone Number
                  </Label>
                  <div className="mt-1.5">
                    <PhoneInput
                      international
                      defaultCountry="KE"
                      value={phone}
                      onChange={(value: string) => setPhone(value ?? "")}
                      placeholder="712 345 678"
                      disabled={submitting}
                      className={cn(
                        "w-full px-4 py-2.5 rounded-lg border",
                        "bg-white dark:bg-gray-900/50",
                        "text-gray-900 dark:text-gray-100",
                        "border-gray-200 dark:border-gray-700",
                        "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                        "focus:outline-none focus:ring-2 focus:ring-purple-500/50",
                        "focus:border-transparent",
                        phoneError && "border-red-500 dark:border-red-500",
                      )}
                    />
                  </div>
                  {phoneError ? (
                    <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">
                      {phoneError}
                    </p>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1.5">
                      📱 Your phone number for verification and prize
                      notifications
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleSendCode}
                  disabled={submitting || phone.length < 8}
                  className="w-full h-12 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-base"
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Send Verification Code{" "}
                      <MessageCircle className="h-5 w-5 ml-1" />
                    </>
                  )}
                </Button>

                <p className="text-center text-gray-400 dark:text-gray-500 text-xs">
                  Standard SMS rates may apply. You can change this later.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </>
    );
  }

  // ─── Verify Code ──────────────────────────────────────
  if (step === "phone-verify") {
    return (
      <>
        <GamingBackground />
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="flex items-center justify-center gap-2 mb-8">
              <StepIndicator icon={CheckCircle} label="Email" done />
              <StepDivider done />
              <StepIndicator icon={Phone} label="Phone" active done />
              <StepDivider />
              <StepIndicator icon={Gift} label="Done" />
            </div>

            <Card className="bg-white dark:bg-gray-900/95 border-gray-200 dark:border-gray-800">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-14 h-14 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center mb-3">
                  <MessageCircle className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-gray-900 dark:text-white text-xl">
                  Enter Verification Code
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  We sent a 6-digit code to{" "}
                  <strong className="text-gray-900 dark:text-white">
                    {phone}
                  </strong>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 pt-4">
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">
                    Verification Code
                  </Label>
                  <Input
                    value={verificationCode}
                    onChange={(e) => {
                      setVerificationCode(
                        e.target.value.replace(/\D/g, "").slice(0, 6),
                      );
                      setCodeError("");
                    }}
                    placeholder="000000"
                    className="mt-1.5 bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-2xl text-center tracking-[0.5em] font-mono"
                    maxLength={6}
                    disabled={submitting}
                    autoFocus
                  />
                  {codeError && (
                    <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">
                      {codeError}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleVerifyCode}
                  disabled={submitting || verificationCode.length < 4}
                  className="w-full h-12 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-base"
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Verify & Complete <BadgeCheck className="h-5 w-5 ml-1" />
                    </>
                  )}
                </Button>

                <div className="text-center">
                  {resendCooldown > 0 ? (
                    <p className="text-gray-400 dark:text-gray-500 text-sm">
                      Resend code in{" "}
                      <span className="text-gray-700 dark:text-gray-300">
                        {resendCooldown}s
                      </span>
                    </p>
                  ) : (
                    <button
                      onClick={handleSendCode}
                      className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm flex items-center gap-1 mx-auto"
                    >
                      <RefreshCw className="h-3 w-3" /> Resend code
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </>
    );
  }

  // ─── Complete ─────────────────────────────────────────
  if (step === "complete") {
    return (
      <>
        <GamingBackground />
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="w-full max-w-md text-center"
          >
            <Card className="bg-white dark:bg-gray-900/95 border-purple-200 dark:border-purple-500/30">
              <CardContent className="p-8 space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                >
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                    <BadgeCheck className="w-10 h-10 text-white" />
                  </div>
                </motion.div>

                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    You're All Set!
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Your account is verified and secured.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      icon: Ticket,
                      label: "Enter Codes",
                      color: "text-purple-600 dark:text-purple-400",
                    },
                    {
                      icon: Sparkles,
                      label: "Spin & Win",
                      color: "text-yellow-600 dark:text-yellow-400",
                    },
                    {
                      icon: Gift,
                      label: "Claim Prizes",
                      color: "text-pink-600 dark:text-pink-400",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-gray-100 dark:bg-white/5 text-center"
                    >
                      <item.icon
                        className={`h-5 w-5 mx-auto mb-1 ${item.color}`}
                      />
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>

                <Button
                  asChild
                  className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Link href="/account">
                    Go to Dashboard <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </>
    );
  }

  // ─── Error ────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center bg-white dark:bg-gray-900/95 border-red-200 dark:border-red-500/20">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-gray-900 dark:text-white">
            Confirmation Failed
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            {errorMessage || "The confirmation link is invalid or has expired."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <Button
              asChild
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Link href="/login">Go to Login</Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Link href="/code-entry">Enter a Code Instead</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Helper Components ──────────────────────────────────
function StepIndicator({
  icon: Icon,
  label,
  active,
  done,
}: {
  icon: any;
  label: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          done
            ? "bg-green-500"
            : active
              ? "bg-purple-500 animate-pulse"
              : "bg-gray-200 dark:bg-gray-700"
        }`}
      >
        <Icon
          className={`h-4 w-4 ${
            done || active ? "text-white" : "text-gray-400 dark:text-gray-500"
          }`}
        />
      </div>
      <span
        className={`text-xs hidden sm:inline ${
          done
            ? "text-green-600 dark:text-green-400"
            : active
              ? "text-purple-600 dark:text-purple-400"
              : "text-gray-400 dark:text-gray-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function StepDivider({ done }: { done?: boolean }) {
  return (
    <div
      className={`w-8 h-px ${
        done ? "bg-green-500/50" : "bg-gray-200 dark:bg-gray-700"
      }`}
    />
  );
}
