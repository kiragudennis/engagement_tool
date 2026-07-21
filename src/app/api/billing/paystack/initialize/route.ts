// app/api/billing/mpesa/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireBusinessAdmin } from "@/lib/auth/server";
import {
  getSubscriptionAmount,
  paystackCreateCustomer,
  paystackCreateSubscription,
  paystackInitializeTransaction,
  resolvePaystackPlanCode,
} from "@/lib/services/paystack";
import { checkBotId } from "botid/server";
import { secureRatelimit } from "@/lib/limit";
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
      console.log("Validation failed:", parsed.error.flatten().fieldErrors);
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { businessId, plan, billingCycle, email, fullName } = parsed.data;

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
      console.log("Authorization failed:", auth.error);
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const amount = getSubscriptionAmount(plan, billingCycle);
    const planCode = resolvePaystackPlanCode(plan, billingCycle);

    const { data: payment, error: bsError } = await supabaseAdmin
      .from("business_payments")
      .insert({
        business_id: businessId,
        amount: amount,
        currency: "USD",
        plan,
        billing_cycle: billingCycle,
        payment_method: "paystack",
        status: "pending",
      })
      .select()
      .single();

    const customerRes = await paystackCreateCustomer(email, fullName);
    const customerCode =
      customerRes.data?.customer_code || customerRes.data?.code;

    let authorizationUrl: string | undefined;
    let subscriptionCode: string | undefined;

    if (planCode && customerCode) {
      const subRes = await paystackCreateSubscription(customerCode, planCode);
      if (subRes.status && subRes.data?.authorization_url) {
        authorizationUrl = subRes.data.authorization_url;
        subscriptionCode = subRes.data.subscription_code;
      }
    }

    if (!authorizationUrl) {
      const initRes = await paystackInitializeTransaction({
        email,
        amount,
        plan,
        billingCycle,
        businessId,
        paymentId: payment!.id,
        callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/${business.slug}/billing/success`,
      });
      if (!initRes.status) {
        return NextResponse.json(
          { error: initRes.message || "Paystack initialization failed" },
          { status: 500 },
        );
      }
      authorizationUrl = initRes.data.authorization_url;
    }

    if (customerCode || subscriptionCode) {
      await supabaseAdmin
        .from("businesses")
        .update({
          paystack_customer_code: customerCode,
          paystack_subscription_code: subscriptionCode,
        })
        .eq("id", businessId);
    }

    return NextResponse.json({
      success: true,
      authorizationUrl,
      paymentId: payment?.id,
    });
  } catch (error) {
    console.error("Paystack init error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
