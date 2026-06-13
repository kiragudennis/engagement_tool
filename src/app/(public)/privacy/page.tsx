// app/(public)/privacy/page.tsx
"use client";

import { motion } from "framer-motion";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950">
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-white/40 mb-12">Last updated: June 2026</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <Section title="Our Privacy Philosophy">
              <p>
                Engage is a <strong>tool for businesses</strong>, not a data
                harvesting platform. Our business model is subscriptions paid by
                Merchants—not selling or monetizing data. We believe customer
                data collected through a Merchant's engagement should belong
                <strong>exclusively to that Merchant</strong>.
              </p>
            </Section>

            <Section title="Information We Collect">
              <h3 className="text-white font-medium mt-4 mb-2">
                From Merchants (Businesses)
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Business name, email address, and contact information</li>
                <li>
                  Payment information (processed securely by PayPal/M-Pesa; we
                  never store full card numbers)
                </li>
                <li>Spin game and trivia configurations</li>
                <li>Access code usage statistics</li>
              </ul>

              <h3 className="text-white font-medium mt-4 mb-2">
                From Customers (End Users)
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Name and email address (provided when creating an account or
                  claiming a prize)
                </li>
                <li>
                  Spin and trivia participation history with each Merchant
                </li>
                <li>Prize wins and redemption status</li>
                <li>Loyalty points earned per Merchant</li>
              </ul>
            </Section>

            <Section title="How We Use Information">
              <p>
                <strong>For Merchants:</strong> We use your information to
                provide the Engage service, process payments, send account
                notifications, and improve our platform.
              </p>
              <p className="mt-3">
                <strong>For Customer Data:</strong> We store customer data on
                behalf of Merchants. We do not:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-3">
                <li>Email, market to, or contact customers independently</li>
                <li>Sell or share customer data with third parties</li>
                <li>Use customer data for our own analytics or advertising</li>
                <li>
                  Cross-reference customer activity across Merchants for any
                  purpose
                </li>
                <li>
                  Build profiles on customers beyond what's needed for the
                  service
                </li>
              </ul>
              <p className="mt-3">
                Customer data is <strong>siloed per Merchant</strong>. A
                customer who uses Engage with both "Coffee Shop A" and "Salon B"
                has two separate data relationships. Coffee Shop A cannot see
                the customer's activity with Salon B, and vice versa.
              </p>
            </Section>

            <Section title="Data Retention">
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Active Merchants:</strong> Customer data is retained
                  for the life of the Merchant's account.
                </li>
                <li>
                  <strong>Cancelled Merchants:</strong> Customer data is
                  available for export for 30 days, then permanently deleted.
                </li>
                <li>
                  <strong>Customer accounts:</strong> Customers may request
                  deletion of their account at any time, which removes their
                  data from all Merchants.
                </li>
                <li>
                  <strong>Inactive customer activations:</strong> Expired
                  activations (no engagement for 90+ days) may be anonymized.
                </li>
              </ul>
            </Section>

            <Section title="Data Sharing">
              <p>We share data only in these limited circumstances:</p>
              <ul className="list-disc pl-5 space-y-1 mt-3">
                <li>
                  <strong>Payment processors</strong> (PayPal, M-Pesa) to
                  process subscription payments
                </li>
                <li>
                  <strong>Email service</strong> (Resend) to send transactional
                  emails to Merchants
                </li>
                <li>
                  <strong>Legal requirements</strong> if required by law or to
                  protect our rights
                </li>
              </ul>
              <p className="mt-3">
                We never share customer data with advertisers, data brokers, or
                analytics companies.
              </p>
            </Section>

            <Section title="Customer Rights">
              <p>Customers have the right to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-3">
                <li>Access their personal data stored on Engage</li>
                <li>
                  Request deletion of their account and all associated data
                </li>
                <li>Know which Merchants they are active with</li>
                <li>
                  Opt out of marketing communications from individual Merchants
                  (by contacting the Merchant directly)
                </li>
              </ul>
              <p className="mt-3">
                Note: Since customer data belongs to the Merchant, requests to
                modify or delete data specific to a Merchant's engagement should
                be directed to that Merchant.
              </p>
            </Section>

            <Section title="Security">
              <p>
                We implement industry-standard security measures including
                encryption in transit (TLS), encryption at rest, and Row Level
                Security (RLS) on our database to ensure data isolation between
                Merchants. Access to customer data is strictly controlled and
                audited.
              </p>
            </Section>

            <Section title="Cookies">
              <p>
                We use essential cookies for authentication and session
                management. We do not use tracking cookies, advertising cookies,
                or third-party analytics cookies on customer-facing pages.
              </p>
            </Section>

            <Section title="Children's Privacy">
              <p>
                Engage is not intended for children under 13. We do not
                knowingly collect data from children under 13. Merchants are
                responsible for ensuring their engagement complies with
                applicable age restrictions.
              </p>
            </Section>

            <Section title="International Data">
              <p>
                Engage is hosted on servers located in the United States and/or
                Europe. By using our service, you consent to the transfer of
                data to these locations. We comply with applicable data
                protection laws.
              </p>
            </Section>

            <Section title="Changes to This Policy">
              <p>
                We will notify Merchants of material changes via email and
                update the "Last updated" date. Continued use after changes
                constitutes acceptance.
              </p>
            </Section>

            <Section title="Contact">
              <p>
                For privacy-related questions, contact us at{" "}
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
