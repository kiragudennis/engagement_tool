// app/(store)/accounts/layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default:
      "My Account | Northwind Systems - Track Your Engagement and Loyalty Points",
    template: "%s | My Account",
  },
  description:
    "Manage your account, track loyalty points, view engagement history, and update preferences. Access all 5 engagement modules from your dashboard.",
  keywords: [
    "customer account",
    "order history",
    "track orders",
    "loyalty points balance",
    "spin history",
    "challenge participation",
    "draw entries",
    "bundle purchases",
    "deal claims",
    "profile management",
    "customer dashboard",
    "engagement history",
    "points redemption",
    "tier status",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  authors: [{ name: "Northwind Systems" }],
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://ns.yunobase.com/accounts",
    title:
      "My Account | Northwind Systems - Track Your Engagement and Loyalty Points",
    description:
      "Manage your engagement profile, track points, and view activity across all 5 modules.",
    siteName: "Northwind Systems",
    images: [
      {
        url: "/og-account.jpg",
        width: 1200,
        height: 630,
        alt: "Northwind Systems Customer Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "My Account | Northwind Systems - Track Your Engagement and Loyalty Points",
    description:
      "Track your loyalty points, engagement history, and account activity.",
    images: ["/twitter-account.jpg"],
  },
  alternates: {
    canonical: "/accounts",
  },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main>{children}</main>;
}
