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
  Download,
  Sparkles,
  Crown,
  Star,
  Diamond,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const RARITY_TIERS = [
  {
    id: "bronze",
    label: "Bronze",
    icon: Star,
    color: "#CD7F32",
    bg: "bg-amber-700",
    defaultPct: 70,
    defaultPts: 5,
  },
  {
    id: "silver",
    label: "Silver",
    icon: Sparkles,
    color: "#C0C0C0",
    bg: "bg-gray-400",
    defaultPct: 20,
    defaultPts: 25,
  },
  {
    id: "gold",
    label: "Gold",
    icon: Crown,
    color: "#FFD700",
    bg: "bg-yellow-500",
    defaultPct: 8,
    defaultPts: 100,
  },
  {
    id: "diamond",
    label: "Diamond",
    icon: Diamond,
    color: "#B9F2FF",
    bg: "bg-cyan-400",
    defaultPct: 2,
    defaultPts: 500,
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
      enabled: true,
    })),
  );
  const [generating, setGenerating] = useState(false);
  const [batchResult, setBatchResult] = useState<any>(null);

  // Ensure percentages add up to 100
  const totalPct = tiers.reduce(
    (sum, t) => sum + (t.enabled ? t.percentage : 0),
    0,
  );

  const updateTier = (id: string, field: string, value: number) => {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: businessSlug,
          totalStickers,
          tiers: tiers
            .filter((t) => t.enabled)
            .map((t) => ({
              rarity: t.id,
              percentage: t.percentage,
              points: t.points,
              count: Math.round((t.percentage / 100) * totalStickers),
            })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setBatchResult(data);
      toast.success(`${totalStickers} sticker codes generated!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const printStickers = () => {
    if (!batchResult) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const stickerWidth = "63mm"; // Standard thermal label width
    const stickerHeight = "38mm"; // Standard thermal label height

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Stickers - ${businessSlug}</title>
        <style>
          @page { size: ${stickerWidth} ${stickerHeight}; margin: 0; }
          body { margin: 0; font-family: Arial, sans-serif; }
          .sticker {
            width: ${stickerWidth};
            height: ${stickerHeight};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            page-break-after: always;
            padding: 2mm;
            box-sizing: border-box;
          }
          .sticker.bronze { border-top: 3px solid #CD7F32; }
          .sticker.silver { border-top: 3px solid #C0C0C0; }
          .sticker.gold { border-top: 3px solid #FFD700; }
          .sticker.diamond { border-top: 3px solid #B9F2FF; }
          .business-name { font-size: 8px; font-weight: bold; color: #333; margin-bottom: 1mm; }
          .rarity-badge { font-size: 7px; padding: 0.5mm 2mm; border-radius: 10px; margin-bottom: 1mm; }
          .qr-code { width: 18mm; height: 18mm; margin: 1mm 0; }
          .code { font-family: monospace; font-size: 7px; font-weight: bold; margin-bottom: 0.5mm; }
          .cta { font-size: 6px; color: #666; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align:center; padding:10px;">
          <h3>Printing ${batchResult.total_count} stickers</h3>
          <p>Make sure your thermal printer is set to ${stickerWidth} × ${stickerHeight} labels</p>
          <button onclick="window.print()" style="padding:10px 20px; font-size:16px;">
            🖨️ Print All Stickers
          </button>
        </div>
        ${batchResult.stickers
          .map(
            (s: any) => `
          <div class="sticker ${s.rarity}">
            <div class="business-name">${batchResult.business_name}</div>
            <div class="rarity-badge" style="background:${s.color}20; color:${s.color}">
              ${s.rarity.toUpperCase()} • ${s.points} PTS
            </div>
            <img class="qr-code" 
                 src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`engagespin.com/spin?code=${s.code}`)}" 
                 alt="QR" />
            <div class="code">${s.code}</div>
            <div class="cta">Scan to spin & win!</div>
          </div>
        `,
          )
          .join("")}
      </body>
      </html>
    `;

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
            Generate rarity-tiered codes to print on products. Customers
            discover codes after purchase — no staff involvement needed.
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

          {/* Rarity tiers */}
          <div>
            <Label className="text-white/60 text-xs mb-3 block">
              Rarity Distribution
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
                    className="p-3 rounded-lg bg-white/5 space-y-2"
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
                      <div className="flex items-center gap-2">
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
                          className="w-16 h-7 text-xs bg-white/5 border-white/10 text-white text-center"
                        />
                        <span className="text-white/40 text-xs">pts</span>
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
                    {t.rarity} ({t.points}pts)
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
