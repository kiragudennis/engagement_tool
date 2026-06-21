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
    const amountItem = metadata.find((i: { Name: string }) => i.Name === "Amount");

    const { data: payment } = await supabaseAdmin
      .from("business_payments")
      .select("*")
      .eq("transaction_id", checkoutRequestId)
      .maybeSingle();

    if (!payment) {
      return NextResponse.json({ received: true });
    }

    await supabaseAdmin
      .from("business_payments")
      .update({
        status: "completed",
        paid_at: new Date().toISOString(),
        metadata: { ...payment.metadata, mpesa_callback: result },
      })
      .eq("id", payment.id);

    await activateBusinessSubscription({
      businessId: payment.business_id,
      plan: payment.plan,
      billingCycle: payment.billing_cycle || "monthly",
      paymentMethod: "mpesa",
      mpesaPhone: payment.metadata?.phone,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("M-Pesa subscription webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
