// app/(public)/terms/page.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

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
          <p className="text-white/40 mb-12">Last updated: August 2026</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <Section title="1. What Engage Is">
              <p>
                Engage is a software-as-a-service tool that allows businesses
                (&quot;Merchants&quot;) to create gamified customer engagement
                experiences, including spin-to-win wheels and live trivia
                events. Engage is <strong>not a marketplace</strong>. We do not
                connect customers with businesses. Customers only access a
                Merchant&apos;s experience when provided with an access code by
                that Merchant.
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
              <p className="mt-3">
                Customers create a single primary account on Engage, identified
                by their email, phone, and national ID or license number. This
                account is the foundation of their identity across all
                businesses. Business accounts (Merchant accounts) are secondary
                and referenced to the customer account — when a Merchant account
                is created, it is tied to the customer account that generated
                the business code. If a customer account is deleted or banned,
                all associated Merchant accounts are also terminated.
              </p>
            </Section>

            <Section title="3. Customer Data Ownership">
              <p>
                <strong>Customer data belongs to the Merchant.</strong> When a
                customer activates their account using your business code, any
                personal information they provide (email, phone, national ID or
                license number, name) and their engagement history with your
                business (spins, trivia participation, prizes won) becomes part
                of your customer list.
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
                  Upon Merchant account cancellation, you may request complete
                  deletion of your customer data.
                </li>
              </ul>
            </Section>

            <Section title="4. How Customers Participate in Businesses">
              <p>
                Customers participate in a business&apos;s engagement
                experiences through a code-based system:
              </p>
              <ol className="list-decimal pl-5 space-y-2 mt-3">
                <li>
                  <strong>Get a Code:</strong> The customer receives a unique
                  code from a business (on a receipt, product packaging, or QR
                  code).
                </li>
                <li>
                  <strong>Enter the Code:</strong> The customer visits the
                  business&apos;s Engage page and enters the code. This
                  activates their account for that specific business for 30
                  days.
                </li>
                <li>
                  <strong>Engage:</strong> While active, the customer can spin
                  the wheel, join trivia challenges, enter prize draws, and earn
                  loyalty points — all tied to that specific business.
                </li>
                <li>
                  <strong>Redeem:</strong> The customer returns to the business
                  to claim prizes or redeem points. The business verifies the
                  customer&apos;s identity (email, phone, ID) and processes the
                  redemption.
                </li>
                <li>
                  <strong>Follow-up:</strong> The business can follow up with
                  the customer using their own customer data (email, phone) for
                  promotions, order notifications, and prize collection. Engage
                  does not facilitate this communication.
                </li>
              </ol>
              <p className="mt-3 text-white/50 text-sm">
                Each business operates independently. A customer&apos;s
                engagement with Business A has no visibility into their
                engagement with Business B. See the{" "}
                <Link href="/docs" className="text-purple-400 hover:underline">
                  Documentation
                </Link>{" "}
                for full details on how codes, activations, and unlocks work.
              </p>
            </Section>

            <Section title="5. How Referrals Work">
              <p>
                Engage's referral program allows customers to earn rewards for
                referring new businesses to the platform. Here is the full
                referral flow:
              </p>
              <ol className="list-decimal pl-5 space-y-2 mt-3">
                <li>
                  <strong>Enroll:</strong> The customer visits their referral
                  dashboard at /account/referral and chooses a commission
                  preference (One-Time or Recurring).
                </li>
                <li>
                  <strong>Get a Referral Code:</strong> The system generates a
                  unique referral code for the customer.
                </li>
                <li>
                  <strong>Share:</strong> The customer shares their referral
                  link (engagespin.com/business/signup?ref=ENGXXXXXX) with
                  potential business owners.
                </li>
                <li>
                  <strong>Business Signs Up:</strong> The referred business
                  creates an account using the customer's referral link.
                </li>
                <li>
                  <strong>Business Subscribes:</strong> When the business pays
                  for a subscription, the referrer earns based on their chosen
                  preference:
                  <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>
                      <strong>One-Time preference:</strong> 50% commission on
                      the first payment only
                    </li>
                    <li>
                      <strong>Recurring preference:</strong> 10% commission on
                      every payment
                    </li>
                    <li>
                      <strong>Loyalty points:</strong> Commission amount × 100,
                      awarded immediately regardless of which preference was
                      chosen
                    </li>
                  </ul>
                  <p className="text-xs text-white/40 mt-1">
                    Note: The referrer chooses either one-time or recurring —
                    not both.
                  </p>
                </li>
                <li>
                  <strong>Get Paid:</strong> Cash commissions are tracked in USD
                  and paid out via Paystack or M-Pesa once the referrer reaches
                  the $100 threshold. Loyalty points are awarded simultaneously
                  and never expire.
                </li>
              </ol>
            </Section>

            <Section title="6. Payment Flow">
              <p>Engage handles payments as follows:</p>
              <ol className="list-decimal pl-5 space-y-2 mt-3">
                <li>
                  <strong>Business Subscription:</strong> Merchants pay a
                  monthly or annual recurring fee via Paystack or M-Pesa. All
                  payment information is processed securely by our payment
                  partners; we never store full card numbers.
                </li>
                <li>
                  <strong>Referral Commissions:</strong> Referrer commissions
                  are calculated based on the Merchant&apos;s subscription plan
                  and tracked in the system. Cash commissions accumulate until
                  the referrer requests a payout (minimum $100 threshold).
                  Loyalty points are awarded immediately as (commission amount ×
                  100).
                </li>
                <li>
                  <strong>Point Redemption:</strong> Points are redeemed
                  directly with the business during checkout. The customer tells
                  the cashier they want to pay with points. The business looks
                  up the customer&apos;s account, verifies their identity, and
                  deducts points from their balance for that specific business.
                  Points cannot be transferred between businesses.
                </li>
              </ol>
              <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20 mt-3">
                <p className="text-purple-400 text-sm">
                  <strong>Note:</strong> Engage is a tool that facilitates the
                  connection between customers and businesses. Payment
                  processing for subscription fees is handled by third-party
                  processors. Point redemption is handled by the Merchant
                  directly — Engage does not hold or process customer payment at
                  the point of redemption.
                </p>
              </div>
            </Section>

            <Section title="7. Customer Privacy">
              <p>
                Customers create a single account on Engage that may be used
                across multiple Merchants. However, a Merchant can only see a
                customer&apos;s data if that customer has activated with the
                Merchant&apos;s specific access code. Merchants cannot see
                customer activity with other Merchants.
              </p>
              <p className="mt-3">
                Engage collects email, phone, and national ID or license number
                from customers solely for the purpose of establishing and
                maintaining uniqueness between a customer and a business. This
                data is used by the specific business that the customer used
                their code with — only that business can access, view, and act
                upon a customer&apos;s engagement data.
              </p>
            </Section>

            <Section title="8. Acceptable Use">
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
                  Attempt to access other Merchants&apos; data or customer
                  information.
                </li>
                <li>Generate fraudulent spins or manipulate the system.</li>
              </ul>
            </Section>

            <Section title="9. Account Suspension, Termination, and Deletion">
              <p>Engage reserves the right, at our sole discretion, to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-3">
                <li>
                  <strong>Suspend or ban</strong> any customer or Merchant
                  account at any time, for any reason, with or without cause,
                  and without prior notice.
                </li>
                <li>
                  <strong>Permanently delete</strong> any customer or Merchant
                  account, removing all associated data from our systems.
                </li>
                <li>
                  Take such action without liability to you or any other party.
                </li>
              </ul>
              <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 mt-3">
                <p className="text-amber-400 text-sm">
                  <strong>Important:</strong> Since business accounts are
                  secondary and referenced to the customer account, when a
                  customer account is banned or permanently deleted, all
                  associated business accounts are also terminated. The customer
                  account is the primary key — all data relationships, business
                  references, engagement history, and loyalty points are tied to
                  the customer account. Deleting the customer account cascades
                  to remove everything.
                </p>
              </div>
            </Section>

            <Section title="10. Service Availability">
              <p>
                We strive for 99.9% uptime but do not guarantee uninterrupted
                service. We reserve the right to suspend accounts that violate
                these terms. We will notify you of planned maintenance when
                possible.
              </p>
            </Section>

            <Section title="11. Limitation of Liability">
              <p>
                Engage is provided &quot;as is.&quot; We are not liable for any
                damages arising from the use or inability to use our service,
                including lost profits, lost data, or business interruption. Our
                total liability is limited to the amount you paid us in the 12
                months preceding the claim.
              </p>
            </Section>

            <Section title="12. Changes to Terms">
              <p>
                We may update these terms from time to time. We will notify you
                of material changes via email. Continued use after changes
                constitutes acceptance of the new terms.
              </p>
            </Section>

            <Section title="13. Contact">
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
