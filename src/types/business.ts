export interface Business {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
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
  spins_this_month: number;
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

  created_at: string;
  updated_at: string;
}
