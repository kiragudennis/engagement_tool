// src/app/api/webhooks/paystack/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  activateBusinessSubscription,
  verifyPaystackWebhook,
} from "@/lib/services/paystack";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    const valid = await verifyPaystackWebhook(rawBody, signature);
    if (!valid) {
      console.error("Invalid Paystack webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const data = event.data;

    // Handle successful charge (both one-time and recurring)
    if (eventType === "charge.success") {
      const metadata = data.metadata || {};
      const paymentId = metadata.payment_id;
      const businessId = metadata.business_id;
      const plan = metadata.plan;
      const billingCycle = metadata.billing_cycle || "monthly";
      const isEarlyBird =
        metadata.is_early_bird === "true" || metadata.type === "one_time";

      // Update payment record if we have the payment ID
      if (paymentId) {
        const { error: updateError } = await supabaseAdmin
          .from("business_payments")
          .update({
            status: "completed",
            paid_at: new Date().toISOString(),
            payment_reference: data.reference,
            transaction_id: data.id,
            metadata: { paystack_response: data },
          })
          .eq("id", paymentId);

        if (updateError) {
          console.error("Failed to update payment:", updateError);
        }
      }

      // Determine business ID from customer code if not in metadata (for recurring charges)
      let resolvedBusinessId = businessId;
      if (!resolvedBusinessId && data.customer?.customer_code) {
        const { data: biz } = await supabaseAdmin
          .from("businesses")
          .select("id")
          .eq("paystack_customer_code", data.customer.customer_code)
          .single();
        resolvedBusinessId = biz?.id;
      }

      // Activate subscription
      if (resolvedBusinessId && plan) {
        await activateBusinessSubscription({
          businessId: resolvedBusinessId,
          plan,
          billingCycle: isEarlyBird ? "lifetime" : billingCycle,
          paymentMethod: "paystack",
          paystackCustomerCode: data.customer?.customer_code,
          paystackSubscriptionCode: data.subscription_code,
        });
      }
    }

    // Handle subscription creation event
    if (eventType === "subscription.create") {
      const metadata = data.metadata || {};
      const businessId = metadata.business_id;

      if (businessId && data.subscription_code) {
        await supabaseAdmin
          .from("businesses")
          .update({
            paystack_subscription_code: data.subscription_code,
            paystack_email_token: data.email_token,
          })
          .eq("id", businessId);
      }
    }

    // Handle failed payment
    if (eventType === "invoice.payment_failed") {
      const customerCode = data.customer?.customer_code;
      const subscriptionCode = data.subscription?.subscription_code;

      if (customerCode || subscriptionCode) {
        const query = supabaseAdmin.from("businesses").update({
          subscription_status: "past_due",
          past_due_at: new Date().toISOString(),
        });

        if (customerCode) {
          query.eq("paystack_customer_code", customerCode);
        } else if (subscriptionCode) {
          query.eq("paystack_subscription_code", subscriptionCode);
        }

        await query;
      }
    }

    // Handle subscription cancellation
    if (eventType === "subscription.disable") {
      const subscriptionCode = data.subscription_code;
      if (subscriptionCode) {
        await supabaseAdmin
          .from("businesses")
          .update({
            subscription_status: "cancelled",
            cancelled_at: new Date().toISOString(),
          })
          .eq("paystack_subscription_code", subscriptionCode);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
