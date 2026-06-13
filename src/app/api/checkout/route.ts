// app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// PayPal config
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET!;
const PAYPAL_API = "https://api-m.paypal.com"; // or .sandbox for testing

// M-Pesa config
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY!;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET!;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY!;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE!;
const MPESA_API = "https://api.safaricom.co.ke";

interface CheckoutRequest {
  businessId: string;
  plan: string;
  billingCycle: "monthly" | "annual";
  paymentMethod: "mpesa" | "paypal";
  phoneNumber?: string; // For M-Pesa
}

// Get plan price
function getPlanPrice(plan: string, cycle: "monthly" | "annual"): number {
  const prices: Record<string, number> = {
    starter: 29,
    pro: 79,
    enterprise: 199,
  };
  const base = prices[plan] || 29;
  return cycle === "annual" ? Math.round((base * 10) / 12) : base;
}

// ─── PayPal: Create Order ───────────────────────────────
async function createPayPalOrder(
  amount: number,
  plan: string,
  businessId: string,
) {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString(
    "base64",
  );

  const tokenRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const { access_token } = await tokenRes.json();

  const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: amount.toString() },
          description: `Engage ${plan} plan`,
          custom_id: businessId,
        },
      ],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_URL}/admin/billing/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
      },
    }),
  });

  return orderRes.json();
}

// ─── PayPal: Capture Order (webhook) ────────────────────
async function capturePayPalOrder(orderId: string) {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString(
    "base64",
  );

  const tokenRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const { access_token } = await tokenRes.json();

  const captureRes = await fetch(
    `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
    },
  );

  return captureRes.json();
}

// ─── M-Pesa: STK Push ──────────────────────────────────
async function mpesaSTKPush(
  amount: number,
  phoneNumber: string,
  businessId: string,
  plan: string,
) {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.]/g, "")
    .slice(0, 14);
  const password = Buffer.from(
    `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`,
  ).toString("base64");

  // Get access token
  const auth = Buffer.from(
    `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`,
  ).toString("base64");
  const tokenRes = await fetch(
    `${MPESA_API}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${auth}` },
    },
  );
  const { access_token } = await tokenRes.json();

  // Format phone number (2547XXXXXXXX)
  const formattedPhone = phoneNumber
    .replace(/^0/, "254")
    .replace(/^\+254/, "254");

  const stkRes = await fetch(`${MPESA_API}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(amount), // M-Pesa in KES
      PartyA: formattedPhone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/mpesa`,
      AccountReference: `Engage-${plan}`,
      TransactionDesc: `Engage ${plan} subscription`,
    }),
  });

  return stkRes.json();
}

// ─── POST Handler ──────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body: CheckoutRequest = await req.json();
    const amount = getPlanPrice(body.plan, body.billingCycle);

    // Record pending payment
    const { data: payment } = await supabase
      .from("business_payments")
      .insert({
        business_id: body.businessId,
        amount,
        currency: body.paymentMethod === "mpesa" ? "KES" : "USD",
        plan: body.plan,
        billing_cycle: body.billingCycle,
        payment_method: body.paymentMethod,
        status: "pending",
      })
      .select()
      .single();

    if (body.paymentMethod === "paypal") {
      const order = await createPayPalOrder(amount, body.plan, body.businessId);
      return NextResponse.json({
        success: true,
        paymentId: payment?.id,
        paypalOrderId: order.id,
        approvalUrl: order.links?.find((l: any) => l.rel === "approve")?.href,
      });
    }

    if (body.paymentMethod === "mpesa") {
      if (!body.phoneNumber) {
        return NextResponse.json(
          { error: "Phone number required for M-Pesa" },
          { status: 400 },
        );
      }

      // Convert USD to KES (approximate rate, use actual API in production)
      const kesAmount = amount * 130;
      const stkResponse = await mpesaSTKPush(
        kesAmount,
        body.phoneNumber,
        body.businessId,
        body.plan,
      );

      // Store M-Pesa checkout request ID
      if (stkResponse.CheckoutRequestID && payment) {
        await supabase
          .from("business_payments")
          .update({
            transaction_id: stkResponse.CheckoutRequestID,
            metadata: stkResponse,
          })
          .eq("id", payment.id);
      }

      return NextResponse.json({
        success: true,
        paymentId: payment?.id,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        message: "Check your phone for the M-Pesa prompt",
      });
    }

    return NextResponse.json(
      { error: "Invalid payment method" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
