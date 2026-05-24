// app/api/webhooks/bundle/route.ts

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createBundleOrderItems } from "@/lib/bundles/order-items";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get("orderId");
    const callbackSecret = url.searchParams.get("callbackSecret");

    if (!orderId || !callbackSecret) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 },
      );
    }

    if (callbackSecret !== process.env.MPESA_CALLBACK_SECRET) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
    }

    const body = await request.json();
    const { Body } = body;

    if (!Body?.stkCallback) {
      return NextResponse.json({ error: "Invalid callback" }, { status: 400 });
    }

    const stkCallback = Body.stkCallback;
    const items = stkCallback.CallbackMetadata?.Item || [];
    const receipt = items.find(
      (i: any) => i.Name === "MpesaReceiptNumber",
    )?.Value;
    const amount = items.find((i: any) => i.Name === "Amount")?.Value;
    const phone = items.find((i: any) => i.Name === "PhoneNumber")?.Value;

    // Get the pending bundle order
    const { data: pendingOrder, error: orderError } = await supabaseAdmin
      .from("bundle_pending_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !pendingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Handle failed payment
    if (stkCallback.ResultCode !== 0) {
      await supabaseAdmin
        .from("bundle_pending_orders")
        .update({ status: "failed", payment_failure: stkCallback.ResultDesc })
        .eq("id", orderId);

      return NextResponse.json({ message: "Payment failed" }, { status: 200 });
    }

    // Get bundle details
    const { data: bundle, error: bundleError } = await supabaseAdmin
      .from("bundles")
      .select("*")
      .eq("id", pendingOrder.bundle_id)
      .single();

    if (bundleError || !bundle) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
    }

    // Create the actual order
    const { data: order, error: createError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: pendingOrder.user_id,
        customer_name: pendingOrder.customer_name,
        customer_email: pendingOrder.customer_email,
        customer_phone: phone,
        shipping_address: pendingOrder.shipping_address,
        shipping_city: pendingOrder.shipping_city,
        shipping_county: pendingOrder.shipping_county,
        shipping_postal_code: pendingOrder.shipping_postal_code,
        shipping_method: pendingOrder.shipping_method,
        shipping_cost: pendingOrder.shipping_cost,
        payment_method: "mpesa",
        payment_status: "completed",
        payment_reference: receipt,
        subtotal: pendingOrder.subtotal,
        coupon_discount: pendingOrder.coupon_discount,
        loyalty_points_used: pendingOrder.loyalty_points_used,
        loyalty_discount: pendingOrder.loyalty_discount,
        shipping_total: pendingOrder.shipping_cost,
        total_amount: amount,
        status: "processing",
        metadata: {
          bundle_id: bundle.id,
          bundle_name: bundle.name,
          bundle_type: bundle.bundle_type,
          selected_items: pendingOrder.selected_items,
          is_bundle_purchase: true,
          mpesa_receipt: receipt,
        },
      })
      .select()
      .single();

    if (createError) {
      console.error("Order creation error:", createError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 },
      );
    }

    // Create order items for each product in the bundle
    await createBundleOrderItems(
      supabaseAdmin,
      order.id,
      bundle,
      pendingOrder.selected_items,
    );

    // Record bundle purchase
    const { data: bundlePurchase, error: purchaseError } = await supabaseAdmin
      .from("bundle_purchases")
      .insert({
        bundle_id: bundle.id,
        user_id: pendingOrder.user_id,
        order_id: order.id,
        quantity: 1,
        selected_items: pendingOrder.selected_items,
        original_price: pendingOrder.subtotal,
        discount_amount:
          pendingOrder.coupon_discount + pendingOrder.loyalty_discount,
        final_price: amount,
        points_used: pendingOrder.loyalty_points_used,
        points_awarded: bundle.bonus_points,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (purchaseError) {
      console.error("Bundle purchase error:", purchaseError);
    }

    // Award points
    if (bundle.bonus_points > 0) {
      await supabaseAdmin.rpc("award_loyalty_points", {
        p_user_id: pendingOrder.user_id,
        p_points: bundle.bonus_points,
        p_source: "bundle_purchase",
        p_source_id: bundle.id,
      });
    }

    // Deduct points if used
    if (pendingOrder.loyalty_points_used > 0) {
      await supabaseAdmin.rpc("deduct_loyalty_points", {
        p_user_id: pendingOrder.user_id,
        p_points: pendingOrder.loyalty_points_used,
        p_source: "bundle_purchase",
        p_source_id: bundle.id,
      });
    }

    // Update bundle stock
    await supabaseAdmin.rpc("decrement_bundle_stock", {
      p_bundle_id: bundle.id,
      p_quantity: 1,
    });

    // Add to live ticker
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("full_name")
      .eq("id", pendingOrder.user_id)
      .single();

    await supabaseAdmin.from("bundle_live_ticker").insert({
      bundle_id: bundle.id,
      user_name: user?.full_name || "Customer",
      action: "purchased",
      message: `${user?.full_name || "Someone"} purchased ${bundle.name} bundle!`,
      metadata: { order_id: order.id },
    });

    // Delete pending order
    await supabaseAdmin
      .from("bundle_pending_orders")
      .delete()
      .eq("id", orderId);

    console.log(
      `✅ Bundle purchase completed: ${bundle.name} - Order: ${order.order_number}`,
    );

    return NextResponse.json(
      { message: "Bundle purchase completed", orderId: order.id },
      { status: 200 },
    );
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
