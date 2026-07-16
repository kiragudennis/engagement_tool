// app/(admin)/admin/[businessSlug]/settings/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Save,
  Store,
  CreditCard,
  Users,
  Palette,
  Copy,
  Mail,
  Phone,
  User,
  Image,
  Trash2,
  Plus,
  Crown,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

export default function BusinessSettingsPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const { supabase, profile } = useAuth();
  const router = useRouter();

  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    admin_name: "",
    admin_email: "",
    admin_phone: "",
    logo_url: "",
    brand_color: "#8B5CF6",
    brand_secondary_color: "#EC4899",
    activation_duration_days: 30,
    require_reactivation_after_expiry: true,
    max_spins_per_activation: 0,
    show_branding_on_live: true,
    require_email_for_prize: true,
    points_per_redemption: 10,
    points_multiplier: 0.5,
    api_key: "",
  });

  // Admin users
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("admin");
  const [inviting, setInviting] = useState(false);

  // Danger zone
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const brandColor = business?.brand_color || "#8B5CF6";

  // ─── Load Data ────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!businessSlug) return;

    const { data: biz } = await supabase
      .from("businesses")
      .select("*")
      .eq("slug", businessSlug)
      .single();

    if (!biz) {
      router.push("/business/signup");
      return;
    }
    // Load API key
    const { data: apiKey } = await supabase
      .from("business_api_keys")
      .select("api_key")
      .eq("business_id", biz.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    setBusiness(biz);
    setFormData({
      name: biz.name || "",
      slug: biz.slug || "",
      description: biz.description || "",
      admin_name: biz.admin_name || "",
      admin_email: biz.admin_email || "",
      admin_phone: biz.admin_phone || "",
      logo_url: biz.logo_url || "",
      brand_color: biz.brand_color || "#8B5CF6",
      brand_secondary_color: biz.brand_secondary_color || "#EC4899",
      activation_duration_days: biz.activation_duration_days || 30,
      require_reactivation_after_expiry:
        biz.require_reactivation_after_expiry ?? true,
      max_spins_per_activation: biz.max_spins_per_activation || 0,
      show_branding_on_live: biz.show_branding_on_live ?? true,
      require_email_for_prize: biz.require_email_for_prize ?? true,
      points_per_redemption: biz.points_per_redemption ?? 10,
      points_multiplier: biz.points_multiplier ?? 0.5,
      api_key: apiKey?.api_key || "",
    });

    // Load admin users
    const { data: admins } = await supabase
      .from("business_admins")
      .select("*, users!user_id(full_name, email)")
      .eq("business_id", biz.id);

    setAdminUsers(admins || []);
    setLoading(false);
  }, [businessSlug, supabase, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Save Settings ────────────────────────────────────
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Business name is required");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          name: formData.name,
          description: formData.description,
          admin_name: formData.admin_name,
          admin_email: formData.admin_email,
          admin_phone: formData.admin_phone,
          logo_url: formData.logo_url || null,
          brand_color: formData.brand_color,
          brand_secondary_color: formData.brand_secondary_color,
          activation_duration_days: formData.activation_duration_days,
          require_reactivation_after_expiry:
            formData.require_reactivation_after_expiry,
          max_spins_per_activation: formData.max_spins_per_activation,
          show_branding_on_live: formData.show_branding_on_live,
          require_email_for_prize: formData.require_email_for_prize,
          updated_at: new Date().toISOString(),
        })
        .eq("id", business.id);

      if (error) throw error;
      toast.success("Settings saved!");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ─── Invite Admin ─────────────────────────────────────
  const handleInviteAdmin = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Email is required");
      return;
    }
    setInviting(true);
    try {
      // Check if user exists
      const { data: users } = await supabase
        .from("users")
        .select("id, email")
        .eq("email", inviteEmail.toLowerCase())
        .single();

      if (!users) {
        toast.error(
          "No account found with this email. They need to sign up first.",
        );
        setInviting(false);
        return;
      }

      // Check if already an admin
      const { data: existing } = await supabase
        .from("business_admins")
        .select("id")
        .eq("business_id", business.id)
        .eq("user_id", users.id)
        .single();

      if (existing) {
        toast.error("This user is already an admin");
        setInviting(false);
        return;
      }

      // Add as admin
      await supabase.from("business_admins").insert({
        business_id: business.id,
        user_id: users.id,
        role: inviteRole,
        accepted_at: new Date().toISOString(),
      });

      toast.success(`${users.email} added as ${inviteRole}!`);
      setInviteEmail("");
      setShowInviteDialog(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to invite");
    } finally {
      setInviting(false);
    }
  };

  // ─── Remove Admin ─────────────────────────────────────
  const handleRemoveAdmin = async (adminId: string, userId: string) => {
    if (userId === profile?.id) {
      toast.error("You cannot remove yourself");
      return;
    }
    if (!confirm("Remove this admin?")) return;
    await supabase.from("business_admins").delete().eq("id", adminId);
    toast.success("Admin removed");
    loadData();
  };

  // ─── Delete Business ──────────────────────────────────
  const handleDeleteBusiness = async () => {
    if (deleteConfirm !== business.name) {
      toast.error("Type the business name to confirm");
      return;
    }
    setDeleting(true);
    try {
      await supabase.from("businesses").delete().eq("id", business.id);
      toast.success("Business deleted");
      router.push("/business/signup");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  // ─── Regenerate Api Key ──────────────────────────────────
  const handleRegenerateApiKey = async () => {
    if (
      !confirm(
        "Regenerate your API key? The old key will stop working immediately.",
      )
    )
      return;

    try {
      const res = await fetch("/api/business/api-key/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFormData((p) => ({ ...p, api_key: data.api_key }));
      toast.success("API key regenerated!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const publicUrl = `engagespin.com/${businessSlug}/spin`;
  const isStarterPlan =
    business?.plan === "starter" || business?.plan === "trial";
  const isProOrEnterprise =
    business?.plan === "pro" || business?.plan === "enterprise";

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
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/${businessSlug}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Settings</h1>
              <p className="text-white/40 text-sm">{business?.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Scrollable wrapper */}
          <div className="relative w-full">
            <div className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
              <TabsList className="bg-white/5 border border-white/10 mb-6 inline-flex w-max min-w-full">
                <TabsTrigger value="general" className="flex-shrink-0">
                  <Store className="h-4 w-4 mr-2" />
                  General
                </TabsTrigger>
                <TabsTrigger value="branding" className="flex-shrink-0">
                  <Palette className="h-4 w-4 mr-2" />
                  Branding
                </TabsTrigger>
                <TabsTrigger value="engagement" className="flex-shrink-0">
                  <Users className="h-4 w-4 mr-2" />
                  Engagement
                </TabsTrigger>
                <TabsTrigger value="team" className="flex-shrink-0">
                  <Users className="h-4 w-4 mr-2" />
                  Team
                </TabsTrigger>
                <TabsTrigger value="danger" className="flex-shrink-0">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Danger
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* ─── GENERAL ──────────────────────────────────── */}
          <TabsContent value="general" className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">
                  Business Information
                </CardTitle>
                <CardDescription className="text-white/50">
                  Your basic business details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Business Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, name: e.target.value }))
                      }
                      className="mt-1 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Slug</Label>
                    <Input
                      value={formData.slug}
                      disabled
                      className="mt-1 bg-white/5 border-white/10 text-white/50"
                    />
                    <p className="text-white/30 text-xs mt-1">
                      Cannot be changed after creation
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-white">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    placeholder="A short description of your business..."
                    rows={3}
                    className="mt-1 bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Contact Name</Label>
                    <div className="relative mt-1">
                      <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                      <Input
                        value={formData.admin_name}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            admin_name: e.target.value,
                          }))
                        }
                        className="pl-9 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white">Contact Email</Label>
                    <div className="relative mt-1">
                      <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                      <Input
                        type="email"
                        value={formData.admin_email}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            admin_email: e.target.value,
                          }))
                        }
                        className="pl-9 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-white">Contact Phone</Label>
                  <div className="relative mt-1">
                    <Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <Input
                      value={formData.admin_phone}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          admin_phone: e.target.value,
                        }))
                      }
                      placeholder="+254 712 345 678"
                      className="pl-9 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>

                {/* Public URL */}
                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                  <Label className="text-white mb-2 block">
                    Public Page URL
                  </Label>
                  <div className="flex gap-2">
                    <code className="flex-1 p-2 rounded-lg bg-black/30 text-yellow-400 font-mono text-sm break-all">
                      {publicUrl}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/10"
                      onClick={() => {
                        navigator.clipboard.writeText(publicUrl);
                        toast.success("Copied!");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Info */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5" /> Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium capitalize">
                      {business.plan} Plan
                    </p>
                    <Badge
                      className={cn(
                        "mt-1",
                        business.subscription_status === "trial" &&
                          "bg-yellow-500/20 text-yellow-400",
                        business.subscription_status === "active" &&
                          "bg-green-500/20 text-green-400",
                      )}
                    >
                      {business.subscription_status}
                    </Badge>
                    {business.subscription_status === "trial" &&
                      business.trial_ends_at && (
                        <p className="text-white/40 text-xs mt-1">
                          Trial ends{" "}
                          {formatDistanceToNow(
                            new Date(business.trial_ends_at),
                            { addSuffix: true },
                          )}
                        </p>
                      )}
                  </div>
                  <Button asChild variant="outline" className="border-white/10">
                    <a href={`/admin/${businessSlug}/billing`}>
                      <CreditCard className="h-4 w-4 mr-2" /> Manage Billing
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                style={{ backgroundColor: brandColor }}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </TabsContent>

          {/* ─── BRANDING ─────────────────────────────────── */}
          <TabsContent value="branding" className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">
                  Brand Customization
                </CardTitle>
                <CardDescription className="text-white/50">
                  Customize how your business appears to customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo */}
                <div>
                  <Label className="text-white mb-2 block">Logo URL</Label>
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {formData.logo_url ? (
                        <img
                          src={formData.logo_url}
                          alt="Logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image className="h-6 w-6 text-white/20" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Input
                        value={formData.logo_url}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            logo_url: e.target.value,
                          }))
                        }
                        placeholder="https://example.com/logo.png"
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <p className="text-white/30 text-xs mt-1">
                        Enter a URL for your logo image
                      </p>
                    </div>
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white mb-2 block">
                      Primary Color
                    </Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.brand_color}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            brand_color: e.target.value,
                          }))
                        }
                        className="w-10 h-10 rounded-lg cursor-pointer border-0"
                      />
                      <Input
                        value={formData.brand_color}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            brand_color: e.target.value,
                          }))
                        }
                        className="flex-1 bg-white/5 border-white/10 text-white font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">
                      Secondary Color
                    </Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.brand_secondary_color}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            brand_secondary_color: e.target.value,
                          }))
                        }
                        className="w-10 h-10 rounded-lg cursor-pointer border-0"
                      />
                      <Input
                        value={formData.brand_secondary_color}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            brand_secondary_color: e.target.value,
                          }))
                        }
                        className="flex-1 bg-white/5 border-white/10 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="p-4 rounded-xl border border-white/10">
                  <Label className="text-white/60 text-xs mb-3 block">
                    Preview
                  </Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: formData.brand_color }}
                    >
                      {formData.name?.[0] || "?"}
                    </div>
                    <div>
                      <p className="text-white font-bold">
                        {formData.name || "Business Name"}
                      </p>
                      <p className="text-white/40 text-xs">
                        This is how customers see your brand
                      </p>
                    </div>
                  </div>
                </div>

                {/* Display settings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">
                        Show branding on live display
                      </Label>
                      <p className="text-white/40 text-xs">
                        Your logo and colors appear on the OBS broadcast
                      </p>
                    </div>
                    <Switch
                      checked={formData.show_branding_on_live}
                      onCheckedChange={(v) =>
                        setFormData((p) => ({ ...p, show_branding_on_live: v }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                style={{ backgroundColor: brandColor }}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Branding
              </Button>
            </div>
          </TabsContent>

          {/* ─── ENGAGEMENT ───────────────────────────────── */}
          <TabsContent value="engagement" className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">
                  Customer Engagement Rules
                </CardTitle>
                <CardDescription className="text-white/50">
                  Control how customers interact with your business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">
                      Activation Duration (days)
                    </Label>
                    <Input
                      type="number"
                      value={formData.activation_duration_days}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          activation_duration_days:
                            parseInt(e.target.value) || 30,
                        }))
                      }
                      className="mt-1 bg-white/5 border-white/10 text-white"
                      min={1}
                      max={365}
                    />
                    <p className="text-white/30 text-xs mt-1">
                      How long a code keeps a customer active
                    </p>
                  </div>
                  <div>
                    <Label className="text-white">
                      Points Per Code Redemption
                    </Label>
                    <Input
                      type="number"
                      value={formData.points_per_redemption}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          points_per_redemption: parseInt(e.target.value) || 10,
                        }))
                      }
                      className="mt-1 bg-white/5 border-white/10 text-white"
                      min={0}
                      max={1000}
                    />
                    <p className="text-white/30 text-xs mt-1">
                      Loyalty points awarded to customers each time they redeem
                      a code. Set to 0 to disable.
                    </p>
                  </div>
                  <div>
                    <Label className="text-white">
                      Max Spins Per Activation
                    </Label>
                    <Input
                      type="number"
                      value={formData.max_spins_per_activation}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          max_spins_per_activation:
                            parseInt(e.target.value) || 0,
                        }))
                      }
                      className="mt-1 bg-white/5 border-white/10 text-white"
                      min={0}
                    />
                    <p className="text-white/30 text-xs mt-1">
                      0 = unlimited spins during activation period
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">
                        Require reactivation after expiry
                      </Label>
                      <p className="text-white/40 text-xs">
                        Customers need a new code after their activation expires
                      </p>
                    </div>
                    <Switch
                      checked={formData.require_reactivation_after_expiry}
                      onCheckedChange={(v) =>
                        setFormData((p) => ({
                          ...p,
                          require_reactivation_after_expiry: v,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">
                        Require email for prizes
                      </Label>
                      <p className="text-white/40 text-xs">
                        Customers must enter email to claim their prize
                      </p>
                    </div>
                    <Switch
                      checked={formData.require_email_for_prize}
                      onCheckedChange={(v) =>
                        setFormData((p) => ({
                          ...p,
                          require_email_for_prize: v,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="text-white font-medium text-sm mb-2">
                    How it works
                  </h4>
                  <ul className="space-y-1 text-white/50 text-xs">
                    <li>
                      • Customers enter a code → activated for{" "}
                      {formData.activation_duration_days} days
                    </li>
                    <li>
                      •{" "}
                      {formData.require_reactivation_after_expiry
                        ? "They need a new code after expiry"
                        : "They stay active permanently"}
                    </li>
                    <li>
                      •{" "}
                      {formData.max_spins_per_activation > 0
                        ? `Max ${formData.max_spins_per_activation} spins per activation`
                        : "Unlimited spins while active"}
                    </li>
                    <li>
                      •{" "}
                      <span className="text-green-400">
                        +{formData.points_per_redemption || 10} loyalty points
                      </span>{" "}
                      awarded per code redemption
                    </li>
                    <li>
                      •{" "}
                      {formData.require_email_for_prize
                        ? "Email required to claim prizes"
                        : "No email required"}
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Points Configuration */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">
                  Points Configuration
                </CardTitle>
                <CardDescription className="text-white/50">
                  How customers earn loyalty points from your codes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sticker Codes (All Plans) */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <Printer className="h-4 w-4 text-purple-400" />
                    <h4 className="text-white font-medium text-sm">
                      Sticker Codes
                    </h4>
                    <Badge className="bg-white/10 text-white/60 text-xs border-0">
                      All Plans
                    </Badge>
                  </div>
                  <p className="text-white/40 text-xs">
                    Sticker codes have fixed point values set during batch
                    generation. Manage sticker batches from the Sticker
                    Generator page.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="border-white/10 text-xs"
                  >
                    <a href={`/admin/${businessSlug}/stickers`}>
                      <Printer className="h-3 w-3 mr-1" /> Go to Sticker
                      Generator
                    </a>
                  </Button>
                </div>

                {/* Public/Marketing Codes (All Plans) */}
                <div>
                  <Label className="text-white">Public Code Points</Label>
                  <Input
                    type="number"
                    value={formData.points_per_redemption || 10}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        points_per_redemption: parseInt(e.target.value) || 10,
                      }))
                    }
                    className="mt-1 bg-white/5 border-white/10 text-white"
                    min={1}
                  />
                  <p className="text-white/30 text-xs mt-1">
                    Default points for public marketing codes and QR codes.
                    Sticker codes use their own point values set during
                    generation.
                  </p>
                </div>

                {/* POS Integration (Pro/Enterprise only) */}
                {isProOrEnterprise ? (
                  <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-4">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-purple-400" />
                      <h4 className="text-white font-medium text-sm">
                        POS Receipt Codes
                      </h4>
                      <Badge className="bg-purple-500/20 text-purple-400 text-xs border-0">
                        Pro Feature
                      </Badge>
                    </div>

                    <p className="text-white/40 text-xs">
                      When your POS system sends the cart total, points are
                      calculated as:
                      <strong className="text-white">
                        {" "}
                        Amount × Multiplier
                      </strong>
                      . The calculation happens when the code is created, not
                      when it's redeemed.
                    </p>

                    <div>
                      <Label className="text-white">Points Multiplier</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.points_multiplier || 1.0}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            points_multiplier:
                              parseFloat(e.target.value) || 1.0,
                          }))
                        }
                        className="mt-1 bg-white/5 border-white/10 text-white"
                        min={0.1}
                        max={10}
                      />
                      <p className="text-white/30 text-xs mt-1">
                        Example: Cart KES 250 ×{" "}
                        {formData.points_multiplier || 1.0} ={" "}
                        {Math.floor(250 * (formData.points_multiplier || 1.0))}{" "}
                        points
                      </p>
                    </div>

                    <div>
                      <Label className="text-white">API Key</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={formData.api_key || "No API key generated"}
                          readOnly
                          className="flex-1 bg-white/5 border-white/10 text-white/50 font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/10"
                          onClick={() => {
                            navigator.clipboard.writeText(formData.api_key);
                            toast.success("API key copied!");
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/10"
                          onClick={handleRegenerateApiKey}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-white/30 text-xs mt-1">
                        Use this key to generate receipt codes from your POS
                        system.
                        <a
                          href="/docs/api"
                          className="text-purple-400 hover:underline ml-1"
                        >
                          View API docs →
                        </a>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-white/50 text-sm">
                      <span className="text-purple-400 font-medium">
                        Pro & Enterprise
                      </span>{" "}
                      get access to:
                    </p>
                    <ul className="text-white/40 text-xs mt-2 space-y-1">
                      <li>• Points multiplier for POS receipt codes</li>
                      <li>• API access for POS integration</li>
                    </ul>
                    <Button
                      asChild
                      size="sm"
                      className="mt-3"
                      style={{ backgroundColor: brandColor }}
                    >
                      <a href={`/admin/${businessSlug}/billing`}>
                        Upgrade Plan
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                style={{ backgroundColor: brandColor }}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Rules
              </Button>
            </div>
          </TabsContent>

          {/* ─── TEAM ─────────────────────────────────────── */}
          <TabsContent value="team" className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">Team Members</CardTitle>
                    <CardDescription className="text-white/50">
                      People who can manage this business
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowInviteDialog(true)}
                    style={{ backgroundColor: brandColor }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Invite
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {adminUsers.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-white font-bold">
                          {admin.users?.full_name?.[0] ||
                            admin.users?.email?.[0] ||
                            "?"}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {admin.users?.full_name || "Unknown"}
                            {admin.user_id === profile?.id && (
                              <span className="text-purple-400 text-xs ml-2">
                                (You)
                              </span>
                            )}
                          </p>
                          <p className="text-white/40 text-xs">
                            {admin.users?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={cn(
                            "text-xs",
                            admin.role === "owner"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-white/10 text-white/60",
                          )}
                        >
                          {admin.role === "owner" ? (
                            <Crown className="h-3 w-3 mr-1" />
                          ) : null}
                          {admin.role}
                        </Badge>
                        {admin.user_id !== profile?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveAdmin(admin.id, admin.user_id)
                            }
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── DANGER ZONE ──────────────────────────────── */}
          <TabsContent value="danger" className="space-y-6">
            <Card className="bg-red-500/5 border-red-500/20">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> Danger Zone
                </CardTitle>
                <CardDescription className="text-red-400/60">
                  Irreversible actions. Please be certain.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <h4 className="text-white font-medium mb-2">
                    Delete Business
                  </h4>
                  <p className="text-white/50 text-sm mb-3">
                    This will permanently delete your business, all spin games,
                    trivia challenges, draws, codes, and customer data. This
                    action cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Business
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite Admin Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Invite Team Member</DialogTitle>
            <DialogDescription className="text-white/50">
              They must already have an Engage account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white">Email Address</Label>
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@email.com"
                className="mt-1 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="host">
                    Host (can manage trivia only)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInviteDialog(false)}
              className="border-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteAdmin}
              disabled={inviting}
              style={{ backgroundColor: brandColor }}
            >
              {inviting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-gray-900 border-red-500/20">
          <DialogHeader>
            <DialogTitle className="text-red-400">Delete Business</DialogTitle>
            <DialogDescription className="text-white/50">
              This action is irreversible. All data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white">
                Type{" "}
                <span className="text-red-400 font-bold">{business?.name}</span>{" "}
                to confirm
              </Label>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={business?.name}
                className="mt-1 bg-white/5 border-red-500/30 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-white/10"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBusiness}
              disabled={deleting || deleteConfirm !== business?.name}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
