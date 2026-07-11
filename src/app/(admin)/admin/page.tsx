// src/app/(admin)/admin/page.tsx
// Redirect to src/app/(admin)/admin/[profile.business_slug]
// src/app/(admin)/admin/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!profile) {
      router.push("/login");
      return;
    }

    if (profile.business_slug) {
      router.push(`/admin/${profile.business_slug}`);
    } else {
      router.push("/business/signup");
    }
  }, [profile, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
    </div>
  );
}
