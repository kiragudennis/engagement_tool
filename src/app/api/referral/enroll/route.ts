// app/api/referral/enroll/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/server";
import { checkBotId } from "botid/server";
import { secureRatelimit } from "@/lib/limit";

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
    if (!user || authError) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { commission_type } = body;

    if (
      commission_type !== "one_time" &&
      commission_type !== "recurring"
    ) {
      return NextResponse.json(
        { error: "Invalid commission type. Use 'one_time' or 'recurring'." },
        { status: 400 },
      );
    }

    const result = await supabaseAdmin.rpc("enroll_in_referral_program", {
      p_user_id: user.id,
      p_commission_type: commission_type,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message || "Failed to enroll in referral program" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: unknown) {
    console.error("Referral enrollment error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}

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
    if (!user || authError) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const result = await supabaseAdmin.rpc("check_referral_enrollment", {
      p_user_id: user.id,
    });

    if (result.error) {
      return NextResponse.json(
        { error: "Failed to check enrollment status" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: unknown) {
    console.error("Referral enrollment check error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
