// app/api/business/api-key/regenerate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID required" },
        { status: 400 },
      );
    }

    // Deactivate old keys
    await supabaseAdmin
      .from("business_api_keys")
      .update({ is_active: false })
      .eq("business_id", businessId)
      .eq("is_active", true);

    // Generate new key
    const newKey = `engage_live_${crypto.randomBytes(24).toString("hex")}`;

    await supabaseAdmin.from("business_api_keys").insert({
      business_id: businessId,
      name: "POS Integration Key",
      api_key: newKey,
      permissions: ["receipt:create"],
      is_active: true,
    });

    return NextResponse.json({ success: true, api_key: newKey });
  } catch (error: any) {
    console.error("API key regeneration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
