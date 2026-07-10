// src/app/api/webhooks/mpesa/subscription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { activateBusinessSubscription } from "@/lib/services/paystack";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = body.Body?.stkCallback || body;
    const url = new URL(req.url);
    const callbackSecret = url.searchParams.get("callback-secret");

    console.log("M-Pesa webhook received:", {
      resultCode: result.ResultCode,
      checkoutRequestId: result.CheckoutRequestID,
    });

    // Check for callback secret
    if (!callbackSecret) {
      console.log("Missing callback secret in the url", callbackSecret);
      return NextResponse.json(
        { error: "Missing sessionId or callbackSecret" },
        { status: 404 },
      );
    }

    // Validate callback secret
    if (callbackSecret !== process.env.MPESA_CALLBACK_SECRET) {
      return NextResponse.json(
        { error: "Invalid callback secret" },
        { status: 404 },
      );
    }

    // If payment failed, log and return
    if (result.ResultCode !== 0) {
      console.error("M-Pesa payment failed:", result.ResultDesc);

      // Update payment record as failed if we can find it
      if (result.CheckoutRequestID) {
        await supabaseAdmin
          .from("business_payments")
          .update({
            status: "failed",
            metadata: { mpesa_failure: result },
          })
          .eq("transaction_id", result.CheckoutRequestID);
      }

      return NextResponse.json({ received: true });
    }

    const checkoutRequestId = result.CheckoutRequestID;
    if (!checkoutRequestId) {
      return NextResponse.json({ received: true });
    }

    // Find the payment record
    const { data: payment } = await supabaseAdmin
      .from("business_payments")
      .select("*")
      .eq("transaction_id", checkoutRequestId)
      .maybeSingle();

    if (!payment) {
      console.error(
        "No payment found for CheckoutRequestID:",
        checkoutRequestId,
      );
      return NextResponse.json({ received: true });
    }

    // Extract M-Pesa transaction details
    const callbackMetadata = result.CallbackMetadata?.Item || [];
    const mpesaReceipt = callbackMetadata.find(
      (i: { Name: string }) => i.Name === "MpesaReceiptNumber",
    )?.Value;
    const amountPaid = callbackMetadata.find(
      (i: { Name: string }) => i.Name === "Amount",
    )?.Value;
    const phoneNumber = callbackMetadata.find(
      (i: { Name: string }) => i.Name === "PhoneNumber",
    )?.Value;

    console.log(
      "Receipt",
      mpesaReceipt,
      "Amount",
      amountPaid,
      "Phone number",
      phoneNumber,
    );

    // Update payment record
    const { error: updateError } = await supabaseAdmin
      .from("business_payments")
      .update({
        status: "completed",
        paid_at: new Date().toISOString(),
        transaction_id: mpesaReceipt || checkoutRequestId,
        metadata: {
          ...payment.metadata,
          mpesa_receipt: mpesaReceipt,
          amount_paid_kes: amountPaid,
          mpesa_callback: result,
        },
      })
      .eq("id", payment.id);

    if (updateError) {
      console.error("Failed to update payment:", updateError);
    }

    const { data: activation, error: activationError } =
      await activateBusinessSubscription({
        businessId: payment.business_id,
        plan: payment.plan,
        billingCycle: payment.billing_cycle || "monthly",
        paymentMethod: "mpesa",
        mpesaPhone: phoneNumber || payment.metadata?.phone,
      });

    console.log("Activation data received", activation);

    if (activationError) {
      console.error("Failed to activate subscription:", activationError);
    } else {
      console.log("Subscription activated for business:", payment.business_id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("M-Pesa subscription webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
