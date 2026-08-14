// app/api/billing/mpesa/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireBusinessAdmin } from "@/lib/auth/server";
import { getSubscriptionAmount } from "@/lib/services/paystack";
import { checkBotId } from "botid/server";
import { generateToken, mpesaSTKPush, secureRatelimit } from "@/lib/limit";
import { schema } from "@/lib/utils";

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
    } = await mpesaSTKPush(
      amountUSD,
      phoneNumber,
      payment.id,
      null,
      plan,
      token
    );

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
