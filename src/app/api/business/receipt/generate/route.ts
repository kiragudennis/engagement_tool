// app/api/business/receipt/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

// Complete schema - accepts everything a POS could send
const receiptSchema = z.object({
  // Required
  amount: z.number().positive("Amount must be positive"),

  // Optional - line items for printing on Engage receipt
  items: z
    .array(
      z.object({
        name: z.string(),
        qty: z.number().default(1),
        price: z.number().optional(),
        sku: z.string().optional(),
      }),
    )
    .optional()
    .default([]),

  // Optional - transaction metadata
  cashier: z.string().optional(),
  registerId: z.string().optional(),
  storeLocation: z.string().optional(),
  transactionId: z.string().optional(), // POS's own transaction ID
  paymentMethod: z.enum(["cash", "card", "mpesa", "other"]).optional(),

  // Optional - customer info (if POS has it)
  customerPhone: z.string().optional(),
  customerName: z.string().optional(),

  // Optional - override points calculation
  pointsOverride: z.number().optional(), // If POS wants to set exact points

  // Optional - what this code unlocks
  unlocks: z.enum(["spin", "draw", "spin_draw", "points"]).default("points"),

  // Optional - print preferences
  printReceipt: z.boolean().default(false),
  printerId: z.string().uuid().optional(),
  receiptTemplate: z
    .enum(["standard", "detailed", "minimal"])
    .default("standard"),

  // Optional - business identification (if not using API key)
  slug: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // ─── AUTHENTICATION ──────────────────────────────────
    const apiKey = req.headers.get("x-api-key");
    const authHeader = req.headers.get("Authorization");
    let businessId: string | null = null;
    let userId: string | null = null;

    if (apiKey) {
      // API Key auth
      const { data: keyData } = await supabaseAdmin
        .from("business_api_keys")
        .select("business_id, permissions")
        .eq("api_key", apiKey)
        .eq("is_active", true)
        .single();

      if (!keyData) {
        return NextResponse.json(
          { error: "Invalid or inactive API key" },
          { status: 401 },
        );
      }

      // Check permissions
      const permissions = keyData.permissions || [];
      if (!permissions.includes("receipt:create")) {
        return NextResponse.json(
          { error: "API key lacks receipt:create permission" },
          { status: 403 },
        );
      }

      businessId = keyData.business_id;
    } else if (authHeader) {
      // Session auth
      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user },
        error: userError,
      } = await supabaseAdmin.auth.getUser(token);

      if (userError || !user) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
      }
      userId = user.id;
    } else {
      return NextResponse.json(
        {
          error:
            "Authentication required. Use x-api-key header or Bearer token.",
        },
        { status: 401 },
      );
    }

    // ─── PARSE BODY ─────────────────────────────────────
    const body = await req.json();
    const parsed = receiptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      amount,
      items,
      cashier,
      registerId,
      storeLocation,
      transactionId,
      paymentMethod,
      customerPhone,
      customerName,
      pointsOverride,
      unlocks,
      printReceipt,
      printerId,
      receiptTemplate,
      slug,
    } = parsed.data;

    // ─── RESOLVE BUSINESS ───────────────────────────────
    if (!businessId && slug) {
      const { data: biz } = await supabaseAdmin
        .from("businesses")
        .select("id, plan")
        .eq("slug", slug)
        .single();

      if (!biz) {
        return NextResponse.json(
          { error: "Business not found" },
          { status: 404 },
        );
      }

      // Check if business plan allows API access
      if (biz.plan !== "pro" && biz.plan !== "enterprise") {
        return NextResponse.json(
          { error: "API access requires Pro or Enterprise plan" },
          { status: 403 },
        );
      }

      businessId = biz.id;
    }

    if (!businessId) {
      return NextResponse.json(
        { error: "Could not determine business. Provide slug or use API key." },
        { status: 400 },
      );
    }

    // ─── GET BUSINESS DETAILS ───────────────────────────
    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select(
        "id, name, slug, logo_url, brand_color, brand_secondary_color, points_multiplier, points_per_redemption, activation_duration_days",
      )
      .eq("id", businessId)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // ─── CALCULATE POINTS ───────────────────────────────
    // Takes points only, spin only, spin + draw or draw only
    const pointsEarned =
      pointsOverride ||
      Math.floor(amount * (business.points_multiplier || 1.0));

    // ─── GENERATE CODE ──────────────────────────────────
    const { data: receipt, error: receiptError } = await supabaseAdmin.rpc(
      "generate_receipt_code",
      {
        p_business_id: businessId,
        p_amount: amount,
        p_points_earned: pointsEarned,
        p_items: items,
        p_cashier_name: cashier || null,
        p_source: "api",
        p_created_by: userId,
        p_unlocks: unlocks,
        p_metadata: {
          register_id: registerId,
          store_location: storeLocation,
          transaction_id: transactionId,
          payment_method: paymentMethod,
          customer_phone: customerPhone,
          customer_name: customerName,
        },
      },
    );

    if (receiptError) {
      console.error("Receipt generation error:", receiptError);
      return NextResponse.json(
        { error: "Failed to generate receipt code" },
        { status: 500 },
      );
    }

    // ─── HANDLE PRINTING ────────────────────────────────
    let printResult = null;
    if (printReceipt && printerId) {
      // Queue print job
      await supabaseAdmin
        .from("business_receipts")
        .update({
          print_status: "pending",
          printer_device_id: printerId,
        })
        .eq("id", (receipt as any).receipt_id);

      printResult = {
        queued: true,
        printerId,
        template: receiptTemplate,
      };
    }

    // ─── BUILD RESPONSE ─────────────────────────────────
    return NextResponse.json({
      success: true,
      receipt: {
        ...receipt,
        // Additional info for the POS
        engagement_url: `engagespin.com/code-entry?code=${(receipt as any).code}`,
        business_url: `engagespin.com/${business.slug}`,
        activation_days: business.activation_duration_days || 30,
      },
      print: printResult,
    });
  } catch (error: any) {
    console.error("Receipt API error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}
