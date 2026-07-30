// app/api/admin/customer/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, user_id, id_number, phone, email, reason } = body;

    if (!action || !user_id) {
      return NextResponse.json(
        { error: "Missing required fields: action, user_id" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminProfile } = await supabaseAdmin
      .from("users")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (!adminProfile || adminProfile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "verify") {
      // Verify user identity (e.g., when collecting prize)
      const { data, error } = await supabaseAdmin
        .from("users")
        .update({
          id_verified: true,
          id_verified_at: new Date().toISOString(),
          id_verified_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Verification failed: " + error.message },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Customer identity verified",
        user: data,
      });
    }

    if (action === "flag") {
      // Flag user account for identity mismatch
      const flagReason = reason || "Identity verification mismatch";

      const { data, error } = await supabaseAdmin
        .from("users")
        .update({
          status: "flagged",
          flagged_reason: flagReason,
          flagged_at: new Date().toISOString(),
          flagged_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Flag failed: " + error.message },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Account flagged for review",
        user: data,
      });
    }

    if (action === "lookup") {
      // Look up customer by phone, email, or ID number
      let query = supabaseAdmin.from("users").select("*");

      if (phone) {
        query = query.or(
          `phone.eq.${phone},phone.eq.${phone.replace(/^\+/, "")}`,
        );
      } else if (email) {
        query = query.eq("email", email.toLowerCase());
      } else if (id_number) {
        query = query.eq("id_number", id_number);
      } else {
        return NextResponse.json(
          { error: "Must provide phone, email, or id_number for lookup" },
          { status: 400 },
        );
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
    }

    return NextResponse.json(
      { error: "Invalid action. Use: verify, flag, or lookup" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Customer verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
