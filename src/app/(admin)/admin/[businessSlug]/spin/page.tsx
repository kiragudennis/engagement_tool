"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/** Business-scoped spin admin — loads games filtered by business */
export default function BusinessSpinAdminPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/admin/marketing/spin?business=${businessSlug}`);
  }, [businessSlug, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
    </div>
  );
}
