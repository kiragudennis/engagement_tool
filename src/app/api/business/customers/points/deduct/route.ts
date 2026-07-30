// app/api/business/customers/points/deduct/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, points, reference_id, description } = body;

    if (!user_id || !points || points <= 0) {
      return NextResponse.json(
        { error: "Missing required fields: user_id, points (> 0)" },
        { status: 400 },
      );
    }

    // Verify API key
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing X-API-Key header" },
        { status: 401 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let businessId: string | null = null;

    // Try API key auth first
    if (apiKey) {
      const { data: keyData } = await supabaseAdmin
        .from("business_api_keys")
        .select("business_id")
        .eq("api_key", apiKey)
        .eq("is_active", true)
        .single();

      if (keyData) {
        businessId = keyData.business_id;
      }
    }

    // Fall back to session auth
    if (!businessId && user) {
      const { data: adminProfile } = await supabaseAdmin
        .from("users")
        .select("id, role")
        .eq("id", user.id)
        .single();

      if (adminProfile?.role === "admin") {
        const { data: adminBiz } = await supabaseAdmin
          .from("business_admins")
          .select("business_id")
          .eq("user_id", user.id)
          .single();

        if (adminBiz) {
          businessId = adminBiz.business_id;
        }
      }
    }

    if (!businessId) {
      return NextResponse.json(
        { error: "Unauthorized - invalid API key or session" },
        { status: 401 },
      );
    }

    // Get customer's points for this business
    const { data: loyalty, error: loyaltyError } = await supabaseAdmin
      .from("loyalty_points")
      .select("*")
      .eq("user_id", user_id)
      .eq("business_id", businessId)
      .single();

    if (loyaltyError || !loyalty) {
      return NextResponse.json(
        { error: "Customer has no points record for this business" },
        { status: 404 },
      );
    }

    const currentPoints = loyalty.points || 0;
    if (currentPoints < points) {
      return NextResponse.json(
        {
          error: `Insufficient points. Required: ${points}, Available: ${currentPoints}`,
        },
        { status: 400 },
      );
    }

    const newPoints = currentPoints - points;

    // Update points
    const { error: updateError } = await supabaseAdmin
      .from("loyalty_points")
      .update({
        points: newPoints,
        points_redeemed: (loyalty.points_redeemed || 0) + points,
        updated_at: new Date().toISOString(),
      })
      .eq("id", loyalty.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to deduct points: " + updateError.message },
        { status: 500 },
      );
    }

    // Record transaction
    const { data: transaction, error: txError } = await supabaseAdmin
      .from("loyalty_transactions")
      .insert({
        user_id: user_id,
        business_id: businessId,
        points_change: -points,
        current_points: newPoints,
        transaction_type: "pos_deduction",
        description: description || "Points deducted via POS/checkout",
        metadata: {
          reference_id,
          deducted_by: user?.id || "api",
          business_id: businessId,
        },
      })
      .select()
      .single();

    if (txError) {
      console.error("Transaction record error:", txError);
    }

    return NextResponse.json({
      success: true,
      transaction: transaction || {
        user_id: user_id,
        points_change: -points,
        current_points: newPoints,
        transaction_type: "pos_deduction",
        description: description || "Points deducted via POS/checkout",
      },
    });
  } catch (error: any) {
    console.error("Points deduction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
