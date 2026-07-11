// app/(admin)/admin/[businessSlug]/billing/manage/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Loader2,
  ArrowLeft,
  CreditCard,
  Smartphone,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Infinity,
  Search,
  RefreshCwIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";

interface SubscriptionData {
  business: {
    plan: string;
    subscription_status: string;
    payment_method: string;
    last_payment_at: string;
    next_billing_at: string;
    paystack_customer_code: string;
    paystack_subscription_code: string;
    mpesa_phone: string;
    past_due_at: string;
    cancelled_at: string;
  };
  paystackSubscription: any;
  paystackCustomer: any;
  payments: any[];
}

export default function SubscriptionManagement() {
  const router = useRouter();
  const { supabase, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [business, setBusiness] = useState<any>(null);
  const [queryingPayment, setQueryingPayment] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const slug = window.location.pathname.split("/")[2];

      const { data: biz } = await supabase
        .from("businesses")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!biz) {
        router.push("/business/signup");
        return;
      }
      setBusiness(biz);

      const res = await fetch(
        `/api/billing/paystack/manage?businessId=${biz.id}`,
      );
      const subscriptionData = await res.json();
      setData(subscriptionData);

      // Auto-check pending M-Pesa payments older than 2 minutes
      const pendingPayments = subscriptionData.payments?.filter(
        (p: any) =>
          p.payment_method === "mpesa" &&
          p.status === "pending" &&
          p.transaction_id &&
          new Date(p.created_at) < new Date(Date.now() - 2 * 60 * 1000), // Older than 2 minutes
      );

      if (pendingPayments?.length > 0) {
        for (const payment of pendingPayments) {
          try {
            const queryRes = await fetch("/api/billing/paystack/manage", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "query_mpesa",
                businessId: biz.id,
                paymentId: payment.id,
              }),
            });

            const queryData = await queryRes.json();

            if (queryData.paymentStatus === "completed") {
              toast.success(
                "Found a completed M-Pesa payment! Your subscription has been updated.",
              );
              // Reload to get fresh data
              const updatedRes = await fetch(
                `/api/billing/paystack/manage?businessId=${biz.id}`,
              );
              const updatedData = await updatedRes.json();
              setData(updatedData);
              break;
            }
          } catch (err) {
            console.error("Auto-query failed for payment:", payment.id, err);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load subscription data:", error);
      toast.error("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    if (!business || !profile) return;
    setActionLoading(action);

    try {
      const res = await fetch("/api/billing/paystack/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          businessId: business.id,
          email: profile.email,
          fullName: profile.full_name || profile.email,
          plan: data?.business.plan,
          billingCycle: "monthly",
        }),
      });

      const result = await res.json();

      if (result.success) {
        if (result.authorizationUrl) {
          window.location.href = result.authorizationUrl;
          return;
        }
        toast.success(result.message || "Action completed successfully");
        loadData(); // Refresh data
      } else {
        toast.error(result.error || "Action failed");
      }
    } catch (error) {
      toast.error("Failed to perform action");
    } finally {
      setActionLoading(null);
    }
  };

  const handleQueryMpesaPayment = async (paymentId: string) => {
    if (!business) return;
    setQueryingPayment(paymentId);

    try {
      const res = await fetch("/api/billing/paystack/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "query_mpesa",
          businessId: business.id,
          paymentId,
        }),
      });

      const result = await res.json();

      if (result.success) {
        if (result.paymentStatus === "completed") {
          toast.success(result.message || "Payment verified successfully!");
        } else if (result.paymentStatus === "failed") {
          toast.error(result.message || "Payment failed");
        } else {
          toast.info(result.message || "Payment still pending");
        }
      } else {
        toast.error(result.error || "Query failed");
      }

      loadData(); // Refresh data
    } catch (error) {
      toast.error("Failed to query payment status");
    } finally {
      setQueryingPayment(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!data) return null;

  const { business: sub } = data;
  const isLifetime =
    sub.subscription_status === "lifetime" || sub.plan?.startsWith("early_");
  const isPastDue = sub.subscription_status === "past_due";
  const isCancelled = sub.subscription_status === "cancelled";
  const isActive = sub.subscription_status === "active";
  const isPaystack = sub.payment_method === "paystack";
  const isMpesa = sub.payment_method === "mpesa";

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/${business?.slug}/billing`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">
                Manage Subscription
              </h1>
              <p className="text-white/40 text-sm">{business?.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        {/* Status Alert */}
        {isPastDue && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div>
                    <h3 className="text-red-400 font-semibold">
                      Payment Past Due
                    </h3>
                    <p className="text-red-300/70 text-sm mt-1">
                      Your last payment failed. Please update your payment
                      method to restore access.
                      {sub.past_due_at && (
                        <span className="block mt-1">
                          Past due since:{" "}
                          {format(new Date(sub.past_due_at), "MMM d, yyyy")}
                        </span>
                      )}
                    </p>
                    <Button
                      onClick={() => handleAction("retry_payment")}
                      disabled={actionLoading === "retry_payment"}
                      className="mt-3 gap-2"
                      size="sm"
                    >
                      {actionLoading === "retry_payment" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Retry Payment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {isCancelled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-yellow-500/10 border-yellow-500/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div>
                    <h3 className="text-yellow-400 font-semibold">
                      Subscription Cancelled
                    </h3>
                    <p className="text-yellow-300/70 text-sm mt-1">
                      Your subscription has been cancelled. Reactivate to
                      restore access.
                      {sub.cancelled_at && (
                        <span className="block mt-1">
                          Cancelled:{" "}
                          {format(new Date(sub.cancelled_at), "MMM d, yyyy")}
                        </span>
                      )}
                    </p>
                    <Button
                      onClick={() => handleAction("reactivate")}
                      disabled={actionLoading === "reactivate"}
                      className="mt-3 gap-2"
                      size="sm"
                    >
                      {actionLoading === "reactivate" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Reactivate Subscription
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Subscription Overview */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Subscription Overview
            </h2>

            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-white/60">Status</span>
                <Badge
                  className={cn(
                    isActive && "bg-green-500/20 text-green-400",
                    isPastDue && "bg-red-500/20 text-red-400",
                    isCancelled && "bg-yellow-500/20 text-yellow-400",
                    isLifetime && "bg-amber-500/20 text-amber-400",
                  )}
                >
                  {isLifetime && <Infinity className="h-3 w-3 mr-1" />}
                  {sub.subscription_status}
                </Badge>
              </div>

              {/* Plan */}
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-white/60">Current Plan</span>
                <span className="text-white font-medium capitalize">
                  {sub.plan}
                </span>
              </div>

              {/* Payment Method */}
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-white/60">Payment Method</span>
                <div className="flex items-center gap-2">
                  {isPaystack ? (
                    <CreditCard className="h-4 w-4 text-purple-400" />
                  ) : (
                    <Smartphone className="h-4 w-4 text-green-400" />
                  )}
                  <span className="text-white">
                    {isPaystack ? "Card / Paystack" : "M-Pesa"}
                  </span>
                </div>
              </div>

              {/* Last Payment */}
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-white/60">Last Payment</span>
                <span className="text-white">
                  {sub.last_payment_at
                    ? format(new Date(sub.last_payment_at), "MMM d, yyyy")
                    : "N/A"}
                </span>
              </div>

              {/* Next Billing */}
              {!isLifetime && (
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-white/60">Next Billing</span>
                  <span className="text-white">
                    {sub.next_billing_at
                      ? format(new Date(sub.next_billing_at), "MMM d, yyyy")
                      : "N/A"}
                  </span>
                </div>
              )}

              {/* Paystack Customer Code (if available) */}
              {sub.paystack_customer_code && (
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-white/60">Customer Code</span>
                  <span className="text-white/40 text-sm font-mono">
                    {sub.paystack_customer_code}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Paystack Subscription Details */}
        {data.paystackSubscription && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Paystack Subscription Details
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-white/60">Status</span>
                  <Badge
                    className={
                      data.paystackSubscription.status === "active"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }
                  >
                    {data.paystackSubscription.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-white/60">Next Payment Date</span>
                  <span className="text-white">
                    {data.paystackSubscription.next_payment_date
                      ? format(
                          new Date(data.paystackSubscription.next_payment_date),
                          "MMM d, yyyy",
                        )
                      : "N/A"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-white/60">Amount</span>
                  <span className="text-white">
                    $
                    {((data.paystackSubscription.amount || 0) / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isLifetime && isActive && (
            <Button
              onClick={() => handleAction("cancel")}
              disabled={actionLoading === "cancel"}
              variant="destructive"
              className="w-full"
            >
              {actionLoading === "cancel" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Cancel Subscription
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => router.push(`/admin/${business?.slug}/billing`)}
            className="w-full"
          >
            Change Plan
          </Button>
        </div>

        {/* Payment History */}
        {/* Payment History */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Payment History
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadData}
                className="text-white/40 hover:text-white/60"
              >
                <RefreshCwIcon className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>

            {data.payments.length === 0 ? (
              <p className="text-white/40 text-sm">No payment history</p>
            ) : (
              <div className="space-y-3">
                {data.payments.map((payment: any) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white text-sm">
                          ${payment.amount} {payment.currency}
                        </p>
                        {payment.payment_method === "mpesa" && (
                          <Smartphone className="h-3 w-3 text-green-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-white/40 text-xs">
                          {format(
                            new Date(payment.created_at),
                            "MMM d, yyyy 'at' h:mm a",
                          )}
                        </p>
                        {payment.metadata?.mpesa_receipt && (
                          <Badge className="bg-green-500/10 text-green-400 text-xs">
                            Receipt: {payment.metadata.mpesa_receipt}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge
                          className={cn(
                            payment.status === "completed" &&
                              "bg-green-500/20 text-green-400",
                            payment.status === "pending" &&
                              "bg-yellow-500/20 text-yellow-400",
                            payment.status === "failed" &&
                              "bg-red-500/20 text-red-400",
                          )}
                        >
                          {payment.status}
                        </Badge>
                        <p className="text-white/40 text-xs mt-1 capitalize">
                          {payment.payment_method}
                        </p>
                      </div>

                      {/* Query button for pending M-Pesa payments */}
                      {payment.payment_method === "mpesa" &&
                        payment.status === "pending" &&
                        payment.transaction_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQueryMpesaPayment(payment.id)}
                            disabled={queryingPayment === payment.id}
                            className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                            title="Check payment status"
                          >
                            {queryingPayment === payment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Help text for M-Pesa users */}
            {data.payments.some(
              (p: any) =>
                p.payment_method === "mpesa" && p.status === "pending",
            ) && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                <p className="text-yellow-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" />
                  Have a pending M-Pesa payment? Click the search icon to check
                  if it was completed. This queries Safaricom directly for the
                  latest status.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
