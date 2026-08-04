// app/api/referral/request-withdrawal/route.ts
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

    const userId = user.id;
    const body = await req.json();
    const { amount, payment_method, mpesa_phone } = body;

    if (!amount || amount < 100) {
      return NextResponse.json(
        { error: "Minimum withdrawal is $100 USD" },
        { status: 400 },
      );
    }

    if (
      payment_method !== "paystack" &&
      payment_method !== "mpesa"
    ) {
      return NextResponse.json(
        { error: "Invalid payment method. Use 'paystack' or 'mpesa'." },
        { status: 400 },
      );
    }

    if (payment_method === "mpesa" && !mpesa_phone) {
      return NextResponse.json(
        { error: "M-Pesa phone number is required for M-Pesa withdrawals" },
        { status: 400 },
      );
    }

    const result = await supabaseAdmin.rpc("create_referral_withdrawal", {
      p_user_id: userId,
      p_amount: Number(amount),
      p_payment_method: payment_method,
      p_mpesa_phone: mpesa_phone || null,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message || "Failed to create withdrawal request" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Withdrawal request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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

    const result = await supabaseAdmin.rpc("get_user_withdrawal_history", {
      p_user_id: user.id,
    });

    if (result.error) {
      return NextResponse.json(
        { error: "Failed to fetch withdrawal history" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      withdrawals: result.data,
    });
  } catch (error: any) {
    console.error("Withdrawal history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
