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

    if (eventType === "charge.success" || eventType === "subscription.create") {
      const metadata = data.metadata || {};
      const businessId = metadata.business_id;
      const plan = metadata.plan || metadata.plan_name;
      const billingCycle = metadata.billing_cycle || "monthly";
      const paymentId = metadata.payment_id;

      if (paymentId) {
        await supabaseAdmin
          .from("business_payments")
          .update({
            status: "completed",
            paid_at: new Date().toISOString(),
            transaction_id: data.reference || data.id,
          })
          .eq("id", paymentId);
      }

      if (businessId && plan) {
        const { data: activation, error: activationError } =
          await activateBusinessSubscription({
            businessId,
            plan,
            billingCycle,
            paymentMethod: "paystack",
            paystackCustomerCode: data.customer?.customer_code,
            paystackSubscriptionCode: data.subscription_code,
          });
        console.log(
          "Business subscription activated:",
          activation,
          "Error:",
          activationError,
        );
      }
    }

    if (eventType === "invoice.payment_failed") {
      const customerCode = data.customer?.customer_code;
      if (customerCode) {
        await supabaseAdmin
          .from("businesses")
          .update({ subscription_status: "past_due" })
          .eq("paystack_customer_code", customerCode);
      }
    }

    if (eventType === "subscription.disable") {
      const subscriptionCode = data.subscription_code;
      if (subscriptionCode) {
        await supabaseAdmin
          .from("businesses")
          .update({ subscription_status: "cancelled" })
          .eq("paystack_subscription_code", subscriptionCode);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
