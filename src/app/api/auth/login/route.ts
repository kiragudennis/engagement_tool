import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/schemas/auth-schema";
import { createSessionForUser } from "@/lib/auth/server";
import { secureRatelimit } from "@/lib/limit";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { success } = await secureRatelimit(req);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;
    const { error: sessionError } = await createSessionForUser(email, password);

    if (sessionError) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role")
      .eq("email", email)
      .single();

    if (userRow) {
      await supabaseAdmin
        .from("users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", userRow.id);
    }

    const { data: adminMemberships } = await supabaseAdmin
      .from("business_admins")
      .select("business_id, businesses(slug)")
      .eq("user_id", userRow?.id);

    const adminSlug =
      adminMemberships?.[0]?.businesses &&
      typeof adminMemberships[0].businesses === "object" &&
      "slug" in adminMemberships[0].businesses
        ? (adminMemberships[0].businesses as { slug: string }).slug
        : null;

    const redirectTo = adminSlug
      ? `/admin/${adminSlug}`
      : "/account/loyalty";

    return NextResponse.json({
      success: true,
      redirectTo,
      user: userRow,
      isBusinessAdmin: !!adminSlug,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
