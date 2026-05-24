// app/bundles/[bundleId]/payment-pending/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function PaymentPendingPage() {
  const { bundleId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { supabase } = useAuth();
  const [status, setStatus] = useState<"pending" | "success" | "failed">(
    "pending",
  );
  const [checking, setChecking] = useState(true);
  const orderId = searchParams.get("order");

  useEffect(() => {
    if (!orderId) {
      router.push("/bundles");
      return;
    }

    const checkPaymentStatus = async () => {
      const { data: order } = await supabase
        .from("orders")
        .select("payment_status, status")
        .eq("id", orderId)
        .single();

      if (order) {
        if (order.payment_status === "completed") {
          setStatus("success");
          // Redirect to success page after 3 seconds
          setTimeout(() => {
            router.push(`/bundles/${bundleId}/success?order=${orderId}`);
          }, 3000);
        } else if (order.payment_status === "failed") {
          setStatus("failed");
        }
      }
      setChecking(false);
    };

    // Check every 3 seconds
    const interval = setInterval(checkPaymentStatus, 3000);
    checkPaymentStatus();

    return () => clearInterval(interval);
  }, [orderId, bundleId, router, supabase]);

  if (checking) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Processing Payment</h2>
        <p className="text-muted-foreground">
          Please check your phone and enter your M-Pesa PIN to complete the
          payment.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          This page will update automatically once payment is confirmed.
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Payment Successful!</h2>
        <p className="text-muted-foreground mb-4">
          Redirecting you to your order confirmation...
        </p>
        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Payment Failed</h2>
        <p className="text-muted-foreground mb-4">
          Your payment could not be processed. Please try again.
        </p>
        <Button onClick={() => router.push(`/bundles/${bundleId}`)}>
          Try Again
        </Button>
      </div>
    );
  }

  return null;
}
