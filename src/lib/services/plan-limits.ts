import { SupabaseClient } from "@supabase/supabase-js";
import {
  getPlanLimits,
  type PlanLimits,
  isUnlimited,
} from "@/lib/config/plans";

export type { PlanLimits };

export { getPlanLimits };

export async function checkEngagementLimit(
  supabase: SupabaseClient,
  businessId: string,
): Promise<{ allowed: boolean; used: number; max: number }> {
  const { data: business } = await supabase
    .from("businesses")
    .select(
      "plan, subscription_status, engagements_this_month, spins_this_month, trial_ends_at",
    )
    .eq("id", businessId)
    .single();

  if (!business) return { allowed: false, used: 0, max: 0 };

  const limits = getPlanLimits(business.plan);
  const used =
    business.engagements_this_month ?? business.spins_this_month ?? 0;

  const trialExpired =
    business.subscription_status === "trial" &&
    business.trial_ends_at &&
    new Date(business.trial_ends_at) <= new Date();

  const subscriptionBlocked = ["expired", "past_due", "cancelled"].includes(
    business.subscription_status,
  );

  if (trialExpired || subscriptionBlocked) {
    return { allowed: false, used, max: limits.maxEngagementsPerMonth };
  }

  return {
    allowed: used < limits.maxEngagementsPerMonth,
    used,
    max: limits.maxEngagementsPerMonth,
  };
}

export async function incrementEngagementCount(
  supabase: SupabaseClient,
  businessId: string,
  type: "spin" | "trivia" | "draw" = "spin",
): Promise<void> {
  await supabase.rpc("increment_business_engagement", {
    p_business_id: businessId,
    p_type: type,
  });
}

/** @deprecated use incrementEngagementCount */
export async function incrementSpinCount(
  supabase: SupabaseClient,
  businessId: string,
): Promise<void> {
  return incrementEngagementCount(supabase, businessId, "spin");
}

/** @deprecated use checkEngagementLimit */
export async function checkSpinLimit(
  supabase: SupabaseClient,
  businessId: string,
): Promise<{ allowed: boolean; used: number; max: number }> {
  return checkEngagementLimit(supabase, businessId);
}

async function countUnderLimit(
  supabase: SupabaseClient,
  businessId: string,
  table: string,
  max: number,
  extraFilter?: Record<string, string>,
): Promise<boolean> {
  if (isUnlimited(max)) return true;

  let query = supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  if (extraFilter) {
    for (const [key, value] of Object.entries(extraFilter)) {
      query = query.eq(key, value);
    }
  }

  const { count } = await query;
  return (count || 0) < max;
}

export async function canCreateSpinGame(
  supabase: SupabaseClient,
  businessId: string,
): Promise<boolean> {
  const { data: business } = await supabase
    .from("businesses")
    .select("plan")
    .eq("id", businessId)
    .single();
  if (!business) return false;
  return countUnderLimit(
    supabase,
    businessId,
    "spin_games",
    getPlanLimits(business.plan).maxSpinGames,
  );
}

export async function canCreateTriviaChallenge(
  supabase: SupabaseClient,
  businessId: string,
): Promise<boolean> {
  const { data: business } = await supabase
    .from("businesses")
    .select("plan")
    .eq("id", businessId)
    .single();
  if (!business) return false;
  return countUnderLimit(
    supabase,
    businessId,
    "challenges",
    getPlanLimits(business.plan).maxTriviaChallenges,
    { challenge_type: "trivia" },
  );
}

export async function canCreateDraw(
  supabase: SupabaseClient,
  businessId: string,
): Promise<boolean> {
  const { data: business } = await supabase
    .from("businesses")
    .select("plan")
    .eq("id", businessId)
    .single();
  if (!business) return false;
  return countUnderLimit(
    supabase,
    businessId,
    "draws",
    getPlanLimits(business.plan).maxActiveDraws,
    { status: "open" },
  );
}

export async function canCreateCode(
  supabase: SupabaseClient,
  businessId: string,
): Promise<boolean> {
  const { data: business } = await supabase
    .from("businesses")
    .select("plan")
    .eq("id", businessId)
    .single();
  if (!business) return false;
  return countUnderLimit(
    supabase,
    businessId,
    "access_codes",
    getPlanLimits(business.plan).maxCodes,
  );
}

export async function canAddAdminUser(
  supabase: SupabaseClient,
  businessId: string,
): Promise<boolean> {
  const { data: business } = await supabase
    .from("businesses")
    .select("plan")
    .eq("id", businessId)
    .single();
  if (!business) return false;
  const limits = getPlanLimits(business.plan);
  const { count } = await supabase
    .from("business_admins")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);
  return (count || 0) < limits.maxAdminUsers;
}
