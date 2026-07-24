"use client";

import { useMemo } from "react";
import { getPlanLimits, isUnlimited } from "@/lib/config/plans";

export function usePlanLimit(business: any) {
  const limits = useMemo(() => {
    if (!business?.plan) return null;
    return getPlanLimits(business.plan);
  }, [business?.plan]);

  const canCreateGame = (currentCount: number) => {
    if (!limits) return { allowed: false, reason: "No plan found" };
    if (isUnlimited(limits.maxSpinGames)) return { allowed: true };
    if (currentCount < limits.maxSpinGames) return { allowed: true };
    return {
      allowed: false,
      reason: `You've reached your plan limit of ${limits.maxSpinGames} spin games. Upgrade to add more.`,
    };
  };

  const canAddPrizeSlot = (currentCount: number) => {
    if (!limits) return { allowed: false, reason: "No plan found" };
    if (isUnlimited(limits.maxPrizeSlots)) return { allowed: true };
    if (currentCount < limits.maxPrizeSlots) return { allowed: true };
    return {
      allowed: false,
      reason: `You've reached your plan limit of ${limits.maxPrizeSlots} prize slots. Upgrade to add more.`,
    };
  };

  const canCreateCode = (currentCount: number) => {
    if (!limits) return { allowed: false, reason: "No plan found" };
    if (isUnlimited(limits.maxCodes)) return { allowed: true };
    if (currentCount < limits.maxCodes) return { allowed: true };
    return {
      allowed: false,
      reason: `You've reached your plan limit of ${limits.maxCodes} access codes. Upgrade to add more.`,
    };
  };

  const canCreateTrivia = (currentCount: number) => {
    if (!limits) return { allowed: false, reason: "No plan found" };
    if (isUnlimited(limits.maxTriviaChallenges)) return { allowed: true };
    if (currentCount < limits.maxTriviaChallenges) return { allowed: true };
    return {
      allowed: false,
      reason: `You've reached your plan limit of ${limits.maxTriviaChallenges} trivia challenges. Upgrade to add more.`,
    };
  };

  const canCreateDraw = (currentCount: number) => {
    if (!limits) return { allowed: false, reason: "No plan found" };
    if (isUnlimited(limits.maxActiveDraws)) return { allowed: true };
    if (currentCount < limits.maxActiveDraws) return { allowed: true };
    return {
      allowed: false,
      reason: `You've reached your plan limit of ${limits.maxActiveDraws} active draws. Upgrade to add more.`,
    };
  };

  return {
    limits,
    canCreateGame,
    canAddPrizeSlot,
    canCreateCode,
    canCreateTrivia,
    canCreateDraw,
  };
}
