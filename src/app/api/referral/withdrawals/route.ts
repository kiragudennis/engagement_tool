// app/api/referral/withdrawals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/server";
import { checkBotId } from "botid/server";
import { secureRatelimit } from "@/lib/limit";

export async function GET(req: NextRequest) {
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { success } = await secureRatelimit(req);
  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 },
    );
  }

  try {
    const { user, error: authError } = await requireUser();
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user?.id || "")
      .maybeSingle();

    if (!user || authError || !["super_admin", "business_owner"].includes(profile?.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || null;

    let query = supabaseAdmin
      .from("referral_withdrawals")
      .select(
        "id, referrer_id, amount, currency, payment_method, mpesa_phone, status, processed_at, processed_by, notes, created_at, referrer:users!inner(email, full_name)",
      )
      .order("created_at", { ascending: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data: withdrawals, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch withdrawals" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      withdrawals,
    });
  } catch (error: any) {
    console.error("Withdrawals fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { success } = await secureRatelimit(req);
  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 },
    );
  }

  try {
    const { user, error: authError } = await requireUser();
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user?.id || "")
      .maybeSingle();

    if (!user || authError || profile?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Unauthorized. Super admin access required." },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { withdrawal_id, status, notes } = body;

    if (!withdrawal_id || !status) {
      return NextResponse.json(
        { error: "withdrawal_id and status are required" },
        { status: 400 },
      );
    }

    const result = await supabaseAdmin.rpc("process_withdrawal", {
      p_withdrawal_id: withdrawal_id,
      p_admin_id: user.id,
      p_status: status,
      p_notes: notes || null,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message || "Failed to process withdrawal" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Withdrawal processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
