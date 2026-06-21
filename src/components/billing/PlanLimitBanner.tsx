"use client";

import Link from "next/link";
import { AlertTriangle, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPlanLimits } from "@/lib/config/plans";
import { getBusinessAccessStatus } from "@/lib/auth/access";
import { UsageMeter } from "@/components/billing/UsageMeter";

interface PlanLimitBannerProps {
  business: {
    slug: string;
    plan: string;
    subscription_status: string;
    trial_ends_at: string | null;
    engagements_this_month?: number;
    spins_this_month?: number;
  };
}

export function PlanLimitBanner({ business }: PlanLimitBannerProps) {
  const limits = getPlanLimits(business.plan);
  const used =
    business.engagements_this_month ?? business.spins_this_month ?? 0;
  const access = getBusinessAccessStatus(business);
  const usagePercent =
    limits.maxEngagementsPerMonth > 0
      ? (used / limits.maxEngagementsPerMonth) * 100
      : 0;

  if (access.isExpired) {
    return (
      <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
          <div>
            <p className="text-red-300 font-medium">Trial expired</p>
            <p className="text-red-300/70 text-sm">
              Subscribe to keep engaging customers.
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="bg-red-600 hover:bg-red-500">
          <Link href={`/admin/${business.slug}/billing?expired=1`}>
            Upgrade Now
          </Link>
        </Button>
      </div>
    );
  }

  if (access.isTrialActive && access.daysLeftInTrial <= 3) {
    return (
      <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Crown className="h-5 w-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-amber-300 font-medium">
              {access.daysLeftInTrial} day
              {access.daysLeftInTrial !== 1 ? "s" : ""} left in trial
            </p>
            <p className="text-amber-300/70 text-sm">
              Subscribe before trial ends to avoid interruption.
            </p>
          </div>
        </div>
        <Button asChild size="sm" variant="outline" className="border-amber-500/50">
          <Link href={`/admin/${business.slug}/billing`}>View Plans</Link>
        </Button>
      </div>
    );
  }

  if (usagePercent >= 80) {
    return (
      <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
        <UsageMeter
          label="Engagements this month"
          used={used}
          max={limits.maxEngagementsPerMonth}
        />
        {usagePercent >= 95 && (
          <div className="mt-3 flex justify-end">
            <Button asChild size="sm">
              <Link href={`/admin/${business.slug}/billing?upgrade=pro`}>
                Upgrade Plan
              </Link>
            </Button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
