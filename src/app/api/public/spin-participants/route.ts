import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get("game_id");

    if (!gameId) {
      return NextResponse.json(
        { error: "game_id is required" },
        { status: 400 },
      );
    }

    const { count, error } = await supabaseAdmin
      .from("spin_participants")
      .select("*", { count: "exact", head: true })
      .eq("game_id", gameId);

    if (error) throw error;

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error("Spin participants error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
