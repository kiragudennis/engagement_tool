// app/api/business/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  businessSignupSchema,
  generateSlug,
} from "@/lib/schemas/business-schema";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { findUserIdByEmail } from "@/lib/auth/server";
import { resend, secureRatelimit } from "@/lib/limit";
import { checkBotId } from "botid/server";

export async function POST(req: NextRequest) {
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { success } = await secureRatelimit(req);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await req.json();

    // Validate with Zod
    const parsed = businessSignupSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed", errors },
        { status: 400 },
      );
    }

    const { businessName, fullName, email, password, type } = parsed.data;
    const slug = generateSlug(businessName);

    // Check if business slug is taken
    const { data: existingBusiness } = await supabaseAdmin
      .from("businesses")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existingBusiness) {
      console.log("Business slug already taken:", slug);
      return NextResponse.json(
        { error: "This business name is already taken" },
        { status: 409 },
      );
    }

    let userId: string;

    const existing = await findUserIdByEmail(email);

    // 🚫 BLOCK: User already has a business
    if (existing && existing.business_name) {
      return NextResponse.json(
        {
          error: `You are already associated with "${existing.business_name}". You must delete or leave that business before creating a new one.`,
          existingBusiness: existing.business_slug,
        },
        { status: 409 },
      );
    }

    if (!existing) {
      // Try to create the user account
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });

      console.log("Auth creation response:", authData, authError);
      if (authError) {
        console.error("User creation failed:", authError);
        return NextResponse.json(
          { error: "Failed to create user account" },
          { status: 500 },
        );
      }

      userId = authData.user!.id;
    } else {
      userId = existing.id;
    }

    // Create business
    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .insert({
        name: businessName,
        slug,
        type,
        admin_email: email,
        admin_name: fullName,
        brand_color: "#8B5CF6",
        brand_secondary_color: "#EC4899",
        subscription_status: "trial",
        trial_ends_at: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        activation_duration_days: 30,
      })
      .select()
      .single();

    if (businessError) {
      console.error("Business creation error:", businessError);
      return NextResponse.json(
        { error: "Failed to create business" },
        { status: 500 },
      );
    }

    console.log("Business created successfully:", business);

    // Ensure user exists in public.users
    await supabaseAdmin.from("users").upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        role: "business_owner",
        status: "active",
        business_name: business.name,
        business_type: business.type,
        business_slug: business.slug,
        onboarding_completed: true,
      },
      { onConflict: "id" },
    );

    // Add user as owner
    await supabaseAdmin.from("business_admins").insert({
      business_id: business.id,
      user_id: userId,
      role: "owner",
      accepted_at: new Date().toISOString(),
    });

    // Generate default QR code
    await supabaseAdmin.from("access_codes").insert({
      business_id: business.id,
      code: `${slug.toUpperCase().replace(/-/g, "")}-QR`,
      type: "qr",
      label: "In-Store QR Code",
      unlocks: "spin",
      max_uses: null,
      max_uses_per_user: 1,
      description: "Default QR code for in-store customers",
    });

    // Send welcome email
    if (resend) {
      try {
        await resend.emails.send({
          from: "Engage <welcome@notifications.engagespin.com>",
          to: email,
          subject: `🎉 Welcome to EngageSpin, ${fullName}!`,
          html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
              <div style="max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #8B5CF6, #EC4899); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Welcome to Engage!</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                  <p style="font-size: 16px;">Hi ${fullName},</p>
                  <p style="font-size: 16px;">Your business <strong>${businessName}</strong> is ready to engage customers!</p>
                  
                  <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
                    <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Your public page:</p>
                    <p style="margin: 0; font-family: monospace; font-size: 16px; color: #f59e0b;">
                      engagespin.com/${slug}/code-entry
                    </p>
                  </div>
                  
                  <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
                    <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Your dashboard:</p>
                    <p style="margin: 0; font-family: monospace; font-size: 14px; color: #8b5cf6;">
                      engagespin.com/admin/${slug}
                    </p>
                  </div>
                  
                  <p style="font-size: 14px; color: #374151;">You're on a <strong>14-day free trial</strong>. No credit card needed.</p>
                  
                  <a href="${process.env.NEXT_PUBLIC_URL}/admin/${slug}" 
                     style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 15px; font-size: 16px;">
                    Go to Dashboard →
                  </a>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      } catch (e) {
        console.error("Welcome email failed:", e);
      }
    }

    return NextResponse.json({
      success: true,
      business: { id: business.id, name: business.name, slug: business.slug },
    });
  } catch (error: any) {
    console.error("Business creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
