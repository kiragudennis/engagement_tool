// app/(public)/about/consultation/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  ArrowRight,
  Loader2,
  Shield,
  Clock,
  Headphones,
  FileCode,
  Settings,
  HelpCircle,
  Mail,
  Users,
  Search,
  XCircle,
} from "lucide-react";
import { DateTimeInput } from "@/components/ui/date-input";
import { cn } from "@/lib/utils";
import {
  CONSULTATION_SERVICES,
  CONSULTATION_FAQS,
  formatKes,
} from "@/lib/config/consultation-services";

type BookingStatus = "idle" | "submitting" | "processing" | "success" | "error";

const bookingSchema = z.object({
  serviceId: z.string().min(1, "Please select a service"),
  paymentMethod: z.enum(["paystack", "mpesa"]),
  businessName: z.string().optional(),
  contactName: z.string().min(2, "Name is required"),
  email: z.email("Please enter a valid email"),
  phone: z.string().min(1, "Phone is required"),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

type ConsultationStage = {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  current: boolean;
  timestamp?: string;
};

type TrackedBooking = {
  id: string;
  serviceName: string;
  serviceDuration: string;
  contactName: string;
  email: string;
  phone: string;
  preferredDate: string | null;
  preferredTime: string | null;
  amountPaid: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentReference: string | null;
  status: string;
  assignedTo: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  stages: ConsultationStage[];
};

export default function ConsultationPage() {
  const [selectedService, setSelectedService] = useState<string>("");
  const [formData, setFormData] = useState<BookingFormData>({
    serviceId: "",
    paymentMethod: "paystack",
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    preferredDate: "",
    preferredTime: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<BookingStatus>("idle");
  const [authorizationUrl, setAuthorizationUrl] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [submittedBookingId, setSubmittedBookingId] = useState<string>("");

  const [trackingReference, setTrackingReference] = useState<string>("");
  const [trackedBooking, setTrackedBooking] = useState<TrackedBooking | null>(
    null,
  );
  const [isTracking, setIsTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string>("");
  const [verificationMessage, setVerificationMessage] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(false);

  const popupRef = useRef<Window | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchBookingStatus = useCallback(async (ref: string) => {
    try {
      const res = await fetch(
        `/api/consultation/status?reference=${encodeURIComponent(ref)}`,
      );
      const data = await res.json();
      if (data.success && data.booking) {
        setTrackedBooking(data.booking);
      }
    } catch {
      // silent
    }
  }, []);

  const verifyAndTrack = useCallback(
    async (ref: string) => {
      try {
        const res = await fetch(
          `/api/consultation/verify?reference=${encodeURIComponent(ref)}`,
        );
        const data = await res.json();
        if (data.success && data.booking) {
          await fetchBookingStatus(ref);
        }
      } catch {
        // silent
      }
    },
    [fetchBookingStatus],
  );

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get("status");
    const refParam = urlParams.get("reference");
    const bookingParam = urlParams.get("booking");

    if (statusParam === "success" && refParam) {
      setStatus("success");
      setReference(refParam);
      if (bookingParam) {
        setSubmittedBookingId(bookingParam);
      }
      verifyAndTrack(refParam);
    }
  }, [verifyAndTrack]);

  useEffect(() => {
    if (status === "success" && reference) {
      const interval = setInterval(() => {
        fetchBookingStatus(reference);
      }, 15000);

      pollIntervalRef.current = interval;

      return () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      };
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [status, reference, fetchBookingStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setStatus("submitting");

    const parsed = bookingSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      const flat = parsed.error.flatten().fieldErrors;
      for (const [key, msgs] of Object.entries(flat)) {
        if (msgs?.length) fieldErrors[key] = msgs[0];
      }
      setErrors(fieldErrors);
      setStatus("idle");
      return;
    }

    try {
      const res = await fetch("/api/consultation/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to initialize booking");

      if (parsed.data.paymentMethod === "mpesa") {
        setSubmittedBookingId(data.bookingId);
        setStatus("processing");
        toast.success(
          "M-Pesa prompt sent! Check your phone to complete payment.",
        );

        setTimeout(async () => {
          try {
            const verifyRes = await fetch(
              `/api/consultation/verify?transactionId=${encodeURIComponent(data.transactionId)}`,
            );
            const verifyData = await verifyRes.json();
            if (
              verifyData.success &&
              verifyData.paymentStatus === "completed"
            ) {
              setStatus("success");
              setReference(verifyData.receipt || data.transactionId);
              toast.success("M-Pesa payment confirmed!");
            }
          } catch {
            // silent
          }
        }, 30000);

        return;
      }

      setAuthorizationUrl(data.authorizationUrl);
      setReference(data.reference);
      setSubmittedBookingId(data.bookingId);
      setStatus("processing");

      const popup = window.open(
        data.authorizationUrl,
        "paystack-checkout",
        "width=600,height=700,top=100,left=100",
      );

      popupRef.current = popup || null;

      if (!popup) {
        window.location.href = data.authorizationUrl;
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
      setStatus("error");
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingError("");
    setTrackedBooking(null);
    setVerificationMessage("");
    setIsTracking(true);

    try {
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          trackingReference.trim(),
        );

      const endpoint = isUUID
        ? `/api/consultation/status?bookingId=${encodeURIComponent(trackingReference.trim())}`
        : `/api/consultation/status?reference=${encodeURIComponent(trackingReference.trim())}`;

      const res = await fetch(endpoint);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Booking not found");
      }

      setTrackedBooking(data.booking);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to track booking";
      setTrackingError(message);
    } finally {
      setIsTracking(false);
    }
  };

  const handleVerify = async () => {
    setTrackingError("");
    setVerificationMessage("");
    setIsVerifying(true);

    try {
      const trimmed = trackingReference.trim();
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          trimmed,
        );

      let endpoint: string;
      if (isUUID) {
        endpoint = `/api/consultation/verify?transactionId=${encodeURIComponent(trimmed)}`;
      } else {
        endpoint = `/api/consultation/verify?reference=${encodeURIComponent(trimmed)}`;
      }

      const res = await fetch(endpoint);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Verification failed");
      }

      setVerificationMessage(
        data.message || `Payment status: ${data.paymentStatus}`,
      );

      if (data.booking) {
        setTrackedBooking((prev) =>
          prev
            ? {
                ...prev,
                paymentStatus:
                  data.booking.payment_status || prev.paymentStatus,
                paymentReference:
                  data.booking.payment_reference || prev.paymentReference,
                stages: prev.stages,
              }
            : null,
        );
      }

      if (data.paymentStatus === "completed") {
        toast.success("Payment verified successfully!");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to verify payment";
      setTrackingError(message);
    } finally {
      setIsVerifying(false);
    }
  };

  const resetTracking = () => {
    setTrackedBooking(null);
    setTrackingError("");
    setTrackingReference("");
  };

  const service = CONSULTATION_SERVICES.find((s) => s.id === selectedService);

  const renderProgressStepper = (stages: ConsultationStage[]) => {
    const activeStage = stages.find((s) => s.current);
    const completedCount = stages.filter((s) => s.completed).length;

    return (
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          {stages.map((stage, i) => (
            <div key={stage.id} className="flex flex-col items-center flex-1">
              <div className="relative flex items-center w-full">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all z-10",
                    stage.completed
                      ? "bg-green-500 border-green-500 text-white"
                      : stage.current
                        ? "bg-purple-500 border-purple-500 text-white"
                        : "bg-slate-900 border-white/10 text-white/30",
                  )}
                >
                  {stage.completed ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : stage.current ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>
                {i < stages.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 mx-1",
                      stage.completed ? "bg-green-500" : "bg-white/10",
                    )}
                  />
                )}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={cn(
                    "text-xs font-medium",
                    stage.completed || stage.current
                      ? "text-white"
                      : "text-white/40",
                  )}
                >
                  {stage.label}
                </p>
                {stage.timestamp && (
                  <p className="text-[10px] text-white/30 mt-0.5">
                    {new Date(stage.timestamp).toLocaleDateString("en-KE", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-white/60 text-xs">
            {activeStage ? (
              <>
                <span className="text-purple-400 font-medium">Current: </span>
                {activeStage.label} — {activeStage.description}
              </>
            ) : completedCount === stages.length ? (
              <>
                <span className="text-green-400 font-medium">
                  All stages completed!
                </span>{" "}
                Your consultation has been fully processed.
              </>
            ) : (
              "Waiting for payment confirmation..."
            )}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950">
      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-6">
              <Settings className="h-7 w-7 text-purple-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Professional{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Consultation
              </span>
            </h1>
            <p className="text-sm text-white/60 max-w-2xl mx-auto leading-relaxed">
              Stop guessing. Get a professional assigned to your business to set
              up winning game tactics, integrate APIs, and customize the
              platform to your exact needs. Payment is processed instantly; the
              professional is paid immediately as a third-party contractor.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Service Tiers */}
      <section className="pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-6">
            {CONSULTATION_SERVICES.map((tier, i) => {
              const Icon = tier.icon;
              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative"
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <Card
                    className={cn(
                      "h-full border transition-all hover:scale-[1.02] duration-300 flex flex-col cursor-pointer",
                      selectedService === tier.id
                        ? "border-purple-500/50 bg-purple-500/5"
                        : "border-white/10 bg-white/5 hover:border-white/20",
                    )}
                    onClick={() => {
                      setSelectedService(tier.id);
                      setFormData((p) => ({ ...p, serviceId: tier.id }));
                      setErrors((p) => ({ ...p, serviceId: "" }));
                    }}
                  >
                    <CardContent className="p-6 flex flex-col h-full">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                        )}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {tier.name}
                      </h3>
                      <p className="text-white/40 text-sm mb-4">
                        {tier.duration}
                      </p>
                      <div className="text-3xl font-bold text-white mb-2">
                        {formatKes(tier.priceKes)}
                      </div>
                      <p className="text-white/50 text-sm mb-4">
                        {tier.description}
                      </p>
                      <ul className="space-y-2 flex-1">
                        {tier.features.slice(0, 4).map((feature, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-white/60 text-sm">
                              {feature}
                            </span>
                          </li>
                        ))}
                        {tier.features.length > 4 && (
                          <li className="text-white/40 text-sm pl-6">
                            +{tier.features.length - 4} more
                          </li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section className="pb-20 px-4" id="booking">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Headphones className="h-5 w-5 text-purple-400" />
                  <h2 className="text-2xl font-bold text-white">
                    Book a Consultation
                  </h2>
                </div>

                {status === "success" && (
                  <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-green-400 text-sm font-medium">
                        Booking confirmed!
                      </p>
                      <p className="text-green-400/70 text-xs mt-0.5">
                        Payment received. Our team will assign a professional
                        and contact you within 4 business hours.
                      </p>
                      {reference && (
                        <p className="text-green-400/50 text-xs mt-1">
                          Reference: {reference}
                        </p>
                      )}
                      {submittedBookingId && (
                        <p className="text-green-400/50 text-xs mt-0.5">
                          Booking ID: {submittedBookingId}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {status === "processing" &&
                  formData.paymentMethod === "mpesa" && (
                    <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                      <Loader2 className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5 animate-spin" />
                      <div>
                        <p className="text-blue-400 text-sm font-medium">
                          M-Pesa prompt sent!
                        </p>
                        <p className="text-blue-400/70 text-xs mt-0.5">
                          Please check your phone ({formData.phone}) and enter
                          your M-Pesa PIN to complete payment.
                        </p>
                        {submittedBookingId && (
                          <p className="text-blue-400/50 text-xs mt-1">
                            Booking ID: {submittedBookingId}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                {status === "processing" &&
                  formData.paymentMethod === "paystack" &&
                  !authorizationUrl && (
                    <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                      <Loader2 className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5 animate-spin" />
                      <div>
                        <p className="text-blue-400 text-sm font-medium">
                          Processing your booking...
                        </p>
                        <p className="text-blue-400/70 text-xs mt-0.5">
                          Please complete payment in the popup window.
                        </p>
                      </div>
                    </div>
                  )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/80 text-sm">
                        Select Service *
                      </Label>
                      <Select
                        value={formData.serviceId}
                        onValueChange={(value) => {
                          setFormData((p) => ({ ...p, serviceId: value }));
                          setSelectedService(value);
                          setErrors((p) => ({ ...p, serviceId: "" }));
                        }}
                        disabled={
                          status === "processing" || status === "success"
                        }
                      >
                        <SelectTrigger
                          className={cn(
                            "mt-1.5 bg-white/5 border-white/10 text-white",
                            errors.serviceId && "border-red-500",
                          )}
                        >
                          <SelectValue placeholder="Choose a consultation tier" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          {CONSULTATION_SERVICES.map((svc) => (
                            <SelectItem
                              key={svc.id}
                              value={svc.id}
                              className="text-white focus:bg-white/10"
                            >
                              {svc.name} - {formatKes(svc.priceKes)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.serviceId && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.serviceId}
                        </p>
                      )}
                      {service && (
                        <p className="text-white/40 text-xs mt-1 truncate">
                          {service.duration} • {service.description}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-white/80 text-sm">
                        Payment Method *
                      </Label>
                      <Select
                        value={formData.paymentMethod}
                        onValueChange={(value: "paystack" | "mpesa") => {
                          setFormData((p) => ({ ...p, paymentMethod: value }));
                          setErrors((p) => ({ ...p, paymentMethod: "" }));
                        }}
                        disabled={
                          status === "processing" || status === "success"
                        }
                      >
                        <SelectTrigger
                          className={cn(
                            "mt-1.5 bg-white/5 border-white/10 text-white",
                            errors.paymentMethod && "border-red-500",
                          )}
                        >
                          <SelectValue placeholder="Choose a payment method" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          <SelectItem
                            value="paystack"
                            className="text-white focus:bg-white/10"
                          >
                            Paystack (Card, USSD, Bank Transfer)
                          </SelectItem>
                          <SelectItem
                            value="mpesa"
                            className="text-white focus:bg-white/10"
                          >
                            M-Pesa (Safaricom)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.paymentMethod && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.paymentMethod}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/80 text-sm">
                        Business Name
                      </Label>
                      <Input
                        value={formData.businessName}
                        onChange={(e) => {
                          setFormData((p) => ({
                            ...p,
                            businessName: e.target.value,
                          }));
                        }}
                        placeholder="Your Business Ltd"
                        className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        disabled={
                          status === "processing" || status === "success"
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-white/80 text-sm">
                        Contact Name *
                      </Label>
                      <Input
                        value={formData.contactName}
                        onChange={(e) => {
                          setFormData((p) => ({
                            ...p,
                            contactName: e.target.value,
                          }));
                          setErrors((p) => ({ ...p, contactName: "" }));
                        }}
                        placeholder="Jane Doe"
                        className={cn(
                          "mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/30",
                          errors.contactName && "border-red-500",
                        )}
                        disabled={
                          status === "processing" || status === "success"
                        }
                      />
                      {errors.contactName && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.contactName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/80 text-sm">
                        Email Address *
                      </Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData((p) => ({ ...p, email: e.target.value }));
                          setErrors((p) => ({ ...p, email: "" }));
                        }}
                        placeholder="you@company.com"
                        className={cn(
                          "mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/30",
                          errors.email && "border-red-500",
                        )}
                        disabled={
                          status === "processing" || status === "success"
                        }
                      />
                      {errors.email && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-white/80 text-sm">
                        Phone Number *
                      </Label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData((p) => ({ ...p, phone: e.target.value }));
                          setErrors((p) => ({ ...p, phone: "" }));
                        }}
                        placeholder="+254 700 000000"
                        className={cn(
                          "mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/30",
                          errors.phone && "border-red-500",
                        )}
                        disabled={
                          status === "processing" || status === "success"
                        }
                      />
                      {errors.phone && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/80 text-sm">
                        Preferred Date
                      </Label>
                      <DateTimeInput
                        value={formData.preferredDate || ""}
                        onChange={(value) => {
                          setFormData((p) => ({
                            ...p,
                            preferredDate: value,
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-white/80 text-sm">
                        Preferred Time
                      </Label>
                      <Input
                        type="time"
                        value={formData.preferredTime}
                        onChange={(e) => {
                          setFormData((p) => ({
                            ...p,
                            preferredTime: e.target.value,
                          }));
                        }}
                        className="mt-1.5 bg-white/5 border-white/10 text-white"
                        disabled={
                          status === "processing" || status === "success"
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-white/80 text-sm">
                      Project Details / Notes
                    </Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => {
                        setFormData((p) => ({ ...p, notes: e.target.value }));
                      }}
                      placeholder="Describe your business, existing tech stack, and what you want to achieve..."
                      rows={4}
                      className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                      disabled={status === "processing" || status === "success"}
                    />
                  </div>

                  {service && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white/60 text-sm">
                            Selected:{" "}
                            <span className="text-white font-medium">
                              {service.name}
                            </span>
                          </p>
                          <p className="text-white/40 text-xs">
                            {service.duration}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold text-lg">
                            {formatKes(service.priceKes)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={
                      status === "submitting" ||
                      status === "processing" ||
                      status === "success"
                    }
                    className="w-full h-12 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-base"
                  >
                    {status === "submitting" || status === "processing" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Proceed to Payment
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>

                  <p className="text-white/30 text-xs text-center">
                    Payment is secured by Paystack or M-Pesa. You will be
                    redirected or prompted to complete payment.
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Tracking Section */}
      <section className="border-t border-white/5 py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-2 mb-8">
            <Search className="h-5 w-5 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">
              Track Your Consultation
            </h2>
          </div>

          <Card className="bg-white/5 border-white/10 mb-8">
            <CardContent>
              <p className="text-white/60 text-sm mb-2">
                Enter your booking reference or booking ID to{" "}
                <strong className="text-white">track</strong>&nbsp;the status
                and progress of your consultation.
              </p>
              <p className="text-white/60 text-xs mb-4">
                To <strong className="text-white">verify</strong>&nbsp;a booking
                payment, use payment reference, transaction ID or receipt
                number.
              </p>
              <form onSubmit={handleTrack} className="flex gap-3">
                <Input
                  value={trackingReference}
                  onChange={(e) => setTrackingReference(e.target.value)}
                  placeholder="e.g. REF_ABC123 or booking UUID"
                  className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
                <Button
                  type="submit"
                  disabled={isTracking || !trackingReference.trim()}
                  className="bg-purple-600 hover:bg-purple-500 text-white"
                >
                  {isTracking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Track
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleVerify}
                  disabled={isVerifying || !trackingReference.trim()}
                  className="bg-green-600 hover:bg-green-500 text-white"
                >
                  {isVerifying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
              </form>
              {trackingError && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-xs">{trackingError}</p>
                </div>
              )}
              {verificationMessage && (
                <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-green-400 text-xs">
                    {verificationMessage}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {trackedBooking && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {trackedBooking.serviceName}
                      </h3>
                      <p className="text-white/40 text-xs">
                        {trackedBooking.serviceDuration}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-lg">
                        {formatKes(trackedBooking.amountPaid)}
                      </p>
                      <Badge
                        className={cn(
                          "mt-1",
                          trackedBooking.paymentStatus === "paid"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : trackedBooking.paymentStatus === "failed"
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                        )}
                      >
                        {trackedBooking.paymentStatus}
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-white/80 text-sm font-medium mb-3">
                      Progress
                    </h4>
                    {renderProgressStepper(trackedBooking.stages)}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-white/40 text-xs mb-1">Contact</p>
                      <p className="text-white text-sm">
                        {trackedBooking.contactName}
                      </p>
                      <p className="text-white/50 text-xs">
                        {trackedBooking.email}
                      </p>
                      <p className="text-white/50 text-xs">
                        {trackedBooking.phone}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-white/40 text-xs mb-1">
                        Booking Details
                      </p>
                      <p className="text-white text-sm">
                        Reference:{" "}
                        <span className="text-white/70">
                          {trackedBooking.paymentReference || "Pending"}
                        </span>
                      </p>
                      {trackedBooking.preferredDate && (
                        <p className="text-white/50 text-xs">
                          Preferred: {trackedBooking.preferredDate} at{" "}
                          {trackedBooking.preferredTime || "any time"}
                        </p>
                      )}
                      {trackedBooking.assignedTo && (
                        <p className="text-white/50 text-xs">
                          Assigned to: {trackedBooking.assignedTo}
                        </p>
                      )}
                    </div>
                  </div>

                  {trackedBooking.notes && (
                    <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-white/40 text-xs mb-1">Notes</p>
                      <p className="text-white/60 text-sm whitespace-pre-wrap">
                        {trackedBooking.notes}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetTracking}
                      className="text-white/50 hover:text-white hover:bg-white/10"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-white/5 py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Choose a Service",
                desc: "Pick the tier that fits your needs, from strategy to full custom build.",
                icon: Settings,
              },
              {
                step: "2",
                title: "Book & Pay",
                desc: "Fill in your details and pay securely via Paystack or M-Pesa.",
                icon: Shield,
              },
              {
                step: "3",
                title: "Get Assigned",
                desc: "We match you with the right professional within 4 business hours.",
                icon: Users,
              },
              {
                step: "4",
                title: "Deliver & Own",
                desc: "The professional delivers the work. You get full handover and documentation.",
                icon: CheckCircle2,
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="text-white/30 text-sm font-medium mb-2">
                    Step {item.step}
                  </div>
                  <h3 className="text-white font-semibold mb-2">
                    {item.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="border-t border-white/5 py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                label: "Secure Payment",
                desc: "Paystack / M-Pesa",
              },
              { icon: Clock, label: "Fast Assignment", desc: "Within 4 hours" },
              {
                icon: FileCode,
                label: "Source Code",
                desc: "You own the deliverable",
              },
              {
                icon: Headphones,
                label: "Post-Launch Support",
                desc: "2-30 days included",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="text-center p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <Icon className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-white font-medium text-sm">{item.label}</p>
                  <p className="text-white/40 text-xs">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-white/5 py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-2 mb-8">
            <HelpCircle className="h-5 w-5 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">
              Frequently Asked Questions
            </h2>
          </div>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-0">
              <Accordion type="multiple" className="divide-y divide-white/5">
                {CONSULTATION_FAQS.map((faq) => (
                  <AccordionItem key={faq.question} value={faq.question}>
                    <AccordionTrigger className="px-6 text-white hover:text-purple-300 transition-colors">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-6 text-white/60 leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to build something custom?
          </h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto">
            Whether you need a strategy session or a full custom build, our
            professionals are ready to help you win.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              asChild
            >
              <a href="#booking">
                Get Started <ArrowRight className="h-5 w-5 ml-2" />
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/10 text-white"
              asChild
            >
              <a href="mailto:support@engagespin.com">
                <Mail className="h-5 w-5 mr-2" />
                Email Us
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
