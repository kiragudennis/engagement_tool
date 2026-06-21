import { getPaystackPlanCode, getPriceKes, PLANS } from "@/lib/config/plans";

const PAYSTACK_API = "https://api.paystack.co";

function paystackHeaders() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

export function getSubscriptionAmountKes(
  plan: string,
  cycle: "monthly" | "annual",
): number {
  const def = PLANS.find((p) => p.id === plan);
  if (!def) return 0;
  return cycle === "annual" ? def.priceKes * 10 : def.priceKes;
}

export async function paystackCreateCustomer(email: string, name: string) {
  const res = await fetch(`${PAYSTACK_API}/customer`, {
    method: "POST",
    headers: paystackHeaders(),
    body: JSON.stringify({ email, first_name: name }),
  });
  return res.json();
}

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

export async function paystackInitializeTransaction(params: {
  email: string;
  amountKes: number;
  plan: string;
  billingCycle: string;
  businessId: string;
  paymentId: string;
  callbackUrl: string;
}) {
  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: "POST",
    headers: paystackHeaders(),
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKes * 100,
      currency: "KES",
      callback_url: params.callbackUrl,
      metadata: {
        business_id: params.businessId,
        plan: params.plan,
        billing_cycle: params.billingCycle,
        payment_id: params.paymentId,
        type: "subscription",
      },
    }),
  });
  return res.json();
}

export function resolvePaystackPlanCode(
  plan: string,
  cycle: "monthly" | "annual",
): string | undefined {
  return getPaystackPlanCode(plan, cycle);
}

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

export async function activateBusinessSubscription(params: {
  businessId: string;
  plan: string;
  billingCycle: "monthly" | "annual";
  paymentMethod: "paystack" | "mpesa" | "paypal";
  paystackCustomerCode?: string;
  paystackSubscriptionCode?: string;
  mpesaPhone?: string;
}) {
  const { supabaseAdmin } = await import("@/lib/supabase/admin");
  const nextBilling = new Date();
  nextBilling.setMonth(
    nextBilling.getMonth() + (params.billingCycle === "annual" ? 12 : 1),
  );

  await supabaseAdmin
    .from("businesses")
    .update({
      plan: params.plan,
      subscription_status: "active",
      payment_method: params.paymentMethod,
      last_payment_at: new Date().toISOString(),
      next_billing_at: nextBilling.toISOString(),
      paystack_customer_code: params.paystackCustomerCode ?? undefined,
      paystack_subscription_code: params.paystackSubscriptionCode ?? undefined,
      mpesa_phone: params.mpesaPhone ?? undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.businessId);
}
