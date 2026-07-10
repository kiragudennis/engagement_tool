// src/lib/services/paystack.ts
import {
  PLANS,
  EARLY_ACCESS_PLANS,
  getPaystackPlanCode,
} from "@/lib/config/plans";

const PAYSTACK_API = "https://api.paystack.co";

function paystackHeaders() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

// Get USD amount for subscription plans
export function getSubscriptionAmount(
  plan: string,
  cycle: "monthly" | "annual" | "lifetime",
): number {
  // Check regular plans first
  const regularPlan = PLANS.find((p) => p.id === plan);
  if (regularPlan) {
    return cycle === "annual" ? regularPlan.price * 10 : regularPlan.price;
  }

  // Check early access plans (one-time payment)
  const earlyPlan = EARLY_ACCESS_PLANS.find((p) => p.id === plan);
  if (earlyPlan) {
    return earlyPlan.price;
  }

  return 0;
}

// Get Paystack plan code for subscription plans
export function resolvePaystackPlanCode(
  plan: string,
  cycle: "monthly" | "annual" | "lifetime",
): string | undefined {
  // Early access plans don't have Paystack plan codes
  if (plan.startsWith("early_")) {
    return undefined;
  }
  return getPaystackPlanCode(plan, cycle);
}

// Create Paystack customer
export async function paystackCreateCustomer(email: string, name: string) {
  const res = await fetch(`${PAYSTACK_API}/customer`, {
    method: "POST",
    headers: paystackHeaders(),
    body: JSON.stringify({ email, first_name: name }),
  });
  return res.json();
}

// Create subscription (for recurring billing)
export async function paystackCreateSubscription(
  customerCode: string,
  planCode: string,
) {
  const res = await fetch(`${PAYSTACK_API}/subscription`, {
    method: "POST",
    headers: paystackHeaders(),
    body: JSON.stringify({ customer: customerCode, plan: planCode }),
  });
  return res.json();
}

// Initialize one-time transaction (for lifetime/early bird plans)
export async function paystackInitializeTransaction(params: {
  email: string;
  amount: number;
  plan: string;
  billingCycle: string;
  businessId: string;
  paymentId: string;
  callbackUrl: string;
  isEarlyBird?: boolean;
}) {
  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: "POST",
    headers: paystackHeaders(),
    body: JSON.stringify({
      email: params.email,
      amount: params.amount * 100, // Paystack expects cents
      currency: "USD",
      callback_url: params.callbackUrl,
      metadata: {
        business_id: params.businessId,
        plan: params.plan,
        billing_cycle: params.billingCycle,
        payment_id: params.paymentId,
        type: params.isEarlyBird ? "one_time" : "subscription",
        is_early_bird: params.isEarlyBird ? "true" : "false",
      },
    }),
  });
  return res.json();
}

// Verify webhook signature
export async function verifyPaystackWebhook(
  rawBody: string,
  signature: string | null,
): Promise<boolean> {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false;
  const crypto = await import("crypto");
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}

// Activate business subscription
export async function activateBusinessSubscription(params: {
  businessId: string;
  plan: string;
  billingCycle: "monthly" | "annual" | "lifetime";
  paymentMethod: "paystack" | "mpesa" | "paypal";
  paystackCustomerCode?: string;
  paystackSubscriptionCode?: string;
  mpesaPhone?: string;
}) {
  const { supabaseAdmin } = await import("@/lib/supabase/admin");

  const nextBilling = new Date();
  if (params.billingCycle === "lifetime" || params.plan?.startsWith("early_")) {
    // Set far future date for lifetime plans
    nextBilling.setFullYear(nextBilling.getFullYear() + 100);
  } else {
    nextBilling.setMonth(
      nextBilling.getMonth() + (params.billingCycle === "annual" ? 12 : 1),
    );
  }

  const updateData: any = {
    plan: params.plan,
    subscription_status: "active",
    payment_method: params.paymentMethod,
    last_payment_at: new Date().toISOString(),
    next_billing_at: nextBilling.toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Only update these if provided
  if (params.paystackCustomerCode) {
    updateData.paystack_customer_code = params.paystackCustomerCode;
  }
  if (params.paystackSubscriptionCode) {
    updateData.paystack_subscription_code = params.paystackSubscriptionCode;
  }
  if (params.mpesaPhone) {
    updateData.mpesa_phone = params.mpesaPhone;
  }

  const { data, error } = await supabaseAdmin
    .from("businesses")
    .update(updateData)
    .eq("id", params.businessId);

  return { data, error };
}
