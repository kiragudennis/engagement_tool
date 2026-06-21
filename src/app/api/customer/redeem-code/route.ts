import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { redeemCodeSchema } from "@/lib/schemas/auth-schema";
import {
  createSessionForUser,
  findUserIdByEmail,
} from "@/lib/auth/server";
import { secureRatelimit } from "@/lib/limit";

export async function POST(req: NextRequest) {
  try {
    const { success } = await secureRatelimit(req);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = redeemCodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { code, fullName, email, password } = parsed.data;

    const { data: codeData } = await supabaseAdmin
      .from("access_codes")
      .select(
        "id, business_id, code, unlocks, max_uses, current_uses, max_uses_per_user, type",
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

    if (codeData.max_uses && codeData.current_uses >= codeData.max_uses) {
      return NextResponse.json(
        { error: "This code has reached its maximum uses" },
        { status: 400 },
      );
    }

    let userId: string;
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

    if (authError) {
      if (
        authError.message?.includes("already been registered") ||
        authError.message?.includes("already exists")
      ) {
        const existingId = await findUserIdByEmail(email);
        if (!existingId) {
          return NextResponse.json(
            { error: "Failed to find existing account. Try logging in first." },
            { status: 500 },
          );
        }
        userId = existingId;
      } else {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
    } else {
      userId = authData.user!.id;
    }

    await supabaseAdmin.from("users").upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        role: "customer",
        status: "active",
        onboarding_completed: true,
      },
      { onConflict: "id" },
    );

    if (codeData.max_uses_per_user > 0) {
      const { count } = await supabaseAdmin
        .from("access_code_usage")
        .select("*", { count: "exact", head: true })
        .eq("code_id", codeData.id)
        .eq("user_id", userId);

      if (count && count >= codeData.max_uses_per_user) {
        return NextResponse.json(
          { error: "You have already used this code" },
          { status: 400 },
        );
      }
    }

    const { data: redeemResult, error: redeemError } = await supabaseAdmin.rpc(
      "redeem_access_code",
      { p_code: code, p_user_id: userId },
    );

    if (redeemError) {
      console.error("Redeem error:", redeemError);
      return NextResponse.json(
        { error: "Failed to redeem code" },
        { status: 500 },
      );
    }

    if (!redeemResult?.success) {
      return NextResponse.json(
        { error: redeemResult?.error || "Failed to redeem code" },
        { status: 400 },
      );
    }

    const { error: sessionError } = await createSessionForUser(email, password);
    if (sessionError) {
      console.error("Session creation after redeem failed:", sessionError);
    }

    return NextResponse.json({
      success: true,
      ...redeemResult,
    });
  } catch (error) {
    console.error("Code redemption error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
