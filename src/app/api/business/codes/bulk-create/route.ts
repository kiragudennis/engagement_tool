// app/api/business/codes/bulk-create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getPlanLimits, isUnlimited } from "@/lib/config/plans";

const bulkCreateSchema = z.object({
  slug: z.string().min(1),
  count: z.number().min(1).max(500),
  unlocks: z
    .enum(["spin", "trivia", "draw", "spin_draw", "trivia_draw", "all"])
    .default("spin"),
  label: z.string().optional(),
  codeSubtype: z.enum(["S", "R", "P"]).default("P"),
  require_activation: z.boolean().optional().default(true),
});

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
    const parsed = bulkCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { slug, count, unlocks, label, codeSubtype, require_activation } = parsed.data;

    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select("id, plan")
      .eq("slug", slug)
      .single();
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    const limits = getPlanLimits(business.plan);

    const limitField =
      codeSubtype === "S"
        ? "maxStickerCodes"
        : codeSubtype === "R"
          ? "maxPosCodes"
          : codeSubtype === "P"
            ? "maxPublicCodes"
            : "maxCodes";
    const baseLimit = (limits as any)[limitField];

    let effectiveLimit = baseLimit;
    if (!isUnlimited(baseLimit)) {
      const { data: dbLimit } = await supabaseAdmin.rpc(
        "get_effective_plan_limit",
        {
          p_business_id: business.id,
          p_limit_type: limitField,
        },
      );

      if (dbLimit) {
        effectiveLimit = dbLimit;
      }
    }

    const typeMap = { S: "sticker", R: "receipt", P: "public" };
    const limitType = typeMap[codeSubtype];

    if (!isUnlimited(effectiveLimit)) {
      const { count: existingCount } = await supabaseAdmin
        .from("access_codes")
        .select("*", { count: "exact", head: true })
        .eq("business_id", business.id)
        .eq("type", limitType);

      if ((existingCount || 0) + count > effectiveLimit) {
        const limitName =
          codeSubtype === "S"
            ? "sticker codes"
            : codeSubtype === "R"
              ? "POS codes"
              : codeSubtype === "P"
                ? "public codes"
                : "access codes";
        return NextResponse.json(
          {
            error: `Plan limit reached. You can only create ${effectiveLimit} ${limitName}.`,
          },
          { status: 403 },
        );
      }
    }

    const { data: admin } = await supabaseAdmin
      .from("business_admins")
      .select("id")
      .eq("business_id", business.id)
      .eq("user_id", user.id)
      .single();
    if (!admin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const planCodeType =
      business.plan === "enterprise"
        ? "E"
        : business.plan === "pro"
          ? "P"
          : "S";
    const generatedCodes: string[] = [];

    for (let i = 0; i < count; i++) {
      const { data: result, error: codeError } = await supabaseAdmin.rpc(
        "generate_business_code",
        {
          p_business_id: business.id,
          p_code_type: planCodeType,
          p_code_subtype: codeSubtype,
         p_unlocks: unlocks,
         p_source: "dashboard_bulk",
         p_created_by: user.id,
         p_require_activation: require_activation,
       },
      );

      if (!codeError && result) {
        generatedCodes.push((result as any).code);

        // Update label if provided
        if (label) {
          await supabaseAdmin
            .from("access_codes")
            .update({ label })
            .eq("id", (result as any).code_id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: generatedCodes.length,
      codes: generatedCodes,
    });
  } catch (error: any) {
    console.error("Bulk code creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
