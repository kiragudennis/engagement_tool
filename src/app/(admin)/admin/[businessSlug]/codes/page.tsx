// app/(admin)/admin/[businessSlug]/codes/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Ticket,
  Copy,
  Trash2,
  Loader2,
  ArrowLeft,
  Pause,
  Play,
  Eye,
  Search,
  QrCode,
  ExternalLink,
  Sparkles,
  Gift,
  Star,
  Crown,
  Diamond,
  Printer,
  ShoppingBag,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

const TIER_COLORS: Record<string, string> = {
  bronze: "bg-amber-700/20 text-amber-400",
  silver: "bg-gray-400/20 text-gray-300",
  gold: "bg-yellow-500/20 text-yellow-400",
  diamond: "bg-cyan-400/20 text-cyan-300",
  standard: "bg-white/10 text-white/60",
};

const TYPE_ICONS: Record<string, any> = {
  sticker: Printer,
  receipt: ShoppingBag,
  public: Globe,
  qr: QrCode,
  single_use: Ticket,
  bulk: Sparkles,
};

export default function CodeManagementPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const { supabase } = useAuth();
  const router = useRouter();

  const [business, setBusiness] = useState<any>(null);
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const loadData = useCallback(async () => {
    if (!businessSlug) return;
    const { data: biz } = await supabase
      .from("businesses")
      .select("id, name, slug, brand_color, plan")
      .eq("slug", businessSlug)
      .single();
    if (!biz) {
      router.push("/business/signup");
      return;
    }
    setBusiness(biz);

    let query = supabase
      .from("access_codes")
      .select("*")
      .eq("business_id", biz.id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (filterType !== "all") query = query.eq("type", filterType);

    const { data } = await query;
    setCodes(data || []);
    setLoading(false);
  }, [businessSlug, supabase, filterType, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleStatus = async (code: any) => {
    await supabase
      .from("access_codes")
      .update({ is_active: !code.is_active })
      .eq("id", code.id);
    toast.success(`Code ${code.is_active ? "paused" : "activated"}`);
    loadData();
  };

  const deleteCode = async (code: any) => {
    if (!confirm(`Delete ${code.code}?`)) return;
    await supabase.from("access_codes").delete().eq("id", code.id);
    toast.success("Code deleted");
    loadData();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copied!");
  };

  const filteredCodes = codes.filter(
    (c) =>
      !search ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.label?.toLowerCase().includes(search.toLowerCase()),
  );

  const brandColor = business?.brand_color || "#8B5CF6";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="border-b border-white/10 bg-black/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/admin/${businessSlug}`)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">Access Codes</h1>
                <p className="text-white/40 text-sm">{business?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="gap-1"
                style={{ backgroundColor: brandColor }}
                asChild
              >
                <Link href={`/admin/${businessSlug}/stickers`}>
                  <Printer className="h-4 w-4" /> Sticker Generator
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Codes", value: codes.length, color: "text-white" },
            {
              label: "Active",
              value: codes.filter((c) => c.is_active).length,
              color: "text-green-400",
            },
            {
              label: "Used Today",
              value: codes.filter((c) => c.current_uses > 0).length,
              color: "text-purple-400",
            },
            {
              label: "Stickers",
              value: codes.filter((c) => c.type === "sticker").length,
              color: "text-amber-400",
            },
          ].map((stat, i) => (
            <Card key={i} className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <p className={cn("text-2xl font-bold", stat.color)}>
                  {stat.value}
                </p>
                <p className="text-xs text-white/40">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Links */}
        <div className="flex gap-2 mb-6">
          {["all", "sticker", "receipt", "public", "qr"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                filterType === type
                  ? "bg-purple-500/20 text-purple-400"
                  : "bg-white/5 text-white/40 hover:text-white/60",
              )}
            >
              {type === "all"
                ? "All"
                : type.charAt(0).toUpperCase() + type.slice(1)}
              <span className="ml-1 text-white/20">
                {type === "all"
                  ? codes.length
                  : codes.filter((c) => c.type === type).length}
              </span>
            </button>
          ))}
        </div>

        {/* Code List */}
        {filteredCodes.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-12 text-center">
              <Ticket className="h-12 w-12 text-white/10 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">No Codes Found</h3>
              <p className="text-white/40 mb-4">
                {filterType !== "all"
                  ? `No ${filterType} codes yet.`
                  : "Generate sticker codes or create public marketing codes."}
              </p>
              <Button asChild style={{ backgroundColor: brandColor }}>
                <Link href={`/admin/${businessSlug}/stickers`}>
                  Generate Stickers
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredCodes.map((code, i) => {
              const TypeIcon = TYPE_ICONS[code.type] || Ticket;
              const tierColor = TIER_COLORS[code.tier] || TIER_COLORS.standard;

              return (
                <motion.div
                  key={code.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <Card
                    className={cn(
                      "bg-white/5 border-white/10 hover:bg-white/10 transition-colors",
                      !code.is_active && "opacity-50",
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Tier indicator */}
                          {code.tier && code.tier !== "standard" && (
                            <div className="flex-shrink-0">
                              {code.tier === "bronze" && (
                                <Star className="h-4 w-4 text-amber-400" />
                              )}
                              {code.tier === "silver" && (
                                <Sparkles className="h-4 w-4 text-gray-300" />
                              )}
                              {code.tier === "gold" && (
                                <Crown className="h-4 w-4 text-yellow-400" />
                              )}
                              {code.tier === "diamond" && (
                                <Diamond className="h-4 w-4 text-cyan-300" />
                              )}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <code className="text-sm font-mono font-bold text-yellow-400 truncate">
                                {code.code}
                              </code>
                              <Badge className={cn("text-xs", tierColor)}>
                                {code.tier || code.type}
                              </Badge>
                              {code.point_value && (
                                <Badge className="bg-green-500/10 text-green-400 text-xs">
                                  {code.point_value} pts
                                </Badge>
                              )}
                            </div>
                            {code.label && (
                              <p className="text-white/40 text-xs truncate mt-0.5">
                                {code.label}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-white/30 mt-1">
                              <span>{code.current_uses || 0} used</span>
                              <span>
                                {formatDistanceToNow(
                                  new Date(code.created_at),
                                  { addSuffix: true },
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyCode(code.code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStatus(code)}
                          >
                            {code.is_active ? (
                              <Pause className="h-3 w-3 text-yellow-400" />
                            ) : (
                              <Play className="h-3 w-3 text-green-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCode(code)}
                          >
                            <Trash2 className="h-3 w-3 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
