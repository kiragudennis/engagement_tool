// app/bundles/[bundleId]/checkout/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { BundleService } from "@/lib/services/bundle-service";
import { PointsService } from "@/lib/services/points-service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingBag,
  Coins,
  Star,
  Shield,
  Truck,
  Lock,
  Loader2,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { formatPhoneNumber } from "@/lib/utils";
import { Bundle } from "@/types/bundles";

interface OrderSummary {
  subtotal: number;
  discount: number;
  pointsDiscount: number;
  shipping: number;
  total: number;
  pointsEarned: number;
  pointsToUse?: number;
}

export default function BundleCheckoutPage() {
  const { bundleId } = useParams<{ bundleId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { supabase, profile } = useAuth();
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [usePoints, setUsePoints] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [orderSummary, setOrderSummary] = useState<OrderSummary>({
    subtotal: 0,
    discount: 0,
    pointsDiscount: 0,
    shipping: 0,
    total: 0,
    pointsEarned: 0,
  });

  const bundleService = new BundleService(supabase);
  const isBuildOwn = searchParams.get("type") === "build";

  useEffect(() => {
    const loadData = async () => {
      try {
        const bundleData = await bundleService.getBundleById(bundleId);
        if (!bundleData) {
          router.push("/bundles");
          return;
        }
        setBundle(bundleData);

        if (profile?.id) {
          const points = await PointsService.getBalance(supabase, profile.id);
          setUserPoints(points?.points || 0);
        }

        // Calculate order summary
        const subtotal = bundleData.discounted_price || bundleData.base_price;
        const pointsDiscount =
          usePoints &&
          bundleData.points_required > 0 &&
          userPoints >= bundleData.points_required
            ? bundleData.points_required / 10 // Convert points to KSH (adjust rate as needed)
            : 0;

        setOrderSummary({
          subtotal,
          discount: bundleData.discounted_price
            ? bundleData.base_price - bundleData.discounted_price
            : 0,
          pointsDiscount,
          shipping: subtotal >= 10000 ? 0 : 500,
          total: Math.max(
            0,
            subtotal - pointsDiscount + (subtotal >= 10000 ? 0 : 500),
          ),
          pointsEarned: bundleData.bonus_points,
        });
      } catch (error) {
        console.error("Error loading bundle:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    bundleId,
    bundleService,
    router,
    profile?.id,
    supabase,
    usePoints,
    userPoints,
  ]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleMpesaPayment = async () => {
    if (!profile) {
      toast.error("Please login to continue");
      router.push("/login");
      return;
    }

    if (!phoneNumber || phoneNumber.length !== 12) {
      toast.error("Please enter a valid M-Pesa number (e.g., 2547XXXXXXXX)");
      return;
    }

    setProcessing(true);

    try {
      // Get selected items from session storage if build-your-own
      let selectedItems = [];
      if (isBuildOwn) {
        const stored = sessionStorage.getItem("bundleItems");
        if (stored) {
          selectedItems = JSON.parse(stored).items;
        }
      }

      const response = await fetch("/api/checkout/mpesa/bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundleId,
          phoneNumber,
          quantity: 1,
          selectedItems,
          usePoints,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Payment initiation failed");
      }

      toast.success("Payment initiated! Check your phone for the STK push.");

      // Redirect to payment pending page
      router.push(
        `/bundles/${bundleId}/payment-pending?order=${result.orderId}`,
      );
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Failed to initiate payment");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Bundle Not Found</h2>
        <Button onClick={() => router.push("/bundles")}>Browse Bundles</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <ShoppingBag className="h-6 w-6 text-purple-500" />
            <h1 className="text-2xl font-bold">Checkout</h1>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-500" />
                  M-Pesa Payment
                </h2>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="phone">M-Pesa Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="2547XXXXXXXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the M-Pesa number you want to pay from
                    </p>
                  </div>

                  {bundle.points_required > 0 &&
                    userPoints >= bundle.points_required && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <div className="flex items-center gap-2">
                          <Coins className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">
                            Use {bundle.points_required} points for discount
                          </span>
                        </div>
                        <Button
                          variant={usePoints ? "default" : "outline"}
                          size="sm"
                          onClick={() => setUsePoints(!usePoints)}
                        >
                          {usePoints ? "Applied" : "Apply"}
                        </Button>
                      </div>
                    )}

                  <div className="bg-green-500/10 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">
                        Secure Payment
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your payment is processed securely via M-Pesa. You'll
                      receive a prompt on your phone to complete the
                      transaction.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Bundle Summary Card */}
              <Card className="p-6">
                <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{bundle.name}</span>
                    <span>{formatPrice(orderSummary.subtotal)}</span>
                  </div>
                  {orderSummary.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Bundle Discount</span>
                      <span>-{formatPrice(orderSummary.discount)}</span>
                    </div>
                  )}
                  {orderSummary.pointsDiscount > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>Points Discount</span>
                      <span>-{formatPrice(orderSummary.pointsDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>
                      {orderSummary.shipping === 0
                        ? "Free"
                        : formatPrice(orderSummary.shipping)}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">
                        {formatPrice(orderSummary.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Order Summary Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-24">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white rounded-t-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Your Bundle
                  </h3>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bundle</span>
                    <span className="font-medium">{bundle.name}</span>
                  </div>

                  {bundle.bonus_points > 0 && (
                    <div className="flex items-center gap-2 text-sm text-yellow-600">
                      <Star className="h-4 w-4" />
                      <span>Earn {orderSummary.pointsEarned} bonus points</span>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <Button
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      size="lg"
                      onClick={handleMpesaPayment}
                      disabled={processing || !phoneNumber}
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Phone className="h-4 w-4 mr-2" />
                          Pay with M-Pesa
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center mt-3">
                    By completing this purchase, you agree to our Terms of
                    Service
                  </p>
                </div>
              </Card>

              {/* Secure Payment Badges */}
              <Card className="p-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="text-xs">Secure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-green-500" />
                    <span className="text-xs">Encrypted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-green-500" />
                    <span className="text-xs">Free Shipping over KSH 10k</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
