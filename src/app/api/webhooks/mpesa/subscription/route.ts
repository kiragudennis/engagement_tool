import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { activateBusinessSubscription } from "@/lib/services/paystack";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = body.Body?.stkCallback || body;

    if (result.ResultCode !== 0) {
      return NextResponse.json({ received: true });
    }

    const checkoutRequestId = result.CheckoutRequestID;
    const metadata = result.CallbackMetadata?.Item || [];
    const amountItem = metadata.find(
      (i: { Name: string }) => i.Name === "Amount",
    );

    console.log("M-Pesa webhook received:", result);

    if (!checkoutRequestId || !amountItem) {
      return NextResponse.json(
        { error: "Invalid webhook data" },
        { status: 400 },
      );
    }

    const { data: payment } = await supabaseAdmin
      .from("business_payments")
      .select("*")
      .eq("transaction_id", checkoutRequestId)
      .maybeSingle();

    if (!payment) {
      return NextResponse.json({ received: true });
    }

    const { data: updatedPayment, error: updateError } = await supabaseAdmin
      .from("business_payments")
      .update({
        status: "completed",
        paid_at: new Date().toISOString(),
        metadata: { ...payment.metadata, mpesa_callback: result },
      })
      .eq("id", payment.id);

    console.log(
      "Updated payment record:",
      updatedPayment,
      "Error:",
      updateError,
    );

    const { data: activation, error: activationError } =
      await activateBusinessSubscription({
        businessId: payment.business_id,
        plan: payment.plan,
        billingCycle: payment.billing_cycle || "monthly",
        paymentMethod: "mpesa",
        mpesaPhone: payment.metadata?.phone,
      });

    console.log(
      "Business subscription activated:",
      activation,
      "Error:",
      activationError,
    );

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("M-Pesa subscription webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
