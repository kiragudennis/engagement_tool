// app/(admin)/admin/referrals/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Users,
  Search,
  Filter,
  Calendar,
  DollarSign,
  RefreshCw,
  CheckCircle,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ReferralCommission {
  id: string;
  referral_id: string;
  referrer_id: string;
  referrer_email: string;
  referrer_name: string;
  referred_business_id: string;
  business_name: string;
  business_slug: string;
  type: string;
  amount: number;
  plan: string;
  billing_cycle: string;
  status: string;
  paid_at: string | null;
  created_at: string;
}

interface ReferralRecord {
  id: string;
  referrer_id: string;
  referrer_email: string;
  referrer_name: string;
  referred_business_id: string;
  business_name: string;
  business_slug: string;
  referral_code: string;
  status: string;
  commission_type: string;
  commission_rate: number;
  created_at: string;
}

export default function AdminReferralsPage() {
  const { supabase, profile } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [commissions, setCommissions] = useState<ReferralCommission[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [payoutLoading, setPayoutLoading] = useState<string | null>(null);
  const [payoutDialog, setPayoutDialog] = useState<ReferralCommission | null>(
    null,
  );
  const [withdrawalDialog, setWithdrawalDialog] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    if (!profile || profile.role !== "super_admin") {
      router.push("/login");
      return;
    }

    try {
       const [referralsRes, commissionsRes, withdrawalsRes] = await Promise.all([
        supabase.rpc("get_all_referrals", {
          p_user_id: profile.id,
        }),
        supabase.rpc("get_all_referral_commissions", {}),
        supabase
          .from("referral_withdrawals")
          .select(
            "id, referrer_id, amount, currency, payment_method, mpesa_phone, status, processed_at, notes, created_at, referrer:users!inner(email, full_name)",
          )
          .order("created_at", { ascending: false }),
      ]);

      if (referralsRes.data) {
        setReferrals(referralsRes.data);
      }
      if (commissionsRes.data) {
        setCommissions(commissionsRes.data);
      }
      if (withdrawalsRes.data) {
        setWithdrawals(withdrawalsRes.data);
      }
    } catch (err) {
      console.error("Error loading admin referral data:", err);
      toast.error("Failed to load referral data");
    } finally {
      setLoading(false);
    }
  }, [profile, supabase, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const processPayout = async (commission: ReferralCommission) => {
    setPayoutLoading(commission.id);
    try {
      const { error } = await supabase.rpc("process_referral_payout", {
        p_referral_id: commission.referral_id,
      });

      if (error) {
        throw error;
      }

      toast.success("Payout processed successfully");
      await loadData();
    } catch (err: any) {
      console.error("Payout error:", err);
      toast.error(err.message || "Failed to process payout");
    } finally {
      setPayoutLoading(null);
      setPayoutDialog(null);
    }
  };

  const processWithdrawal = async (
    withdrawal: any,
    status: string,
    notes?: string,
  ) => {
    if (!profile) return;
    setPayoutLoading(withdrawal.id);
    try {
      const { error } = await supabase.rpc("process_withdrawal", {
        p_withdrawal_id: withdrawal.id,
        p_admin_id: profile.id,
        p_status: status,
        p_notes: notes || null,
      });

      if (error) throw error;

      toast.success(`Withdrawal ${status}`);
      await loadData();
    } catch (err: any) {
      console.error("Withdrawal processing error:", err);
      toast.error(err.message || "Failed to process withdrawal");
    } finally {
      setPayoutLoading(null);
      setWithdrawalDialog(null);
    }
  };

  const filteredCommissions = commissions.filter((c) => {
    const matchesSearch =
      c.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.referrer_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const totalEarnings = commissions.reduce(
    (sum, c) => sum + Number(c.amount || 0),
    0,
  );
  const totalPaid = commissions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const totalPending = commissions
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-purple-500/10 rounded-lg">
            <Users className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Referral Program</h1>
            <p className="text-white/40">Admin panel for referral management</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 text-purple-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">
                {referrals.length}
              </p>
              <p className="text-xs text-white/40">Total Referrals</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 text-center">
              <DollarSign className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">
                ${totalEarnings.toFixed(2)}
              </p>
              <p className="text-xs text-white/40">Total Commissions</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">
                ${totalPaid.toFixed(2)}
              </p>
              <p className="text-xs text-white/40">Paid Out</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 text-center">
              <RefreshCw className="h-5 w-5 text-orange-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">
                ${totalPending.toFixed(2)}
              </p>
              <p className="text-xs text-white/40">Pending Payout</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Commission History</CardTitle>
            <CardDescription className="text-white/40">
              All referral commissions across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <Input
                  placeholder="Search by business or referrer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-white"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredCommissions.length === 0 ? (
              <p className="text-white/40 text-center py-8">
                No commissions found
              </p>
            ) : (
              <div className="space-y-2">
                {filteredCommissions.map((c) => (
                  <motion.div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" />
                      <div>
                        <p className="text-white text-sm font-medium">
                          {c.business_name || "Unknown Business"}
                        </p>
                        <p className="text-white/40 text-xs">
                          Referrer: {c.referrer_name || c.referrer_email} •{" "}
                          {c.type} • {c.plan || "N/A"}
                        </p>
                        <p className="text-white/30 text-xs flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(c.created_at), "PPP")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">
                        ${Number(c.amount || 0).toFixed(2)}
                      </span>
                      <Badge
                        className={
                          c.status === "paid"
                            ? "bg-green-500/20 text-green-400"
                            : c.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                        }
                      >
                        {c.status}
                      </Badge>
                      {c.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPayoutDialog(c)}
                          disabled={payoutLoading === c.id}
                        >
                          {payoutLoading === c.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <DollarSign className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 mt-6">
          <CardHeader>
            <CardTitle className="text-white">Referral Records</CardTitle>
            <CardDescription className="text-white/40">
              All business referrals
            </CardDescription>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <p className="text-white/40 text-center py-8">
                No referrals found
              </p>
            ) : (
              <div className="space-y-2">
                {referrals.map((r) => (
                  <motion.div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" />
                      <div>
                        <p className="text-white text-sm font-medium">
                          {r.business_name || "Unknown Business"}
                        </p>
                        <p className="text-white/40 text-xs">
                          Referrer: {r.referrer_name || r.referrer_email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={
                          r.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : r.status === "joined"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-gray-500/20 text-gray-400"
                        }
                      >
                        {r.status}
                      </Badge>
                      <code className="text-xs text-white/30">
                        {r.referral_code}
                      </code>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal Requests */}
        <Card className="bg-white/5 border-white/10 mt-6">
          <CardHeader>
            <CardTitle className="text-white">
              Withdrawal Requests
            </CardTitle>
            <CardDescription className="text-white/40">
              Affiliate withdrawal requests ($100 minimum, Paystack or M-Pesa)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {withdrawals.filter(
              (w) => w.status === "pending" || w.status === "processing",
            ).length === 0 ? (
              <p className="text-white/40 text-center py-8">
                No pending withdrawal requests
              </p>
            ) : (
              <div className="space-y-2">
                {withdrawals
                  .filter(
                    (w) =>
                      w.status === "pending" || w.status === "processing",
                  )
                  .map((w) => (
                    <motion.div
                      key={w.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Banknote className="h-4 w-4 text-purple-400" />
                        <div>
                          <p className="text-white text-sm font-medium">
                            ${Number(w.amount || 0).toFixed(2)} USD
                          </p>
                          <p className="text-white/40 text-xs">
                            {w.referrer?.email || "Unknown"} •{" "}
                            {w.payment_method}
                            {w.mpesa_phone && ` (${w.mpesa_phone})`}
                          </p>
                          <p className="text-white/30 text-xs flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(w.created_at), "PPP")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={cn(
                            "text-xs",
                            w.status === "paid"
                              ? "bg-green-500/20 text-green-400"
                              : w.status === "processing"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-yellow-500/20 text-yellow-400",
                          )}
                        >
                          {w.status}
                        </Badge>
                        {w.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setWithdrawalDialog(w)}
                          >
                            Process
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!payoutDialog} onOpenChange={() => setPayoutDialog(null)}>
        <DialogContent className="bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Payout</DialogTitle>
            <DialogDescription className="text-white/40">
              Process payout of $
              {payoutDialog ? Number(payoutDialog.amount).toFixed(2) : "0.00"}{" "}
              to {payoutDialog?.referrer_name || payoutDialog?.referrer_email}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutDialog(null)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-pink-600"
              onClick={() => payoutDialog && processPayout(payoutDialog)}
              disabled={payoutLoading === payoutDialog?.id}
            >
              {payoutLoading === payoutDialog?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Process Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!withdrawalDialog}
        onOpenChange={() => setWithdrawalDialog(null)}
      >
        <DialogContent className="bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              Process Withdrawal ${withdrawalDialog ? Number(withdrawalDialog.amount).toFixed(2) : "0.00"}
            </DialogTitle>
            <DialogDescription className="text-white/40">
              {withdrawalDialog?.referrer?.email || "Unknown affiliate"}
              {" • "}
              {withdrawalDialog?.payment_method === "paystack"
                ? "Paystack"
                : "M-Pesa"}{" "}
              {withdrawalDialog?.mpesa_phone &&
                `(${withdrawalDialog.mpesa_phone})`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawalDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="border-red-500/20 text-red-400 hover:bg-red-500/10"
              onClick={() =>
                withdrawalDialog &&
                processWithdrawal(withdrawalDialog, "cancelled", "Cancelled by admin")
              }
              disabled={payoutLoading === withdrawalDialog?.id}
            >
              Reject
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-pink-600"
              onClick={() =>
                withdrawalDialog &&
                processWithdrawal(withdrawalDialog, "processing")
              }
              disabled={payoutLoading === withdrawalDialog?.id}
            >
              {payoutLoading === withdrawalDialog?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve &amp; Pay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
