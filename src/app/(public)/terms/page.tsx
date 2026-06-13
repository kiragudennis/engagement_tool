// app/(public)/terms/page.tsx
"use client";

import { motion } from "framer-motion";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950">
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Terms of Service
          </h1>
          <p className="text-white/40 mb-12">Last updated: June 2026</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <Section title="1. What Engage Is">
              <p>
                Engage is a software-as-a-service tool that allows businesses
                ("Merchants") to create gamified customer engagement
                experiences, including spin-to-win wheels and live trivia
                events. Engage is <strong>not a marketplace</strong>. We do not
                connect customers with businesses. Customers only access a
                Merchant's experience when provided with an access code by that
                Merchant.
              </p>
            </Section>

            <Section title="2. Your Account">
              <p>
                As a Merchant, you are responsible for maintaining the security
                of your account and all activities that occur under it. You must
                provide accurate information when signing up and keep it
                current. You may not share your account credentials with
                unauthorized users.
              </p>
            </Section>

            <Section title="3. Customer Data Ownership">
              <p>
                <strong>Customer data belongs to the Merchant.</strong> When a
                customer activates their account using your business code, any
                personal information they provide (email, name) and their
                engagement history with your business (spins, trivia
                participation, prizes won) becomes part of your customer list.
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-3">
                <li>You may export your customer data at any time via CSV.</li>
                <li>You may use this data for your own marketing purposes.</li>
                <li>
                  Engage will never email, market to, or contact your customers
                  independently.
                </li>
                <li>
                  Engage will never sell, share, or monetize your customer data.
                </li>
                <li>
                  Upon account cancellation, you may request complete deletion
                  of your customer data.
                </li>
              </ul>
            </Section>

            <Section title="4. Customer Privacy">
              <p>
                Customers create a single account on Engage that may be used
                across multiple Merchants. However, a Merchant can only see a
                customer's data if that customer has activated with the
                Merchant's specific access code. Merchants cannot see customer
                activity with other Merchants.
              </p>
            </Section>

            <Section title="5. Subscription & Billing">
              <p>
                Engage offers subscription plans on a monthly or annual basis.
                All plans include a 14-day free trial. You may cancel at any
                time. Upon cancellation, your account remains active until the
                end of your current billing period. Refunds are provided on a
                case-by-case basis.
              </p>
            </Section>

            <Section title="6. Acceptable Use">
              <p>You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-3">
                <li>
                  Use Engage for any illegal purpose or in violation of any
                  laws.
                </li>
                <li>
                  Upload malicious code or attempt to compromise the platform.
                </li>
                <li>Use Engage to send spam or unsolicited communications.</li>
                <li>
                  Misrepresent prizes or fail to honor prizes won by customers.
                </li>
                <li>
                  Attempt to access other Merchants' data or customer
                  information.
                </li>
                <li>Generate fraudulent spins or manipulate the system.</li>
              </ul>
            </Section>

            <Section title="7. Service Availability">
              <p>
                We strive for 99.9% uptime but do not guarantee uninterrupted
                service. We reserve the right to suspend accounts that violate
                these terms. We will notify you of planned maintenance when
                possible.
              </p>
            </Section>

            <Section title="8. Limitation of Liability">
              <p>
                Engage is provided "as is." We are not liable for any damages
                arising from the use or inability to use our service, including
                lost profits, lost data, or business interruption. Our total
                liability is limited to the amount you paid us in the 12 months
                preceding the claim.
              </p>
            </Section>

            <Section title="9. Termination">
              <p>
                You may cancel your account at any time. We may terminate your
                account for violation of these terms with 7 days' notice. Upon
                termination, you may export your customer data within 30 days
                before it is permanently deleted.
              </p>
            </Section>

            <Section title="10. Changes to Terms">
              <p>
                We may update these terms from time to time. We will notify you
                of material changes via email. Continued use after changes
                constitutes acceptance of the new terms.
              </p>
            </Section>

            <Section title="11. Contact">
              <p>
                For questions about these terms, contact us at{" "}
                <a
                  href="mailto:legal@engagespin.com"
                  className="text-purple-400 hover:underline"
                >
                  legal@engagespin.com
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
