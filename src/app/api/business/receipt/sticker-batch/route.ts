// app/api/business/receipt/sticker-batch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const stickerBatchSchema = z.object({
  slug: z.string(),
  totalStickers: z.number().min(10).max(1000),
  tiers: z.array(
    z.object({
      rarity: z.enum(["bronze", "silver", "gold", "diamond"]),
      percentage: z.number(),
      points: z.number().positive(),
      unlocks: z
        .enum(["points", "spin", "spin_draw", "draw"])
        .default("points"),
      count: z.number(),
    }),
  ),
});

const TIER_COLORS: Record<string, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  diamond: "#B9F2FF",
};

export async function POST(req: NextRequest) {
  try {
    // ─── AUTHENTICATION ──────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      NextResponse.json(
        { error: "Not Authorized" },
        {
          status: 403,
        },
      );
    }

    const userId = user?.id;

    const body = await req.json();
    const parsed = stickerBatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { slug, totalStickers, tiers } = parsed.data;

    // Get business
    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("id, name, slug, plan, brand_color")
      .eq("slug", slug)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // Determine code type from plan
    const codeType =
      business.plan === "enterprise"
        ? "E"
        : business.plan === "pro"
          ? "P"
          : "S";

    // Generate batch ID and label
    const batchId = crypto.randomUUID();
    const batchLabel = `${business.slug}-stickers-${new Date().toISOString().split("T")[0]}`;

    // Generate codes for each tier
    const allStickers: any[] = [];
    let totalGenerated = 0;

    for (const tier of tiers) {
      for (let i = 0; i < tier.count; i++) {
        const { data: result, error: codeError } = await supabaseAdmin.rpc(
          "generate_business_code",
          {
            p_business_id: business.id,
            p_code_type: codeType,
            p_code_subtype: "S",
            p_tier: tier.rarity,
            p_points_earned: tier.points,
            p_unlocks: tier.unlocks,
            p_batch_id: batchId,
            p_batch_label: batchLabel,
            p_source: "sticker_batch",
            p_created_by: userId,
          },
        );

        if (codeError) {
          console.error(
            `Code generation error for ${tier.rarity} #${i}:`,
            codeError,
          );
          continue;
        }

        if (result && (result as any).code) {
          allStickers.push({
            code: (result as any).code,
            rarity: tier.rarity,
            points: tier.points,
            unlocks: tier.unlocks,
            color: TIER_COLORS[tier.rarity] || "#8B5CF6",
          });
          totalGenerated++;
        }
      }
    }

    // Record the batch in sticker_batches table
    const { error: batchError } = await supabaseAdmin
      .from("sticker_batches")
      .insert({
        business_id: business.id,
        batch_label: batchLabel,
        total_count: totalGenerated,
        distribution: tiers.map((t) => ({
          rarity: t.rarity,
          count: t.count,
          unlocks: t.unlocks,
          points: t.points,
        })),
        created_by: userId,
      });

    if (batchError) {
      console.error("Batch record error:", batchError);
      // Don't fail - codes were already generated
    }

    return NextResponse.json({
      success: true,
      batch_id: batchId,
      business_name: business.name,
      total_count: totalGenerated,
      tiers: tiers.map((t) => ({
        rarity: t.rarity,
        points: t.points,
        unlocks: t.unlocks,
        count: t.count,
      })),
      stickers: allStickers,
    });
  } catch (error: any) {
    console.error("Sticker batch error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
