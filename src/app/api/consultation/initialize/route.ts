// app/api/consultation/initialize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";
import { paystackInitializeTransaction } from "@/lib/services/paystack";
import { checkBotId } from "botid/server";
import { generateToken, mpesaSTKPush, secureRatelimit } from "@/lib/limit";
import {
  CONSULTATION_SERVICES,
  ConsultationService,
} from "@/lib/config/consultation-services";

const bookingSchema = z.object({
  serviceId: z.string().min(1, "Service is required"),
  paymentMethod: z.enum(["paystack", "mpesa"]),
  businessName: z.string().optional(),
  contactName: z.string().min(2, "Name is required"),
  email: z.email("Valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { success } = await secureRatelimit(req);
  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const body = await req.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      const flat = parsed.error.flatten().fieldErrors;
      for (const [key, msgs] of Object.entries(flat)) {
        if (msgs?.length) fieldErrors[key] = msgs[0];
      }
      return NextResponse.json(
        { error: "Invalid input", fields: fieldErrors },
        { status: 400 },
      );
    }

    const {
      serviceId,
      paymentMethod,
      businessName,
      contactName,
      email,
      phone,
      preferredDate,
      preferredTime,
      notes,
    } = parsed.data;

    // Consultation from config
    const service = CONSULTATION_SERVICES.find(
      (s: ConsultationService) => s.id === serviceId,
    );

    if (!service) {
      return NextResponse.json(
        { error: "Service not found or unavailable" },
        { status: 404 },
      );
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("consultation_bookings")
      .insert({
        service_id: serviceId,
        business_name: businessName || null,
        contact_name: contactName,
        email,
        phone,
        preferred_date: preferredDate || null,
        preferred_time: preferredTime || null,
        notes: notes || null,
        amount_paid: service.priceKes,
        currency: "KES",
        payment_method: "paystack",
        payment_status: "pending",
        status: "pending",
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      console.error("Booking creation error:", bookingError);
      return NextResponse.json(
        { error: "Failed to create booking. Please try again." },
        { status: 500 },
      );
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/about/consultation?status=success&booking=${booking.id}`;

    if (paymentMethod === "paystack") {
      const paystackRes = await paystackInitializeTransaction({
        email,
        amount: service.priceKes,
        plan: serviceId,
        billingCycle: "one_time",
        businessId: booking.id,
        paymentId: booking.id,
        callbackUrl,
        isEarlyBird: false,
        currency: "KES",
        consultationId: booking.id,
        serviceId: serviceId,
      });

      if (!paystackRes.status || !paystackRes.data?.authorization_url) {
        return NextResponse.json(
          { error: paystackRes.message || "Payment initialization failed" },
          { status: 500 },
        );
      }

      // Update booking payment_reference for frontend querying;
      await supabaseAdmin
        .from("consultation_bookings")
        .update({
          payment_reference: paystackRes.data.reference,
        })
        .eq("id", booking.id)
        .single();

      return NextResponse.json({
        success: true,
        authorizationUrl: paystackRes.data.authorization_url,
        reference: paystackRes.data.reference,
        bookingId: booking.id,
        paymentMethod: "paystack",
      });
    } else if (paymentMethod === "mpesa") {
      const token = await generateToken();

      const {
        response: stkResponse,
        formattedPhone,
        amountKES,
      } = await mpesaSTKPush(
        service.priceKes,
        phone,
        booking.id,
        serviceId,
        "consultation",
        token,
      );

      if (stkResponse.CheckoutRequestID) {
        // Update booking transaction_id for frontend querying;
        await supabaseAdmin
          .from("consultation_bookings")
          .update({
            transaction_id: stkResponse.CheckoutRequestID,
          })
          .eq("id", booking.id)
          .single();

        return NextResponse.json({
          success: true,
          bookingId: booking?.id,
          transactionId: stkResponse.CheckoutRequestID,
          message: "Check your phone for the M-Pesa prompt",
          paymentMethod: "mpesa",
        });
      } else {
        return NextResponse.json(
          {
            error: stkResponse.errorMessage || "Payment initialization failed",
          },
          { status: 500 },
        );
      }
    }
  } catch (error: unknown) {
    console.error("Consultation initialization error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
