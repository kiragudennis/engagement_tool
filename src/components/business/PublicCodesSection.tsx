// app/(public)/[businessSlug]/components/PublicCodesSection.tsx
"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PublicCodesSectionProps {
  codes: Array<{
    id: string;
    code: string;
    label?: string | null;
    unlocks: string;
    description?: string | null;
  }>;
  businessSlug: string;
}

const UNLOCK_LABELS: Record<string, string> = {
  spin: "Spin",
  trivia: "Trivia",
  draw: "Draw",
  both: "Spin + Draw",
  all: "All Games",
  points: "Points",
};

export function PublicCodesSection({ codes, businessSlug }: PublicCodesSectionProps) {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (codes.length === 0) return null;

  const handleRedeem = (code: string) => {
    router.push(`/${businessSlug}/code-entry?code=${encodeURIComponent(code)}`);
  };

  const handleCopy = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Code copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <Ticket className="h-5 w-5 text-purple-400" />
        <h2 className="text-xl sm:text-2xl font-bold text-white">Public Codes</h2>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4 sm:p-6">
          <p className="text-white/50 text-xs sm:text-sm mb-4">
            Click a code below to redeem it instantly. If you&apos;re logged in, it will be applied automatically.
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {codes.map((codeObj, i) => (
              <motion.div
                key={codeObj.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-1.5"
              >
                <Button
                  onClick={() => handleRedeem(codeObj.code)}
                  variant="secondary"
                  className="h-9 sm:h-10 px-3 sm:px-4 font-mono text-xs sm:text-sm bg-white/10 border-white/10 hover:bg-white/20 text-white"
                >
                  {codeObj.code}
                </Button>
                <Button
                  onClick={() => handleCopy(codeObj.code, codeObj.id)}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-white/40 hover:text-white"
                >
                  {copiedId === codeObj.id ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
