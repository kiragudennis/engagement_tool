// types/engage.ts

export interface Business {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  brand_color: string;
  brand_secondary_color: string;
  custom_domain?: string;

  plan: "trial" | "starter" | "pro" | "enterprise";
  subscription_status:
    | "trial"
    | "active"
    | "past_due"
    | "cancelled"
    | "expired";
  trial_ends_at: string;

  activation_duration_days: number;
  require_reactivation_after_expiry: boolean;
  max_spins_per_activation: number;

  admin_email: string;

  created_at: string;
}

export interface AccessCode {
  id: string;
  business_id: string;
  code: string;
  type: "public" | "single_use" | "time_limited" | "bulk" | "qr";
  label?: string;
  unlocks: "spin" | "trivia" | "both";
  max_uses?: number;
  current_uses: number;
  max_uses_per_user: number;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
}

export interface CustomerBusinessActivation {
  id: string;
  user_id: string;
  business_id: string;
  business_name?: string;
  business_slug?: string;
  business_logo?: string;
  business_color?: string;
  expires_at: string;
  spins_used: number;
  is_active: boolean;
}

export interface CodeRedemptionResult {
  success: boolean;
  error?: string;
  business_id?: string;
  business_name?: string;
  business_slug?: string;
  expires_at?: string;
  unlocks?: "spin" | "trivia" | "both";
  redirect_url?: string;
}
