// // app/api/webhooks/paypal/route.ts

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const eventType = body.event_type;

//     if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
//       const orderId = body.resource?.supplementary_data?.related_ids?.order_id;
//       const businessId = body.resource?.custom_id;

//       if (!businessId) {
//         return NextResponse.json({ error: "No business ID" }, { status: 400 });
//       }

//       // Update payment status
//       const { data: payment } = await supabase
//         .from("business_payments")
//         .update({
//           status: "completed",
//           transaction_id: body.resource.id,
//           paid_at: new Date().toISOString(),
//           metadata: body,
//         })
//         .eq("business_id", businessId)
//         .eq("status", "pending")
//         .order("created_at", { ascending: false })
//         .limit(1)
//         .select()
//         .single();

//       if (payment) {
//         // Activate business subscription
//         const nextBilling = new Date();
//         nextBilling.setMonth(
//           nextBilling.getMonth() +
//             (payment.billing_cycle === "annual" ? 12 : 1),
//         );

//         await supabase
//           .from("businesses")
//           .update({
//             plan: payment.plan,
//             subscription_status: "active",
//             last_payment_at: new Date().toISOString(),
//             next_billing_at: nextBilling.toISOString(),
//             payment_method: "paypal",
//             trial_ends_at: null,
//           })
//           .eq("id", businessId);
//       }
//     }

//     return NextResponse.json({ received: true });
//   } catch (error: any) {
//     console.error("PayPal webhook error:", error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }

// // app/api/webhooks/mpesa/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@supabase/supabase-js";

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!,
// );

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const { Body } = body;

//     if (Body.stkCallback.ResultCode === 0) {
//       // Payment successful
//       const checkoutRequestId = Body.stkCallback.CheckoutRequestID;
//       const mpesaReceiptNumber = Body.stkCallback.CallbackMetadata?.Item?.find(
//         (i: any) => i.Name === "MpesaReceiptNumber",
//       )?.Value;

//       // Find the payment
//       const { data: payment } = await supabase
//         .from("business_payments")
//         .update({
//           status: "completed",
//           transaction_id: mpesaReceiptNumber,
//           paid_at: new Date().toISOString(),
//           metadata: body,
//         })
//         .eq("transaction_id", checkoutRequestId)
//         .eq("status", "pending")
//         .select()
//         .single();

//       if (payment) {
//         const nextBilling = new Date();
//         nextBilling.setMonth(
//           nextBilling.getMonth() +
//             (payment.billing_cycle === "annual" ? 12 : 1),
//         );

//         await supabase
//           .from("businesses")
//           .update({
//             plan: payment.plan,
//             subscription_status: "active",
//             last_payment_at: new Date().toISOString(),
//             next_billing_at: nextBilling.toISOString(),
//             payment_method: "mpesa",
//             trial_ends_at: null,
//           })
//           .eq("id", payment.business_id);
//       }
//     }

//     return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
//   } catch (error: any) {
//     console.error("M-Pesa webhook error:", error);
//     return NextResponse.json(
//       { ResultCode: 1, ResultDesc: "Error" },
//       { status: 500 },
//     );
//   }
// }
