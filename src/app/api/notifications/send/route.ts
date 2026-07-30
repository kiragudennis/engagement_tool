// app/api/notifications/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import twilio from "twilio";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      business_id,
      type,
      title,
      message,
      email,
      phone,
      email_html,
      email_text,
      sms_body,
      metadata = {},
    } = body;

    if (!user_id || !type || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields: user_id, type, title, message" },
        { status: 400 }
      );
    }

    // Verify auth
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    let isAdmin = false;
    let isBusinessAdmin = false;
    let effectiveBusinessId: string | null = business_id || null;

    if (session) {
      const { data: profile } = await supabaseAdmin
        .from("users")
        .select("id, role")
        .eq("id", session.user.id)
        .single();

      if (profile?.role === "admin") {
        isAdmin = true;
      }

      // Check if user is admin of the business
      if (business_id) {
        const { data: adminBiz } = await supabaseAdmin
          .from("business_admins")
          .select("business_id")
          .eq("user_id", session.user.id)
          .eq("business_id", business_id)
          .single();

        if (adminBiz) {
          isBusinessAdmin = true;
          effectiveBusinessId = business_id;
        }
      }
    }

    // Also allow API key auth for businesses
    const apiKey = req.headers.get("x-api-key");
    if (!isAdmin && !isBusinessAdmin && apiKey) {
      const { data: keyData } = await supabaseAdmin
        .from("business_api_keys")
        .select("business_id")
        .eq("api_key", apiKey)
        .eq("is_active", true)
        .single();

      if (keyData) {
        isBusinessAdmin = true;
        effectiveBusinessId = keyData.business_id;
      }
    }

    if (!isAdmin && !isBusinessAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - admin or business access required" },
        { status: 401 }
      );
    }

    // If business_id is provided, verify it matches the authenticated business
    if (business_id && effectiveBusinessId !== business_id) {
      return NextResponse.json(
        { error: "Forbidden - you do not have access to this business" },
        { status: 403 }
      );
    }

    const results = { inApp: false, email: false, sms: false };

    // 1. In-app notification
    try {
      const { data: notif, error: notifError } = await supabaseAdmin.rpc(
        "create_notification",
        {
          p_user_id: user_id,
          p_type: type,
          p_title: title,
          p_message: message,
          p_metadata: {
            ...metadata,
            business_id: effectiveBusinessId,
            source: isAdmin ? "admin" : "business",
          },
          p_business_id: effectiveBusinessId,
        },
      );

      if (notifError) {
        console.error("In-app notification error:", notifError);
      } else {
        results.inApp = true;
      }
    } catch (error) {
      console.error("In-app notification error:", error);
    }

    // 2. Email via Resend
    if (email && email_html) {
      try {
        const { resend } = await import("@/lib/limit");
        await resend.emails.send({
          from: `Engage <${process.env.RESEND_FROM_EMAIL || "notifications@engagespin.com"}>`,
          to: email,
          subject: title,
          html: email_html,
          text: email_text || message,
        } as any);
        results.email = true;
      } catch (error) {
        console.error("Email notification error:", error);
      }
    }

    // 3. SMS via Twilio
    if (phone && sms_body) {
      try {
        const twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN,
        );
        await twilioClient.messages.create({
          body: sms_body,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone,
        });
        results.sms = true;
      } catch (error) {
        console.error("SMS notification error:", error);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      notification: {
        user_id,
        business_id: effectiveBusinessId,
        type,
        title,
        message,
      },
    });
  } catch (error: any) {
    console.error("Notification send error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
