"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BillingSuccessPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(`/admin/${businessSlug}`);
    }, 5000);
    return () => clearTimeout(timer);
  }, [businessSlug, router]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">
          Payment successful!
        </h1>
        <p className="text-white/60 mb-6">
          Your subscription is now active. Redirecting to dashboard...
        </p>
        <Button onClick={() => router.push(`/admin/${businessSlug}`)}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
