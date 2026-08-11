// app/(public)/[businessSlug]/components/PointsValueSection.tsx
"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Coins } from "lucide-react";
import Link from "next/link";

interface PointsValueSectionProps {
  pointsPerRedemption: number;
  pointsValue: number;
}

export function PointsValueSection({ pointsPerRedemption, pointsValue }: PointsValueSectionProps) {
  const redeemValue = pointsPerRedemption * pointsValue;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <Coins className="h-5 w-5 text-yellow-400" />
        <h2 className="text-xl sm:text-2xl font-bold text-white">Points Value</h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border-yellow-500/20">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider mb-1">
                  Point Value
                </p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-400">
                  1 point = {pointsValue} KSh
                </p>
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider mb-1">
                  Per Code Redemption
                </p>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {pointsPerRedemption} points
                </p>
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider mb-1">
                  Redemption Value
                </p>
                <p className="text-xl sm:text-2xl font-bold text-amber-400">
                  {redeemValue.toLocaleString()} KSh
                </p>
              </div>
            </div>
            <p className="text-white/40 text-xs text-center mt-4">
              Points can be redeemed for discounts at checkout.{" "}
              <Link href="/docs" className="text-purple-400 hover:underline">
                Learn more
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}
