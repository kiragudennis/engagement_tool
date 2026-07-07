// app/api/billing/mpesa/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireBusinessAdmin } from "@/lib/auth/server";
import { getSubscriptionAmountKes } from "@/lib/services/paystack";
import { checkBotId } from "botid/server";
import { generateToken, secureRatelimit } from "@/lib/limit";
import { schema } from "@/lib/utils";

const MPESA_API = "https://api.safaricom.co.ke";

async function mpesaSTKPush(
  amountKes: number,
  phoneNumber: string,
  paymentId: string,
  plan: string,
  token: string,
) {
  // Convert currency to KES if needed (using totals.total)
  // let amountKES = totals.total;
  // const currency = totals.currency || "KES"; // Assuming currency is in totals

  // if (currency !== "KES") {
  //   try {
  //     const access_key = process.env.EXCHANGE_API_KEY;
  //     const endpoint = process.env.ENDPOINT;

  //     const res = await fetch(
  //       `https://api.exchangerate.host/${endpoint}?access_key=${access_key}&from=${currency}&to=KES&amount=${amountKES}`,
  //       { next: { revalidate: 3600 * 12 } },
  //     );
  //     const json = await res.json();
  //     const rate = json.result;

  //     if (!rate) throw new Error("Rate missing");
  //     amountKES = Math.round(rate);
  //   } catch (err) {
  //     console.error(
  //       "Exchange rate fetch failed, defaulting to hardcoded rate",
  //       err,
  //     );
  //     amountKES = Math.round(totals.total * 131); // fallback
  //   }
  // }

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
      Amount: Math.ceil(amountKes),
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: `${process.env.NEXT_PUBLIC_SITE_LIVE_URL}/api/webhooks/mpesa/subscription`,
      AccountReference: `ENGAGE-${plan}`,
      TransactionDesc: `Engage ${plan} subscription`,
    }),
  });

  return { response: await stkRes.json(), formattedPhone };
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
    console.log("Received M-Pesa subscription request:", body);

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

    const amountKes = getSubscriptionAmountKes(plan, billingCycle);

    const { data: payment, error: errorPayment } = await supabaseAdmin
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

    console.log("Created payment record:", payment, "Error:", errorPayment);

    if (!payment) {
      return NextResponse.json(
        { error: "Failed to create payment record" },
        { status: 500 },
      );
    }

    const token = await generateToken();

    const { response: stkResponse, formattedPhone } = await mpesaSTKPush(
      amountKes,
      phoneNumber,
      payment!.id,
      plan,
      token,
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
