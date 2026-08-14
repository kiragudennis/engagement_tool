// app/(public)/contact/page.tsx
"use client";

import { useState } from "react";
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
import {
  Mail,
  Phone,
  Clock,
  MessageSquare,
  HelpCircle,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Please enter a valid email address"),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const CONTACT_SUBJECTS = [
  { value: "general", label: "General Inquiry" },
  { value: "support", label: "Technical Support" },
  { value: "billing", label: "Billing & Payments" },
  { value: "partnership", label: "Partnership" },
  { value: "feedback", label: "Feedback & Suggestions" },
  { value: "other", label: "Other" },
];

const FAQS = [
  {
    id: "redeem-code",
    question: "How do I redeem my spin or trivia code?",
    answer:
      "Go to the 'Enter Code' page, type in your code, and follow the prompts. You'll be able to spin the wheel or join the trivia session immediately. If a code is invalid or expired, you'll see an error message right away.",
  },
  {
    id: "spin-wheel",
    question: "How does the spin wheel work?",
    answer:
      "Business owners customize prizes and odds for their wheel. Customers enter a code, spin from their phone, and see the result instantly. Winners are notified via SMS and email, and businesses can broadcast the spin live.",
  },
  {
    id: "payments",
    question: "What payment methods do you accept?",
    answer:
      "We accept M-Pesa, Visa, and Mastercard. Most payments go through Paystack, which supports both KES and USD. You can choose your preferred currency at checkout. We also offer direct M-Pesa as a backup option (KES only). Billing is usage-based - you're charged for spins, trivia plays, and draw entries.",
  },
  {
    id: "setup",
    question: "How long does it take to set up?",
    answer:
      "Most businesses are up and running in under 10 minutes. Create an account, customize your first spin wheel or trivia game, and share the code with customers. We have docs and a support team ready to help.",
  },
  {
    id: "customize",
    question: "Can I customize the spin wheel prizes and branding?",
    answer:
      "Yes. You control prizes, odds, colors, and branding. You can also set up sticker systems for in-store codes and connect your POS for automatic code generation.",
  },
  {
    id: "security",
    question: "Is my data secure?",
    answer:
      "Yes. We follow modern security practices to keep your data safe, each business can only access its own information. We use strict access controls so you never see another company's data. For payments, we use Paystack and M-Pesa directly, meaning your card details never pass through our systems.",
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitted(false);

    const parsed = contactSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      const flat = parsed.error.flatten().fieldErrors;
      for (const [key, msgs] of Object.entries(flat)) {
        if (msgs?.length) fieldErrors[key] = msgs[0];
      }
      setErrors(fieldErrors);
      toast.error("Please fix the errors below");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      toast.success("Message sent! We'll get back to you within 24 hours.");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setSubmitted(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send message";
      toast.error(message);
    } finally {
      setLoading(false);
    }
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
              <MessageSquare className="h-7 w-7 text-purple-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Get in{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Touch
              </span>
            </h1>
            <p className="text-lg text-white/60 max-w-xl mx-auto">
              Have a question? Browse our FAQs below or send us a message. We
              usually reply within 24 hours.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left Column - FAQs + Contact Info */}
            <div className="lg:col-span-3 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <HelpCircle className="h-5 w-5 text-purple-400" />
                  <h2 className="text-2xl font-bold text-white">
                    Frequently Asked Questions
                  </h2>
                </div>

                <Card className="bg-white/5 border-white/10">
                  <CardContent>
                    <Accordion
                      type="multiple"
                      className="max-w-lg divide-y divide-white/5"
                      defaultValue={["redeem-code"]}
                    >
                      {FAQS.map((faq) => (
                        <AccordionItem key={faq.id} value={faq.id}>
                          <AccordionTrigger>{faq.question}</AccordionTrigger>
                          <AccordionContent>{faq.answer}</AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>

                <p className="text-white/40 text-sm mt-4">
                  Couldn&apos;t find what you&apos;re looking for? Send us a
                  message and we&apos;ll help.
                </p>
              </motion.div>

              {/* Contact Info Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid sm:grid-cols-2 gap-4"
              >
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 flex-shrink-0">
                      <Mail className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">Email</p>
                      <a
                        href="mailto:support@engagespin.com"
                        className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
                      >
                        support@engagespin.com
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-green-500/10 flex-shrink-0">
                      <Clock className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">
                        Response Time
                      </p>
                      <p className="text-white/60 text-sm">Within 24 hours</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card className="bg-white/5 border-white/10 sticky top-24">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-white mb-1">
                      Send us a message
                    </h2>
                    <p className="text-white/50 text-sm mb-6">
                      Fill out the form and we&apos;ll get back to you shortly.
                    </p>

                    {submitted && (
                      <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-green-400 text-sm font-medium">
                            Message sent successfully
                          </p>
                          <p className="text-green-400/70 text-xs mt-0.5">
                            We&apos;ll reply to support@engagespin.com within 24
                            hours.
                          </p>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label className="text-white/80 text-sm">
                          Full Name
                        </Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => {
                            setFormData((p) => ({
                              ...p,
                              name: e.target.value,
                            }));
                            setErrors((p) => ({ ...p, name: "" }));
                          }}
                          placeholder="Jane Doe"
                          className={cn(
                            "mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/30",
                            errors.name && "border-red-500",
                          )}
                          disabled={loading}
                        />
                        {errors.name && (
                          <p className="text-red-400 text-xs mt-1">
                            {errors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-white/80 text-sm">
                          Email Address
                        </Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => {
                            setFormData((p) => ({
                              ...p,
                              email: e.target.value,
                            }));
                            setErrors((p) => ({ ...p, email: "" }));
                          }}
                          placeholder="you@company.com"
                          className={cn(
                            "mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/30",
                            errors.email && "border-red-500",
                          )}
                          disabled={loading}
                        />
                        {errors.email && (
                          <p className="text-red-400 text-xs mt-1">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-white/80 text-sm">Subject</Label>
                        <Select
                          value={formData.subject}
                          onValueChange={(value) => {
                            setFormData((p) => ({ ...p, subject: value }));
                            setErrors((p) => ({ ...p, subject: "" }));
                          }}
                          disabled={loading}
                        >
                          <SelectTrigger
                            className={cn(
                              "mt-1.5 bg-white/5 border-white/10 text-white",
                              errors.subject && "border-red-500",
                            )}
                          >
                            <SelectValue placeholder="Select a topic" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10">
                            {CONTACT_SUBJECTS.map((subject) => (
                              <SelectItem
                                key={subject.value}
                                value={subject.value}
                                className="text-white focus:bg-white/10"
                              >
                                {subject.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.subject && (
                          <p className="text-red-400 text-xs mt-1">
                            {errors.subject}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-white/80 text-sm">Message</Label>
                        <Textarea
                          value={formData.message}
                          onChange={(e) => {
                            setFormData((p) => ({
                              ...p,
                              message: e.target.value,
                            }));
                            setErrors((p) => ({ ...p, message: "" }));
                          }}
                          placeholder="Tell us how we can help..."
                          rows={5}
                          className={cn(
                            "mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none",
                            errors.message && "border-red-500",
                          )}
                          disabled={loading}
                        />
                        {errors.message && (
                          <p className="text-red-400 text-xs mt-1">
                            {errors.message}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={loading || submitted}
                        className="w-full h-11 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            Send Message
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
