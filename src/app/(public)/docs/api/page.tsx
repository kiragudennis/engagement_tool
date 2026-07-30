// app/(public)/docs/api/page.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Zap,
  Key,
  Shield,
  Terminal,
  Copy,
  Check,
  ArrowRight,
  ShoppingBag,
  Ticket,
  Gift,
  Coins,
  Globe,
  Store,
  Sparkles,
  RotateCcw,
  Crown,
  Trophy,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

const ENDPOINTS = [
  {
    method: "POST",
    path: "/api/business/receipt/generate",
    label: "Generate Receipt Code",
    description:
      "Generate a unique receipt code for a customer purchase. Works with POS systems, e-commerce stores, and any checkout process. The unified code generator handles both receipts and stickers with the same underlying function.",
    auth: "API Key",
    plan: "Pro & Enterprise",
    request: `{
  "amount": 250.00,        // Required: Cart total in KES
  "items": [               // Optional: Line items for your records
    {
      "name": "Latte",
      "qty": 2,
      "price": 125.00
    }
  ],
  "cashier": "Jane",       // Optional: Staff or order reference
  "unlocks": "spin",       // Optional: "points" | "spin" | "draw" | "spin_draw" (default: "points")
  "customerPhone": "0712345678", // Optional: Pre-fill customer info
  "pointsOverride": 500,   // Optional: Set exact points instead of calculated
  "transactionId": "ORD-12345", // Optional: Your system's order/receipt ID
  "storeLocation": "Nairobi" // Optional: Store location
}`,
    response: `{
  "success": true,
  "receipt": {
    "code_id": "uuid",
    "receipt_id": "uuid",
    "receipt_number": "RCPT-0042",
    "code": "BREW-PR-00042-A7X9",
    "points_earned": 500,
    "amount": 250.00,
    "unlocks": "spin",
    "tier": "standard",
    "business_name": "Brew & Bean Coffee",
    "business_slug": "brew-bean",
    "business_logo": "https://...",
    "business_color": "#8B5CF6",
    "qr_url": "/spin?code=BREW-PR-00042-A7X9"
  }
}`,
    notes: [
      "Uses the unified business code generator (same as stickers)",
      "Points are calculated as: amount × your business multiplier",
      "Control what customers unlock with the 'unlocks' parameter",
      "Each code is single-use and unique",
      "The code activates the customer for 30 days",
      "Works with POS systems, e-commerce, and manual checkout",
      "Code pattern: {PREFIX}-{PLAN_TYPE}{SUBTYPE}-{SEQUENCE}-{RANDOM}",
      "Plan type: S=Starter, P=Pro, E=Enterprise",
      "Subtype: R=Receipt (for this endpoint)",
    ],
  },
  {
    method: "GET",
    path: "/api/code/lookup",
    label: "Look Up Code",
    description:
      "Validate a code and get its details. Works for both receipt codes and sticker codes. Useful for checking if a code is still valid before using it in your system.",
    auth: "None (public)",
    plan: "All Plans",
    request: `GET /api/code/lookup?code=BREW-PR-00042-A7X9`,
    response: `{
  "success": true,
  "code": "BREW-PR-00042-A7X9",
  "unlocks": "spin",
  "type": "receipt", // or "sticker", "public"
  "tier": "standard", // or "bronze", "silver", "gold", "diamond"
  "point_value": 500,
  "business_id": "uuid",
  "business_name": "Brew & Bean Coffee",
  "business_slug": "brew-bean",
  "business_logo": "https://...",
  "business_color": "#8B5CF6",
  "redirect_url": "/brew-bean/spin",
  "is_active": true, // or false
  "max_uses": 1,
  "current_uses": 0,
  "max_uses_per_user": 1,
  "valid_from": "2026-07-18 09:21:11.069601+00",
  "valid_until": "2030-07-18 09:21:11.069601+00",
}`,
    notes: [
      "No authentication required",
      "Returns 404 if code is invalid or expired",
      "Works for receipt, sticker, public, and QR codes",
      "Use this to pre-validate codes before printing or sending to customers",
    ],
  },
  {
    method: "POST",
    path: "/api/business/customers/lookup",
    label: "Look Up Customer",
    description:
      "Find a customer by phone, email, or ID number. Useful for POS and e-commerce checkout to verify the customer and retrieve their points balance.",
    auth: "API Key (X-API-Key header)",
    plan: "Pro & Enterprise",
    request: `{
  "phone": "+254700000000",   // OR
  "email": "customer@email.com", // OR
  "id_number": "12345678"
}`,
    response: `{
  "success": true,
  "users": [
    {
      "id": "uuid",
      "email": "customer@email.com",
      "full_name": "Jane Doe",
      "phone": "+254700000000",
      "id_number": "12345678",
      "status": "active",
      "id_verified": true,
      "summary": {
        "businesses": [
          {
            "business_id": "uuid",
            "business_name": "Brew & Bean",
            "points": 500,
            "tier": "silver",
            "spins_used": 3,
            "is_active": true
          }
        ],
        "recent_spins": [...]
      }
    }
  ]
}`,
    notes: [
      "Requires X-API-Key header with your business API key",
      "Returns up to 5 matching users",
      "Includes engagement summary for each user",
      "Use this to verify customer identity at checkout",
    ],
  },
  {
    method: "POST",
    path: "/api/business/customers/points/deduct",
    label: "Deduct Customer Points",
    description:
      "Deduct points from a customer's balance for a purchase. This is how POS and e-commerce checkout works — the customer pays with points, and the business deducts them server-side.",
    auth: "API Key (X-API-Key header)",
    plan: "Pro & Enterprise",
    request: `{
  "user_id": "uuid",           // Required: Customer user ID
  "points": 100,               // Required: Points to deduct
  "reference_id": "ORD-12345", // Optional: Your order/receipt ID
  "description": "Coffee purchase" // Optional: Transaction description
}`,
    response: `{
  "success": true,
  "transaction": {
    "id": "uuid",
    "user_id": "uuid",
    "points_change": -100,
    "current_points": 400,
    "transaction_type": "pos_deduction",
    "description": "Coffee purchase",
    "created_at": "2026-07-30T10:00:00Z"
  }
}`,
    notes: [
      "Requires X-API-Key header with your business API key",
      "Fails if customer has insufficient points",
      "Creates a loyalty_transaction record for audit",
      "Points are deducted from the customer's balance for THIS business only",
      "Use this in your POS or e-commerce checkout flow",
    ],
  },
  {
    method: "POST",
    path: "/api/notifications/send",
    label: "Send Notification",
    description:
      "Send an in-app notification to a user, optionally with email (Resend) and SMS (Twilio). Used by Engage for important system events. Businesses handle their own marketing outside Engage.",
    auth: "Admin Session or Business API Key",
    plan: "All Plans",
    request: `{
  "user_id": "uuid",
  "type": "system_alert",
  "title": "Important Update",
  "message": "Your account has been verified.",
  "business_id": "uuid",       // Optional
  "email": "user@email.com",   // Optional
  "phone": "+254700000000",    // Optional
  "email_html": "<p>HTML content</p>", // Optional
  "sms_body": "SMS text",      // Optional
  "metadata": {}               // Optional
}`,
    response: `{
  "success": true,
  "results": {
    "inApp": true,
    "email": true,
    "sms": false
  },
  "notification": {
    "user_id": "uuid",
    "business_id": "uuid",
    "type": "system_alert",
    "title": "Important Update",
    "message": "Your account has been verified."
  }
}`,
    notes: [
      "In-app notification is always created",
      "Email requires Resend configuration",
      "SMS requires Twilio configuration",
      "Business admins can only send for their own business",
      "Admins can send for any business",
      "Most marketing notifications are handled by businesses outside Engage",
    ],
  },
];

export default function ApiDocsPage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    toast.success("Copied!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950">
      {/* Hero */}
      <div className="text-center py-16 px-4 border-b border-white/5">
        <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-0">
          For Developers
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          API Reference
        </h1>
        <p className="text-lg text-white/50 max-w-2xl mx-auto">
          Integrate Engage with your checkout system — POS, e-commerce, or
          manual order processing. The unified API generates both receipt and
          sticker codes using the same powerful backend function.
        </p>
        <div className="flex gap-3 justify-center mt-6">
          <Link href="/docs">
            <Button variant="outline" className="border-white/10 gap-2">
              <ArrowRight className="h-4 w-4 rotate-180" /> General Docs
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Who Can Use This */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Globe className="h-6 w-6 text-purple-400" /> Who Can Use This API
          </h2>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <p className="text-white/60 text-sm leading-relaxed mb-4">
                This API works for{" "}
                <strong className="text-white">
                  any business with a checkout process
                </strong>
                . Whether you're a coffee shop, an online store, or a service
                provider, you can generate codes for your customers.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    icon: Store,
                    title: "POS Systems",
                    desc: "Restaurants, cafes, retail stores — generate codes on receipt",
                  },
                  {
                    icon: Globe,
                    title: "E-Commerce",
                    desc: "Online stores, Shopify, WooCommerce — generate codes after checkout",
                  },
                  {
                    icon: Terminal,
                    title: "Manual Checkout",
                    desc: "Phone orders, events, pop-ups — generate codes manually",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-white/5 border border-white/10 text-center"
                  >
                    <item.icon className="h-5 w-5 text-purple-400 mx-auto mb-2" />
                    <p className="text-white font-medium text-sm">
                      {item.title}
                    </p>
                    <p className="text-white/40 text-xs mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-400" /> How It Works
          </h2>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 space-y-4">
              <div className="p-4 rounded-lg bg-black/30">
                <p className="text-white/60 text-sm">
                  <strong className="text-white">
                    Unified Code Generator:
                  </strong>{" "}
                  Both receipt codes and sticker codes use the same{" "}
                  <code className="text-purple-400">
                    business code generator
                  </code>
                  . function. This ensures consistency across all code types and
                  makes it easy to switch between sticker and receipt models.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingBag className="h-4 w-4 text-green-400" />
                      <span className="text-white font-medium text-sm">
                        Receipt Codes
                      </span>
                    </div>
                    <ul className="space-y-1 text-white/50 text-xs">
                      <li>
                        • Generated via{" "}
                        <code className="text-green-400">
                          /api/business/receipt/generate
                        </code>
                      </li>
                      <li>• Points = Amount × Multiplier</li>
                      <li>
                        • Pattern:{" "}
                        <code className="text-green-400">
                          BREW-PR-00042-A7X9
                        </code>
                      </li>
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Printer className="h-4 w-4 text-blue-400" />
                      <span className="text-white font-medium text-sm">
                        Sticker Codes
                      </span>
                    </div>
                    <ul className="space-y-1 text-white/50 text-xs">
                      <li>
                        • Generated via{" "}
                        <code className="text-blue-400">
                          /api/business/receipt/sticker-batch
                        </code>
                      </li>
                      <li>• Tier-based points (Bronze→Diamond)</li>
                      <li>
                        • Pattern:{" "}
                        <code className="text-blue-400">
                          BREW-PS-00001-A7X9
                        </code>
                      </li>
                    </ul>
                  </div>
                </div>
                <p className="text-white/40 text-xs mt-4">
                  Both use the same underlying system with different{" "}
                  <code className="text-purple-400">code subtype</code> values:
                  "R" for Receipt or "S" for Sticker.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Authentication */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Key className="h-6 w-6 text-purple-400" /> Authentication
          </h2>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 space-y-4">
              <p className="text-white/60 text-sm leading-relaxed">
                All API requests that modify data require an API key. You can
                find your API key in your business settings under{" "}
                <strong className="text-white">
                  Settings → Engagement → POS Receipt Points
                </strong>
                .
              </p>
              <p className="text-white/60 text-sm">
                Include the key in the request header:
              </p>
              <div className="p-4 rounded-lg bg-black/30 font-mono text-sm flex items-center justify-between">
                <code className="text-purple-400">
                  x-api-key: engage_live_abc123def456...
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyCode("x-api-key: engage_live_abc123def456...", -1)
                  }
                  className="text-white/40 hover:text-white"
                >
                  {copiedIndex === -1 ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                <Shield className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-yellow-400 text-sm font-medium">
                    Keep your API key secret
                  </p>
                  <p className="text-yellow-400/60 text-xs mt-1">
                    Never expose your API key in client-side code. All API calls
                    should be made from your server. Regenerate your key anytime
                    from your dashboard if compromised.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* What Engage Needs */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-purple-400" /> What Engage
            Needs
          </h2>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 space-y-4">
              <p className="text-white/60 text-sm leading-relaxed">
                Engage does <strong className="text-white">not</strong> record
                your sales data. We only need the{" "}
                <strong className="text-white">cart total</strong> to calculate
                points. The items array and other fields are optional for your
                own records.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                  <h4 className="text-green-400 font-medium text-sm mb-2 flex items-center gap-1">
                    <Check className="h-4 w-4" /> Required
                  </h4>
                  <ul className="space-y-1 text-white/50 text-xs">
                    <li>
                      • <code className="text-green-400">amount</code> — Cart
                      total (KES)
                    </li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <h4 className="text-blue-400 font-medium text-sm mb-2 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Optional (for control)
                  </h4>
                  <ul className="space-y-1 text-white/50 text-xs">
                    <li>
                      • <code className="text-blue-400">unlocks</code> — What
                      customer gets (default: "points")
                    </li>
                    <li>
                      • <code className="text-blue-400">pointsOverride</code> —
                      Set exact points
                    </li>
                    <li>
                      • <code className="text-blue-400">items</code> — Line
                      items (for your records)
                    </li>
                    <li>
                      • <code className="text-blue-400">customerPhone</code> —
                      Pre-fill customer info
                    </li>
                    <li>
                      • <code className="text-blue-400">transactionId</code> —
                      Your order/receipt reference
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-black/30">
                <p className="text-white/60 text-sm">
                  <strong className="text-white">Points Calculation:</strong>{" "}
                  Points = Cart Amount × Your Business Multiplier
                </p>
                <p className="text-white/40 text-xs mt-2">
                  Example: Cart total = KES 250, Multiplier = 2.0 → Customer
                  gets 500 points
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* What Customer Unlocks */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Gift className="h-6 w-6 text-purple-400" /> What Your Customer
            Unlocks
          </h2>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 space-y-4">
              <p className="text-white/60 text-sm">
                Use the <code className="text-purple-400">unlocks</code>{" "}
                parameter to control exactly what your customer gets. This lets
                you tailor the experience based on purchase value or promotional
                strategy.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    unlock: "points",
                    icon: Coins,
                    label: "Points Only",
                    desc: "Earn points, need another code to access features",
                    example: "Small purchases, building loyalty",
                    color: "gray",
                  },
                  {
                    unlock: "spin",
                    icon: RotateCcw,
                    label: "Spin Access",
                    desc: "Unlock the spin wheel immediately",
                    example: "Mid-tier purchases, instant rewards",
                    color: "blue",
                  },
                  {
                    unlock: "draw",
                    icon: Trophy,
                    label: "Draw Entry",
                    desc: "Auto-entry into prize draws",
                    example: "Promotional periods, building anticipation",
                    color: "amber",
                  },
                  {
                    unlock: "spin_draw",
                    icon: Crown,
                    label: "Spin + Draw (Premium)",
                    desc: "Both spin access AND draw entry",
                    example: "High-value purchases, VIP customers",
                    color: "purple",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-3 rounded-lg border",
                      `bg-${item.color}-500/5 border-${item.color}-500/20`,
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <item.icon
                        className={cn("h-4 w-4", `text-${item.color}-400`)}
                      />
                      <p className="text-white font-medium text-sm">
                        {item.label}
                      </p>
                    </div>
                    <p className="text-white/50 text-xs mb-1">{item.desc}</p>
                    <p className="text-white/30 text-xs italic">
                      {item.example}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                <h5 className="text-purple-400 font-medium text-xs mb-1">
                  💡 Strategic Tips
                </h5>
                <ul className="space-y-1 text-purple-400/60 text-xs">
                  <li>
                    • <strong className="text-purple-300">Lower spend:</strong>{" "}
                    Send{" "}
                    <code className="text-purple-400">"unlocks": "points"</code>{" "}
                    — customer earns points, needs to come back
                  </li>
                  <li>
                    • <strong className="text-purple-300">Mid spend:</strong>{" "}
                    Send{" "}
                    <code className="text-purple-400">"unlocks": "spin"</code> —
                    customer can spin immediately
                  </li>
                  <li>
                    • <strong className="text-purple-300">High spend:</strong>{" "}
                    Send{" "}
                    <code className="text-purple-400">
                      "unlocks": "spin_draw"
                    </code>{" "}
                    — premium experience rewards loyalty
                  </li>
                  <li>
                    • <strong className="text-purple-300">Promotions:</strong>{" "}
                    Send{" "}
                    <code className="text-purple-400">"unlocks": "draw"</code> —
                    build excitement for upcoming events
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Endpoints */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Terminal className="h-6 w-6 text-purple-400" /> Endpoints
          </h2>

          <div className="space-y-8">
            {ENDPOINTS.map((endpoint, i) => (
              <Card key={i} className="bg-white/5 border-white/10">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge
                      className={cn(
                        "text-xs font-bold",
                        endpoint.method === "POST"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-blue-500/20 text-blue-400",
                      )}
                    >
                      {endpoint.method}
                    </Badge>
                    <code className="text-white font-mono text-sm">
                      {endpoint.path}
                    </code>
                    <Badge className="bg-purple-500/20 text-purple-400 text-xs border-0">
                      {endpoint.auth}
                    </Badge>
                    <Badge className="bg-white/10 text-white/60 text-xs border-0">
                      {endpoint.plan}
                    </Badge>
                  </div>

                  <h3 className="text-white font-semibold text-lg">
                    {endpoint.label}
                  </h3>
                  <p className="text-white/50 text-sm">
                    {endpoint.description}
                  </p>

                  {/* Request */}
                  <div>
                    <p className="text-white/40 text-xs font-medium mb-2">
                      Request
                    </p>
                    <div className="relative">
                      <pre className="p-4 rounded-lg bg-black/30 text-green-400 text-xs font-mono overflow-x-auto">
                        {endpoint.request}
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCode(endpoint.request, i)}
                        className="absolute top-2 right-2 text-white/40 hover:text-white"
                      >
                        {copiedIndex === i ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Response */}
                  <div>
                    <p className="text-white/40 text-xs font-medium mb-2">
                      Response
                    </p>
                    <pre className="p-4 rounded-lg bg-black/30 text-yellow-400 text-xs font-mono overflow-x-auto">
                      {endpoint.response}
                    </pre>
                  </div>

                  {/* Notes */}
                  <div>
                    <p className="text-white/40 text-xs font-medium mb-2">
                      Notes
                    </p>
                    <ul className="space-y-1">
                      {endpoint.notes.map((note, j) => (
                        <li
                          key={j}
                          className="text-white/50 text-xs flex items-start gap-2"
                        >
                          <span className="text-purple-400 mt-0.5">•</span>{" "}
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Integration Examples */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-400" /> Integration
            Examples
          </h2>

          <div className="space-y-4">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                  <Store className="h-4 w-4 text-blue-400" />
                  POS System (Restaurant)
                </h3>
                <div className="space-y-2 text-white/50 text-xs">
                  <p>
                    After payment is complete, POS sends cart total and unlocks
                    based on order size:
                  </p>
                  <pre className="p-3 rounded-lg bg-black/30 text-green-400 font-mono text-xs overflow-x-auto">
                    {`POST /api/business/receipt/generate
{
  "amount": 250.00,
  "items": [
    { "name": "Burger", "qty": 1, "price": 150.00 },
    { "name": "Fries", "qty": 1, "price": 50.00 },
    { "name": "Soda", "qty": 1, "price": 50.00 }
  ],
  "registerId": "REG-001",
  "cashier": "Jane",
  "unlocks": "spin",
  "customerPhone": "0712345678"
}`}
                  </pre>
                  <p>
                    Customer gets code printed on receipt, can spin the wheel.
                    Uses unified generator with subtype "R".
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-green-400" />
                  E-Commerce (Online Store)
                </h3>
                <div className="space-y-2 text-white/50 text-xs">
                  <p>
                    After order confirmation, webhook sends cart total and
                    unlocks based on order value:
                  </p>
                  <pre className="p-3 rounded-lg bg-black/30 text-green-400 font-mono text-xs overflow-x-auto">
                    {`POST /api/business/receipt/generate
{
  "amount": 500.00,
  "items": [
    { "name": "T-Shirt", "qty": 2, "price": 250.00 }
  ],
  "transactionId": "ORD-12345",
  "unlocks": "spin_draw",
  "customerPhone": "0712345678",
  "customerName": "John Doe"
}`}
                  </pre>
                  <p>
                    Customer receives code via email. Gets spin access AND entry
                    into monthly draw. Subtype "R" with receipt tracking.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-amber-400" />
                  Manual Checkout (Phone Orders)
                </h3>
                <div className="space-y-2 text-white/50 text-xs">
                  <p>
                    Staff manually creates order and generates code for
                    customer:
                  </p>
                  <pre className="p-3 rounded-lg bg-black/30 text-green-400 font-mono text-xs overflow-x-auto">
                    {`POST /api/business/receipt/generate
{
  "amount": 150.00,
  "items": [
    { "name": "Pizza", "qty": 1, "price": 120.00 },
    { "name": "Drink", "qty": 1, "price": 30.00 }
  ],
  "cashier": "Mike",
  "unlocks": "points",
  "customerPhone": "0712345678"
}`}
                  </pre>
                  <p>
                    Staff can read the code to the customer or send it via SMS.
                    Customer earns points and needs another code to access
                    spins. Subtype "R" tracks the transaction.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Code Patterns */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Ticket className="h-6 w-6 text-purple-400" /> Code Patterns
          </h2>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <p className="text-white/50 text-sm mb-4">
                All codes are generated by the unified{" "}
                <code className="text-purple-400">business code generator</code>{" "}
                function. The pattern includes plan type and subtype.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-3 text-white/40 font-medium">
                        Pattern
                      </th>
                      <th className="text-left p-3 text-white/40 font-medium">
                        Type
                      </th>
                      <th className="text-left p-3 text-white/40 font-medium">
                        Subtype
                      </th>
                      <th className="text-left p-3 text-white/40 font-medium">
                        Example
                      </th>
                      <th className="text-left p-3 text-white/40 font-medium">
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        pattern: "{PREFIX}-{PLAN}{SUBTYPE}-{SEQ}-{RAND}",
                        type: "Receipt",
                        subtype: "R",
                        example: "BREW-PR-00042-A7X9",
                        points: "Amount × Business Multiplier",
                      },
                      {
                        pattern: "{PREFIX}-{PLAN}{SUBTYPE}-{SEQ}-{RAND}",
                        type: "Sticker",
                        subtype: "S",
                        example: "BREW-PS-00001-B3K2",
                        points: "Set at batch creation (5-500)",
                      },
                      {
                        pattern: "{PREFIX}-{PLAN}{SUBTYPE}-{SEQ}-{RAND}",
                        type: "Public Marketing",
                        subtype: "P",
                        example: "BREW-PP-00015-C7D1",
                        points: "Business default (points_per_redemption)",
                      },
                      {
                        pattern: "{PREFIX}-{PLAN}{SUBTYPE}-{SEQ}-{RAND}",
                        type: "QR Code",
                        subtype: "Q",
                        example: "BREW-PQ-00008-E5F3",
                        points: "Business default (points_per_redemption)",
                      },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="p-3 font-mono text-purple-400 text-xs">
                          {row.pattern}
                        </td>
                        <td className="p-3 text-white text-xs">{row.type}</td>
                        <td className="p-3 text-white/60 text-xs">
                          <Badge
                            className={cn(
                              "text-xs border-0",
                              row.subtype === "R" &&
                                "bg-green-500/20 text-green-400",
                              row.subtype === "S" &&
                                "bg-blue-500/20 text-blue-400",
                              row.subtype === "P" &&
                                "bg-amber-500/20 text-amber-400",
                              row.subtype === "Q" &&
                                "bg-purple-500/20 text-purple-400",
                            )}
                          >
                            {row.subtype}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono text-white/60 text-xs">
                          {row.example}
                        </td>
                        <td className="p-3 text-white/60 text-xs">
                          {row.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-black/30">
                <p className="text-white/40 text-xs">
                  <strong className="text-white">Plan Types:</strong> S=Starter,
                  P=Pro, E=Enterprise &nbsp;|&nbsp;
                  <strong className="text-white"> Subtypes:</strong> R=Receipt,
                  S=Sticker, P=Public, Q=QR
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Rate Limits */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-400" /> Rate Limits
          </h2>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-3 text-white/40 font-medium">
                        Plan
                      </th>
                      <th className="text-left p-3 text-white/40 font-medium">
                        Requests/min
                      </th>
                      <th className="text-left p-3 text-white/40 font-medium">
                        Requests/day
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { plan: "Pro", min: "60", day: "5,000" },
                      { plan: "Enterprise", min: "300", day: "50,000" },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="p-3 text-white">{row.plan}</td>
                        <td className="p-3 text-white/60">{row.min}</td>
                        <td className="p-3 text-white/60">{row.day}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <div className="text-center py-12 border-t border-white/5">
          <h3 className="text-xl font-bold text-white mb-3">
            Need help integrating?
          </h3>
          <p className="text-white/50 mb-6">
            We're happy to help your development team get set up — whether you
            run a POS, e-commerce store, or custom checkout system.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              className="bg-gradient-to-r from-purple-600 to-pink-600 gap-2"
            >
              <a href="mailto:dev@engagespin.com">
                <Zap className="h-4 w-4" /> Contact Developer Support
              </a>
            </Button>
            <Link href="/docs">
              <Button variant="outline" className="border-white/10 gap-2">
                <ArrowRight className="h-4 w-4 rotate-180" /> General Docs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
