// app/api/business/viewer/claim/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { business_id, game_type, game_id, stream_type } = body;

    if (!business_id || !game_type) {
      return NextResponse.json(
        { error: "business_id and game_type are required" },
        { status: 400 },
      );
    }

    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select("id, plan, subscription_status")
      .eq("id", business_id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    if (
      business.subscription_status === "expired" ||
      business.subscription_status === "cancelled" ||
      business.subscription_status === "past_due"
    ) {
      return NextResponse.json(
        { error: "Business subscription is not active" },
        { status: 403 },
      );
    }

    const { data: result, error: claimError } = await supabaseAdmin.rpc(
      "claim_viewer_prize",
      {
        p_business_id: business_id,
        p_user_id: user.id,
        p_game_type: game_type,
        p_game_id: game_id || null,
        p_stream_type: stream_type || "internal",
      },
    );

    if (claimError) {
      console.error("Viewer prize claim error:", claimError);
      return NextResponse.json(
        { error: "Failed to claim prize" },
        { status: 500 },
      );
    }

    if (!result || !result.success) {
      return NextResponse.json(
        { error: result?.error || "Prize claim failed" },
        { status: 400 },
      );
    }

    await supabaseAdmin
      .from("businesses")
      .update({
        viewer_prizes_claimed: (business as any).viewer_prizes_claimed + 1,
      })
      .eq("id", business_id);

    return NextResponse.json({
      success: true,
      prize_type: result.prize_type,
      prize_value: result.prize_value,
    });
  } catch (error: any) {
    console.error("Viewer prize claim error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
