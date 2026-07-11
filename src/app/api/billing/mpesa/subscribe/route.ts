// app/api/billing/mpesa/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireBusinessAdmin } from "@/lib/auth/server";
import { getSubscriptionAmount } from "@/lib/services/paystack";
import { checkBotId } from "botid/server";
import { generateToken, secureRatelimit } from "@/lib/limit";
import { schema } from "@/lib/utils";

const MPESA_API = "https://api.safaricom.co.ke";

async function mpesaSTKPush(
  amountUSD: number,
  phoneNumber: string,
  paymentId: string,
  plan: string,
  token: string,
) {
  // Convert USD to KES for M-Pesa
  let amountKES: number;

  // Reduce the amount for testing
  if (amountUSD > 1) {
    console.log("Amount awaiting conversion:", amountUSD);

    amountUSD = 1;
  }

  console.log("Testing amount:", amountUSD);
  try {
    const access_key = process.env.EXCHANGE_API_KEY;
    const endpoint = process.env.ENDPOINT;

    const res = await fetch(
      `https://api.exchangerate.host/${endpoint}?access_key=${access_key}&from=USD&to=KES&amount=${amountUSD}`,
      { next: { revalidate: 3600 * 12 } },
    );
    const json = await res.json();
    const rate = json.result;

    if (!rate) throw new Error("Rate missing");
    amountKES = Math.round(rate);
  } catch (err) {
    console.error("Exchange rate fetch failed, using fallback rate", err);
    amountKES = Math.round(amountUSD * 131); // fallback rate
  }

  console.log(`M-Pesa STK Push: USD ${amountUSD} → KES ${amountKES}`);

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.]/g, "")
    .slice(0, 14);
  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`,
  ).toString("base64");

  const formattedPhone = phoneNumber
    .replace(/\s/g, "")
    .replace(/^0/, "254")
    .replace(/^\+/, "");

  const stkRes = await fetch(`${MPESA_API}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(amountKES),
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: `${process.env.NEXT_PUBLIC_SITE_LIVE_URL}/api/webhooks/mpesa/subscription?callback-secret=${process.env.MPESA_CALLBACK_SECRET}`,
      AccountReference: `ENGAGE-${plan}`,
      TransactionDesc: `Engage ${plan} subscription`,
    }),
  });

  return {
    response: await stkRes.json(),
    formattedPhone,
    amountKES,
  };
}

export async function POST(req: NextRequest) {
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { success } = await secureRatelimit(req);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      console.error("Validation failed:", parsed.error.flatten().fieldErrors);
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

    // Get USD amount
    const amountUSD = getSubscriptionAmount(plan, billingCycle);

    // Create payment record in USD
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("business_payments")
      .insert({
        business_id: businessId,
        amount: amountUSD,
        currency: "USD", // Store original USD amount
        plan,
        billing_cycle: billingCycle,
        payment_method: "mpesa",
        status: "pending",
        metadata: {
          phone: phoneNumber,
          is_lifetime: plan.startsWith("early_"),
        },
      })
      .select()
      .single();

    if (!payment || paymentError) {
      console.log("Error occured updating business payment", paymentError);
      return NextResponse.json(
        { error: "Failed to create payment record" },
        { status: 500 },
      );
    }

    const token = await generateToken();

    const {
      response: stkResponse,
      formattedPhone,
      amountKES,
    } = await mpesaSTKPush(amountUSD, phoneNumber, payment.id, plan, token);

    if (stkResponse.CheckoutRequestID) {
      await supabaseAdmin
        .from("business_payments")
        .update({
          transaction_id: stkResponse.CheckoutRequestID,
          metadata: {
            ...payment.metadata,
            mpesa_request: stkResponse,
            phone: formattedPhone,
            amount_kes: amountKES,
            amount_usd: amountUSD,
            payment_id: payment.id,
          },
        })
        .eq("id", payment.id);
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
