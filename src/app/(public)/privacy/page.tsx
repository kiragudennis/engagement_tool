// app/(public)/privacy/page.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950">
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-white/40 mb-12">Last updated: August 2026</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <Section title="Our Privacy Philosophy">
              <p>
                Engage is a <strong>tool for businesses</strong>, not a data
                harvesting platform. Our business model is subscriptions paid by
                Merchants — we do not sell or monetize your data in any way. We
                belief customer data collected through a Merchant&apos;s
                engagement should belong{" "}
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
              <p className="mt-2 text-white/50 text-sm leading-relaxed">
                Engage collects the following information from customers solely
                for the purpose of establishing and maintaining uniqueness
                between a customer and a business:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-3">
                <li>
                  <strong>Email address</strong> — used for account creation,
                  authentication, and identity verification
                </li>
                <li>
                  <strong>Phone number</strong> — used for identity verification
                  at prize collection and fraud prevention
                </li>
                <li>
                  <strong>National ID or driver&apos;s license number</strong> —
                  used for identity verification at prize collection and fraud
                  prevention
                </li>
                <li>Full name (provided when creating an account)</li>
              </ul>
              <p className="mt-2 text-white/50 text-sm leading-relaxed">
                These three data points (email, phone, national ID/license) are
                collected for one purpose only: to ensure that each customer
                account is uniquely tied to a real-world individual across all
                businesses they engage with. This prevents duplicate accounts,
                fraudulent redemptions, and account sharing.
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-3">
                <li>
                  Spin and trivia participation history with each Merchant
                </li>
                <li>Prize wins and redemption status per business</li>
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
                <strong>For Customer Data:</strong> Customer data is stored on
                behalf of Merchants. We do not:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-3">
                <li>Email, market to, or contact customers independently</li>
                <li>Sell or share customer data with third parties</li>
                <li>Use customer data for our own analytics or advertising</li>
                <li>
                  Cross-reference customer activity across Merchants for any
                  purpose other than fraud prevention
                </li>
                <li>
                  Build profiles on customers beyond what&apos;s needed for the
                  service
                </li>
              </ul>
              <p className="mt-3">
                Customer data is <strong>siloed per Merchant</strong>. A
                customer who uses Engage with both &quot;Coffee Shop A&quot; and &quot;Salon B&quot;
                has two separate data relationships. Coffee Shop A cannot see
                the customer&apos;s activity with Salon B, and vice versa. Each
                Merchant can only access customer data for accounts that have
                activated with their specific access code.
              </p>
            </Section>

            <Section title="Data Breach Risks">
              <h3 className="text-white font-medium mt-4 mb-2">
                Risks to Engage from mishandling customer data
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Mishandling, unauthorized access, or improper disclosure of
                customer data (including email, phone, national ID/license
                numbers, and engagement history) can land Engage in serious
                legal and regulatory trouble:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-3">
                <li>
                  <strong>GDPR / Data Protection Law Violations:</strong>{" "}
                  Exposing personal data (especially ID numbers) without proper
                  safeguards can result in fines of up to 4% of annual global
                  revenue or €20 million, whichever is higher.
                </li>
                <li>
                  <strong>Kenya Data Protection Act (KDPA):</strong>{" "}
                  Kenya&apos;s data protection law requires explicit purpose
                  collection, data minimization, and breach notification within
                  72 hours. Failure to notify regulators of a breach can result
                  in fines and criminal liability.
                </li>
                <li>
                  <strong>National ID exposure:</strong> National ID numbers are
                  considered sensitive personal data. Unauthorized disclosure
                  can lead to identity theft claims and severe regulatory
                  penalties. Engage must implement strict access controls and
                  encryption for this data.
                </li>
                <li>
                  <strong>Breach notification obligations:</strong> If customer
                  personal data is compromised, Engage may be legally required
                  to notify affected individuals and the Data Protection
                  Commissioner within 72 hours.
                </li>
                <li>
                  <strong>Civil liability:</strong> Customers affected by a data
                  breach may pursue civil damages for identity theft, fraud, or
                  other harm resulting from exposed personal information.
                </li>
                <li>
                  <strong>Contractual liability:</strong> Merchants may
                  terminate their subscriptions or seek damages if data breaches
                  occur due to Engage&apos;s negligence.
                </li>
              </ul>
              <p className="mt-3 text-white/50 text-sm leading-relaxed">
                To mitigate these risks, Engage implements technical and
                organizational measures including encryption at rest and in
                transit, strict role-based access controls, audit logging, and
                regular security assessments. See the{" "}
                <Link href="/docs" className="text-purple-400 hover:underline">
                  Documentation
                </Link>{" "}
                for full details on our security practices.
              </p>
            </Section>

            <Section title="Data Retention">
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Active Merchants:</strong> Customer data is retained
                  for the life of the Merchant&apos;s account.
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
                  <strong>Payment processors</strong> (Paystack, M-Pesa) to
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
                analytics companies. Customer personal data (including ID
                numbers) is never shared with third parties except as described
                above.
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
                <li>
                  Object to automated decision-making and profiling related to
                  fraud detection
                </li>
              </ul>
              <p className="mt-3">
                Note: Since customer data belongs to the Merchant, requests to
                modify or delete data specific to a Merchant&apos;s engagement
                should be directed to that Merchant. However, if a customer
                requests full account deletion, Engage will remove the account
                and all associated data from every Merchant.
              </p>
            </Section>

            <Section title="Account Suspension and Deletion">
              <h3 className="text-white font-medium mt-4 mb-2">
                Engage reserves the right to suspend or terminate accounts
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Engage is a tool that facilitates customer-business
                relationships. While customers are the primary account holders,
                Engage reserves the right to suspend or permanently delete any
                customer account for violation of these terms, suspected fraud,
                or other legitimate business reasons. Because business accounts
                are secondary and referenced to the customer account,
                terminating a customer account will also terminate any
                associated business accounts.
              </p>
              <p className="mt-3 text-white/50 text-sm leading-relaxed">
                When Engage deletes a customer account, all data associated with
                that customer — including their engagement history, points
                balances, and any business references — is permanently removed
                across the entire platform. Merchants will no longer be able to
                access data for a deleted customer account.
              </p>
            </Section>

            <Section title="Security">
              <p>
                We implement industry-standard security measures including
                encryption in transit (TLS), encryption at rest, and Row Level
                Security (RLS) on our database to ensure data isolation between
                Merchants. Access to customer data is strictly controlled and
                audited. Sensitive personal data (phone numbers, national ID
                numbers) is encrypted at rest using AES-256. All access to
                customer data is logged and audited regularly.
              </p>
            </Section>

            <Section title="Cookies">
              <p>
                We use essential cookies for authentication and session
                management only. We do not use tracking cookies, advertising
                cookies, or third-party analytics cookies on customer-facing
                pages. See our{" "}
                <Link
                  href="/cookies"
                  className="text-purple-400 hover:underline"
                >
                  Cookies Policy
                </Link>{" "}
                for details.
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
                protection laws, including GDPR and KDPA.
              </p>
            </Section>

            <Section title="Changes to This Policy">
              <p>
                We will notify Merchants of material changes via email and
                update the &quot;Last updated&quot; date. Continued use after
                changes constitutes acceptance. Material changes to data
                processing activities will require renewed consent where legally
                required.
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
