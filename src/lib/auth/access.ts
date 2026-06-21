export interface BusinessAccessStatus {
  canAccessAdmin: boolean;
  isTrialActive: boolean;
  isPaid: boolean;
  isExpired: boolean;
  daysLeftInTrial: number;
}

export function getBusinessAccessStatus(business: {
  subscription_status: string;
  trial_ends_at: string | null;
}): BusinessAccessStatus {
  const now = new Date();
  const trialEnd = business.trial_ends_at
    ? new Date(business.trial_ends_at)
    : null;
  const isTrialActive =
    business.subscription_status === "trial" &&
    trialEnd !== null &&
    trialEnd > now;
  const isPaid = business.subscription_status === "active";
  const isExpired =
    !isTrialActive &&
    !isPaid &&
    (business.subscription_status === "expired" ||
      business.subscription_status === "cancelled" ||
      business.subscription_status === "past_due" ||
      (business.subscription_status === "trial" &&
        trialEnd !== null &&
        trialEnd <= now));

  const daysLeftInTrial =
    trialEnd && trialEnd > now
      ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

  return {
    canAccessAdmin: isTrialActive || isPaid,
    isTrialActive,
    isPaid,
    isExpired,
    daysLeftInTrial,
  };
}
