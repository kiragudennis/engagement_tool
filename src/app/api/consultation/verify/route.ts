// app/api/consultation/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { paystackVerifyTransaction } from "@/lib/services/paystack";
import {
  generateToken,
  querySTKStatus,
  queryTransactionStatus,
  secureRatelimit,
} from "@/lib/limit";
import { checkBotId } from "botid/server";

export async function GET(req: NextRequest) {
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { success } = await secureRatelimit(req);
  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");
    const transactionId = searchParams.get("transactionId");
    const receiptNumber = searchParams.get("receiptNumber");

    if (!reference && !transactionId && !receiptNumber) {
      return NextResponse.json(
        { error: "Reference, transaction ID, or receipt number is required" },
        { status: 400 },
      );
    }

    let query = supabaseAdmin
      .from("consultation_bookings")
      .select("*");

    if (reference) {
      query = query.eq("payment_reference", reference);
    } else if (transactionId) {
      query = query.eq("transaction_id", transactionId);
    } else if (receiptNumber) {
      query = query.eq("payment_reference", receiptNumber);
    }

    const { data: booking, error: bookingError } = await query.single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 },
      );
    }

    if (booking.payment_status === "paid") {
      return NextResponse.json({
        success: true,
        paymentStatus: "completed",
        message: "Payment already confirmed.",
        booking,
      });
    }

    if (booking.payment_method === "paystack") {
      const verifyResult = await paystackVerifyTransaction(
        booking.payment_reference || reference || "",
      );

      if (verifyResult.status && verifyResult.data?.status === "success") {
        const { error: updateError } = await supabaseAdmin
          .from("consultation_bookings")
          .update({
            payment_status: "paid",
            payment_reference: verifyResult.reference,
            transaction_id: verifyResult.id,
            status: "confirmed",
            paid_at: verifyResult.paid_at,
            updated_at: new Date().toISOString(),
            metadata: {
              ...booking.metadata,
              paystack_verification: verifyResult.data,
              verified_at: new Date().toISOString(),
            },
          })
          .eq("id", booking.id);

        if (updateError) {
          console.error("Failed to update booking:", updateError);
        }

        return NextResponse.json({
          success: true,
          paymentStatus: "completed",
          message: "Payment verified successfully!",
          booking: {
            ...booking,
            payment_status: "paid",
            status: "confirmed",
          },
        });
      }

      if (verifyResult.data?.status === "failed") {
        return NextResponse.json({
          success: false,
          paymentStatus: "failed",
          message: verifyResult.data.gateway_response || "Payment failed",
        });
      }

      return NextResponse.json({
        success: true,
        paymentStatus: verifyResult.data?.status || "pending",
        message:
          "Payment is still pending or was not completed via Paystack.",
      });
    }

    if (booking.payment_method === "mpesa") {
      const token = await generateToken();
      let queryResult;

      if (receiptNumber) {
        queryResult = await queryTransactionStatus(receiptNumber, token);
      } else if (transactionId || booking.transaction_id) {
        queryResult = await querySTKStatus(
          transactionId || booking.transaction_id,
          token,
        );
      } else {
        return NextResponse.json(
          {
            error: "No transaction ID or receipt number available for M-Pesa verification",
          },
          { status: 400 },
        );
      }

      if (
        queryResult.ResultCode === "0" ||
        queryResult.Result?.ResultCode === "0"
      ) {
        const callbackMetadata = queryResult.CallbackMetadata?.Item || [];
        const checkoutRequestId = queryResult.CheckoutRequestID;
        const mpesaReceipt = callbackMetadata.find(
          (i: { Name: string }) => i.Name === "MpesaReceiptNumber",
        )?.Value;
        const amountPaid = callbackMetadata.find(
          (i: { Name: string }) => i.Name === "Amount",
        )?.Value;
        const phoneNumber = callbackMetadata.find(
          (i: { Name: string }) => i.Name === "PhoneNumber",
        )?.Value;
        const transactionDate = callbackMetadata.find(
          (i: { Name: string }) => i.Name === "TransactionDate",
        )?.Value;

        const { error: updateError } = await supabaseAdmin
          .from("consultation_bookings")
          .update({
            payment_status: "paid",
            status: "confirmed",
            paid_at: transactionDate,
            updated_at: new Date().toISOString(),
            payment_reference: mpesaReceipt,
            transaction_id: checkoutRequestId,
            metadata: {
              mpesa_receipt: mpesaReceipt,
              amount_paid: amountPaid,
              mpesa_phone_number: phoneNumber,
              payment_date: transactionDate,
              mpesa_callback: queryResult,
            },
          })
          .eq("id", booking.id);

        if (updateError) {
          console.error("Failed to update payment:", updateError);
        }

        return NextResponse.json({
          success: true,
          paymentStatus: "completed",
          message: "M-Pesa payment verified successfully!",
          receipt: mpesaReceipt,
          amount: amountPaid,
          booking: {
            ...booking,
            payment_status: "paid",
            status: "confirmed",
          },
        });
      }

      if (
        queryResult.ResultCode === "1" ||
        queryResult.ResultCode === "1032"
      ) {
        return NextResponse.json({
          success: false,
          paymentStatus: "failed",
          message: queryResult.ResultDesc || "Payment was not completed",
          resultCode: queryResult.ResultCode,
        });
      }

      return NextResponse.json({
        success: true,
        paymentStatus: "pending",
        message:
          "M-Pesa payment is still being processed. Please check again in a few minutes.",
        resultCode: queryResult.ResultCode,
        resultDesc: queryResult.ResultDesc,
      });
    }

    return NextResponse.json({
      success: false,
      paymentStatus: "unknown",
      message: "Unsupported payment method.",
    });
  } catch (error: unknown) {
    console.error("Verification error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
