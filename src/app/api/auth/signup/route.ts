// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";
import { resend, secureRatelimit } from "@/lib/limit";
import { checkBotId } from "botid/server";

const signupSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  referralCode: z.string().optional(),
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
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { fullName, email, phone, password, referralCode } = parsed.data;

    // Check if user already exists
    const { data: existingUser, error: userExistsError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    console.log("Error searching user with same Email:", userExistsError);

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: {
          full_name: fullName,
          phone: phone || null,
        },
      });

    if (authError || !authData.user) {
      console.error("Auth creation error:", authError);
      return NextResponse.json(
        { error: authError?.message || "Failed to create account" },
        { status: 500 },
      );
    }

    const userId = authData.user.id;

    // ✅ FIX: Use INSERT instead of UPDATE
    // Create user profile in public.users table
    const { data: createdProfile, error: profileError } = await supabaseAdmin
      .from("users")
      .insert({
        id: userId, // Important: Set the ID to match auth user
        email: email.toLowerCase(),
        full_name: fullName,
        phone: phone || null,
        status: "inactive",
        onboarding_completed: false,
        role: "customer", // Default role
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select() // Add .select() to return the created record
      .single();

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Rollback - delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Failed to create profile: " + profileError.message },
        { status: 500 },
      );
    }

    // Handle referral code if provided
    if (referralCode) {
      const { data: referrerData, error: referrerError } = await supabaseAdmin
        .from("users")
        .select("id, referral_code")
        .eq("referral_code", referralCode.toUpperCase())
        .single();

      if (!referrerError && referrerData && referrerData.id !== userId) {
        const { error: referralError } = await supabaseAdmin
          .from("referrals")
          .insert({
            referrer_id: referrerData.id,
            referred_email: email,
            referred_user_id: userId,
            referral_code: referralCode.toUpperCase(),
            status: "joined",
            reward_points: 100,
            conversion_type: "signup",
            metadata: {
              joined_at: new Date().toISOString(),
              signup_data: {
                full_name: fullName,
                phone: phone || null,
              },
            },
          });

        if (referralError) {
          console.error("Referral insertion error:", referralError);
          // Not critical - don't fail signup
        }

        // Update referred_by on user profile
        const { error: updatedReferredByError } = await supabaseAdmin
          .from("users")
          .update({ referred_by: referrerData.id })
          .eq("id", userId);

        if (updatedReferredByError) {
          console.error("Referred by update error:", updatedReferredByError);
        }
      }
    }

    // Send verification email
    await sendVerificationEmail(email, fullName);

    return NextResponse.json({
      success: true,
      message: "Account created! Please check your email to verify.",
      userId,
      profile: createdProfile,
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function sendVerificationEmail(email: string, name: string) {
  if (!resend) {
    console.log("Resend not configured - skipping verification email");
    return;
  }

  try {
    const { data: linkData, error } =
      await supabaseAdmin.auth.admin.generateLink({
        email,
        type: "magiclink",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_URL}/auth/confirm-signup`,
        },
      });

    if (error || !linkData?.properties?.action_link) {
      console.error("Magic link generation failed:", error);
      return;
    }

    const verificationLink = linkData.properties.action_link;

    await resend.emails.send({
      from: `Engage <${process.env.RESEND_FROM_EMAIL}>`,
      to: email,
      subject: `Welcome to Engage, ${name}! Verify Your Email`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 40px; color: #333; max-width: 600px; margin: auto;">
          <div style="background: linear-gradient(135deg, #8B5CF6, #EC4899); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; font-size: 28px; font-weight: bold; margin: 0;">Welcome to Engage!</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">Spin. Play. Win.</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 30px;">
              Hi <strong>${name}</strong>,<br><br>
              Thanks for joining Engage! You're one step away from spinning wheels, playing trivia, and winning prizes at your favorite local businesses.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${verificationLink}" 
                 style="background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                ✅ Verify My Email
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; text-align: center; margin-bottom: 30px;">
              This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.
            </p>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 30px; margin-top: 30px;">
              <h4 style="color: #1f2937; margin-bottom: 15px;">What You Can Do:</h4>
              <ul style="color: #4b5563; padding-left: 20px;">
                <li style="margin-bottom: 8px;">🎡 <strong>Spin & Win</strong> - Use codes from businesses to spin wheels and win prizes</li>
                <li style="margin-bottom: 8px;">🧠 <strong>Live Trivia</strong> - Join trivia nights and compete on the leaderboard</li>
                <li style="margin-bottom: 8px;">🎁 <strong>Prize Draws</strong> - Enter draws and watch winners announced live</li>
                <li style="margin-bottom: 8px;">⭐ <strong>Earn Points</strong> - Get loyalty points for every engagement</li>
                <li style="margin-bottom: 8px;">👑 <strong>Climb Tiers</strong> - Bronze → Silver → Gold → Platinum</li>
              </ul>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center;">
                <p style="margin: 0; color: #4b5563; font-size: 14px;">
                  <strong>Got a code from a business?</strong><br>
                  Head to <a href="${process.env.NEXT_PUBLIC_URL}/code-entry" style="color: #8B5CF6; font-weight: bold;">engagespin.com/code-entry</a> and enter it to start playing!
                </p>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px;">
              © ${new Date().getFullYear()} Engage. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Verification email sent to:", email);
  } catch (error) {
    console.error("Failed to send verification email:", error);
  }
}
