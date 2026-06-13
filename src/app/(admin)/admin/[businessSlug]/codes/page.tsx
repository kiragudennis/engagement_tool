// app/(admin)/admin/[businessSlug]/codes/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket,
  Plus,
  Copy,
  Trash2,
  QrCode,
  Download,
  Loader2,
  Clock,
  Users,
  Zap,
  Calendar,
  Pause,
  Play,
  RefreshCw,
  ArrowLeft,
  ExternalLink,
  Sparkles,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  ChevronDown,
  Gift,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

// ─── Types ──────────────────────────────────────────────
interface AccessCode {
  id: string;
  code: string;
  type: "public" | "single_use" | "time_limited" | "bulk" | "qr";
  label: string;
  description: string;
  unlocks: "spin" | "trivia" | "both";
  max_uses: number | null;
  current_uses: number;
  max_uses_per_user: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  usage_count?: number;
}

// ─── Helpers ────────────────────────────────────────────
function generateCode(businessSlug: string, type: string): string {
  const prefix = businessSlug.replace(/-/g, "").toUpperCase().slice(0, 6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timestamp = Date.now().toString(36).slice(-2).toUpperCase();
  return type === "bulk"
    ? `${prefix}-${random}${timestamp}`
    : `${prefix}-${random}`;
}

function generateBulkCodes(businessSlug: string, count: number): string[] {
  return Array.from({ length: count }, () =>
    generateCode(businessSlug, "bulk"),
  );
}

const CODE_TYPE_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; description: string }
> = {
  public: {
    label: "Public",
    icon: Users,
    color: "bg-blue-500/20 text-blue-400",
    description: "Share publicly, unlimited uses",
  },
  single_use: {
    label: "Single Use",
    icon: Ticket,
    color: "bg-green-500/20 text-green-400",
    description: "One code = one activation",
  },
  time_limited: {
    label: "Timed",
    icon: Clock,
    color: "bg-yellow-500/20 text-yellow-400",
    description: "Valid during specific hours",
  },
  bulk: {
    label: "Bulk",
    icon: Zap,
    color: "bg-purple-500/20 text-purple-400",
    description: "Multiple single-use codes",
  },
  qr: {
    label: "QR Code",
    icon: QrCode,
    color: "bg-pink-500/20 text-pink-400",
    description: "In-store QR code",
  },
};

// ─── Main Component ─────────────────────────────────────
export default function CodeManagementPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const { supabase } = useAuth();
  const router = useRouter();

  const [business, setBusiness] = useState<any>(null);
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<AccessCode | null>(null);
  const [creating, setCreating] = useState(false);
  const [bulkCodes, setBulkCodes] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    type: "public" as AccessCode["type"],
    label: "",
    description: "",
    unlocks: "spin" as "spin" | "trivia" | "both",
    max_uses: "" as string,
    max_uses_per_user: "1",
    valid_from: "",
    valid_until: "",
  });
  const [bulkCount, setBulkCount] = useState(50);

  // ─── Load Data ────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!businessSlug) return;
    try {
      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name, slug, brand_color")
        .eq("slug", businessSlug)
        .single();
      if (!biz) {
        router.push("/business/signup");
        return;
      }
      setBusiness(biz);

      let query = supabase
        .from("access_codes")
        .select("*, access_code_usage(count)")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: false });

      if (filterType !== "all") query = query.eq("type", filterType);
      if (filterStatus === "active") query = query.eq("is_active", true);
      if (filterStatus === "inactive") query = query.eq("is_active", false);

      const { data: codeData } = await query;
      setCodes(
        (codeData || []).map((c) => ({
          ...c,
          usage_count: c.access_code_usage?.[0]?.count || c.current_uses || 0,
        })),
      );
    } catch (err) {
      console.error("Error loading codes:", err);
    } finally {
      setLoading(false);
    }
  }, [businessSlug, supabase, filterType, filterStatus, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Create Code ──────────────────────────────────────
  const handleCreateCode = async () => {
    if (!business) return;
    setCreating(true);
    try {
      const code =
        formData.type === "bulk"
          ? generateBulkCodes(businessSlug, 1)[0]
          : generateCode(businessSlug, formData.type);

      const { error } = await supabase.from("access_codes").insert({
        business_id: business.id,
        code,
        type: formData.type,
        label:
          formData.label || `${CODE_TYPE_CONFIG[formData.type].label} Code`,
        description: formData.description,
        unlocks: formData.unlocks,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        max_uses_per_user: parseInt(formData.max_uses_per_user) || 1,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        is_active: true,
      });

      if (error) throw error;

      toast.success(`Code ${code} created!`);
      setShowCreateDialog(false);
      resetForm();
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create code");
    } finally {
      setCreating(false);
    }
  };

  // ─── Create Bulk Codes ────────────────────────────────
  const handleCreateBulkCodes = async () => {
    if (!business) return;
    setCreating(true);
    try {
      const codes = generateBulkCodes(businessSlug, bulkCount);
      const inserts = codes.map((code) => ({
        business_id: business.id,
        code,
        type: "single_use" as const,
        label:
          formData.label || `Bulk Code Batch ${format(new Date(), "MMM dd")}`,
        description: formData.description,
        unlocks: formData.unlocks,
        max_uses: 1,
        max_uses_per_user: 1,
        is_active: true,
      }));

      const { error } = await supabase.from("access_codes").insert(inserts);
      if (error) throw error;

      setBulkCodes(codes);
      toast.success(`${bulkCount} codes generated!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate codes");
    } finally {
      setCreating(false);
    }
  };

  // ─── Toggle Code Status ───────────────────────────────
  const toggleCodeStatus = async (code: AccessCode) => {
    try {
      await supabase
        .from("access_codes")
        .update({ is_active: !code.is_active })
        .eq("id", code.id);

      toast.success(`Code ${code.is_active ? "paused" : "activated"}`);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ─── Delete Code ──────────────────────────────────────
  const deleteCode = async (code: AccessCode) => {
    if (!confirm(`Delete code ${code.code}?`)) return;
    try {
      await supabase.from("access_codes").delete().eq("id", code.id);
      toast.success("Code deleted");
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ─── Export Codes ─────────────────────────────────────
  const exportCodes = (codes: string[]) => {
    const csv = "code\n" + codes.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${businessSlug}-codes-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Codes exported to CSV");
  };

  const resetForm = () => {
    setFormData({
      type: "public",
      label: "",
      description: "",
      unlocks: "spin",
      max_uses: "",
      max_uses_per_user: "1",
      valid_from: "",
      valid_until: "",
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  // ─── Filtered Codes ───────────────────────────────────
  const filteredCodes = codes.filter((c) => {
    if (
      search &&
      !c.code.toLowerCase().includes(search.toLowerCase()) &&
      !c.label?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  // ─── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
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
                variant="outline"
                size="sm"
                className="gap-1 border-white/10"
                onClick={() => {
                  resetForm();
                  setShowBulkDialog(true);
                }}
              >
                <Zap className="h-4 w-4" /> Generate Bulk
              </Button>
              <Button
                size="sm"
                className="gap-1"
                style={{ backgroundColor: business?.brand_color }}
                onClick={() => {
                  resetForm();
                  setShowCreateDialog(true);
                }}
              >
                <Plus className="h-4 w-4" /> New Code
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <Input
                  placeholder="Search codes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-white"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="single_use">Single Use</SelectItem>
                  <SelectItem value="time_limited">Timed</SelectItem>
                  <SelectItem value="qr">QR Code</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white">
                  <Eye className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Code List */}
        <AnimatePresence>
          {filteredCodes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Ticket className="h-16 w-16 text-white/10 mx-auto mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">
                No Codes Yet
              </h3>
              <p className="text-white/40 mb-4">
                Create your first access code to start engaging customers
              </p>
              <Button
                onClick={() => {
                  resetForm();
                  setShowCreateDialog(true);
                }}
                style={{ backgroundColor: business?.brand_color }}
              >
                <Plus className="h-4 w-4 mr-2" /> Create Code
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filteredCodes.map((code, i) => {
                const config =
                  CODE_TYPE_CONFIG[code.type] || CODE_TYPE_CONFIG.public;
                const TypeIcon = config.icon;
                const usagePercent = code.max_uses
                  ? Math.min(100, (code.current_uses / code.max_uses) * 100)
                  : 0;

                return (
                  <motion.div
                    key={code.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card
                      className={cn(
                        "bg-white/5 border-white/10 hover:bg-white/10 transition-colors",
                        !code.is_active && "opacity-50",
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          {/* Code Info */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={cn("text-xs", config.color)}>
                                <TypeIcon className="h-3 w-3 mr-1" />
                                {config.label}
                              </Badge>
                              <Badge className="text-xs bg-white/10 text-white/60">
                                {code.unlocks === "both"
                                  ? "Spin + Trivia"
                                  : code.unlocks === "trivia"
                                    ? "Trivia"
                                    : "Spin"}
                              </Badge>
                              {!code.is_active && (
                                <Badge className="text-xs bg-red-500/20 text-red-400">
                                  Paused
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <code className="text-lg font-mono font-bold text-yellow-400 tracking-wider">
                                {code.code}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => copyCode(code.code)}
                              >
                                <Copy className="h-3 w-3 text-white/30" />
                              </Button>
                            </div>

                            {code.label && (
                              <p className="text-white/60 text-sm">
                                {code.label}
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-white/40">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {code.current_uses} / {code.max_uses || "∞"}{" "}
                                uses
                              </span>
                              {code.valid_until && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Expires{" "}
                                  {format(
                                    new Date(code.valid_until),
                                    "MMM d, h:mm a",
                                  )}
                                </span>
                              )}
                              <span>
                                Created{" "}
                                {formatDistanceToNow(
                                  new Date(code.created_at),
                                  { addSuffix: true },
                                )}
                              </span>
                            </div>

                            {/* Usage bar */}
                            {code.max_uses && (
                              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${usagePercent}%`,
                                    backgroundColor:
                                      usagePercent > 80
                                        ? "#ef4444"
                                        : usagePercent > 50
                                          ? "#f59e0b"
                                          : "#10b981",
                                  }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCodeStatus(code)}
                              title={code.is_active ? "Pause" : "Activate"}
                            >
                              {code.is_active ? (
                                <Pause className="h-4 w-4 text-yellow-400" />
                              ) : (
                                <Play className="h-4 w-4 text-green-400" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedQRCode(code);
                                setShowQRDialog(true);
                              }}
                            >
                              <QrCode className="h-4 w-4 text-white/40" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCode(code)}
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
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
        </AnimatePresence>
      </div>

      {/* Create Code Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Create Access Code</DialogTitle>
            <DialogDescription className="text-white/50">
              Codes let customers access your spin wheel and trivia games
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white">Code Type</Label>
              <Select
                value={formData.type}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, type: v as any }))
                }
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CODE_TYPE_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        <div>
                          <p>{config.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {config.description}
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">Label (Optional)</Label>
              <Input
                value={formData.label}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, label: e.target.value }))
                }
                placeholder="Friday Night Event, Receipt Codes..."
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white">Unlocks</Label>
                <Select
                  value={formData.unlocks}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, unlocks: v as any }))
                  }
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spin">Spin Only</SelectItem>
                    <SelectItem value="trivia">Trivia Only</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Max Uses Per Person</Label>
                <Input
                  type="number"
                  value={formData.max_uses_per_user}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      max_uses_per_user: e.target.value,
                    }))
                  }
                  className="bg-white/5 border-white/10 text-white"
                  min="1"
                />
              </div>
            </div>

            {formData.type !== "single_use" && (
              <div>
                <Label className="text-white">
                  Max Total Uses (empty = unlimited)
                </Label>
                <Input
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, max_uses: e.target.value }))
                  }
                  placeholder="Unlimited"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            )}

            {formData.type === "time_limited" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white">Valid From</Label>
                  <Input
                    type="datetime-local"
                    value={formData.valid_from}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, valid_from: e.target.value }))
                    }
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Valid Until</Label>
                  <Input
                    type="datetime-local"
                    value={formData.valid_until}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        valid_until: e.target.value,
                      }))
                    }
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="border-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCode}
              disabled={creating}
              style={{ backgroundColor: business?.brand_color }}
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create Code"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Generate Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-md bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              Generate Bulk Codes
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Create multiple single-use codes at once. Perfect for printing on
              receipts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white">Number of Codes</Label>
              <Input
                type="number"
                value={bulkCount}
                onChange={(e) => setBulkCount(parseInt(e.target.value) || 10)}
                className="bg-white/5 border-white/10 text-white"
                min={1}
                max={1000}
              />
            </div>
            <div>
              <Label className="text-white">Label</Label>
              <Input
                value={formData.label}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, label: e.target.value }))
                }
                placeholder="Receipt Codes - June 2026"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Unlocks</Label>
              <Select
                value={formData.unlocks}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, unlocks: v as any }))
                }
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spin">Spin Only</SelectItem>
                  <SelectItem value="trivia">Trivia Only</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bulkCodes.length > 0 && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 max-h-40 overflow-y-auto">
                <p className="text-green-400 text-sm font-medium mb-2">
                  {bulkCodes.length} codes generated
                </p>
                {bulkCodes.slice(0, 10).map((c, i) => (
                  <code
                    key={i}
                    className="block text-xs text-green-300 font-mono"
                  >
                    {c}
                  </code>
                ))}
                {bulkCodes.length > 10 && (
                  <p className="text-xs text-green-400/50 mt-1">
                    ...and {bulkCodes.length - 10} more
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col gap-2">
            {bulkCodes.length > 0 && (
              <Button
                variant="outline"
                onClick={() => exportCodes(bulkCodes)}
                className="border-white/10 w-full"
              >
                <Download className="h-4 w-4 mr-2" /> Export to CSV
              </Button>
            )}
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBulkDialog(false);
                  setBulkCodes([]);
                }}
                className="border-white/10 flex-1"
              >
                Close
              </Button>
              <Button
                onClick={handleCreateBulkCodes}
                disabled={creating}
                className="flex-1"
                style={{ backgroundColor: business?.brand_color }}
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Generate Codes"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-sm bg-gray-900 border-white/10 text-center">
          <DialogHeader>
            <DialogTitle className="text-white">QR Code</DialogTitle>
          </DialogHeader>
          {selectedQRCode && (
            <div className="space-y-4 py-4">
              <div className="bg-white p-4 rounded-xl inline-block mx-auto">
                {/* QR Code would be generated here using a library like qrcode.react */}
                <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                  <QrCode className="h-24 w-24 text-gray-400" />
                </div>
              </div>
              <p className="text-white font-mono font-bold text-lg">
                {selectedQRCode.code}
              </p>
              <p className="text-white/50 text-sm">
                Customers scan this to go directly to your spin page
              </p>
              <p className="text-white/30 text-xs">
                URL: engagespin.com/spin?code={selectedQRCode.code}
              </p>
              <Button
                onClick={() => {
                  const url = `engagespin.com/spin?code=${selectedQRCode.code}`;
                  navigator.clipboard.writeText(url);
                  toast.success("URL copied!");
                }}
                variant="outline"
                className="border-white/10 w-full"
              >
                <Copy className="h-4 w-4 mr-2" /> Copy Spin URL
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
