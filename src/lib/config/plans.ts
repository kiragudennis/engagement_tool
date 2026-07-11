// src/lib/config/plans.ts
import { Sparkles, Crown, Zap, type LucideIcon, Rocket } from "lucide-react";

export const KES_TO_USD_RATE = 129;

export type PlanId =
  | "trial"
  | "starter"
  | "pro"
  | "enterprise"
  | "early_bronze"
  | "early_silver"
  | "early_gold";
export type BillingCycle = "monthly" | "annual" | "lifetime";

export interface PlanLimits {
  maxEngagementsPerMonth: number;
  maxSpinGames: number;
  maxTriviaChallenges: number;
  maxActiveDraws: number;
  maxPrizeSlots: number;
  maxTriviaQuestions: number;
  maxCodes: number;
  maxAdminUsers: number;
  canRemoveBranding: boolean;
  canUseCustomDomain: boolean;
  hasApiAccess: boolean;
  hasAnalytics: boolean;
}

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  price: number;
  icon: LucideIcon;
  color: string;
  borderColor: string;
  bgGlow: string;
  popular: boolean;
  desc: string;
  limits: PlanLimits;
  features: PlanFeature[];
  paystackPlanCodes: {
    monthly: string;
    annual: string;
    lifetime?: string;
  };
}

export interface EarlyAccessPlanDefinition {
  id: PlanId;
  name: string;
  price: number;
}

const UNLIMITED = 999;

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  trial: {
    maxEngagementsPerMonth: 100,
    maxSpinGames: 1,
    maxTriviaChallenges: 1,
    maxActiveDraws: 1,
    maxPrizeSlots: 6,
    maxTriviaQuestions: 20,
    maxCodes: 3,
    maxAdminUsers: 1,
    canRemoveBranding: false,
    canUseCustomDomain: false,
    hasApiAccess: false,
    hasAnalytics: false,
  },
  starter: {
    maxEngagementsPerMonth: 500,
    maxSpinGames: 1,
    maxTriviaChallenges: 1,
    maxActiveDraws: 1,
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
    maxEngagementsPerMonth: 5000,
    maxSpinGames: 3,
    maxTriviaChallenges: 3,
    maxActiveDraws: 3,
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
    maxEngagementsPerMonth: 25000,
    maxSpinGames: UNLIMITED,
    maxTriviaChallenges: UNLIMITED,
    maxActiveDraws: UNLIMITED,
    maxPrizeSlots: 24,
    maxTriviaQuestions: UNLIMITED,
    maxCodes: UNLIMITED,
    maxAdminUsers: 10,
    canRemoveBranding: true,
    canUseCustomDomain: true,
    hasApiAccess: true,
    hasAnalytics: true,
  },
  early_bronze: {
    maxEngagementsPerMonth: 1000,
    maxSpinGames: 1,
    maxTriviaChallenges: 1,
    maxActiveDraws: 1,
    maxPrizeSlots: 6,
    maxTriviaQuestions: 20,
    maxCodes: 10,
    maxAdminUsers: 1,
    canRemoveBranding: false,
    canUseCustomDomain: false,
    hasApiAccess: false,
    hasAnalytics: false,
  },
  early_silver: {
    maxEngagementsPerMonth: 5000,
    maxSpinGames: 3,
    maxTriviaChallenges: 3,
    maxActiveDraws: 3,
    maxPrizeSlots: 12,
    maxTriviaQuestions: 100,
    maxCodes: 50,
    maxAdminUsers: 3,
    canRemoveBranding: true,
    canUseCustomDomain: true,
    hasApiAccess: false,
    hasAnalytics: true,
  },
  early_gold: {
    maxEngagementsPerMonth: 10000,
    maxSpinGames: 5,
    maxTriviaChallenges: 5,
    maxActiveDraws: 5,
    maxPrizeSlots: 18,
    maxTriviaQuestions: 200,
    maxCodes: 100,
    maxAdminUsers: 5,
    canRemoveBranding: true,
    canUseCustomDomain: true,
    hasApiAccess: true,
    hasAnalytics: true,
  },
};

function formatLimit(value: number, label: string): string {
  return value >= UNLIMITED ? `Unlimited ${label}` : `${value} ${label}`;
}

export const PLANS: PlanDefinition[] = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    icon: Sparkles,
    color: "from-blue-500 to-cyan-500",
    borderColor: "border-blue-500/30",
    bgGlow: "bg-blue-500/10",
    popular: false,
    desc: "For small businesses getting started",
    limits: PLAN_LIMITS.starter,
    paystackPlanCodes: {
      monthly: "PLN_tnycmek89nlf8o4",
      annual: "PLN_cvdw8uhpsxy6749",
    },
    features: [
      { text: "1 spin game", included: true },
      { text: "1 trivia challenge", included: true },
      { text: "1 active draw", included: true },
      { text: "500 engagements/month", included: true },
      { text: "6 prize slots on wheel", included: true },
      { text: "20 trivia questions", included: true },
      { text: "Basic branding (logo + 1 color)", included: true },
      { text: "Customer CSV export", included: true },
      { text: "Live broadcast (OBS)", included: true },
      { text: "QR code generation", included: true },
      { text: "Email support", included: true },
      { text: "Multiple admin users", included: false },
      { text: "Priority support", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 79,
    icon: Crown,
    color: "from-purple-500 to-pink-500",
    borderColor: "border-purple-500/30",
    bgGlow: "bg-purple-500/10",
    popular: true,
    desc: "For growing businesses running regular campaigns",
    limits: PLAN_LIMITS.pro,
    paystackPlanCodes: {
      monthly: "PLN_b8q1ptwh4tyemyd",
      annual: "PLN_kp2bk8mq4wdx6nc",
    },
    features: [
      { text: "3 spin games", included: true },
      { text: "3 trivia challenges", included: true },
      { text: "3 active draws", included: true },
      { text: "5,000 engagements/month", included: true },
      { text: "12 prize slots on wheel", included: true },
      { text: "100 trivia questions", included: true },
      { text: "Full branding customization", included: true },
      { text: "Customer CSV + webhook export", included: true },
      { text: "Live broadcast (OBS)", included: true },
      { text: "Bulk code generation", included: true },
      { text: "Analytics dashboard", included: true },
      { text: "3 admin users", included: true },
      { text: "Priority support", included: true },
      { text: "API access", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 194,
    icon: Zap,
    color: "from-amber-500 to-orange-500",
    borderColor: "border-amber-500/30",
    bgGlow: "bg-amber-500/10",
    popular: false,
    desc: "For chains and high-volume venues",
    limits: PLAN_LIMITS.enterprise,
    paystackPlanCodes: {
      monthly: "PLN_z5ur4kh042dd30y",
      annual: "PLN_bqgtnx8m6mbay27",
    },
    features: [
      { text: "Unlimited spin games", included: true },
      { text: "Unlimited trivia challenges", included: true },
      { text: "Unlimited active draws", included: true },
      { text: "25,000 engagements/month", included: true },
      { text: "24 prize slots on wheel", included: true },
      { text: "Unlimited trivia questions", included: true },
      { text: "Full white-label branding", included: true },
      { text: "Customer CSV + API + Webhooks", included: true },
      { text: "Live broadcast (OBS)", included: true },
      { text: "Multiple locations support", included: true },
      { text: "Advanced analytics", included: true },
      { text: "10 admin users", included: true },
      { text: "Dedicated support", included: true },
      { text: "API access", included: true },
    ],
  },
];

// ─── Early Bird Packages (USD) ──────────────────────────
export const EARLY_BIRD_PACKAGES = [
  {
    id: "bronze",
    name: "Bronze",
    priceUsd: 697, // Break-even at 24 months, saves $173 over 3 years
    color: "from-amber-500 to-orange-500",
    borderColor: "border-amber-500/30",
    bgGlow: "bg-amber-500/10",
    popular: false,
    desc: "For small businesses ready to grow with gamification",
    features: [
      {
        text: "Lifetime access — never pay again",
        included: true,
        highlight: true,
      },
      { text: "3 spin games", included: true },
      { text: "3 trivia challenges", included: true },
      { text: "3 active draws", included: true },
      { text: "5,000 engagements/month", included: true },
      { text: "12 prize slots on wheel", included: true },
      { text: "Full branding customization", included: true },
      { text: "Customer CSV + webhook export", included: true },
      { text: "Live broadcast (OBS)", included: true },
      { text: "Bulk code generation", included: true },
      { text: "Analytics dashboard", included: true },
      { text: "3 admin users", included: true },
      { text: "Priority email support", included: true },
      { text: "API access", included: false },
      { text: "Dedicated support", included: false },
      { text: "Custom integrations", included: false },
    ],
    bestFor: "Coffee shops, salons, small retailers",
  },
  {
    id: "silver",
    name: "Silver",
    priceUsd: 1797, // Break-even at 23 months, saves $573 over 3 years
    color: "from-gray-400 to-gray-500",
    borderColor: "border-gray-400/30",
    bgGlow: "bg-gray-400/10",
    popular: true,
    desc: "For growing businesses running regular campaigns",
    features: [
      {
        text: "Lifetime access — never pay again",
        included: true,
        highlight: true,
      },
      { text: "10 spin games", included: true },
      { text: "10 trivia challenges", included: true },
      { text: "10 active draws", included: true },
      { text: "25,000 engagements/month", included: true },
      { text: "24 prize slots on wheel", included: true },
      { text: "Full branding customization", included: true },
      { text: "Customer CSV + API + Webhooks", included: true },
      { text: "Live broadcast (OBS)", included: true },
      { text: "Bulk code generation", included: true },
      { text: "Advanced analytics", included: true },
      { text: "10 admin users", included: true },
      { text: "Priority support (email + chat)", included: true },
      { text: "API access", included: true },
      { text: "Dedicated support", included: false },
      { text: "Custom integrations", included: false },
    ],
    bestFor: "Restaurants, event venues, mid-size retailers",
  },
  {
    id: "gold",
    name: "Gold",
    priceUsd: 4997, // Break-even at 26 months, saves $823 over 3 years
    color: "from-yellow-400 to-yellow-600",
    borderColor: "border-yellow-500/30",
    bgGlow: "bg-yellow-500/10",
    popular: false,
    desc: "For chains and high-volume venues with multiple locations",
    features: [
      {
        text: "Lifetime access — never pay again",
        included: true,
        highlight: true,
      },
      { text: "Unlimited spin games", included: true },
      { text: "Unlimited trivia challenges", included: true },
      { text: "Unlimited active draws", included: true },
      { text: "100,000 engagements/month", included: true },
      { text: "24 prize slots on wheel", included: true },
      { text: "Full white-label branding", included: true },
      { text: "Customer CSV + API + Webhooks", included: true },
      { text: "Live broadcast (OBS)", included: true },
      { text: "Bulk code generation", included: true },
      { text: "Advanced analytics + custom reports", included: true },
      { text: "Unlimited admin users", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "API access", included: true },
      { text: "Custom integrations", included: true },
      { text: "Multiple location support", included: true },
    ],
    bestFor: "Chains, franchises, agencies managing multiple clients",
  },
];

export const EARLY_ACCESS_PLANS: EarlyAccessPlanDefinition[] = [
  {
    id: "early_bronze",
    name: "Early Bronze",
    price: 697,
  },
  {
    id: "early_silver",
    name: "Early Silver",
    price: 1797,
  },
  {
    id: "early_gold",
    name: "Early Gold",
    price: 4997,
  },
];

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan as PlanId] || PLAN_LIMITS.trial;
}

export function getPaystackPlanCode(
  plan: string,
  cycle: BillingCycle,
): string | undefined {
  let def: any = PLANS.find((p) => p.id === plan);
  return def?.paystackPlanCodes[cycle];
}

export function getPrice(plan: PlanDefinition, cycle: BillingCycle): number {
  return cycle === "annual" ? plan.price * 10 : plan.price;
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function isUnlimited(value: number): boolean {
  return value >= UNLIMITED;
}

export function formatPlanLimit(value: number, singular: string): string {
  return formatLimit(value, singular);
}

export const PRICING_FAQS = [
  {
    q: "What counts as an 'engagement'?",
    a: "An engagement is any customer interaction: a spin on your wheel, a trivia answer, or an entry into a draw. The counter resets monthly.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes! Upgrade or downgrade anytime. Upgrades apply immediately; downgrades apply at the next billing cycle.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes, 14-day free trial on any plan with 100 engagements to test everything. No credit card required.",
  },
  {
    q: "What happens when I hit my engagement limit?",
    a: "We notify you before you hit the limit. Games stay active but customers cannot engage until next month or you upgrade.",
  },
  {
    q: "Do you support M-Pesa?",
    a: "Yes! We accept M-Pesa and international cards via Paystack for subscriptions.",
  },
];
