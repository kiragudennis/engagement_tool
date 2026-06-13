// app/(admin)/admin/[businessSlug]/customers/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Download,
  Loader2,
  ArrowLeft,
  Mail,
  Clock,
  RotateCcw,
  Gift,
  Calendar,
  ChevronDown,
  UserCheck,
  UserX,
  ExternalLink,
  Sparkles,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

export default function CustomerListPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const { supabase } = useAuth();
  const router = useRouter();

  const [business, setBusiness] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerDetail, setCustomerDetail] = useState<any>(null);

  const loadCustomers = useCallback(async () => {
    if (!businessSlug) return;
    try {
      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name, slug, brand_color")
        .eq("slug", businessSlug)
        .single();
      if (!biz) return;
      setBusiness(biz);

      let query = supabase
        .from("customer_business_activations")
        .select(
          `
          id, user_id, activated_at, expires_at, is_active, 
          spins_used, trivia_participated, activation_source,
          users!user_id(full_name, email, created_at)
        `,
        )
        .eq("business_id", biz.id)
        .order("activated_at", { ascending: false });

      if (activeTab === "active") {
        query = query
          .eq("is_active", true)
          .gte("expires_at", new Date().toISOString());
      } else if (activeTab === "expired") {
        query = query.or(
          "is_active.eq.false,expires_at.lt." + new Date().toISOString(),
        );
      }

      const { data } = await query;
      setCustomers(data || []);
    } catch (err) {
      console.error("Error loading customers:", err);
    } finally {
      setLoading(false);
    }
  }, [businessSlug, supabase, activeTab]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const loadCustomerDetail = async (customer: any) => {
    setSelectedCustomer(customer);
    try {
      const [{ data: spins }, { data: trivia }] = await Promise.all([
        supabase
          .from("spin_attempts")
          .select("*")
          .eq("user_id", customer.user_id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("challenge_participants")
          .select("*, challenges!inner(name)")
          .eq("user_id", customer.user_id)
          .eq("business_id", business.id)
          .limit(10),
      ]);

      setCustomerDetail({
        ...customer,
        spins: spins || [],
        trivia: trivia || [],
      });
    } catch (err) {
      console.error("Error loading customer detail:", err);
    }
  };

  const exportCustomers = () => {
    const csv =
      "Name,Email,Status,Activated,Expires,Spins Used\n" +
      customers
        .map(
          (c) =>
            `"${c.users?.full_name || ""}","${c.users?.email || ""}","${c.is_active ? "Active" : "Expired"}","${format(new Date(c.activated_at), "yyyy-MM-dd")}","${c.expires_at ? format(new Date(c.expires_at), "yyyy-MM-dd") : "N/A"}","${c.spins_used}"`,
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${businessSlug}-customers-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${customers.length} customers exported`);
  };

  const filteredCustomers = customers.filter((c) => {
    if (!search) return true;
    const name = c.users?.full_name?.toLowerCase() || "";
    const email = c.users?.email?.toLowerCase() || "";
    const term = search.toLowerCase();
    return name.includes(term) || email.includes(term);
  });

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
                <h1 className="text-xl font-bold text-white">Customers</h1>
                <p className="text-white/40 text-sm">
                  {business?.name} • {customers.length} total
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 border-white/10"
              onClick={exportCustomers}
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            {
              label: "Total Customers",
              value: customers.length,
              icon: Users,
              color: "text-blue-400",
            },
            {
              label: "Active",
              value: customers.filter(
                (c) => c.is_active && new Date(c.expires_at) > new Date(),
              ).length,
              icon: UserCheck,
              color: "text-green-400",
            },
            {
              label: "Expired",
              value: customers.filter(
                (c) => !c.is_active || new Date(c.expires_at) <= new Date(),
              ).length,
              icon: UserX,
              color: "text-red-400",
            },
            {
              label: "Total Spins",
              value: customers.reduce((s, c) => s + (c.spins_used || 0), 0),
              icon: RotateCcw,
              color: "text-purple-400",
            },
          ].map((stat) => (
            <Card key={stat.label} className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <stat.icon className={cn("h-5 w-5 mx-auto mb-2", stat.color)} />
                <p className="text-2xl font-bold text-white">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-xs text-white/40">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs & Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1"
          >
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-full sm:w-64">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        {/* Customer List */}
        <div className="space-y-2">
          {filteredCustomers.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-white/10 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">
                  No Customers Yet
                </h3>
                <p className="text-white/40">
                  Share your spin page to start building your customer list
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredCustomers.map((customer, i) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <Card
                  className={cn(
                    "bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer",
                    selectedCustomer?.id === customer.id &&
                      "ring-2 ring-purple-500/50",
                  )}
                  onClick={() => loadCustomerDetail(customer)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-white font-bold">
                          {customer.users?.full_name?.[0] || "?"}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {customer.users?.full_name || "Anonymous"}
                          </p>
                          <p className="text-white/40 text-sm">
                            {customer.users?.email || "No email"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-white text-sm font-medium">
                            {customer.spins_used} spin
                            {customer.spins_used !== 1 ? "s" : ""}
                          </p>
                          <p className="text-white/40 text-xs">
                            {customer.trivia_participated > 0 &&
                              `${customer.trivia_participated} trivia`}
                          </p>
                        </div>

                        <Badge
                          className={cn(
                            customer.is_active &&
                              new Date(customer.expires_at) > new Date()
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400",
                          )}
                        >
                          {customer.is_active &&
                          new Date(customer.expires_at) > new Date() ? (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" /> Active
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3 mr-1" /> Expired
                            </>
                          )}
                        </Badge>

                        <ChevronDown className="h-4 w-4 text-white/20" />
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    {selectedCustomer?.id === customer.id && customerDetail && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 pt-4 border-t border-white/10 space-y-4"
                      >
                        <div className="grid grid-cols-3 gap-3">
                          <DetailBadge
                            label="Activated"
                            value={format(
                              new Date(customerDetail.activated_at),
                              "MMM d, yyyy",
                            )}
                          />
                          <DetailBadge
                            label="Expires"
                            value={
                              customerDetail.expires_at
                                ? format(
                                    new Date(customerDetail.expires_at),
                                    "MMM d, yyyy",
                                  )
                                : "Never"
                            }
                          />
                          <DetailBadge
                            label="Source"
                            value={customerDetail.activation_source || "code"}
                          />
                        </div>

                        {customerDetail.spins?.length > 0 && (
                          <div>
                            <p className="text-white/60 text-xs font-medium mb-2">
                              Recent Spins
                            </p>
                            <div className="space-y-1">
                              {customerDetail.spins
                                .slice(0, 5)
                                .map((spin: any, j: number) => (
                                  <div
                                    key={j}
                                    className="flex items-center justify-between text-sm"
                                  >
                                    <span className="text-white/70">
                                      {spin.prize_type === "points" &&
                                      spin.points_awarded > 0
                                        ? `Won ${spin.points_awarded} Points`
                                        : `Won ${spin.prize_value || spin.prize_type}`}
                                    </span>
                                    <span className="text-white/30 text-xs">
                                      {formatDistanceToNow(
                                        new Date(spin.created_at),
                                        { addSuffix: true },
                                      )}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-white/30">
                          <Mail className="h-3 w-3" />
                          <span>
                            {customer.users?.email || "No email on file"}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function DetailBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-lg bg-white/5 text-center">
      <p className="text-white font-medium text-sm">{value}</p>
      <p className="text-white/40 text-xs">{label}</p>
    </div>
  );
}
