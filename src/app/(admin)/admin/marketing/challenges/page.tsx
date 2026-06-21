// app/(admin)/admin/[businessSlug]/challenges/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Edit, Trash2, Eye, Trophy, Crown, Coins, Clock, Target,
  Loader2, Play, Pause, Flag, TrendingUp, Save, Brain, Users,
  Medal, Gift, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Challenge, TriviaScoringConfig, PrizeTier } from "@/types/challenges";
import { TriviaHostControls } from "@/components/challenges/TriviaHostControls";

// ─── Main Component ─────────────────────────────────────
export default function AdminChallengesPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const { supabase } = useAuth();
  const router = useRouter();

  const [business, setBusiness] = useState<any>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [triviaHostOpen, setTriviaHostOpen] = useState(false);
  const [triviaHostChallenge, setTriviaHostChallenge] = useState<Challenge | null>(null);

  const fetchData = useCallback(async () => {
    if (!businessSlug) return;

    const { data: biz } = await supabase
      .from("businesses").select("id, name, slug, brand_color").eq("slug", businessSlug).single();
    if (!biz) { router.push("/business/signup"); return; }
    setBusiness(biz);

    const { data } = await supabase
      .from("challenges")
      .select("*")
      .eq("business_id", biz.id)
      .eq("challenge_type", "trivia")
      .order("created_at", { ascending: false });

    setChallenges(data || []);
    setLoading(false);
  }, [businessSlug, supabase, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("challenges").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    toast.success(`Challenge ${status}`);
    fetchData();
  };

  const deleteChallenge = async (id: string) => {
    if (confirm("Delete this trivia challenge?")) {
      await supabase.from("challenges").delete().eq("id", id);
      toast.success("Challenge deleted");
      fetchData();
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      draft: { label: "Draft", variant: "secondary", icon: Eye },
      active: { label: "Active", variant: "default", icon: Play },
      paused: { label: "Paused", variant: "outline", icon: Pause },
      ended: { label: "Ended", variant: "secondary", icon: Flag },
      archived: { label: "Archived", variant: "destructive", icon: Flag },
    };
    const c = map[status] || map.draft;
    const Icon = c.icon;
    return <Badge variant={c.variant} className="gap-1"><Icon className="h-3 w-3" />{c.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const brandColor = business?.brand_color || "#8B5CF6";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Trivia Challenges</h1>
          <p className="text-muted-foreground text-sm">
            Create live trivia events for your customers
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedChallenge(null)} style={{ backgroundColor: brandColor }}>
              <Plus className="h-4 w-4 mr-2" /> New Trivia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedChallenge ? "Edit Trivia" : "Create Trivia Challenge"}</DialogTitle>
              <DialogDescription>Configure your trivia event</DialogDescription>
            </DialogHeader>
            <TriviaChallengeForm
              businessId={business?.id}
              initialChallenge={selectedChallenge}
              brandColor={brandColor}
              onSave={() => { fetchData(); setDialogOpen(false); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Challenges Grid */}
      {challenges.length === 0 ? (
        <Card className="p-12 text-center">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No trivia challenges yet</h3>
          <p className="text-muted-foreground mb-4">Create your first trivia event to engage customers live</p>
          <Button onClick={() => { setSelectedChallenge(null); setDialogOpen(true); }} style={{ backgroundColor: brandColor }}>
            <Plus className="h-4 w-4 mr-2" /> Create Trivia
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {challenges.map((challenge) => {
            const isActive = challenge.status === "active";
            const isEnded = new Date(challenge.ends_at) < new Date();

            return (
              <Card key={challenge.id} className="overflow-hidden hover:shadow-lg transition-all">
                <div className="h-24 bg-gradient-to-r from-yellow-500 to-orange-500 p-4 text-white relative">
                  <div className="absolute top-3 right-3">{getStatusBadge(challenge.status)}</div>
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="h-4 w-4" />
                    <span className="text-sm opacity-90">Trivia</span>
                  </div>
                  <h3 className="text-lg font-bold line-clamp-1">{challenge.name}</h3>
                </div>

                <CardContent className="p-4 space-y-3">
                  {challenge.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{challenge.description}</p>
                  )}

                  {/* Prize Tiers */}
                  <div className="flex flex-wrap gap-1">
                    {challenge.prize_tiers?.slice(0, 3).map((tier, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tier.rank === 1 && <Crown className="h-3 w-3 mr-1 text-yellow-500" />}
                        {tier.prize_type === "points" ? `${tier.prize_value} pts` : tier.prize_value}
                      </Badge>
                    ))}
                  </div>

                  {/* Timing */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Starts:</span>
                      <span>{format(new Date(challenge.starts_at), "MMM d, h:mm a")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ends:</span>
                      <span className={isEnded ? "text-red-500" : ""}>
                        {format(new Date(challenge.ends_at), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/${businessSlug}/trivia/${challenge.id}/live`} target="_blank">
                        <Eye className="h-3 w-3 mr-1" /> Live
                      </Link>
                    </Button>
                    {isActive && (
                      <Button variant="outline" size="sm" className="flex-1"
                        onClick={() => { setTriviaHostChallenge(challenge); setTriviaHostOpen(true); }}>
                        <Brain className="h-3 w-3 mr-1" /> Host
                      </Button>
                    )}
                    <Button variant="outline" size="sm"
                      onClick={() => { setSelectedChallenge(challenge); setDialogOpen(true); }}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteChallenge(challenge.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Status actions */}
                  {challenge.status === "draft" && (
                    <Button className="w-full" size="sm" onClick={() => updateStatus(challenge.id, "active")}>
                      <Play className="h-4 w-4 mr-2" /> Activate
                    </Button>
                  )}
                  {isActive && !isEnded && (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => updateStatus(challenge.id, "paused")}>
                      <Pause className="h-4 w-4 mr-2" /> Pause
                    </Button>
                  )}
                  {challenge.status === "paused" && (
                    <Button size="sm" className="w-full" onClick={() => updateStatus(challenge.id, "active")}>
                      <Play className="h-4 w-4 mr-2" /> Resume
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Trivia Host Dialog */}
      <Dialog open={triviaHostOpen} onOpenChange={setTriviaHostOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-yellow-500" />
              Trivia Host Panel - {triviaHostChallenge?.name}
            </DialogTitle>
            <DialogDescription>Control the trivia game flow</DialogDescription>
          </DialogHeader>
          {triviaHostChallenge && (
            <TriviaHostControls challenge={triviaHostChallenge} onClose={() => setTriviaHostOpen(false)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Trivia Challenge Form ──────────────────────────────
function TriviaChallengeForm({
  businessId,
  initialChallenge,
  brandColor,
  onSave,
}: {
  businessId: string;
  initialChallenge: Challenge | null;
  brandColor: string;
  onSave: () => void;
}) {
  const { supabase } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: initialChallenge?.name || "",
    slug: initialChallenge?.slug || "",
    description: initialChallenge?.description || "",
    scoring_config: {
      base_points: initialChallenge?.scoring_config?.base_points || 100,
      time_limit: initialChallenge?.scoring_config?.time_limit || 5,
      speed_bonus_lightning: initialChallenge?.scoring_config?.speed_bonus_lightning || 50,
      speed_bonus_quick: initialChallenge?.scoring_config?.speed_bonus_quick || 25,
      speed_bonus_good: initialChallenge?.scoring_config?.speed_bonus_good || 10,
      streak_bonus_enabled: initialChallenge?.scoring_config?.streak_bonus_enabled ?? true,
      spin_game_id: initialChallenge?.scoring_config?.spin_game_id || "",
    },
    prize_tiers: initialChallenge?.prize_tiers || [
      { rank: 1, prize_type: "points", prize_value: 5000 },
      { rank: 2, prize_type: "points", prize_value: 2500 },
      { rank: 3, prize_type: "points", prize_value: 1000 },
    ],
    starts_at: initialChallenge?.starts_at?.slice(0, 16) || new Date().toISOString().slice(0, 16),
    ends_at: initialChallenge?.ends_at?.slice(0, 16) || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    status: initialChallenge?.status || "draft",
    theme_color: initialChallenge?.theme_color || brandColor,
    show_leaderboard: initialChallenge?.show_leaderboard ?? true,
    show_ticker: initialChallenge?.show_ticker ?? true,
    participation_points: initialChallenge?.participation_points || 0,
  });

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSubmit = async () => {
    if (!formData.name.trim()) { toast.error("Name is required"); return; }

    setSaving(true);
    try {
      const slug = formData.slug || generateSlug(formData.name);
      const payload = {
        ...formData,
        slug,
        business_id: businessId,
        challenge_type: "trivia",
        updated_at: new Date().toISOString(),
      };

      if (initialChallenge?.id) {
        await supabase.from("challenges").update(payload).eq("id", initialChallenge.id);
      } else {
        await supabase.from("challenges").insert(payload);
      }

      toast.success(initialChallenge ? "Updated!" : "Created!");
      onSave();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addPrizeTier = () => {
    const newRank = formData.prize_tiers.length + 1;
    setFormData({ ...formData, prize_tiers: [...formData.prize_tiers, { rank: newRank, prize_type: "points", prize_value: 500 }] });
  };

  const removePrizeTier = (index: number) => {
    const tiers = formData.prize_tiers.filter((_, i) => i !== index);
    tiers.forEach((t, i) => (t.rank = i + 1));
    setFormData({ ...formData, prize_tiers: tiers });
  };

  const updatePrizeTier = (index: number, field: string, value: any) => {
    const tiers = [...formData.prize_tiers];
    (tiers[index] as any)[field] = value;
    setFormData({ ...formData, prize_tiers: tiers });
  };

  return (
    <div className="space-y-6 py-4">
      <Tabs defaultValue="basic">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="scoring">Scoring</TabsTrigger>
          <TabsTrigger value="prizes">Prizes</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Basic */}
        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Challenge Name *</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })} placeholder="Friday Night Trivia" />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} placeholder="auto-generated" />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Describe your trivia event..." />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v as typeof formData.status })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        {/* Scoring */}
        <TabsContent value="scoring" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Base Points per Question</Label>
              <Input type="number" value={formData.scoring_config.base_points} onChange={e => setFormData({ ...formData, scoring_config: { ...formData.scoring_config, base_points: parseInt(e.target.value) || 100 } })} />
            </div>
            <div>
              <Label>Time Limit (seconds)</Label>
              <Input type="number" value={formData.scoring_config.time_limit} onChange={e => setFormData({ ...formData, scoring_config: { ...formData.scoring_config, time_limit: parseInt(e.target.value) || 5 } })} min={3} max={30} />
            </div>
          </div>

          <Label>Speed Bonus Points</Label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Lightning (&lt;1s)</Label>
              <Input type="number" value={formData.scoring_config.speed_bonus_lightning} onChange={e => setFormData({ ...formData, scoring_config: { ...formData.scoring_config, speed_bonus_lightning: parseInt(e.target.value) || 0 } })} />
            </div>
            <div>
              <Label className="text-xs">Quick (&lt;2s)</Label>
              <Input type="number" value={formData.scoring_config.speed_bonus_quick} onChange={e => setFormData({ ...formData, scoring_config: { ...formData.scoring_config, speed_bonus_quick: parseInt(e.target.value) || 0 } })} />
            </div>
            <div>
              <Label className="text-xs">Good (&lt;3s)</Label>
              <Input type="number" value={formData.scoring_config.speed_bonus_good} onChange={e => setFormData({ ...formData, scoring_config: { ...formData.scoring_config, speed_bonus_good: parseInt(e.target.value) || 0 } })} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Streak Bonuses</Label>
              <p className="text-xs text-muted-foreground">Bonus for 3+ consecutive correct answers</p>
            </div>
            <Switch checked={formData.scoring_config.streak_bonus_enabled} onCheckedChange={v => setFormData({ ...formData, scoring_config: { ...formData.scoring_config, streak_bonus_enabled: v } })} />
          </div>

          <div>
            <Label>Linked Spin Game ID (optional)</Label>
            <Input value={formData.scoring_config.spin_game_id} onChange={e => setFormData({ ...formData, scoring_config: { ...formData.scoring_config, spin_game_id: e.target.value } })} placeholder="Spin game UUID for ticket entry" />
            <p className="text-xs text-muted-foreground mt-1">Customers win trivia tickets via this spin game</p>
          </div>

          <div className="pt-4">
            <Label>Participation Points</Label>
            <Input type="number" value={formData.participation_points} onChange={e => setFormData({ ...formData, participation_points: parseInt(e.target.value) || 0 })} />
            <p className="text-xs text-muted-foreground mt-1">Points for all participants</p>
          </div>
        </TabsContent>

        {/* Prizes */}
        <TabsContent value="prizes" className="space-y-3 mt-4">
          {formData.prize_tiers.map((tier, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
              <div className="w-12 flex items-center gap-1">
                {tier.rank === 1 && <Crown className="h-4 w-4 text-yellow-500" />}
                {tier.rank === 2 && <Medal className="h-4 w-4 text-gray-400" />}
                {tier.rank === 3 && <Medal className="h-4 w-4 text-amber-600" />}
                <span className="text-sm font-medium">#{tier.rank}</span>
              </div>
              <Select value={tier.prize_type} onValueChange={v => updatePrizeTier(idx, "prize_type", v)}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">Points</SelectItem>
                  <SelectItem value="discount">Discount %</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                </SelectContent>
              </Select>
              <Input type={tier.prize_type === "points" || tier.prize_type === "discount" ? "number" : "text"}
                value={tier.prize_value} onChange={e => updatePrizeTier(idx, "prize_value", e.target.value)}
                placeholder={tier.prize_type === "points" ? "Points" : tier.prize_type === "discount" ? "%" : "Prize name"}
                className="w-28" />
              <Button variant="ghost" size="sm" onClick={() => removePrizeTier(idx)} disabled={formData.prize_tiers.length <= 1}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addPrizeTier}><Plus className="h-4 w-4 mr-1" /> Add Prize Tier</Button>
        </TabsContent>

        {/* Schedule */}
        <TabsContent value="schedule" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date & Time</Label>
              <Input type="datetime-local" value={formData.starts_at} onChange={e => setFormData({ ...formData, starts_at: e.target.value })} />
            </div>
            <div>
              <Label>End Date & Time</Label>
              <Input type="datetime-local" value={formData.ends_at} onChange={e => setFormData({ ...formData, ends_at: e.target.value })} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onSave}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving} style={{ backgroundColor: brandColor }}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {initialChallenge ? "Update" : "Create"} Trivia
        </Button>
      </div>
    </div>
  );
}