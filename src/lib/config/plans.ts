import { Sparkles, Crown, Zap, type LucideIcon } from "lucide-react";

export const KES_TO_USD_RATE = 129;

export type PlanId = "trial" | "starter" | "pro" | "enterprise";
export type BillingCycle = "monthly" | "annual";

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
  priceKes: number;
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
  };
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
};

function formatLimit(value: number, label: string): string {
  return value >= UNLIMITED ? `Unlimited ${label}` : `${value} ${label}`;
}

export const PLANS: PlanDefinition[] = [
  {
    id: "starter",
    name: "Starter",
    priceKes: 3999,
    icon: Sparkles,
    color: "from-blue-500 to-cyan-500",
    borderColor: "border-blue-500/30",
    bgGlow: "bg-blue-500/10",
    popular: false,
    desc: "For small businesses getting started",
    limits: PLAN_LIMITS.starter,
    paystackPlanCodes: {
      monthly: "PLN_ydgtlvrtrjpbtz8",
      annual: "PLN_l2nu74bpwgmfckg",
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
    priceKes: 9999,
    icon: Crown,
    color: "from-purple-500 to-pink-500",
    borderColor: "border-purple-500/30",
    bgGlow: "bg-purple-500/10",
    popular: true,
    desc: "For growing businesses running regular campaigns",
    limits: PLAN_LIMITS.pro,
    paystackPlanCodes: {
      monthly: "PLN_1y7cuxm6auf2cxq",
      annual: "PLN_f8njityjpmp6eal",
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
    priceKes: 24999,
    icon: Zap,
    color: "from-amber-500 to-orange-500",
    borderColor: "border-amber-500/30",
    bgGlow: "bg-amber-500/10",
    popular: false,
    desc: "For chains and high-volume venues",
    limits: PLAN_LIMITS.enterprise,
    paystackPlanCodes: {
      monthly: "PLN_99uja3f924723eg",
      annual: "PLN_dquz9sky664pvk5",
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

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan as PlanId] || PLAN_LIMITS.trial;
}

export function getPaystackPlanCode(
  plan: string,
  cycle: BillingCycle,
): string | undefined {
  const def = PLANS.find((p) => p.id === plan);
  return def?.paystackPlanCodes[cycle];
}

export function getPriceKes(
  plan: PlanDefinition,
  cycle: BillingCycle,
): number {
  return cycle === "annual"
    ? Math.round((plan.priceKes * 10) / 12)
    : plan.priceKes;
}

export function formatKES(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function kesToUsd(kes: number): number {
  return Math.round(kes / KES_TO_USD_RATE);
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
