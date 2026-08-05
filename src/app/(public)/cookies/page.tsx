// app/(public)/cookies/page.tsx
"use client";

import { motion } from "framer-motion";
import { Shield, Check, AlertTriangle } from "lucide-react";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950">
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Cookies Policy
          </h1>
          <p className="text-white/40 mb-12">Last updated: August 2026</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <Section title="What Are Cookies">
              <p>
                Cookies are small text files stored on your device when you
                visit a website. They help websites function properly, remember
                your preferences, and provide insights into how the site is used.
                This policy explains what cookies Engage uses and why.
              </p>
            </Section>

            <Section title="Cookies We Use">
              <p>
                Engage uses <strong>only essential cookies</strong>. We do not
                use tracking cookies, advertising cookies, or third-party
                analytics cookies on any customer-facing pages.
              </p>

              <h3 className="text-white font-medium mt-4 mb-2">
                Essential Cookies (Always Active)
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">
                These cookies are necessary for the website to function and
                cannot be switched off. They are usually set in response to
                actions made by you, such as setting your privacy preferences,
                logging in, or filling in forms.
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-3 text-white/50">
                <li>
                  <strong>supabase-auth-token</strong> — Stores your
                  authentication session to keep you logged in as you navigate
                  the site. Without this cookie, you would be asked to log in on
                  every page.
                </li>
                <li>
                  <strong>theme</strong> — Remembers your light/dark mode
                  preference.
                </li>
                <li>
                  <strong>cookies-consent</strong> — Records your cookie consent
                  preferences so we don&apos;t prompt you repeatedly.
                </li>
              </ul>

              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                  <Check className="h-5 w-5 text-green-400 mb-2" />
                  <p className="text-green-400 text-sm font-medium">
                    Safe — No Tracking
                  </p>
                  <p className="text-white/50 text-xs mt-1">
                    Engage does not use cookies for behavioral advertising,
                    cross-site tracking, or analytics profiling. No third-party
                    tracking scripts are loaded on customer-facing pages.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <Shield className="h-5 w-5 text-blue-400 mb-2" />
                  <p className="text-blue-400 text-sm font-medium">
                    Secure Storage
                  </p>
                  <p className="text-white/50 text-xs mt-1">
                    All cookies used by Engage are first-party, HTTP-only, and
                    secured. They are not shared with advertising or data broker
                    networks.
                  </p>
                </div>
              </div>
            </Section>

            <Section title="Data Breach Implications of Cookie Security">
              <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <h3 className="text-amber-400 font-medium text-sm mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Why cookie security matters
                </h3>
                <p className="text-white/50 text-xs leading-relaxed">
                  Engage stores sensitive customer data including email, phone
                  numbers, and national ID or driver&apos;s license numbers. The
                  authentication cookies that protect access to this data must
                  remain secure. If an attacker gains access to a valid session
                  cookie, they could access a customer&apos;s entire profile —
                  including personal identification data — across all businesses
                  the customer has engaged with. This would constitute a data
                  breach under GDPR, the Kenya Data Protection Act, and other
                  applicable regulations.
                </p>
              </div>
              <p className="text-white/50 text-sm leading-relaxed mt-3">
                To mitigate this risk, Engage implements:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-3 text-white/50">
                <li>
                  HTTP-only cookies that cannot be accessed via JavaScript
                  (prevents XSS-based cookie theft)
                </li>
                <li>
                  Secure (HTTPS-only) cookies that are only transmitted over
                  encrypted connections
                </li>
                <li>
                  SameSite restrictions to prevent cross-site request forgery
                </li>
                <li>Short session timeouts with automatic re-authentication</li>
                <li>
                  All access to customer personal data (including ID numbers) is
                  logged and audited
                </li>
              </ul>
            </Section>

            <Section title="Managing Your Cookie Preferences">
              <p>
                Since Engage only uses essential cookies that are critical for
                the service to function, you cannot opt out of them while using
                the platform. You can, however:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-3">
                <li>
                  Set your browser to refuse cookies — this will prevent you from
                  logging in or using the service
                </li>
                <li>
                  Clear your browser&apos;s cookie cache at any time to end your
                  session
                </li>
                <li>
                  Request account deletion at any time via your account settings,
                  which will invalidate all active sessions
                </li>
              </ul>
              <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20 mt-3">
                <p className="text-purple-400 text-sm">
                  <strong>Note:</strong> For Merchants, Engage uses additional
                  session management for the admin dashboard. All admin sessions
                  require two-factor authentication for business accounts.
                </p>
              </div>
            </Section>

            <Section title="Third-Party Links">
              <p>
                Engage pages may contain links to third-party websites (such as
                payment processors). Once you click through to a third-party
                site, we are not responsible for the cookies that site may set.
                Please review the privacy and cookie policies of those sites
                directly.
              </p>
            </Section>

            <Section title="Updates to This Policy">
              <p>
                We may update this cookies policy from time to time. When we do,
                we will update the &quot;Last updated&quot; date above and notify
                Merchants via email. Any changes will take effect immediately
                for customer-facing pages.
              </p>
            </Section>

            <Section title="Contact">
              <p>
                For cookie-related questions, contact us at{" "}
                <a
                  href="mailto:privacy@engagespin.com"
                  className="text-purple-400 hover:underline"
                >
                  privacy@engagespin.com
                </a>
                .
              </p>
            </Section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-3">{title}</h2>
      <div className="text-white/60 leading-relaxed space-y-3">{children}</div>
    </div>
  );
}
