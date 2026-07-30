// app/(admin)/admin/[businessSlug]/verify/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  UserCheck,
  UserX,
  Shield,
  Phone,
  Mail,
  Hash,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type UserSummary = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  id_number: string | null;
  status: string;
  flagged_reason: string | null;
  flagged_at: string | null;
  id_verified: boolean;
  id_verified_at: string | null;
  email_verified: boolean;
  created_at: string;
  summary: {
    businesses: any[];
    recent_spins: any[];
    recent_draws: any[];
    recent_trivia: any[];
  };
};

export default function VerifyCustomerPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const { supabase } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"phone" | "email" | "id">("phone");
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setUsers([]);
    setSelectedUser(null);

    try {
      const res = await fetch("/api/admin/customer/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lookup",
          [searchType]: searchQuery.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed");

      setUsers(data.users || []);
      if (data.users && data.users.length === 0) {
        toast.info("No customers found matching that query");
      }
    } catch (err: any) {
      toast.error(err.message || "Lookup failed");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, searchType]);

  const handleVerify = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/customer/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          user_id: selectedUser.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      toast.success("Customer identity verified successfully");
      setSelectedUser((prev) =>
        prev ? { ...prev, id_verified: true, id_verified_at: new Date().toISOString() } : null
      );
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFlag = async () => {
    if (!selectedUser || !flagReason.trim()) {
      toast.error("Please provide a reason for flagging");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/customer/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "flag",
          user_id: selectedUser.id,
          reason: flagReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Flag failed");

      toast.success("Account flagged for review");
      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              status: "flagged",
              flagged_reason: flagReason.trim(),
              flagged_at: new Date().toISOString(),
            }
          : null
      );
      setFlagReason("");
    } catch (err: any) {
      toast.error(err.message || "Flag failed");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-400">Active</Badge>;
      case "flagged":
        return <Badge className="bg-red-500/20 text-red-400">Flagged</Badge>;
      case "inactive":
        return <Badge className="bg-gray-500/20 text-gray-400">Inactive</Badge>;
      case "suspended":
        return <Badge className="bg-yellow-500/20 text-yellow-400">Suspended</Badge>;
      case "banned":
        return <Badge className="bg-red-900/30 text-red-300">Banned</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400">{status}</Badge>;
    }
  };

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
              <h1 className="text-xl font-bold text-white">Verify Customer</h1>
              <p className="text-white/40 text-sm">
                Look up and verify customer identity when collecting prizes
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Search Card */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="h-5 w-5 text-purple-400" />
                Look Up Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Label className="text-white/60 text-xs mb-1 block">
                    Search by {searchType === "phone" ? "Phone" : searchType === "email" ? "Email" : "ID Number"}
                  </Label>
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder={
                      searchType === "phone"
                        ? "+254 700 000000"
                        : searchType === "email"
                        ? "customer@email.com"
                        : "Enter ID number"
                    }
                    className="bg-white/5 border-white/10 text-white"
                    disabled={loading}
                  />
                </div>
                <div className="sm:w-40">
                  <Label className="text-white/60 text-xs mb-1 block">Type</Label>
                  <select
                    value={searchType}
                    onChange={(e) =>
                      setSearchType(e.target.value as "phone" | "email" | "id")
                    }
                    className="w-full rounded-lg border bg-white/5 p-2 text-sm text-white border-white/10"
                  >
                    <option value="phone">Phone</option>
                    <option value="email">Email</option>
                    <option value="id">ID Number</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleSearch}
                    disabled={loading || !searchQuery.trim()}
                    className="gap-2"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {users.length > 0 && !selectedUser && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">
                  Results ({users.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-white font-bold">
                        {user.full_name?.[0] || "?"}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {user.full_name || "Anonymous"}
                        </p>
                        <p className="text-white/40 text-sm">
                          {user.email}
                        </p>
                        {user.phone && (
                          <p className="text-white/30 text-xs flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(user.status)}
                      <Badge
                        className={
                          user.id_verified
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                        }
                      >
                        {user.id_verified ? "ID Verified" : "ID Unverified"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Selected User Detail */}
          {selectedUser && (
            <div className="space-y-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className="h-5 w-5 text-purple-400" />
                      Customer Details
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedUser.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUser(null)}
                        className="text-white/60"
                      >
                        Back to results
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-white/40 text-xs">Full Name</p>
                        <p className="text-white font-medium">
                          {selectedUser.full_name || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs flex items-center gap-1">
                          <Mail className="h-3 w-3" /> Email
                        </p>
                        <p className="text-white font-medium">
                          {selectedUser.email}
                        </p>
                      </div>
                      {selectedUser.phone && (
                        <div>
                          <p className="text-white/40 text-xs flex items-center gap-1">
                            <Phone className="h-3 w-3" /> Phone
                          </p>
                          <p className="text-white font-medium">
                            {selectedUser.phone}
                          </p>
                        </div>
                      )}
                      {selectedUser.id_number && (
                        <div>
                          <p className="text-white/40 text-xs flex items-center gap-1">
                            <Hash className="h-3 w-3" /> ID Number
                          </p>
                          <p className="text-white font-medium">
                            {selectedUser.id_number}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-white/40 text-xs">Status</p>
                        {getStatusBadge(selectedUser.status)}
                      </div>
                      <div>
                        <p className="text-white/40 text-xs">Email Verified</p>
                        <Badge
                          className={
                            selectedUser.email_verified
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-500/20 text-gray-400"
                          }
                        >
                          {selectedUser.email_verified ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs">ID Verified</p>
                        <Badge
                          className={
                            selectedUser.id_verified
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-500/20 text-gray-400"
                          }
                        >
                          {selectedUser.id_verified ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs">Member Since</p>
                        <p className="text-white/60 text-sm">
                          {formatDistanceToNow(new Date(selectedUser.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedUser.flagged_reason && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-red-400 text-sm font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Flagged: {selectedUser.flagged_reason}
                      </p>
                      {selectedUser.flagged_at && (
                        <p className="text-red-300/60 text-xs mt-1">
                          {formatDistanceToNow(new Date(selectedUser.flagged_at), {
                            addSuffix: true,
                          })}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                    <Button
                      onClick={handleVerify}
                      disabled={actionLoading || selectedUser.id_verified}
                      className="gap-2 flex-1"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : selectedUser.id_verified ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                      {selectedUser.id_verified
                        ? "Identity Verified"
                        : "Verify Identity"}
                    </Button>
                    <div className="flex-1 space-y-2">
                      <Textarea
                        value={flagReason}
                        onChange={(e) => setFlagReason(e.target.value)}
                        placeholder="Reason for flagging this account..."
                        className="bg-white/5 border-white/10 text-white text-sm"
                        disabled={actionLoading}
                      />
                      <Button
                        variant="destructive"
                        onClick={handleFlag}
                        disabled={actionLoading || !flagReason.trim()}
                        className="w-full gap-2"
                      >
                        {actionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserX className="h-4 w-4" />
                        )}
                        Flag Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Summary */}
              {selectedUser.summary && (
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Engagement Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Businesses */}
                    <div>
                      <h4 className="text-white/60 text-sm font-medium mb-3">
                        Active Businesses
                      </h4>
                      {selectedUser.summary.businesses?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedUser.summary.businesses.map((biz: any) => (
                            <div
                              key={biz.business_id}
                              className="p-3 rounded-lg bg-white/5 border border-white/10"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-white text-sm font-medium">
                                    {biz.business_name}
                                  </p>
                                  <p className="text-white/40 text-xs">
                                    {biz.points} pts • {biz.tier}
                                  </p>
                                </div>
                                <Badge
                                  className={
                                    biz.is_active
                                      ? "bg-green-500/20 text-green-400"
                                      : "bg-red-500/20 text-red-400"
                                  }
                                >
                                  {biz.is_active ? "Active" : "Expired"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white/40 text-sm">
                          No active businesses
                        </p>
                      )}
                    </div>

                    {/* Recent Spins */}
                    <div>
                      <h4 className="text-white/60 text-sm font-medium mb-3">
                        Recent Spins
                      </h4>
                      {selectedUser.summary.recent_spins?.length > 0 ? (
                        <div className="space-y-2">
                          {selectedUser.summary.recent_spins
                            .slice(0, 5)
                            .map((spin: any) => (
                              <div
                                key={spin.id}
                                className="flex items-center justify-between p-2 rounded bg-white/5"
                              >
                                <span className="text-white/70 text-sm">
                                  {spin.prize_type === "points" && spin.points_awarded > 0
                                    ? `Won ${spin.points_awarded} Points`
                                    : `Won ${spin.prize_value || spin.prize_type}`}
                                </span>
                                <span className="text-white/30 text-xs">
                                  {spin.business_name}
                                </span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-white/40 text-sm">No spins yet</p>
                      )}
                    </div>

                    {/* Recent Draws */}
                    <div>
                      <h4 className="text-white/60 text-sm font-medium mb-3">
                        Recent Draw Entries
                      </h4>
                      {selectedUser.summary.recent_draws?.length > 0 ? (
                        <div className="space-y-2">
                          {selectedUser.summary.recent_draws
                            .slice(0, 5)
                            .map((draw: any) => (
                              <div
                                key={draw.id}
                                className="flex items-center justify-between p-2 rounded bg-white/5"
                              >
                                <span className="text-white/70 text-sm">
                                  {draw.draw_name}
                                </span>
                                <span className="text-white/30 text-xs">
                                  {draw.entry_count} entries
                                </span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-white/40 text-sm">
                          No draw entries yet
                        </p>
                      )}
                    </div>

                    {/* Recent Trivia */}
                    <div>
                      <h4 className="text-white/60 text-sm font-medium mb-3">
                        Recent Trivia
                      </h4>
                      {selectedUser.summary.recent_trivia?.length > 0 ? (
                        <div className="space-y-2">
                          {selectedUser.summary.recent_trivia
                            .slice(0, 5)
                            .map((trivia: any) => (
                              <div
                                key={trivia.id}
                                className="flex items-center justify-between p-2 rounded bg-white/5"
                              >
                                <span className="text-white/70 text-sm">
                                  {trivia.challenge_name}
                                </span>
                                <span className="text-white/30 text-xs">
                                  Score: {trivia.current_score}
                                </span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-white/40 text-sm">
                          No trivia participation yet
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
