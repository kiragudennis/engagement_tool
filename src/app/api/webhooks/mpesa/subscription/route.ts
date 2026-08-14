// src/app/api/webhooks/mpesa/subscription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { activateBusinessSubscription } from "@/lib/services/paystack";
import { resend } from "@/lib/limit";
import {
  CONSULTATION_SERVICES,
  ConsultationService,
} from "@/lib/config/consultation-services";
import { escapeHtml } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = body.Body?.stkCallback || body;
    const url = new URL(req.url);
    const callbackSecret = url.searchParams.get("callback-secret");
    const paymentId = url.searchParams.get("paymentId");
    const serviceId = url.searchParams.get("serviceId");

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

        if (paymentId) {
          // Update consultation booking as failed if we have the paymentId
          await supabaseAdmin
            .from("consultation_bookings")
            .update({
              payment_status: "failed",
              transaction_id: result.CheckoutRequestID,
              metadata: { mpesa_failure: result },
            })
            .eq("id", paymentId);
        }
      }

      return NextResponse.json({ received: true });
    }

    const checkoutRequestId = result.CheckoutRequestID;
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

    if (!checkoutRequestId) {
      return NextResponse.json({ received: true });
    }

    // Exit early if we have a paymentId (bookingId) in the query params
    if (paymentId) {
      // Update consultation booking if we have the paymentId
      const { data: updatedBookingData, error: updateError } =
        await supabaseAdmin
          .from("consultation_bookings")
          .update({
            payment_status: "paid",
            status: "confirmed",
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            payment_reference: mpesaReceipt,
            transaction_id: checkoutRequestId,
            metadata: { mpesa_receipt: mpesaReceipt, mpesa_callback: result },
          })
          .select("*")
          .eq("id", paymentId);

      if (
        updateError ||
        !updatedBookingData ||
        updatedBookingData.length === 0
      ) {
        console.error("Failed to update consultation booking:", updateError);
        return NextResponse.json({ received: true });
      }

      const updatedBooking = updatedBookingData[0];

      // Consultation from config
      const service = CONSULTATION_SERVICES.find(
        (s: ConsultationService) => s.id === serviceId,
      );

      try {
        await resend.emails.send({
          from: `Engage Consultations <${process.env.RESEND_FROM_EMAIL || "notifications@engagespin.com"}>`,
          to: "support@engagespin.com",
          subject: `New Paid Consultation: ${service?.name || "Unknown Service"}`,
          html: `
                    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #fff; background: #0f172a;">
                      <h2 style="color: #a855f7; margin-bottom: 16px;">New Paid Consultation Booking</h2>
                      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #334155; color: #94a3b8; width: 160px;">Service</td>
                          <td style="padding: 12px 0; border-bottom: 1px solid #334155; color: #f1f5f9;">${service?.name || "Unknown"}</td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #334155; color: #94a3b8;">Contact</td>
                          <td style="padding: 12px 0; border-bottom: 1px solid #334155; color: #f1f5f9;">${escapeHtml(updatedBooking.contact_name)}</td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #334155; color: #94a3b8;">Email</td>
                          <td style="padding: 12px 0; border-bottom: 1px solid #334155; color: #f1f5f9;">${escapeHtml(updatedBooking.email)}</td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #334155; color: #94a3b8;">Phone</td>
                          <td style="padding: 12px 0; border-bottom: 1px solid #334155; color: #f1f5f9;">${escapeHtml(updatedBooking.phone)}</td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #334155; color: #94a3b8;">Amount Paid</td>
                          <td style="padding: 12px 0; border-bottom: 1px solid #334155; color: #f1f5f9;">KES ${updatedBooking.amount_paid?.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #334155; color: #94a3b8;">Preferred Date</td>
                          <td style="padding: 12px 0; border-bottom: 1px solid #334155; color: #f1f5f9;">${escapeHtml(updatedBooking.preferred_date || "Not specified")}</td>
                        </tr>
                      </table>
                      ${updatedBooking?.notes ? `<div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin-bottom: 16px;"><p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Notes</p><p style="color: #e2e8f0; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(updatedBooking.notes)}</p></div>` : ""}
                      <p style="color: #64748b; font-size: 12px; margin-top: 24px;">Booking ID: ${updatedBooking.id}</p>
                    </div>
                  `,
          text: `New Paid Consultation Booking\n\nService: ${service?.name || "Unknown"}\nContact: ${updatedBooking.contact_name}\nEmail: ${updatedBooking.email}\nPhone: ${updatedBooking.phone}\nAmount: KES ${updatedBooking.amount_paid?.toLocaleString()}\nPreferred Date: ${updatedBooking.preferred_date || "Not specified"}\nNotes: ${updatedBooking.notes || "None"}`,
        });
      } catch (notifError) {
        console.error("Failed to send notification:", notifError);
      }

      console.error("Missing paymentId in the query params");
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

    // Update payment record
    const { error: updateError } = await supabaseAdmin
      .from("business_payments")
      .update({
        status: "completed",
        paid_at: new Date().toISOString(),
        payment_reference: mpesaReceipt,
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
