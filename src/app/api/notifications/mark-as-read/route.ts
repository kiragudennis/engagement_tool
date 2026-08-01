// /api/notifications/received/route.ts
import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/lib/services/notification-service";
import { createClient } from "@/lib/supabase/server";
import { checkBotId } from "botid/server";
import { secureRatelimit } from "@/lib/limit";

export async function POST(req: NextRequest) {
  // Uses notification service to fetch notifications for the authenticated user
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { success } = await secureRatelimit(req);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { notificationId } = await req.json();

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notificationService = new NotificationService(supabase);
    if (notificationId) {
      await notificationService.markAsRead(notificationId, user.id);
    }

    await notificationService.markAllAsRead(user.id);
    return NextResponse.json({ notifications: [] }, { status: 200 });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}
