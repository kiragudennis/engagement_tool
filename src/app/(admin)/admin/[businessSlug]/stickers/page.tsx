// app/(admin)/admin/[businessSlug]/stickers/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";
import { StickerBatchGenerator } from "@/components/business/sticker-generator";

export default function StickersPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const { supabase } = useAuth();
  const router = useRouter();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessSlug) return;
    supabase
      .from("businesses")
      .select("id, name, slug, brand_color, plan")
      .eq("slug", businessSlug)
      .single()
      .then(({ data }) => {
        setBusiness(data);
        setLoading(false);
      });
  }, [businessSlug, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const brandColor = business?.brand_color || "#8B5CF6";

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="border-b border-white/10 bg-black/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/${businessSlug}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">
                Sticker Generator
              </h1>
              <p className="text-white/40 text-sm">
                {business?.name} • Print codes on products
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <StickerBatchGenerator
          businessSlug={businessSlug as string}
          brandColor={brandColor}
        />
      </div>
    </div>
  );
}
