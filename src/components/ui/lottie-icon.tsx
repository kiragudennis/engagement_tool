import React from "react";
import Lottie from "lottie-react";
import { cn } from "@/lib/utils";

export interface LottieIconProps {
  animation: any;
  isCategory?: boolean;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

export const LottieIcon = ({
  animation,
  isCategory = false,
  className,
  size = "md",
}: LottieIconProps) => {
  const sizeMap = {
    xs: "w-4 h-4",
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        isCategory && "rounded-full bg-white/10 p-2"
      )}
    >
      <Lottie
        animationData={animation}
        loop={true}
        autoplay={true}
        className={cn(sizeMap[size], className)}
      />
    </div>
  );
};