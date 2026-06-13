// app/(store)/about/layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Northwind Systems | Enterprise E-commerce + Engagement System",
  description:
    "Northwind Systems delivers a complete e-commerce platform with 5 gamified engagement modules. Build customer loyalty with Spin Wheel, Live Challenges, Lucky Draws, Mystery Bundles, and Flash Deals — all integrated with real-time broadcast displays.",
  keywords: [
    "Northwind Systems",
    "e-commerce engagement system",
    "customer retention software",
    "gamified e-commerce",
    "live shopping platform",
    "loyalty program software",
    "customer engagement modules",
    "spin to win ecommerce",
    "live trivia shopping",
    "mystery bundles ecommerce",
    "flash deals platform",
    "points loyalty system",
    "community building platform",
    "customer acquisition tools",
  ],
  openGraph: {
    title: "Northwind Systems | Build Customer Community Through Engagement",
    description:
      "Complete e-commerce system with 5 engagement modules that transform casual buyers into loyal brand advocates. Real-time broadcasts, points economy, and live community building.",
    images: [
      {
        url: "/about/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Northwind Systems - Enterprise Engagement System",
      },
    ],
    siteName: "Northwind Systems",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Northwind Systems | Engagement-First E-commerce",
    description:
      "Spin wheels, live challenges, lucky draws, mystery bundles, and flash deals. All integrated with your checkout and loyalty points system.",
    images: ["/about/twitter-image.jpg"],
  },
  alternates: {
    canonical: "/about",
  },
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
};

export default function AboutPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main>{children}</main>;
}
