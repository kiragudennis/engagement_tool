// app/(store)/privacy/page.tsx
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Northwind Systems",
  description:
    "Learn how Northwind Systems collects and uses data to improve our engagement modules. No marketing without subscription.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-2 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Data We Collect</h2>
          <p className="text-muted-foreground mb-3">
            We collect data solely to operate and improve our 5 engagement
            modules (Spin Wheel, Challenges, Lucky Draws, Mystery Bundles, and
            Flash Deals). This includes:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Account information (name, email, Google sign-in data)</li>
            <li>Transaction history (purchases, points earned/redeemed)</li>
            <li>
              Engagement activity (spins, challenge participation, draw entries,
              bundle purchases, deal claims)
            </li>
            <li>Device and browser information for performance optimization</li>
            <li>Referral sources to improve module effectiveness</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            2. How We Use Your Data
          </h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>
              To operate the spin wheel, challenges, draws, bundles, and deals
              modules
            </li>
            <li>To calculate and track loyalty points across all 5 modules</li>
            <li>
              To prevent fraud and abuse (rate limiting, duplicate detection)
            </li>
            <li>To improve module performance and user experience</li>
            <li>To provide customer support for module-related issues</li>
          </ul>
          <p className="text-muted-foreground mt-3">
            <strong>
              We do NOT use your data for marketing unless you explicitly
              subscribe.
            </strong>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Data Sharing</h2>
          <p className="text-muted-foreground">
            We do not sell your personal data. Data may be shared only with:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-2">
            <li>
              Service providers essential for platform operation (hosting,
              payment processing)
            </li>
            <li>Legal authorities when required by law</li>
            <li>You, upon request (data export available)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Data Retention</h2>
          <p className="text-muted-foreground">
            We retain your data as long as your account is active. You may
            request deletion at any time. Anonymized engagement data may be
            retained for performance analysis.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Your Rights</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Access your data via your account dashboard</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Opt out of non-essential data collection</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Contact Us</h2>
          <p className="text-muted-foreground">
            For privacy-related questions or data requests, email us at{" "}
            <a
              href="mailto:privacy@northwind.yunobase.com"
              className="text-blue-600 hover:underline"
            >
              privacy@northwind.yunobase.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
