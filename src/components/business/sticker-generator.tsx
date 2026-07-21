// components/business/sticker-generator.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Loader2,
  Printer,
  Sparkles,
  Crown,
  Star,
  Diamond,
  RotateCcw,
  Gift,
  Trophy,
  Coins,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const UNLOCKS_OPTIONS = [
  {
    value: "points",
    label: "Points Only",
    description: "Just award points",
    icon: Coins,
  },
  {
    value: "spin",
    label: "Spin & Win",
    description: "Access to spin the wheel",
    icon: RotateCcw,
  },
  {
    value: "spin_draw",
    label: "Spin + Draws",
    description: "Spin + auto-enter draws",
    icon: Gift,
  },
  {
    value: "draw",
    label: "Draws Only",
    description: "Only enter prize draws",
    icon: Trophy,
  },
];

const RARITY_TIERS = [
  {
    id: "bronze",
    label: "Bronze",
    icon: Star,
    color: "#CD7F32",
    defaultPct: 70,
    defaultPts: 5,
    defaultUnlocks: "points",
    description: "Most common — points only",
  },
  {
    id: "silver",
    label: "Silver",
    icon: Sparkles,
    color: "#C0C0C0",
    defaultPct: 20,
    defaultPts: 25,
    defaultUnlocks: "spin",
    description: "Uncommon — unlocks the wheel",
  },
  {
    id: "gold",
    label: "Gold",
    icon: Crown,
    color: "#FFD700",
    defaultPct: 8,
    defaultPts: 100,
    defaultUnlocks: "spin_draw",
    description: "Rare — spin + draw entry",
  },
  {
    id: "diamond",
    label: "Diamond",
    icon: Diamond,
    color: "#B9F2FF",
    defaultPct: 2,
    defaultPts: 500,
    defaultUnlocks: "spin_draw",
    description: "Ultra rare — spin + draw entry",
  },
];

export function StickerBatchGenerator({
  businessSlug,
  brandColor,
}: {
  businessSlug: string;
  brandColor: string;
}) {
  const [totalStickers, setTotalStickers] = useState(100);
  const [tiers, setTiers] = useState(
    RARITY_TIERS.map((t) => ({
      ...t,
      percentage: t.defaultPct,
      points: t.defaultPts,
      unlocks: t.defaultUnlocks,
      enabled: true,
    })),
  );
  const [generating, setGenerating] = useState(false);
  const [batchResult, setBatchResult] = useState<any>(null);

  const totalPct = tiers.reduce(
    (sum, t) => sum + (t.enabled ? t.percentage : 0),
    0,
  );

  const updateTier = (id: string, field: string, value: any) => {
    setTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );
  };

  const handleGenerate = async () => {
    if (Math.abs(totalPct - 100) > 0.5) {
      toast.error("Percentages must add up to 100%");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/business/receipt/sticker-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: businessSlug,
          totalStickers,
          tiers: tiers
            .filter((t) => t.enabled)
            .map((t) => ({
              rarity: t.id,
              percentage: t.percentage,
              points: t.points,
              unlocks: t.unlocks,
              count: Math.round((t.percentage / 100) * totalStickers),
            })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate codes");
      if (!data.stickers || data.stickers.length === 0) {
        throw new Error("No codes were generated. Please try again.");
      }

      setBatchResult(data);
      toast.success(`${data.total_count} sticker codes generated!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate codes");
    } finally {
      setGenerating(false);
    }
  };

  const getUnlocksLabel = (unlocksValue: string) => {
    return (
      UNLOCKS_OPTIONS.find((o) => o.value === unlocksValue)?.label ||
      unlocksValue
    );
  };

  const printStickers = () => {
    if (!batchResult?.stickers?.length) {
      toast.error("No stickers to print.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups");
      return;
    }

    const stickerWidth = "63mm";
    const stickerHeight = "38mm";

    const html = `<!DOCTYPE html><html><head><title>Stickers - ${businessSlug}</title>
      <style>
        @page { size: ${stickerWidth} ${stickerHeight}; margin: 0; }
        body { margin: 0; font-family: Arial, sans-serif; }
        .sticker { width: ${stickerWidth}; height: ${stickerHeight}; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; page-break-after: always; padding: 2mm; box-sizing: border-box; }
        .sticker.bronze { border-top: 3px solid #CD7F32; }
        .sticker.silver { border-top: 3px solid #C0C0C0; }
        .sticker.gold { border-top: 3px solid #FFD700; }
        .sticker.diamond { border-top: 3px solid #B9F2FF; }
        .business-name { font-size: 8px; font-weight: bold; color: #333; margin-bottom: 1mm; }
        .rarity-badge { font-size: 7px; padding: 0.5mm 2mm; border-radius: 10px; margin-bottom: 0.5mm; display: inline-block; }
        .unlocks-badge { font-size: 6px; color: #555; margin-bottom: 0.5mm; font-weight: bold; }
        .qr-code { width: 18mm; height: 18mm; margin: 1mm 0; }
        .code { font-family: monospace; font-size: 7px; font-weight: bold; margin-bottom: 0.5mm; }
        .cta { font-size: 6px; color: #666; }
        @media print { .no-print { display: none; } }
      </style></head><body>
      <div class="no-print" style="text-align:center; padding:10px; background:#f0f0f0;">
        <h3>📦 ${batchResult.business_name} - Sticker Batch</h3>
        <p>${batchResult.total_count} stickers across ${batchResult.tiers.length} tiers</p>
        <p style="font-size:11px; color:#666;">
          ${batchResult.tiers.map((t: any) => `${t.rarity}: ${t.count}×${t.points}pts (${getUnlocksLabel(t.unlocks)})`).join(" · ")}
        </p>
        <button onclick="window.print()" style="padding:12px 24px; font-size:16px; cursor:pointer; background:#8B5CF6; color:white; border:none; border-radius:8px; margin:10px;">🖨️ Print All</button>
      </div>
      ${batchResult.stickers
        .map(
          (s: any) => `
        <div class="sticker ${s.rarity}">
          <div class="business-name">${batchResult.business_name}</div>
          <div class="rarity-badge" style="background:${s.color}20; color:${s.color}">${s.rarity.toUpperCase()} · ${s.points} PTS</div>
          <div class="unlocks-badge">${getUnlocksLabel(s.unlocks)}</div>
          <img class="qr-code" src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`engagespin.com/spin?code=${s.code}`)}" alt="QR" onerror="this.style.display='none'" />
          <div class="code">${s.code}</div>
          <div class="cta">Scan to ${s.unlocks === "draw" ? "enter draw" : s.unlocks === "points" ? "earn points" : "spin & win"}!</div>
        </div>
      `,
        )
        .join("")}
    </body></html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5" style={{ color: brandColor }} />
              Sticker Batch Generator
            </h3>
            <Badge className="bg-purple-500/20 text-purple-400">
              Product Labels
            </Badge>
          </div>

          <p className="text-white/50 text-sm">
            Generate rarity-tiered codes. Each tier can unlock different
            experiences — higher tiers unlock more features.
          </p>

          {/* Total stickers */}
          <div>
            <Label className="text-white/60 text-xs">Total Stickers</Label>
            <Input
              type="number"
              value={totalStickers}
              onChange={(e) =>
                setTotalStickers(parseInt(e.target.value) || 100)
              }
              className="mt-1 bg-white/5 border-white/10 text-white"
              min={10}
              max={1000}
            />
          </div>

          {/* Rarity tiers with per-tier unlocks */}
          <div>
            <Label className="text-white/60 text-xs mb-3 block">
              Rarity Distribution & Unlocks
            </Label>
            <div className="space-y-3">
              {tiers.map((tier) => {
                const Icon = tier.icon;
                const count = Math.round(
                  (tier.percentage / 100) * totalStickers,
                );
                return (
                  <div
                    key={tier.id}
                    className="p-3 rounded-lg bg-white/5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon
                          className="h-4 w-4"
                          style={{ color: tier.color }}
                        />
                        <span className="text-white text-sm font-medium">
                          {tier.label}
                        </span>
                        <Badge
                          className="text-xs"
                          style={{
                            backgroundColor: `${tier.color}20`,
                            color: tier.color,
                          }}
                        >
                          {count} stickers
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-white/40 text-[10px]">
                          Points
                        </Label>
                        <Input
                          type="number"
                          value={tier.points}
                          onChange={(e) =>
                            updateTier(
                              tier.id,
                              "points",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="h-7 text-xs bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white/40 text-[10px]">
                          Unlocks
                        </Label>
                        <Select
                          value={tier.unlocks}
                          onValueChange={(v) =>
                            updateTier(tier.id, "unlocks", v)
                          }
                        >
                          <SelectTrigger className="h-7 text-xs bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNLOCKS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <div className="flex items-center gap-1.5 text-xs">
                                  <opt.icon className="h-3 w-3" />
                                  {opt.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-white/40 text-xs w-8">
                        {tier.percentage}%
                      </span>
                      <Slider
                        value={[tier.percentage]}
                        onValueChange={([val]) =>
                          updateTier(tier.id, "percentage", val)
                        }
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                    </div>

                    <p className="text-white/20 text-[10px]">
                      {tier.description}
                    </p>
                  </div>
                );
              })}
            </div>
            <p
              className={cn(
                "text-xs mt-2",
                Math.abs(totalPct - 100) < 0.5
                  ? "text-green-400"
                  : "text-red-400",
              )}
            >
              Total: {totalPct}%{" "}
              {Math.abs(totalPct - 100) < 0.5 ? "✓" : "(must be 100%)"}
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating || Math.abs(totalPct - 100) > 0.5}
            className="w-full gap-2"
            style={{ backgroundColor: brandColor }}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate {totalStickers} Sticker Codes
          </Button>

          {batchResult && (
            <Button
              onClick={printStickers}
              variant="outline"
              className="w-full gap-2 border-white/10"
            >
              <Printer className="h-4 w-4" /> Print Stickers
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {batchResult && (
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <h4 className="text-white font-medium mb-3">Batch Summary</h4>
            <div className="grid grid-cols-2 gap-2">
              {batchResult.tiers.map((t: any) => (
                <div
                  key={t.rarity}
                  className="p-2 rounded bg-white/5 text-center"
                >
                  <p className="text-white font-bold">{t.count}</p>
                  <p className="text-white/40 text-xs capitalize">
                    {t.rarity} — {t.points}pts ({getUnlocksLabel(t.unlocks)})
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
