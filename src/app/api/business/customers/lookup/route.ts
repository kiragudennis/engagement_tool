// app/api/business/customers/lookup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, email, id_number } = body;

    if (!phone && !email && !id_number) {
      return NextResponse.json(
        { error: "Must provide phone, email, or id_number" },
        { status: 400 },
      );
    }

    // Verify API key
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing X-API-Key header" },
        { status: 401 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let businessId: string | null = null;

    // Try API key auth first
    if (apiKey) {
      const { data: keyData } = await supabaseAdmin
        .from("business_api_keys")
        .select("business_id")
        .eq("api_key", apiKey)
        .eq("is_active", true)
        .single();

      if (keyData) {
        businessId = keyData.business_id;
      }
    }

    // Fall back to session auth
    if (!businessId && user) {
      const { data: adminProfile } = await supabaseAdmin
        .from("users")
        .select("id, role")
        .eq("id", user.id)
        .single();

      if (adminProfile?.role === "admin") {
        const { data: adminBiz } = await supabaseAdmin
          .from("business_admins")
          .select("business_id")
          .eq("user_id", user.id)
          .single();

        if (adminBiz) {
          businessId = adminBiz.business_id;
        }
      }
    }

    if (!businessId) {
      return NextResponse.json(
        { error: "Unauthorized - invalid API key or session" },
        { status: 401 },
      );
    }

    // Build query
    let query = supabaseAdmin.from("users").select("*");

    if (phone) {
      const normalizedPhone = phone.replace(/^\+/, "");
      query = query.or(
        `phone.eq.${phone},phone.eq.${normalizedPhone},phone.eq.${normalizedPhone.replace(/\s/g, "")}`,
      );
    } else if (email) {
      query = query.eq("email", email.toLowerCase());
    } else if (id_number) {
      query = query.eq("id_number", id_number);
    }

    const { data: users, error } = await query.limit(5);

    if (error) {
      return NextResponse.json(
        { error: "Lookup failed: " + error.message },
        { status: 500 },
      );
    }

    // Get verification summary for each user
    const usersWithSummary = await Promise.all(
      (users || []).map(async (user) => {
        const { data: summary } = await supabaseAdmin.rpc(
          "get_customer_verification_summary",
          { p_user_id: user.id },
        );
        return { ...user, summary };
      }),
    );

    return NextResponse.json({
      success: true,
      users: usersWithSummary,
    });
  } catch (error: any) {
    console.error("Customer lookup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
