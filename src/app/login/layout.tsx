// app/login/layout.tsx

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Northwind Systems",
  description:
    "Sign in to access your account, earn loyalty points, participate in spin games, join live challenges, and unlock exclusive deals.",
  keywords: [
    "northwind login",
    "customer engagement platform",
    "loyalty program access",
    "spin to win login",
    "live challenges signin",
    "lucky draws entry",
    "flash deals access",
    "points redemption login",
    "community shopping login",
  ],
  openGraph: {
    title: "Login | Northwind Systems",
    description:
      "Sign in to access exclusive engagement modules, loyalty rewards, live challenges, and flash deals.",
    url: "https://ns.yunobase.com/login",
    siteName: "Northwind Systems",
    images: [
      {
        url: "/og-login.jpg",
        width: 1200,
        height: 630,
        alt: "Login to Northwind Systems - Engagement Strategy for E-commerce",
      },
    ],
    type: "website",
    locale: "en_KE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Login | Northwind Systems",
    description:
      "Access your engagement dashboard, loyalty points, and exclusive deals. Sign in to your account.",
    images: ["/twitter-login.jpg"],
  },
  robots: {
    index: false, // Login pages shouldn't be indexed
    follow: false,
  },
  alternates: {
    canonical: "/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <main>{children}</main>
    </div>
  );
}
