// lib/services/plan-limits.ts
import { SupabaseClient } from "@supabase/supabase-js";

export interface PlanLimits {
  maxSpinsPerMonth: number;
  maxSpinGames: number;
  maxTriviaChallenges: number;
  maxPrizeSlots: number;
  maxTriviaQuestions: number;
  maxCodes: number;
  maxAdminUsers: number;
  canRemoveBranding: boolean;
  canUseCustomDomain: boolean;
  hasApiAccess: boolean;
  hasAnalytics: boolean;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  trial: {
    maxSpinsPerMonth: 100,
    maxSpinGames: 1,
    maxTriviaChallenges: 1,
    maxPrizeSlots: 6,
    maxTriviaQuestions: 10,
    maxCodes: 3,
    maxAdminUsers: 1,
    canRemoveBranding: false,
    canUseCustomDomain: false,
    hasApiAccess: false,
    hasAnalytics: false,
  },
  starter: {
    maxSpinsPerMonth: 500,
    maxSpinGames: 1,
    maxTriviaChallenges: 1,
    maxPrizeSlots: 6,
    maxTriviaQuestions: 20,
    maxCodes: 10,
    maxAdminUsers: 1,
    canRemoveBranding: false,
    canUseCustomDomain: false,
    hasApiAccess: false,
    hasAnalytics: false,
  },
  pro: {
    maxSpinsPerMonth: 5000,
    maxSpinGames: 3,
    maxTriviaChallenges: 3,
    maxPrizeSlots: 12,
    maxTriviaQuestions: 100,
    maxCodes: 50,
    maxAdminUsers: 3,
    canRemoveBranding: true,
    canUseCustomDomain: true,
    hasApiAccess: false,
    hasAnalytics: true,
  },
  enterprise: {
    maxSpinsPerMonth: 25000,
    maxSpinGames: 999,
    maxTriviaChallenges: 999,
    maxPrizeSlots: 24,
    maxTriviaQuestions: 999,
    maxCodes: 999,
    maxAdminUsers: 10,
    canRemoveBranding: true,
    canUseCustomDomain: true,
    hasApiAccess: true,
    hasAnalytics: true,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.trial;
}

export async function checkSpinLimit(
  supabase: SupabaseClient,
  businessId: string,
): Promise<{ allowed: boolean; used: number; max: number }> {
  const { data: business } = await supabase
    .from("businesses")
    .select("plan, subscription_status, spins_this_month")
    .eq("id", businessId)
    .single();

  if (!business) return { allowed: false, used: 0, max: 0 };

  const limits = getPlanLimits(business.plan);
  const used = business.spins_this_month || 0;

  return {
    allowed: used < limits.maxSpinsPerMonth,
    used,
    max: limits.maxSpinsPerMonth,
  };
}

export async function incrementSpinCount(
  supabase: SupabaseClient,
  businessId: string,
): Promise<void> {
  await supabase.rpc("increment_business_spin_count", {
    p_business_id: businessId,
  });
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

  const limits = getPlanLimits(business.plan);
  const { count } = await supabase
    .from("spin_games")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  return (count || 0) < limits.maxSpinGames;
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

  const limits = getPlanLimits(business.plan);
  const { count } = await supabase
    .from("access_codes")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  return (count || 0) < limits.maxCodes;
}
