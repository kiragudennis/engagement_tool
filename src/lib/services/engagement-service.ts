import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/limit";

interface EngagementThreshold {
  plan: string;
  threshold_percent: number;
  message: string;
  subject: string;
}

const THRESHOLDS: EngagementThreshold[] = [
  {
    plan: "starter",
    threshold_percent: 80,
    subject: "You're reaching your monthly engagement limit",
    message: "You've used 80% of your monthly engagement limit. Upgrade to Pro for 10x more engagements.",
  },
  {
    plan: "starter",
    threshold_percent: 95,
    subject: "Your engagement limit is almost reached",
    message: "You've used 95% of your monthly engagement limit. Upgrade now to avoid interruption.",
  },
  {
    plan: "pro",
    threshold_percent: 80,
    subject: "You're reaching your Pro engagement limit",
    message: "You've used 80% of your Pro engagement limit. Contact us for Enterprise plans.",
  },
  {
    plan: "pro",
    threshold_percent: 95,
    subject: "Your Pro engagement limit is almost reached",
    message: "You've used 95% of your Pro engagement limit. Upgrade to Enterprise for unlimited growth.",
  },
];

export async function checkAndSendEngagementNotifications() {
  const { data: businesses, error } = await supabaseAdmin
    .from("businesses")
    .select("id, name, plan, engagements_this_month, admin_email, admin_name, subscription_status")
    .in("subscription_status", ["active", "trial"]);

  if (error || !businesses) {
    console.error("Failed to fetch businesses for engagement check:", error);
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const biz of businesses) {
    const limit = getPlanLimit(biz.plan);
    if (limit <= 0) continue;

    const used = biz.engagements_this_month || 0;
    const percentUsed = (used / limit) * 100;

    for (const threshold of THRESHOLDS.filter(
      (t) => t.plan === biz.plan && percentUsed >= t.threshold_percent
    )) {
      try {
        await resend.emails.send({
          from: "Engage <notifications@engagespin.com>",
          to: biz.admin_email,
          subject: threshold.subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Hi ${biz.admin_name || "there"},</h2>
              <p>${threshold.message}</p>
              <p><strong>Usage:</strong> ${used.toLocaleString()} / ${limit.toLocaleString()} (${Math.round(percentUsed)}%)</p>
              <p><strong>Plan:</strong> ${biz.plan}</p>
              <div style="margin-top: 24px;">
                <a href="https://dashboard.engagespin.com/upgrade" 
                   style="background: #8B5CF6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  Upgrade Plan
                </a>
              </div>
            </div>
          `,
        });

        await supabaseAdmin.from("engagement_notifications").insert({
          business_id: biz.id,
          notification_type: "limit_warning",
          threshold_percent: threshold.threshold_percent,
          channel: "email",
          status: "sent",
          metadata: { used, limit, percentUsed },
        });

        sent++;
      } catch (error) {
        console.error(`Failed to send engagement notification to ${biz.admin_email}:`, error);
        failed++;
      }
    }
  }

  return { sent, failed };
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
