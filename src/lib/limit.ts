// lib/limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Resend } from "resend";
import { getPaystackPlanCode } from "./config/plans";
const MPESA_API = "https://api.safaricom.co.ke";

// ✅ Shared Redis instance
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const resend = new Resend(process.env.RESEND_API_KEY);

// 🔁 Default limit: 5 reqs / 1 min
const defaultRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "global",
});

// 🔒 Booking limit: 2 reqs / 5 mins
export const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(2, "300 s"),
  analytics: true,
  prefix: "bookme",
});

// 🚨 Stripe-safe default limiter
export async function secureRatelimit(req: Request) {
  const ip = getIP(req);
  const isStripeWebhook =
    req.url.includes("/api/webhooks/stripe") &&
    req.headers.get("stripe-signature");

  if (isStripeWebhook) {
    return { success: true };
  }

  return await defaultRateLimit.limit(ip);
}

// 🛡️ Revised country-aware, IP-priority limiter with soft sinkhole
export async function countryAwareRateLimit(
  req: Request,
  maxIPHits = 100, // Allow 100 hits per IP...
  ipWindowSec = 30, // ...every 30 seconds
  logCountryHits = true, // but we’ll just observe the country-wide patterns
) {
  const ip = getIP(req);
  const country = req.headers.get("cf-ipcountry") ?? "XX";
  const now = Math.floor(Date.now() / ipWindowSec);

  const ipKey = `quota:ip:${ip}:${now}`;
  const ipCount = await redis.incr(ipKey);
  await redis.expire(ipKey, ipWindowSec + 5);

  const isIPLimited = ipCount > maxIPHits;

  // 🚨 Soft sinkhole for light abuse
  if (isIPLimited) {
    const strikeKey = `softstrike:${ip}`;
    const strikes = await redis.incr(strikeKey);
    await redis.expire(strikeKey, 900); // 15 min decay

    const delay = 1000 + (strikes - 1) * 300; // 1s base + 0.3s per strike

    // Optional: block if it’s really sketch
    if (strikes >= 25) {
      await redis.setex(`block:ip:${ip}`, 86400, "1"); // 1 day block
    }

    await new Promise((res) => setTimeout(res, delay));
  }

  // 🧾 Just log country quota bursts (no banning)
  if (logCountryHits) {
    const countryKey = `log:country:${country}:${now}`;
    await redis.incr(countryKey);
    await redis.expire(countryKey, ipWindowSec + 2);
  }

  const isBlocked = await redis.get(`block:ip:${ip}`);

  return {
    blocked: Boolean(isBlocked),
  };
}

// 🧠 Extract IP
export function getIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

export async function banIfInvalid(
  req: Request,
  isInvalid: boolean,
  reason: string,
) {
  if (!isInvalid) return false; // nothing to ban

  const ip = getIP(req);
  const banKey = `block:ip:${ip}`;
  const strikes = await redis.incr(banKey);

  if (strikes === 1) {
    await redis.expire(banKey, 60 * 60); // 1 hour timeout for first strike
  }

  if (strikes >= 3) {
    await redis.set(banKey, "banned");
    await redis.expire(banKey, 60 * 60 * 24 * 7); // 1 week ban
    console.warn(`🚫 IP ${ip} permabanned for: ${reason}`);
  }

  return true;
}

export const getPlanCode = getPaystackPlanCode;

export const generateToken = async () => {
  const secret = process.env.MPESA_CONSUMER_SECRET;
  const key = process.env.MPESA_CONSUMER_KEY;
  const auth = Buffer.from(key + ":" + secret).toString("base64");
  try {
    const response = await fetch(
      `${MPESA_API}/oauth/v1/generate?grant_type=client_credentials`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      },
    );

    // Parse response body as JSON and read access_token
    const json = await response.json();
    const token = json.access_token;

    return token;
  } catch (error) {
    console.log("Token Error generated", error);
    throw error; // Re-throw the error to handle it in the calling function
  }
};

export async function mpesaSTKPush(
  amountUSD: number,
  phoneNumber: string,
  paymentId: string | null,
  serviceId: string | null,
  plan: string,
  token: string,
) {
  // Convert USD to KES for M-Pesa
  let amountKES: number;

  if (plan === "consultation") {
    // For consultation, we assume the amount is already in KES
    amountKES = amountUSD;
  } else {
    try {
      const access_key = process.env.EXCHANGE_API_KEY;
      const endpoint = process.env.ENDPOINT;

      const res = await fetch(
        `https://api.exchangerate.host/${endpoint}?access_key=${access_key}&from=USD&to=KES&amount=${amountUSD}`,
        { next: { revalidate: 3600 * 12 } },
      );
      const json = await res.json();
      const rate = json.result;

      if (!rate) throw new Error("Rate missing");
      amountKES = Math.round(rate);
    } catch (err) {
      console.error("Exchange rate fetch failed, using fallback rate", err);
      amountKES = Math.round(amountUSD * 131); // fallback rate
    }
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.]/g, "")
    .slice(0, 14);
  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`,
  ).toString("base64");

  const formattedPhone = phoneNumber
    .replace(/\s/g, "")
    .replace(/^0/, "254")
    .replace(/^\+/, "");

  const stkRes = await fetch(`${MPESA_API}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline",
      Amount: Math.ceil(amountKES),
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_TILL!,
      PhoneNumber: formattedPhone,
      CallBackURL: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/mpesa/subscription?callback-secret=${process.env.MPESA_CALLBACK_SECRET}&paymentId=${paymentId}&serviceId=${serviceId}`,
      AccountReference: `ENGAGE-${plan}`,
      TransactionDesc: `Engage ${plan} subscription`,
    }),
  });

  return {
    response: await stkRes.json(),
    formattedPhone,
    amountKES,
  };
}

export async function querySTKStatus(checkoutRequestId: string, token: string) {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.]/g, "")
    .slice(0, 14);

  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`,
  ).toString("base64");

  const res = await fetch(`${MPESA_API}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  return res.json();
}

// Querying by receipt number
export async function queryTransactionStatus(
  receiptNumber: string,
  token: string,
) {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.]/g, "")
    .slice(0, 14);

  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`,
  ).toString("base64");

  const res = await fetch(`${MPESA_API}/mpesa/transactionstatus/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      // Use either TransactionID or OriginalConversationID
      TransactionID: receiptNumber,
    }),
  });

  return res.json();
}
