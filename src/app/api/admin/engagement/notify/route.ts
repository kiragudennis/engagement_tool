import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import twilio from "twilio";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { business_id } = body;

    if (!business_id) {
      return NextResponse.json(
        { error: "business_id is required" },
        { status: 400 }
      );
    }

    const { data: business, error } = await supabaseAdmin
      .from("businesses")
      .select("id, name, plan, engagements_this_month, admin_email, admin_name, mpesa_phone, subscription_status")
      .eq("id", business_id)
      .single();

    if (error || !business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    const limit = getPlanLimit(business.plan);
    if (limit <= 0) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    const used = business.engagements_this_month || 0;
    const percentUsed = (used / limit) * 100;

    const threshold = getThreshold(business.plan, percentUsed);
    if (!threshold) {
      return NextResponse.json(
        { message: "No threshold reached", percentUsed },
        { status: 200 }
      );
    }

    const results = { email: false, sms: false };

    // Send email via Resend
    if (business.admin_email) {
      try {
        const { resend } = await import("@/lib/limit");
        await resend.emails.send({
          from: "Engage <notifications@engagespin.com>",
          to: business.admin_email,
          subject: threshold.subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Hi ${business.admin_name || "there"},</h2>
              <p>${threshold.message}</p>
              <p><strong>Usage:</strong> ${used.toLocaleString()} / ${limit.toLocaleString()} (${Math.round(percentUsed)}%)</p>
              <p><strong>Plan:</strong> ${business.plan}</p>
              <div style="margin-top: 24px;">
                <a href="https://dashboard.engagespin.com/upgrade" 
                   style="background: #8B5CF6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  Upgrade Plan
                </a>
              </div>
            </div>
          `,
        });
        results.email = true;
      } catch (error) {
        console.error("Failed to send email:", error);
      }
    }

    // Send SMS via Twilio
    if (business.mpesa_phone) {
      try {
        const twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        await twilioClient.messages.create({
          body: `${threshold.subject}. Usage: ${used}/${limit} (${Math.round(percentUsed)}%). Upgrade: https://dashboard.engagespin.com/upgrade`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: business.mpesa_phone,
        });
        results.sms = true;
      } catch (error) {
        console.error("Failed to send SMS:", error);
      }
    }

    // Log notification
    await supabaseAdmin.from("engagement_notifications").insert({
      business_id,
      notification_type: "limit_warning",
      threshold_percent: threshold.threshold_percent,
      channel: results.email && results.sms ? "both" : results.email ? "email" : "sms",
      status: results.email || results.sms ? "sent" : "failed",
      metadata: { used, limit, percentUsed },
    });

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Engagement notification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getPlanLimit(plan: string): number {
  const limits: Record<string, number> = {
    trial: 100,
    starter: 1000,
    pro: 10000,
    enterprise: 50000,
    early_bronze: 500,
    early_silver: 2000,
    early_gold: 5000,
  };
  return limits[plan] || 100;
}

function getThreshold(plan: string, percentUsed: number) {
  const thresholds = [
    { plan: "starter", threshold_percent: 80, subject: "You're reaching your monthly engagement limit", message: "You've used 80% of your monthly engagement limit. Upgrade to Pro for 10x more engagements." },
    { plan: "starter", threshold_percent: 95, subject: "Your engagement limit is almost reached", message: "You've used 95% of your monthly engagement limit. Upgrade now to avoid interruption." },
    { plan: "pro", threshold_percent: 80, subject: "You're reaching your Pro engagement limit", message: "You've used 80% of your Pro engagement limit. Contact us for Enterprise plans." },
    { plan: "pro", threshold_percent: 95, subject: "Your Pro engagement limit is almost reached", message: "You've used 95% of your Pro engagement limit. Upgrade to Enterprise for unlimited growth." },
  ];

  return thresholds.find((t) => t.plan === plan && percentUsed >= t.threshold_percent);
}
