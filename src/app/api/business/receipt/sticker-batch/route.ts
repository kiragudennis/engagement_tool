// app/api/business/receipt/sticker-batch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

const stickerBatchSchema = z.object({
  slug: z.string(),
  totalStickers: z.number().min(10).max(1000),
  tiers: z.array(
    z.object({
      rarity: z.enum(["bronze", "silver", "gold", "diamond"]),
      percentage: z.number(),
      points: z.number().positive(),
      count: z.number(),
    }),
  ),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = stickerBatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { slug, totalStickers, tiers } = parsed.data;

    // Get business
    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select("id, name, slug, plan, brand_color")
      .eq("slug", slug)
      .single();
    if (!business) {
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

    // Generate batch ID
    const batchId = crypto.randomUUID();
    const batchLabel = `${business.slug}-stickers-${new Date().toISOString().split("T")[0]}`;

    // Generate codes for each tier
    const allStickers: any[] = [];

    for (const tier of tiers) {
      const batchCodes = [];

      for (let i = 0; i < tier.count; i++) {
        const code = await supabaseAdmin
          .rpc("generate_business_code", {
            p_business_id: business.id,
            p_code_type: codeType,
            p_tier: tier.rarity,
          })
          .then(({ data }) => data);

        batchCodes.push({
          business_id: business.id,
          code,
          code_prefix: business.slug.substring(0, 4).toUpperCase(),
          code_type: codeType,
          code_sequence: 0, // Will be set by the function
          type: "sticker",
          label: `${tier.rarity} Sticker - ${tier.points}pts`,
          tier: tier.rarity,
          unlocks: "spin",
          max_uses: 1,
          max_uses_per_user: 1,
          point_value: tier.points,
          batch_id: batchId,
          batch_label: batchLabel,
          is_active: true,
          description: `${tier.rarity} tier sticker code worth ${tier.points} points`,
        });
      }

      // Insert in batches of 50
      for (let j = 0; j < batchCodes.length; j += 50) {
        const chunk = batchCodes.slice(j, j + 50);
        const { data: inserted } = await supabaseAdmin
          .from("access_codes")
          .insert(chunk)
          .select("code, tier, point_value");
        if (inserted) {
          type Tier = "bronze" | "silver" | "gold" | "diamond";
          const colorMap: Record<Tier, string> = {
            bronze: "#CD7F32",
            silver: "#C0C0C0",
            gold: "#FFD700",
            diamond: "#B9F2FF",
          };

          inserted.forEach(
            (c: { code: string; tier: Tier; point_value: number }) =>
              allStickers.push({
                code: c.code,
                rarity: c.tier,
                points: c.point_value,
                color: colorMap[c.tier],
              }),
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      batch_id: batchId,
      business_name: business.name,
      total_count: allStickers.length,
      tiers: tiers.map((t) => ({
        rarity: t.rarity,
        points: t.points,
        count: t.count,
      })),
      stickers: allStickers,
    });
  } catch (error: any) {
    console.error("Sticker batch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
