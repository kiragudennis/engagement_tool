// app/api/business/codes/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createCodeSchema = z.object({
  slug: z.string().min(1),
  type: z
    .enum(["public", "single_use", "time_limited", "qr", "sticker"])
    .default("public"),
  label: z.string().optional(),
  unlocks: z
    .enum(["spin", "trivia", "draw", "spin_draw", "trivia_draw", "all"])
    .default("spin"),
  tier: z.enum(["standard", "bronze", "silver", "gold", "diamond"]).optional(),
  point_value: z.number().positive().optional(),
  max_uses: z.number().positive().optional(),
  max_uses_per_user: z.number().min(1).default(1),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Auth
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (!user || userError) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createCodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      slug,
      type,
      label,
      unlocks,
      tier,
      point_value,
      max_uses,
      max_uses_per_user,
      valid_from,
      valid_until,
    } = parsed.data;

    // Get business
    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select("id, name, slug, plan")
      .eq("slug", slug)
      .single();
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // Check admin access
    const { data: admin } = await supabaseAdmin
      .from("business_admins")
      .select("id")
      .eq("business_id", business.id)
      .eq("user_id", user.id)
      .single();
    if (!admin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Determine code type from plan
    const planCodeType =
      business.plan === "enterprise"
        ? "E"
        : business.plan === "pro"
          ? "P"
          : "S";
    const codeSubtype = type === "sticker" ? "S" : type === "qr" ? "Q" : "P";

    // Generate code using unified RPC
    const { data: result, error: codeError } = await supabaseAdmin.rpc(
      "generate_business_code",
      {
        p_business_id: business.id,
        p_code_type: planCodeType,
        p_code_subtype: codeSubtype,
        p_tier: tier || "standard",
        p_points_earned: point_value || null,
        p_unlocks: unlocks,
        p_source: "dashboard",
        p_created_by: user.id,
      },
    );

    if (codeError || !result) {
      console.error("Code generation error:", codeError);
      return NextResponse.json(
        { error: "Failed to generate code" },
        { status: 500 },
      );
    }

    // Update additional fields
    const updates: any = {};
    if (label) updates.label = label;
    if (max_uses) updates.max_uses = max_uses;
    if (max_uses_per_user) updates.max_uses_per_user = max_uses_per_user;
    if (valid_from) updates.valid_from = valid_from;
    if (valid_until) updates.valid_until = valid_until;

    if (Object.keys(updates).length > 0) {
      await supabaseAdmin
        .from("access_codes")
        .update(updates)
        .eq("id", (result as any).code_id);
    }

    return NextResponse.json({
      success: true,
      code: (result as any).code,
      points_earned: (result as any).points_earned,
    });
  } catch (error: any) {
    console.error("Code creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
