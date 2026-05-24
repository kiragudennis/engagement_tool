// app/api/checkout/mpesa/bundle/route.ts

import { secureRatelimit } from "@/lib/limit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateToken } from "@/lib/utils";
import axios from "axios";
import { checkBotId } from "botid/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const {
    bundleId,
    phoneNumber,
    quantity = 1,
    selectedItems = [],
    usePoints = false,
  } = body;

  const access_key = process.env.EXCHANGE_API_KEY;
  const endpoint = process.env.ENDPOINT;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  // Validate phone number
  if (
    !phoneNumber ||
    phoneNumber.length !== 12 ||
    !phoneNumber.startsWith("254")
  ) {
    return NextResponse.json(
      { error: "Invalid phone number" },
      { status: 400 },
    );
  }

  if (!bundleId) {
    return NextResponse.json({ error: "Bundle ID required" }, { status: 400 });
  }

  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { success } = await secureRatelimit(req);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: "Unauthorized", redirect: "/login" },
      { status: 401 },
    );
  }

  // Fetch bundle details
  const { data: bundle, error: bundleError } = await supabaseAdmin
    .from("bundles")
    .select("*")
    .eq("id", bundleId)
    .single();

  if (bundleError || !bundle) {
    return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
  }

  // Check availability
  if (bundle.remaining_count !== null && bundle.remaining_count < quantity) {
    return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
  }

  // Calculate pricing
  let finalPrice = bundle.discounted_price || bundle.base_price;
  let originalPrice = bundle.base_price;
  let pointsUsed = 0;

  // Handle points discount
  if (usePoints && bundle.points_required > 0) {
    const { data: userPoints } = await supabaseAdmin
      .from("loyalty_points")
      .select("points")
      .eq("user_id", user.id)
      .single();

    if (userPoints && userPoints.points >= bundle.points_required) {
      const pointsDiscount = bundle.points_required / 10; // 10 points = 1 KSH
      finalPrice = Math.max(0, finalPrice - pointsDiscount);
      pointsUsed = bundle.points_required;
    }
  }

  // Apply quantity
  finalPrice = finalPrice * quantity;
  originalPrice = originalPrice * quantity;

  // Handle build-your-own items
  let selectedItemsJson = [];
  if (selectedItems.length > 0) {
    selectedItemsJson = selectedItems;
  }

  // Create order record
  // Instead of creating a real order, create a pending order:
  const { data: pendingOrder, error: pendingError } = await supabaseAdmin
    .from("bundle_pending_orders")
    .insert({
      user_id: user.id,
      bundle_id: bundleId,
      customer_name: user.user_metadata?.full_name || "Customer",
      customer_email: user.email,
      customer_phone: phoneNumber,
      shipping_address: "To be confirmed",
      shipping_city: "To be confirmed",
      shipping_county: "To be confirmed",
      subtotal: originalPrice,
      coupon_discount: originalPrice - finalPrice,
      loyalty_points_used: pointsUsed,
      loyalty_discount:
        pointsUsed > 0 ? (bundle.points_required / 10) * quantity : 0,
      selected_items: selectedItemsJson,
      quantity: quantity,
      status: "pending",
    })
    .select()
    .single();

  if (pendingError) {
    console.error("Pending order creation error:", pendingError);
    return NextResponse.json(
      { error: "Failed to create pending order" },
      { status: 500 },
    );
  }

  // Convert currency if needed
  let amountKES = finalPrice;
  const currency = "KES";

  if (currency !== "KES") {
    try {
      const res = await fetch(
        `https://api.exchangerate.host/${endpoint}?access_key=${access_key}&from=${currency}&to=KES&amount=${amountKES}`,
        { next: { revalidate: 3600 * 12 } },
      );
      const json = await res.json();
      const rate = json.result;
      if (rate) amountKES = Math.round(rate);
    } catch (err) {
      console.error("Exchange rate fetch failed", err);
    }
  }

  // Prepare M-Pesa STK push
  const current_time = new Date();
  const year = current_time.getFullYear();
  const month = String(current_time.getMonth() + 1).padStart(2, "0");
  const day = String(current_time.getDate()).padStart(2, "0");
  const hours = String(current_time.getHours()).padStart(2, "0");
  const minutes = String(current_time.getMinutes()).padStart(2, "0");
  const seconds = String(current_time.getSeconds()).padStart(2, "0");

  const shortCode = process.env.MPESA_SHORTCODE!;
  const passKey = process.env.MPESA_PASSKEY!;
  const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
  const password = Buffer.from(shortCode + passKey + timestamp).toString(
    "base64",
  );

  try {
    const token = await generateToken();

    const { data } = await axios.post(
      "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerBuyGoodsOnline",
        Amount: Math.round(amountKES),
        PartyA: phoneNumber,
        PartyB: process.env.MPESA_TILL!,
        PhoneNumber: phoneNumber,
        CallBackURL: `${siteUrl}/api/bundles/mpesa/callback?orderId=${pendingOrder.id}&callbackSecret=${process.env.MPESA_CALLBACK_SECRET!}`,
        AccountReference: bundle.name.slice(0, 12),
        TransactionDesc: "Bundle Purchase",
      },
      {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (data.ResponseCode !== "0") {
      throw new Error(`M-Pesa error: ${data.ResponseDescription}`);
    }

    // Update order with M-Pesa request ID
    await supabaseAdmin
      .from("bundle_pending_orders")
      .update({
        metadata: {
          ...pendingOrder.metadata,
          mpesa_checkout_request_id: data.CheckoutRequestID,
          mpesa_merchant_request_id: data.MerchantRequestID,
        },
      })
      .eq("id", pendingOrder.id);

    return NextResponse.json(
      {
        success: true,
        orderId: pendingOrder.id,
        checkoutRequestId: data.CheckoutRequestID,
        message: "STK push sent successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("M-Pesa checkout error:", error);

    // Update order as failed
    await supabaseAdmin
      .from("bundle_pending_orders")
      .update({
        payment_status: "failed",
        status: "cancelled",
        metadata: {
          ...pendingOrder.metadata,
          payment_error: error.message,
        },
      })
      .eq("id", pendingOrder.id);

    return NextResponse.json(
      { error: error.message || "Failed to initiate payment" },
      { status: 500 },
    );
  }
}
