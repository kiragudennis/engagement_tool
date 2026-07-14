// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { initBotId } from "botid/client/core";

Sentry.init({
  dsn: "https://41072d7212430e043fe4e2deb825e50a@o4510837765570560.ingest.de.sentry.io/4510837770747984",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

initBotId({
  protect: [
    {
      path: "/api/customer/redeem-code",
      method: "POST",
    },
    {
      path: "/api/customer/validate-code",
      method: "GET",
    },
    {
      path: "/api/auth/login",
      method: "POST",
    },
    {
      path: "/api/auth/logout",
      method: "POST",
    },
    {
      path: "/api/auth/signup",
      method: "POST",
    },
    {
      path: "/api/auth/verify-code",
      method: "GET",
    },
    {
      path: "/api/business/create",
      method: "POST",
    },
    {
      path: "/api/cron/subscription-renewal",
      method: "GET",
    },
    {
      path: "/api/billing/mpesa/query",
      method: "POST",
    },
    {
      path: "/api/billing/mpesa/subcribe",
      method: "POST",
    },
    {
      path: "/api/billing/paystack/manage",
      method: "GET",
    },
    {
      path: "/api/billing/paystack/manage",
      method: "POST",
    },
    {
      path: "/api/billing/paystack/initialize",
      method: "POST",
    },
    {
      path: "/api/auth/signup",
      method: "POST",
    },
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
