// src/lib/auth/server.ts
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { getBusinessAccessStatus } from "@/lib/auth/access";

export { getBusinessAccessStatus };

export async function findUserIdByEmail(email: string): Promise<string | null> {
  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  console.log("findUserIdByEmail:", email, "found user ID:", userRow?.id);
  return userRow?.id ?? null;
}

export async function createSessionForUser(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { error: null };
}

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, supabase, error: "Unauthorized" as const };
  }

  return { user, supabase, error: null };
}

export async function requireBusinessAdmin(businessSlug: string) {
  const { user, supabase, error } = await requireUser();
  if (error || !user) {
    return {
      user: null,
      business: null,
      admin: null,
      error: "Unauthorized" as const,
    };
  }

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, slug, plan, subscription_status, trial_ends_at")
    .eq("slug", businessSlug)
    .single();

  if (!business) {
    return {
      user,
      business: null,
      admin: null,
      error: "Business not found" as const,
    };
  }

  const { data: admin } = await supabaseAdmin
    .from("business_admins")
    .select("id, role")
    .eq("business_id", business.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) {
    return { user, business, admin: null, error: "Forbidden" as const };
  }

  return { user, business, admin, error: null };
}

export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}
