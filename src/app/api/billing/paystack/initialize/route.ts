// app/api/billing/mpesa/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireBusinessAdmin } from "@/lib/auth/server";
import {
  getSubscriptionAmountKes,
  paystackCreateCustomer,
  paystackCreateSubscription,
  paystackInitializeTransaction,
  resolvePaystackPlanCode,
} from "@/lib/services/paystack";

const schema = z.object({
  businessId: z.string().uuid(),
  plan: z.enum(["starter", "pro", "enterprise"]),
  billingCycle: z.enum(["monthly", "annual"]),
  email: z.string().email(),
  fullName: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
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
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const amountKes = getSubscriptionAmountKes(plan, billingCycle);
    const planCode = resolvePaystackPlanCode(plan, billingCycle);

    const { data: payment } = await supabaseAdmin
      .from("business_payments")
      .insert({
        business_id: businessId,
        amount: amountKes,
        currency: "KES",
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
        amountKes,
        plan,
        billingCycle,
        businessId,
        paymentId: payment!.id,
        callbackUrl: `${process.env.NEXT_PUBLIC_URL}/admin/${business.slug}/billing/success`,
      });
      if (!initRes.status) {
        return NextResponse.json(
          { error: initRes.message || "Paystack initialization failed" },
          { status: 500 },
        );
      }
      authorizationUrl = initRes.data.authorization_url;
    }

    if (customerCode) {
      await supabaseAdmin
        .from("businesses")
        .update({ paystack_customer_code: customerCode })
        .eq("id", businessId);
    }

    if (subscriptionCode) {
      await supabaseAdmin
        .from("businesses")
        .update({ paystack_subscription_code: subscriptionCode })
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
