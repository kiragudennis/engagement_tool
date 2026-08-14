// app/api/consultation/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { checkBotId } from "botid/server";
import { secureRatelimit } from "@/lib/limit";

export async function GET(req: NextRequest) {
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
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");
    const bookingId = searchParams.get("bookingId");

    if (!reference && !bookingId) {
      return NextResponse.json(
        { error: "Reference or booking ID is required" },
        { status: 400 },
      );
    }

    let query = supabaseAdmin
      .from("consultation_bookings")
      .select("*");

    if (reference) {
      query = query.eq("payment_reference", reference);
    } else if (bookingId) {
      query = query.eq("id", bookingId);
    }

    const { data: booking, error: bookingError } = await query.single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 },
      );
    }

    const service = await supabaseAdmin
      .from("consultation_services")
      .select("name, duration, description")
      .eq("id", booking.service_id)
      .maybeSingle();

    let professionalName = null;
    if (booking.assigned_to) {
      const { data: professional } = await supabaseAdmin
        .from("users")
        .select("full_name, email")
        .eq("id", booking.assigned_to)
        .maybeSingle();

      professionalName = professional?.full_name || null;
    }

    const stages = buildStages(booking);

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        serviceName: service?.data?.name || "Consultation",
        serviceDuration: service?.data?.duration || "",
        contactName: booking.contact_name,
        email: booking.email,
        phone: booking.phone,
        preferredDate: booking.preferred_date,
        preferredTime: booking.preferred_time,
        amountPaid: booking.amount_paid,
        currency: booking.currency,
        paymentMethod: booking.payment_method,
        paymentStatus: booking.payment_status,
        paymentReference: booking.payment_reference,
        status: booking.status,
        assignedTo: professionalName,
        notes: booking.notes,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
        paidAt: booking.paid_at,
        stages,
      },
    });
  } catch (error: unknown) {
    console.error("Status fetch error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type ConsultationStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

interface Stage {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  current: boolean;
  timestamp?: string;
}

function buildStages(booking: {
  payment_status: PaymentStatus;
  status: ConsultationStatus;
  paid_at: string | null;
  updated_at: string;
  assigned_to: string | null;
}): Stage[] {
  const isPaid = booking.payment_status === "paid";
  const isConfirmed = booking.status === "confirmed";
  const isInProgress = booking.status === "in_progress";
  const isCompleted = booking.status === "completed";
  const isAssigned = !!booking.assigned_to;

  return [
    {
      id: "payment",
      label: "Payment Confirmed",
      description: "Your payment has been received successfully.",
      completed: isPaid,
      current: !isPaid && booking.payment_status !== "failed",
      timestamp: booking.paid_at || undefined,
    },
    {
      id: "review",
      label: "Under Review",
      description: "Our team is reviewing your requirements.",
      completed: isConfirmed && !isInProgress && !isCompleted,
      current: isPaid && !isConfirmed,
      timestamp: isConfirmed ? booking.updated_at : undefined,
    },
    {
      id: "assigned",
      label: "Professional Assigned",
      description: isAssigned
        ? "A professional has been matched to your project."
        : "We are matching you with the right professional.",
      completed: isAssigned || isInProgress || isCompleted,
      current: isConfirmed && !isAssigned && !isInProgress && !isCompleted,
      timestamp: isAssigned ? booking.updated_at : undefined,
    },
    {
      id: "in-progress",
      label: "In Progress",
      description: "The consultation session is actively in progress.",
      completed: isCompleted,
      current: isInProgress,
      timestamp: isInProgress ? booking.updated_at : undefined,
    },
    {
      id: "completed",
      label: "Completed",
      description: "Your consultation has been completed successfully.",
      completed: isCompleted,
      current: false,
      timestamp: isCompleted ? booking.updated_at : undefined,
    },
  ];
}
