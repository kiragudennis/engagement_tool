import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UAParser } from "ua-parser-js";
import { supabaseAdmin } from "./lib/supabase/admin";
import {
  createMiddlewareSupabaseClient,
  updateSession,
} from "./lib/supabase/middleware";
import { getBusinessAccessStatus } from "@/lib/auth/access";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const assets = path.match(/\.(png|jpg|jpeg|webp|svg|ico|json|txt|mp3)$/);

  if (
    path.startsWith("/auth") ||
    path.startsWith("/_next") ||
    path.startsWith("/api/") ||
    path === "/auth/callback" ||
    assets
  ) {
    return NextResponse.next();
  }

  const parser = new UAParser(request.headers.get("user-agent") || "");
  const userAgent = parser.getResult();

  const isBot =
    /bot|crawler|spider|crawling/i.test(userAgent.ua ?? "") &&
    !/Googlebot|bingbot|slurp|DuckDuckBot|Baiduspider/i.test(
      userAgent.ua ?? "",
    );

  if (isBot) {
    return NextResponse.next();
  }

  let response = await updateSession(request);
  const supabase = createMiddlewareSupabaseClient(request, response);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAdminRoute = path.startsWith("/admin");
    const isAccountRoute = path.startsWith("/account");

    if ((isAdminRoute || isAccountRoute) && !user) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirectedFrom", path);
      return NextResponse.redirect(redirectUrl);
    }

    if (isAdminRoute && user) {
      const slug = path.split("/")[2];
      if (!slug || slug === "marketing") {
        return response;
      }

      const { data: business } = await supabaseAdmin
        .from("businesses")
        .select("id, slug, plan, subscription_status, trial_ends_at")
        .eq("slug", slug)
        .maybeSingle();

      if (!business) {
        return NextResponse.redirect(new URL("/business/signup", request.url));
      }

      const { data: admin } = await supabaseAdmin
        .from("business_admins")
        .select("id")
        .eq("business_id", business.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!admin) {
        return NextResponse.redirect(new URL("/code-entry", request.url));
      }

      const access = getBusinessAccessStatus(business);
      const billingPath = `/admin/${slug}/billing`;
      const dashboardPath = `/admin/${slug}`;
      const allowedWhenExpired = [dashboardPath, billingPath];

      if (
        access.isExpired &&
        !allowedWhenExpired.some(
          (p) => path === p || path.startsWith(`${billingPath}/`),
        )
      ) {
        const billingUrl = new URL(billingPath, request.url);
        billingUrl.searchParams.set("expired", "1");
        return NextResponse.redirect(billingUrl);
      }
    }

    if (user && !path.startsWith("/api")) {
      await supabaseAdmin.from("page_views").insert({
        path,
        user_id: user.id,
      });
    }
  } catch (error) {
    console.error("Middleware error:", error);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|ico|json|txt|mp3)).*)",
  ],
};
