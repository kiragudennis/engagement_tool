// app/api/business/codes/bulk-create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bulkCreateSchema = z.object({
  slug: z.string().min(1),
  count: z.number().min(1).max(500),
  unlocks: z
    .enum(["spin", "trivia", "draw", "spin_draw", "trivia_draw", "all"])
    .default("spin"),
  label: z.string().optional(),
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

    const { slug, count, unlocks, label } = parsed.data;

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
          p_code_subtype: "P",
          p_unlocks: unlocks,
          p_source: "dashboard_bulk",
          p_created_by: user.id,
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
