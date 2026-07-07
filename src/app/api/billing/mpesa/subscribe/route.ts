// app/api/billing/mpesa/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireBusinessAdmin } from "@/lib/auth/server";
import {
  activateBusinessSubscription,
  getSubscriptionAmountKes,
} from "@/lib/services/paystack";

const MPESA_API = "https://api.safaricom.co.ke";

const schema = z.object({
  businessId: z.string().uuid(),
  plan: z.enum(["starter", "pro", "enterprise"]),
  billingCycle: z.enum(["monthly", "annual"]),
  phoneNumber: z.string().min(9),
});

async function mpesaSTKPush(
  amountKes: number,
  phoneNumber: string,
  paymentId: string,
  plan: string,
) {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.]/g, "")
    .slice(0, 14);
  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`,
  ).toString("base64");

  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`,
  ).toString("base64");

  const tokenRes = await fetch(
    `${MPESA_API}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } },
  );
  const { access_token } = await tokenRes.json();

  const formattedPhone = phoneNumber
    .replace(/\s/g, "")
    .replace(/^0/, "254")
    .replace(/^\+/, "");

  const stkRes = await fetch(`${MPESA_API}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(amountKes),
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/mpesa/subscription`,
      AccountReference: `ENGAGE-${plan}`,
      TransactionDesc: `Engage ${plan} subscription`,
    }),
  });

  return { response: await stkRes.json(), formattedPhone };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { businessId, plan, billingCycle, phoneNumber } = parsed.data;

    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select("slug")
      .eq("id", businessId)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    const auth = await requireBusinessAdmin(business.slug);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const amountKes = getSubscriptionAmountKes(plan, billingCycle);

    const { data: payment } = await supabaseAdmin
      .from("business_payments")
      .insert({
        business_id: businessId,
        amount: amountKes,
        currency: "KES",
        plan,
        billing_cycle: billingCycle,
        payment_method: "mpesa",
        status: "pending",
        metadata: { phone: phoneNumber },
      })
      .select()
      .single();

    const { response: stkResponse, formattedPhone } = await mpesaSTKPush(
      amountKes,
      phoneNumber,
      payment!.id,
      plan,
    );

    if (stkResponse.CheckoutRequestID) {
      await supabaseAdmin
        .from("business_payments")
        .update({
          transaction_id: stkResponse.CheckoutRequestID,
          metadata: {
            ...stkResponse,
            phone: formattedPhone,
            payment_id: payment!.id,
          },
        })
        .eq("id", payment!.id);

      await supabaseAdmin
        .from("businesses")
        .update({ mpesa_phone: formattedPhone })
        .eq("id", businessId);
    }

    return NextResponse.json({
      success: true,
      paymentId: payment?.id,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      message: "Check your phone for the M-Pesa prompt",
    });
  } catch (error) {
    console.error("M-Pesa subscribe error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
