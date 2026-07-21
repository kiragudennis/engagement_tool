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
      "Generate a unique code for a customer receipt. The code will have pre-calculated points based on your business multiplier and the cart total.",
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
  "cashier": "Jane"        // Optional: Staff name
}`,
    response: `{
  "success": true,
  "receipt": {
    "receipt_id": "uuid",
    "receipt_number": "RCPT-0042",
    "code": "BREW-R-260714-A7X9",
    "points_earned": 500,
    "amount": 250.00,
    "business_name": "Brew & Bean Coffee",
    "business_slug": "brew-bean",
    "qr_url": "/spin?code=BREW-R-260714-A7X9"
  }
}`,
    notes: [
      "Points are calculated as: amount × your business multiplier",
      "Each code is single-use and unique",
      "The code activates the customer for 30 days",
      "Codes follow the pattern: {PREFIX}-R-{DATE}-{RANDOM}",
    ],
  },
  {
    method: "GET",
    path: "/api/code/lookup",
    label: "Look Up Code",
    description:
      "Validate a code and get its details. Useful for checking if a code is still valid before printing.",
    auth: "None (public)",
    plan: "All Plans",
    request: `GET /api/code/lookup?code=BREW-R-260714-A7X9`,
    response: `{
  "success": true,
  "code": "BREW-R-260714-A7X9",
  "unlocks": "spin",
  "business_id": "uuid",
  "business_name": "Brew & Bean Coffee",
  "business_slug": "brew-bean",
  "business_logo": "https://...",
  "business_color": "#8B5CF6",
  "redirect_url": "/brew-bean/spin"
}`,
    notes: [
      "No authentication required",
      "Returns 404 if code is invalid or expired",
      "Use this to pre-validate codes before printing",
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
          Integrate Engage with your POS system. Generate receipt codes,
          validate codes, and manage your business programmatically.
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
            Needs From Your POS
          </h2>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 space-y-4">
              <p className="text-white/60 text-sm leading-relaxed">
                Engage does <strong className="text-white">not</strong> record
                your receipts or store your sales data. We only need the{" "}
                <strong className="text-white">cart total</strong> to calculate
                appropriate points. The items array is optional and only used
                for your own records if you choose to include it.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                  <h4 className="text-green-400 font-medium text-sm mb-2 flex items-center gap-1">
                    <Check className="h-4 w-4" /> We Need
                  </h4>
                  <ul className="space-y-1 text-white/50 text-xs">
                    <li>• Cart total (amount)</li>
                    <li>• That's it</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                  <h4 className="text-red-400 font-medium text-sm mb-2">
                    We Don't Need
                  </h4>
                  <ul className="space-y-1 text-white/50 text-xs">
                    <li>• Full receipt data</li>
                    <li>• Customer payment details</li>
                    <li>• Inventory information</li>
                    <li>• Your sales history</li>
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

        {/* Code Patterns */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Ticket className="h-6 w-6 text-purple-400" /> Code Patterns
          </h2>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
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
                        pattern: "{PREFIX}-S-{SEQ}-{RAND}",
                        type: "Sticker",
                        example: "BREW-S-0001-A7X9",
                        points: "Set at batch creation (5-500)",
                      },
                      {
                        pattern: "{PREFIX}-R-{DATE}-{RAND}",
                        type: "Receipt (POS)",
                        example: "BREW-R-260714-B3K2",
                        points: "Amount × Business Multiplier",
                      },
                      {
                        pattern: "{PREFIX}-PUB-{LABEL}",
                        type: "Public Marketing",
                        example: "BREW-PUB-WEEKEND",
                        points: "Business default (points_per_redemption)",
                      },
                      {
                        pattern: "{PREFIX}-QR-{SEQ}",
                        type: "QR Code",
                        example: "BREW-QR-0001",
                        points: "Business default (points_per_redemption)",
                      },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="p-3 font-mono text-purple-400 text-xs">
                          {row.pattern}
                        </td>
                        <td className="p-3 text-white text-xs">{row.type}</td>
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
            We're happy to help your development team get set up.
          </p>
          <Button
            asChild
            className="bg-gradient-to-r from-purple-600 to-pink-600 gap-2"
          >
            <a href="mailto:dev@engagespin.com">
              <Zap className="h-4 w-4" /> Contact Developer Support
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
