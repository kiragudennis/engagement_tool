// app/api/customer/code-lookup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.toUpperCase().trim();

  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  try {
    // Look up the code
    const { data: codeData } = await supabaseAdmin
      .from("access_codes")
      .select(
        `id, business_id, code, unlocks, type, businesses!inner(id, name, slug, logo_url, brand_color)`,
      )
      .eq("code", code)
      .eq("is_active", true)
      .single();

    if (!codeData) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 404 },
      );
    }

    const business = Array.isArray(codeData.businesses)
      ? codeData.businesses[0]
      : codeData.businesses;

    if (!business) {
      return NextResponse.json(
        { error: "Invalid business data" },
        { status: 404 },
      );
    }

    const result: any = {
      code: codeData.code,
      unlocks: codeData.unlocks,
      business_id: business.id,
      business_name: business.name,
      business_slug: business.slug,
      business_logo: business.logo_url,
      business_color: business.brand_color,
      redirect_url: `/${business.slug}/${codeData.unlocks === "trivia" ? "trivia" : "spin"}`,
    };

    // If code unlocks a draw, get draw details
    if (codeData.unlocks === "draw" || codeData.unlocks === "both") {
      const { data: draw } = await supabaseAdmin
        .from("draws")
        .select("name, prize_name, entry_ends_at")
        .eq("access_code_id", codeData.id)
        .eq("status", "open")
        .single();

      if (draw) {
        result.draw_name = draw.name;
        result.draw_prize = draw.prize_name;
        result.draw_ends_at = draw.entry_ends_at;
        result.redirect_url = `/${business.slug}/draw`;
      }
    }

    // If code unlocks trivia, get trivia details
    if (codeData.unlocks === "trivia" || codeData.unlocks === "both") {
      const { data: challenge } = await supabaseAdmin
        .from("challenges")
        .select("name, starts_at")
        .eq("business_id", business.id)
        .eq("challenge_type", "trivia")
        .eq("status", "active")
        .single();

      if (challenge) {
        result.trivia_name = challenge.name;
        result.trivia_time = challenge.starts_at;
      }
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Code lookup error:", error);
    return NextResponse.json(
      { error: "Failed to look up code" },
      { status: 500 },
    );
  }
}
