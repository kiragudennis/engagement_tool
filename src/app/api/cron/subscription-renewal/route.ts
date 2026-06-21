import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSubscriptionAmountKes } from "@/lib/services/paystack";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const { data: dueBusinesses } = await supabaseAdmin
    .from("businesses")
    .select("id, slug, plan, billing_cycle, mpesa_phone, next_billing_at")
    .eq("subscription_status", "active")
    .eq("payment_method", "mpesa")
    .not("mpesa_phone", "is", null)
    .lte("next_billing_at", threeDaysFromNow.toISOString());

  let reminders = 0;

  for (const biz of dueBusinesses || []) {
    const cycle = (biz as { billing_cycle?: string }).billing_cycle === "annual"
      ? "annual"
      : "monthly";
    const amount = getSubscriptionAmountKes(biz.plan, cycle);

    await supabaseAdmin.from("business_payments").insert({
      business_id: biz.id,
      amount,
      currency: "KES",
      plan: biz.plan,
      billing_cycle: cycle,
      payment_method: "mpesa",
      status: "pending",
      metadata: { type: "renewal_reminder", phone: biz.mpesa_phone },
    });

    reminders++;
  }

  const { data: expired } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("subscription_status", "past_due")
    .lt("next_billing_at", new Date().toISOString());

  for (const biz of expired || []) {
    await supabaseAdmin
      .from("businesses")
      .update({ subscription_status: "expired" })
      .eq("id", biz.id);
  }

  return NextResponse.json({
    success: true,
    renewalReminders: reminders,
    expiredCount: expired?.length || 0,
  });
}
