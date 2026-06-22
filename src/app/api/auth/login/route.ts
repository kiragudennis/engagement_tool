// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSessionForUser } from "@/lib/auth/server";
import { secureRatelimit } from "@/lib/limit";
import { checkBotId } from "botid/server";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const verification = await checkBotId();

  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { success } = await secureRatelimit(req);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
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

    // Update last login
    await supabaseAdmin
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("email", email.toLowerCase());

    // Check if user is a business admin
    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select("id, full_name, email")
      .eq("email", email.toLowerCase())
      .single();

    const { data: adminMemberships } = await supabaseAdmin
      .from("business_admins")
      .select("business_id, businesses!inner(slug)")
      .eq("user_id", userRow?.id);

    const adminSlug =
      adminMemberships?.[0]?.businesses &&
      typeof adminMemberships[0].businesses === "object" &&
      "slug" in adminMemberships[0].businesses
        ? (adminMemberships[0].businesses as { slug: string }).slug
        : null;

    const redirectTo = adminSlug ? `/admin/${adminSlug}` : "/account";

    return NextResponse.json({
      success: true,
      redirectTo,
      user: userRow,
      isBusinessAdmin: !!adminSlug,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
