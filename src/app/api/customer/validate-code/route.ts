import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const codeSchema = z.object({
  code: z
    .string()
    .min(1)
    .transform((v) => v.toUpperCase().trim()),
});

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const parsed = codeSchema.safeParse({ code });
    if (!parsed.success) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const { data: codeData } = await supabaseAdmin
      .from("access_codes")
      .select(
        `
        id, business_id, code, unlocks, type, max_uses, current_uses,
        businesses!inner(id, name, slug, logo_url, brand_color)
      `,
      )
      .eq("code", parsed.data.code)
      .eq("is_active", true)
      .maybeSingle();

    if (!codeData) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 404 },
      );
    }

    const business = (codeData.businesses as unknown as {
      id: string;
      name: string;
      slug: string;
      logo_url: string | null;
      brand_color: string;
    }[])
      ? Array.isArray(codeData.businesses)
        ? codeData.businesses[0]
        : codeData.businesses
      : null;

    const result: Record<string, unknown> = {
      business_name: business?.name,
      business_slug: business?.slug,
      business_logo: business?.logo_url,
      business_color: business?.brand_color,
      unlocks: codeData.unlocks,
      code: codeData.code,
      redirect_url: `/${business?.slug}/spin`,
    };

    if (codeData.unlocks === "draw" || codeData.unlocks === "both") {
      const { data: draw } = await supabaseAdmin
        .from("draws")
        .select("id, name, prize_name, entry_ends_at")
        .eq("access_code_id", codeData.id)
        .eq("status", "open")
        .maybeSingle();

      if (draw) {
        result.draw_name = draw.name;
        result.draw_prize = draw.prize_name;
        result.draw_ends_at = draw.entry_ends_at;
        result.redirect_url = `/${business?.slug}/draw/${draw.id}`;
      }
    }

    if (codeData.unlocks === "trivia") {
      const { data: challenge } = await supabaseAdmin
        .from("challenges")
        .select("id, name, starts_at")
        .eq("business_id", business?.id)
        .eq("challenge_type", "trivia")
        .in("status", ["active", "live"])
        .order("starts_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (challenge) {
        result.trivia_name = challenge.name;
        result.trivia_time = challenge.starts_at;
        result.redirect_url = `/${business?.slug}/trivia/${challenge.id}`;
      }
    }

    if (codeData.max_uses && codeData.current_uses >= codeData.max_uses) {
      return NextResponse.json(
        { error: "This code has reached its maximum uses" },
        { status: 400 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Validate code error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
