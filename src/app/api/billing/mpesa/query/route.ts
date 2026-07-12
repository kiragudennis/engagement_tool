// app/api/billing/mpesa/query/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireBusinessAdmin } from "@/lib/auth/server";
import { generateToken } from "@/lib/limit";
import { activateBusinessSubscription } from "@/lib/services/paystack";

const MPESA_API = "https://api.safaricom.co.ke";

async function querySTKStatus(checkoutRequestId: string, token: string) {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.]/g, "")
    .slice(0, 14);

  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`,
  ).toString("base64");

  const res = await fetch(`${MPESA_API}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  return res.json();
}

// Querying by receipt number
async function queryTransactionStatus(receiptNumber: string, token: string) {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.]/g, "")
    .slice(0, 14);

  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`,
  ).toString("base64");

  const res = await fetch(`${MPESA_API}/mpesa/transactionstatus/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      // Use either TransactionID or OriginalConversationID
      TransactionID: receiptNumber,
    }),
  });

  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, paymentId, receiptNumber } = body;

    // Get business and payment details
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

    const { data: payment } = await supabaseAdmin
      .from("business_payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (!payment.transaction_id) {
      return NextResponse.json(
        {
          error:
            "No transaction ID found. This payment may not have been initiated yet.",
        },
        { status: 400 },
      );
    }

    // Query M-Pesa for transaction status
    const token = await generateToken();
    let queryResult;

    // If user provided a receipt number, use transaction status query
    if (receiptNumber) {
      console.log("Querying by receipt number:", receiptNumber);
      queryResult = await queryTransactionStatus(receiptNumber, token);
    }
    // Otherwise use CheckoutRequestID (STK query)
    else if (payment.transaction_id) {
      console.log("Querying by CheckoutRequestID:", payment.transaction_id);
      queryResult = await querySTKStatus(payment.transaction_id, token);
    } else {
      return NextResponse.json(
        {
          error: "No transaction ID or receipt number available",
        },
        { status: 400 },
      );
    }

    console.log("M-Pesa query result:", queryResult);

    // Check if payment was successful
    if (
      queryResult.ResultCode === "0" ||
      queryResult.Result?.ResultCode === "0"
    ) {
      // Payment successful - extract receipt details
      const callbackMetadata = queryResult.CallbackMetadata?.Item || [];
      const mpesaReceipt = callbackMetadata.find(
        (i: any) => i.Name === "MpesaReceiptNumber",
      )?.Value;
      const amountPaid = callbackMetadata.find(
        (i: any) => i.Name === "Amount",
      )?.Value;
      const phoneNumber = callbackMetadata.find(
        (i: any) => i.Name === "PhoneNumber",
      )?.Value;
      const transactionDate = callbackMetadata.find(
        (i: any) => i.Name === "TransactionDate",
      )?.Value;

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
            mpesa_query_result: queryResult,
            transaction_date: transactionDate,
          },
        })
        .eq("id", payment.id);

      if (updateError) {
        console.error("Failed to update payment:", updateError);
      }

      // Activate subscription
      const isLifetime =
        payment.plan?.startsWith("early_") || payment.metadata?.is_lifetime;

      const { data: activation, error: activationError } =
        await activateBusinessSubscription({
          businessId: payment.business_id,
          plan: payment.plan,
          billingCycle: isLifetime
            ? "lifetime"
            : payment.billing_cycle || "monthly",
          paymentMethod: "mpesa",
          mpesaPhone: phoneNumber || payment.metadata?.phone,
        });

      if (activationError) {
        console.error("Failed to activate subscription:", activationError);
        return NextResponse.json({
          success: true,
          paymentStatus: "completed",
          message:
            "Payment verified but subscription activation failed. Please contact support.",
          receipt: mpesaReceipt,
          amount: amountPaid,
        });
      }

      return NextResponse.json({
        success: true,
        paymentStatus: "completed",
        message: "Payment verified and subscription activated!",
        receipt: mpesaReceipt,
        amount: amountPaid,
        subscriptionActivated: true,
      });
    }
    // Payment failed
    else if (
      queryResult.ResultCode === "1" ||
      queryResult.ResultCode === "1032"
    ) {
      // Update payment as failed
      await supabaseAdmin
        .from("business_payments")
        .update({
          status: "failed",
          metadata: {
            ...payment.metadata,
            mpesa_query_result: queryResult,
          },
        })
        .eq("id", payment.id);

      return NextResponse.json({
        success: false,
        paymentStatus: "failed",
        message: queryResult.ResultDesc || "Payment was not completed",
        resultCode: queryResult.ResultCode,
      });
    }
    // Still pending
    else {
      return NextResponse.json({
        success: true,
        paymentStatus: "pending",
        message:
          "Payment is still being processed. Please check again in a few minutes.",
        resultCode: queryResult.ResultCode,
        resultDesc: queryResult.ResultDesc,
      });
    }
  } catch (error) {
    console.error("M-Pesa query error:", error);
    return NextResponse.json(
      { error: "Failed to query M-Pesa transaction" },
      { status: 500 },
    );
  }
}
