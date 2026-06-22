// app/(public)/signup/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignupRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Collect all params to forward
    const ref = searchParams.get("ref");
    const code = searchParams.get("code");
    const business = searchParams.get("business");

    // Build redirect URL
    const params = new URLSearchParams();
    params.set("tab", "signup"); // Always open signup tab
    if (ref) params.set("ref", ref);
    if (code) params.set("code", code);
    if (business) params.set("business", business);

    router.replace(`/login?${params.toString()}`);
  }, [router, searchParams]);

  return null; // Instant redirect, no UI needed
}
