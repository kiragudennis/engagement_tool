// app/api/auth/verify-code/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import twilio from "twilio";
import { createClient } from "@/lib/supabase/server";
import { checkBotId } from "botid/server";
import { secureRatelimit } from "@/lib/limit";

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

const TWILIO_VERIFY_SID = process.env.TWILIO_VERIFY_SID || "";

export async function POST(req: NextRequest) {
  const verification = await checkBotId();

  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { success } = await secureRatelimit(req);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  try {
    // Get authenticated user
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { phone, code } = await req.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Phone and code are required" },
        { status: 400 },
      );
    }

    if (!twilioClient || !TWILIO_VERIFY_SID) {
      // Development fallback
      await supabaseAdmin
        .from("users")
        .update({
          phone_verified: true,
          onboarding_completed: true,
          status: "active",
        })
        .eq("id", user.id);

      return NextResponse.json({ success: true, dev: true });
    }

    // Verify the code
    const verificationCheck = await twilioClient.verify.v2
      .services(TWILIO_VERIFY_SID)
      .verificationChecks.create({ to: phone, code });

    if (verificationCheck.status !== "approved") {
      return NextResponse.json(
        { error: "Invalid verification code. Please try again." },
        { status: 400 },
      );
    }

    // Mark phone as verified
    await supabaseAdmin
      .from("users")
      .update({
        phone,
        phone_verified: true,
        onboarding_completed: true,
        status: "active",
      })
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Verify code error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify code" },
      { status: 500 },
    );
  }
}
