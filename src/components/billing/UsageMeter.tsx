"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface UsageMeterProps {
  label: string;
  used: number;
  max: number;
  className?: string;
}

export function UsageMeter({ label, used, max, className }: UsageMeterProps) {
  const percent = max > 0 ? Math.min(100, (used / max) * 100) : 0;
  const isWarning = percent >= 80;
  const isCritical = percent >= 95;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span
          className={cn(
            isCritical
              ? "text-red-400"
              : isWarning
                ? "text-amber-400"
                : "text-white/40",
          )}
        >
          {used.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>
      <Progress
        value={percent}
        className={cn("h-1.5", isCritical && "bg-red-950")}
      />
      {isWarning && (
        <p className="text-xs text-amber-400/80">
          {isCritical
            ? "Almost at limit — upgrade to avoid blocking customers."
            : "Approaching your monthly limit."}
        </p>
      )}
    </div>
  );
}
