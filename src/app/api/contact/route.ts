// app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resend } from "@/lib/limit";
import { checkBotId } from "botid/server";
import { secureRatelimit } from "@/lib/limit";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.email("Valid email is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message is too short"),
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
    const parsed = contactSchema.safeParse(body);

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

    const { name, email, subject, message } = parsed.data;

    const subjectLabels: Record<string, string> = {
      general: "General Inquiry",
      support: "Technical Support",
      billing: "Billing & Payments",
      partnership: "Partnership",
      feedback: "Feedback & Suggestions",
      other: "Other",
    };

    const subjectLabel = subjectLabels[subject] || subject;

    await resend.emails.send({
      from: `Engage Contact <${process.env.RESEND_FROM_EMAIL || "notifications@engagespin.com"}>`,
      to: "support@engagespin.com",
      replyTo: email,
      subject: `Contact Form: ${subjectLabel}`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #fff; background: #0f172a;">
          <h2 style="color: #a855f7; margin-bottom: 16px;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #334155; color: #94a3b8; width: 140px;">Name</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #334155; color: #f1f5f9;">${escapeHtml(name)}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #334155; color: #94a3b8;">Email</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #334155; color: #f1f5f9;">${escapeHtml(email)}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #334155; color: #94a3b8;">Subject</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #334155; color: #f1f5f9;">${escapeHtml(subjectLabel)}</td>
            </tr>
          </table>
          <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px;">
            <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Message</p>
            <p style="color: #e2e8f0; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</p>
          </div>
          <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
            Sent from the Engage contact form at ${new Date().toLocaleString()}
          </p>
        </div>
      `,
      text: `New Contact Form Submission\n\nName: ${name}\nEmail: ${email}\nSubject: ${subjectLabel}\n\nMessage:\n${message}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Contact form error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}
