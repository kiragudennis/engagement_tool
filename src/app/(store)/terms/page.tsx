// app/(store)/terms/page.tsx
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Northwind Systems",
  description:
    "Terms governing the use of Northwind Systems engagement modules and e-commerce platform.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
      <p className="text-muted-foreground mb-8">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground">
            By accessing or using Northwind Systems, you agree to be bound by
            these Terms of Service and our Privacy Policy. If you do not agree,
            please do not use our platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            2. The Engagement Modules
          </h2>
          <p className="text-muted-foreground mb-3">
            Northwind Systems provides 5 engagement modules as part of the
            e-commerce experience:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
            <li>
              <strong>Spin Wheel:</strong> Daily spins for points and prizes.
              Free spins reset daily.
            </li>
            <li>
              <strong>Challenges:</strong> Live trivia, referrals, and team
              competitions. Points awarded based on performance.
            </li>
            <li>
              <strong>Lucky Draws:</strong> Time-limited giveaways. Winners
              selected randomly.
            </li>
            <li>
              <strong>Mystery Bundles:</strong> Curated product bundles with
              optional mystery reveal.
            </li>
            <li>
              <strong>Flash Deals:</strong> Limited-time offers with live
              countdowns and stock limits.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            3. Loyalty Points System
          </h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Points are earned on purchases and engagement activities</li>
            <li>Points can be redeemed for discounts at checkout</li>
            <li>
              Points have no cash value and cannot be exchanged for currency
            </li>
            <li>Points expire after 12 months of inactivity</li>
            <li>
              Fraudulent point accumulation may result in account suspension
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            4. Fair Use & Fraud Prevention
          </h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Automated scripts or bots are prohibited</li>
            <li>
              Multiple accounts for abuse of free spins/entries will be banned
            </li>
            <li>
              We reserve the right to reverse fraudulent point transactions
            </li>
            <li>Rate limits apply to prevent abuse</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            5. Purchases & Payments
          </h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>
              All payments are processed securely via third-party providers
            </li>
            <li>Digital goods delivered instantly upon payment</li>
            <li>Physical products subject to separate shipping terms</li>
            <li>Refunds handled according to seller's policy</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            6. Account Responsibility
          </h2>
          <p className="text-muted-foreground">
            You are responsible for maintaining the security of your account.
            Notify us immediately of any unauthorized use. We are not liable for
            losses from unauthorized access to your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            7. Modifications to Service
          </h2>
          <p className="text-muted-foreground">
            We reserve the right to modify, suspend, or discontinue any module
            with reasonable notice. Points and rewards may be adjusted
            accordingly.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            8. Limitation of Liability
          </h2>
          <p className="text-muted-foreground">
            Northwind Systems is provided "as is" without warranties. To the
            maximum extent permitted by law, we are not liable for indirect
            damages arising from use of our platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Governing Law</h2>
          <p className="text-muted-foreground">
            These terms are governed by the laws of Kenya. Disputes shall be
            resolved in Nairobi, Kenya.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
          <p className="text-muted-foreground">
            Questions about these terms? Contact us at{" "}
            <a
              href="mailto:legal@northwind.yunobase.com"
              className="text-blue-600 hover:underline"
            >
              legal@northwind.yunobase.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
