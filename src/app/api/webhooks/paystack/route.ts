// src/app/api/webhooks/paystack/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  activateBusinessSubscription,
  verifyPaystackWebhook,
} from "@/lib/services/paystack";
import {
  CONSULTATION_SERVICES,
  ConsultationService,
} from "@/lib/config/consultation-services";
import { resend } from "@/lib/limit";
import { escapeHtml } from "@/lib/utils";

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
      const consultationId = metadata.consultation_id;
      const serviceId = metadata.service_id;

      // Update consultation booking if we have the consultation ID
      if (consultationId) {
        const { data: updatedBookingData, error: updateError } =
          await supabaseAdmin
            .from("consultation_bookings")
            .update({
              payment_status: "paid",
              status: "confirmed",
              updated_at: new Date().toISOString(),
              paid_at: new Date().toISOString(),
              payment_reference: data.reference,
              transaction_id: data.id,
              metadata: { paystack_response: data },
            })
            .select("*")
            .eq("id", consultationId);

        console.log("Booking webhook update error:", updateError);
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
        const service = await CONSULTATION_SERVICES.find(
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

        return NextResponse.json({ received: true });
      }

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
