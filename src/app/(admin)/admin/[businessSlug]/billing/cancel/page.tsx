"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function BillingCancelPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-white mb-2">
          Payment cancelled
        </h1>
        <p className="text-white/60 mb-6">
          No charges were made. You can try again anytime.
        </p>
        <Button onClick={() => router.push(`/admin/${businessSlug}/billing`)}>
          Back to Billing
        </Button>
      </div>
    </div>
  );
}
