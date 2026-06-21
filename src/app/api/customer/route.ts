// app/api/customer/redeem-code/route.ts
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const redeemSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .transform((v) => v.toUpperCase().trim()),
  fullName: z
    .string()
    .min(1, "Name is required")
    .transform((v) => v.trim()),
  email: z
    .email("Valid email required")
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate
    const parsed = redeemSchema.safeParse(body);
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

    // Validate code exists
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

    // Check code limits
    if (codeData.max_uses && codeData.current_uses >= codeData.max_uses) {
      return NextResponse.json(
        { error: "This code has reached its maximum uses" },
        { status: 400 },
      );
    }

    // Create or find user
    let userId: string;
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

    if (authError) {
      if (authError.message?.includes("already been registered")) {
        const {
          data: { users },
        } = await supabaseAdmin.auth.admin.listUsers();
        const existing = users?.find((u) => u.email === email);
        if (!existing) {
          return NextResponse.json(
            { error: "Failed to find existing account" },
            { status: 500 },
          );
        }
        userId = existing.id;
      } else {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
    } else {
      userId = authData.user!.id;
    }

    // Ensure public.users record
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

    // Check if user already used this code
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

    // Redeem the code via RPC (uses service role so RLS is bypassed)
    const { data: redeemResult, error: redeemError } = await supabaseAdmin.rpc(
      "redeem_access_code",
      {
        p_code: code,
        p_user_id: userId,
      },
    );

    if (redeemError) {
      console.error("Redeem error:", redeemError);
      return NextResponse.json(
        { error: "Failed to redeem code" },
        { status: 500 },
      );
    }

    if (!redeemResult.success) {
      return NextResponse.json({ error: redeemResult.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ...redeemResult,
    });
  } catch (error: any) {
    console.error("Code redemption error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
