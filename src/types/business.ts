// src/types/business.ts
export interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  website: string | null;
  location: string | null;
  logo_url: string;
  cover_image_url: string;
  brand_color: string;
  brand_secondary_color: string;
  favicon_url: string;
  custom_domain: string;
  plan:
    | "trial"
    | "starter"
    | "pro"
    | "enterprise"
    | "early_bronze"
    | "early_silver"
    | "early_gold";
  subscription_status:
    | "trial"
    | "active"
    | "past_due"
    | "cancelled"
    | "expired";
  stripe_customer_id: string;
  stripe_subscription_id: string;
  trial_ends_at: string;

  activation_duration_days: number;
  require_reactivation_after_expiry: boolean;
  max_spins_per_activation: number;
  max_spins_per_month: number;

  require_email_for_prize: boolean;
  show_branding_on_live: boolean;

  admin_email: string;
  admin_name: string;

  last_payment_at: string | null;
  next_billing_at: string | null;
  payment_method: "mpesa" | "paystack" | "card" | "none";
  type: "retail" | "restaurant" | "service" | "event" | "other";
  paystack_customer_code: string;
  paystack_subscription_code: string;
  mpesa_phone: string | null;
  points_per_redemption: number;
  points_value: number;

  // ENGAGEMENT
  engagements_this_month: number;
  trivia_answers_this_month: number;
  draw_entries_this_month: number;
  code_redemptions_this_month: number;
  spins_this_month: number;
  viewer_engagements_count: number;
  viewer_prizes_claimed: number;
  sticker_codes_this_month: number;
  pos_codes_this_month: number;
  public_codes_this_month: number;
  plan_locked_until: string | null;

  created_at: string;
  updated_at: string;
}
