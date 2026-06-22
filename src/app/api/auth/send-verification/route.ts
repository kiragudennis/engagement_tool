// app/api/auth/send-verification/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import twilio from "twilio";
import { secureRatelimit } from "@/lib/limit";
import { checkBotId } from "botid/server";
import { createClient } from "@/lib/supabase/server";

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

    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    // Check if phone is already used by another verified account
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("phone", phone)
      .eq("phone_verified", true)
      .neq("id", user.id)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "This phone number is already linked to another account" },
        { status: 409 },
      );
    }

    if (!twilioClient || !TWILIO_VERIFY_SID) {
      // Development fallback - auto-verify
      console.log("Twilio not configured - auto-verifying phone:", phone);
      await supabaseAdmin
        .from("users")
        .update({
          phone,
          phone_verified: true,
        })
        .eq("id", user.id);

      return NextResponse.json({ success: true, dev: true });
    }

    // Send verification code via Twilio Verify
    await twilioClient.verify.v2
      .services(TWILIO_VERIFY_SID)
      .verifications.create({ to: phone, channel: "sms" });

    // Store phone temporarily (unverified)
    await supabaseAdmin
      .from("users")
      .update({
        phone,
        phone_verified: false,
      })
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Send verification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send verification code" },
      { status: 500 },
    );
  }
}
