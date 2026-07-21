// app/api/billing/manage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireBusinessAdmin } from "@/lib/auth/server";
import {
  paystackGetSubscription,
  paystackEnableSubscription,
  paystackDisableSubscription,
  paystackGetCustomer,
  activateBusinessSubscription,
} from "@/lib/services/paystack";
import { EARLY_ACCESS_PLANS, PLANS } from "@/lib/config/plans";
import { headers } from "next/headers";
import { checkBotId } from "botid/server";
import { secureRatelimit } from "@/lib/limit";

// GET: Fetch subscription status
export async function GET(req: NextRequest) {
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { success } = await secureRatelimit(req);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID required" },
        { status: 400 },
      );
    }

    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // Get Paystack subscription details if available
    let paystackSubscription = null;
    let paystackCustomer = null;

    if (business.paystack_customer_code) {
      try {
        paystackCustomer = await paystackGetCustomer(
          business.paystack_customer_code,
        );
      } catch (err) {
        console.error("Failed to fetch Paystack customer:", err);
      }
    }

    if (business.paystack_subscription_code) {
      try {
        paystackSubscription = await paystackGetSubscription(
          business.paystack_subscription_code,
        );
      } catch (err) {
        console.error("Failed to fetch Paystack subscription:", err);
      }
    }

    // Get recent payment history
    const { data: payments } = await supabaseAdmin
      .from("business_payments")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      business: {
        plan: business.plan,
        subscription_status: business.subscription_status,
        payment_method: business.payment_method,
        last_payment_at: business.last_payment_at,
        next_billing_at: business.next_billing_at,
        paystack_customer_code: business.paystack_customer_code,
        paystack_subscription_code: business.paystack_subscription_code,
        mpesa_phone: business.mpesa_phone,
        past_due_at: business.past_due_at,
        cancelled_at: business.cancelled_at,
      },
      paystackSubscription: paystackSubscription?.data,
      paystackCustomer: paystackCustomer?.data,
      payments,
    });
  } catch (error) {
    console.error("Failed to fetch subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST: Manage subscription (reactivate, cancel, retry payment)
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
    const { action, businessSlug, businessId } = body;

    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select("*")
      .eq("slug", businessSlug)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // Handle different actions
    switch (action) {
      case "reactivate": {
        // Reactivate Paystack subscription
        if (!business.paystack_subscription_code) {
          return NextResponse.json(
            {
              error: "No Paystack subscription found. Please contact support.",
            },
            { status: 400 },
          );
        }

        const result = await paystackEnableSubscription(
          business.paystack_subscription_code,
        );

        if (result.status) {
          await supabaseAdmin
            .from("businesses")
            .update({
              subscription_status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("id", businessId);

          return NextResponse.json({
            success: true,
            message: "Subscription reactivated",
          });
        } else {
          return NextResponse.json(
            {
              error: result.message || "Failed to reactivate",
            },
            { status: 500 },
          );
        }
      }

      case "cancel": {
        if (!business.paystack_subscription_code) {
          // For M-Pesa users, just update status
          await supabaseAdmin
            .from("businesses")
            .update({
              subscription_status: "cancelled",
              cancelled_at: new Date().toISOString(),
            })
            .eq("id", businessId);

          return NextResponse.json({
            success: true,
            message: "Subscription cancelled",
          });
        }

        const result = await paystackDisableSubscription(
          business.paystack_subscription_code,
        );

        if (result.status) {
          await supabaseAdmin
            .from("businesses")
            .update({
              subscription_status: "cancelled",
              cancelled_at: new Date().toISOString(),
            })
            .eq("id", businessId);

          return NextResponse.json({
            success: true,
            message: "Subscription cancelled",
          });
        } else {
          return NextResponse.json(
            {
              error: result.message || "Failed to cancel",
            },
            { status: 500 },
          );
        }
      }

      case "retry_payment": {
        // For users with past_due status who need to retry payment
        const { email, fullName, plan, billingCycle } = body;

        // Calculate amount
        const amount = plan.startsWith("early_")
          ? EARLY_ACCESS_PLANS.find((p) => p.id === plan)?.price || 0
          : billingCycle === "annual"
            ? (PLANS.find((p) => p.id === plan)?.price || 0) * 10
            : PLANS.find((p) => p.id === plan)?.price || 0;

        // Create new payment record
        const { data: payment } = await supabaseAdmin
          .from("business_payments")
          .insert({
            business_id: businessId,
            amount,
            currency: "USD",
            plan,
            billing_cycle: billingCycle,
            payment_method: business.payment_method || "paystack",
            status: "pending",
            metadata: { type: "retry_payment" },
          })
          .select()
          .single();

        if (!payment) {
          return NextResponse.json(
            { error: "Failed to create payment" },
            { status: 500 },
          );
        }

        // If they have Paystack, try to charge via subscription
        if (business.paystack_subscription_code) {
          const result = await paystackEnableSubscription(
            business.paystack_subscription_code,
          );

          if (result.status) {
            return NextResponse.json({
              success: true,
              message: "Subscription reactivated. Payment will be processed.",
              type: "subscription_reactivated",
            });
          }
        }

        // Generate payment link for manual payment
        const { paystackInitializeTransaction } =
          await import("@/lib/services/paystack");
        const initRes = await paystackInitializeTransaction({
          email,
          amount,
          plan,
          billingCycle,
          businessId,
          paymentId: payment.id,
          callbackUrl: `${process.env.NEXT_PUBLIC_SITE_LIVE_URL}/admin/${business.slug}/billing`,
        });

        if (initRes.status) {
          return NextResponse.json({
            success: true,
            authorizationUrl: initRes.data.authorization_url,
            paymentId: payment.id,
          });
        } else {
          return NextResponse.json(
            {
              error: initRes.message || "Failed to initialize payment",
            },
            { status: 500 },
          );
        }
      }

      case "query_paystack": {
        const { paymentId } = body;

        if (!paymentId) {
          return NextResponse.json(
            { error: "Payment ID required" },
            { status: 400 },
          );
        }

        // Get the payment record
        const { data: payment } = await supabaseAdmin
          .from("business_payments")
          .select("*")
          .eq("id", paymentId)
          .single();

        if (!payment) {
          return NextResponse.json(
            { error: "Payment not found" },
            { status: 404 },
          );
        }

        if (!payment.transaction_id) {
          return NextResponse.json(
            {
              error: "No transaction reference found",
            },
            { status: 400 },
          );
        }

        try {
          const { paystackVerifyTransaction } =
            await import("@/lib/services/paystack");
          const verifyResult = await paystackVerifyTransaction(
            payment.payment_reference,
          );

          if (verifyResult.status && verifyResult.data?.status === "success") {
            // Payment was successful - update record
            const { error: updateError } = await supabaseAdmin
              .from("business_payments")
              .update({
                status: "completed",
                paid_at: new Date().toISOString(),
                metadata: {
                  ...payment.metadata,
                  paystack_verification: verifyResult.data,
                  verified_manually: true,
                  verified_at: new Date().toISOString(),
                },
              })
              .eq("id", payment.id);

            if (updateError) {
              console.error("Failed to update payment:", updateError);
            }

            // Activate subscription if needed
            const isLifetime =
              payment.plan?.startsWith("early_") ||
              payment.metadata?.is_lifetime;

            await activateBusinessSubscription({
              businessId: payment.business_id,
              plan: payment.plan,
              billingCycle: isLifetime
                ? "lifetime"
                : payment.billing_cycle || "monthly",
              paymentMethod: "paystack",
              paystackCustomerCode:
                verifyResult.data.customer?.customer_code ||
                business.paystack_customer_code,
            });

            return NextResponse.json({
              success: true,
              paymentStatus: "completed",
              message: "Payment verified and subscription activated!",
              amount: verifyResult.data.amount / 100,
              reference: payment.transaction_id,
            });
          } else if (
            verifyResult.data?.status === "failed" ||
            verifyResult.data?.status === "abandoned"
          ) {
            // Payment failed
            await supabaseAdmin
              .from("business_payments")
              .update({
                status: "failed",
                metadata: {
                  ...payment.metadata,
                  paystack_verification: verifyResult.data,
                },
              })
              .eq("id", payment.id);

            return NextResponse.json({
              success: false,
              paymentStatus: "failed",
              message: "Payment was not successful",
              gatewayResponse: verifyResult.data.gateway_response,
            });
          } else {
            // Still pending
            return NextResponse.json({
              success: true,
              paymentStatus: "pending",
              message: "Payment is still pending. Please check again later.",
              status: verifyResult.data?.status,
            });
          }
        } catch (error) {
          console.error("Paystack verification error:", error);
          return NextResponse.json(
            { error: "Failed to verify Paystack transaction" },
            { status: 500 },
          );
        }
      }

      case "query_mpesa": {
        const { paymentId, receiptNumber } = body;

        if (!paymentId) {
          return NextResponse.json(
            { error: "Payment ID required" },
            { status: 400 },
          );
        }

        const incomingHeaders = await headers();

        // Forward to the M-Pesa query endpoint
        const queryRes = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/billing/mpesa/query`,
          {
            method: "POST",
            headers: {
              // Forward the user's BotID telemetry signature
              ...Object.fromEntries(incomingHeaders.entries()),
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              businessId,
              paymentId,
              receiptNumber: receiptNumber || undefined,
            }),
          },
        );

        const queryData = await queryRes.json();
        return NextResponse.json(queryData);
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Subscription management error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
