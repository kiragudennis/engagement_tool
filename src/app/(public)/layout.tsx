// app/(store)/layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Northwind Systems - Enterprise E-commerce + Engagement System",
    template: "%s | Northwind Systems",
  },
  description:
    "Complete e-commerce system with 5 gamified engagement modules. Build customer loyalty with Spin Wheel, Live Challenges, Lucky Draws, Mystery Bundles, and Flash Deals — all integrated with real-time broadcast displays and unified points economy.",
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
    "enterprise e-commerce",
  ],
  authors: [{ name: "Northwind Systems" }],
  creator: "Northwind Systems",
  publisher: "Northwind Systems",
  formatDetection: {
    email: false,
    address: false,
    telephone: true,
  },
  metadataBase: new URL("https://ns.yunobase.com"),
  alternates: {
    canonical: "/",
    languages: {
      "en-KE": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://ns.yunobase.com",
    title: "Northwind Systems - Build Customer Community Through Engagement",
    description:
      "Complete e-commerce system with 5 engagement modules that transform casual buyers into loyal brand advocates. Real-time broadcasts, points economy, and live community building.",
    siteName: "Northwind Systems",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Northwind Systems - Enterprise Engagement System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Northwind Systems | Engagement-First E-commerce",
    description:
      "Spin wheels, live challenges, lucky draws, mystery bundles, and flash deals. All integrated with your checkout and loyalty points system.",
    images: ["/twitter-image.jpg"],
    creator: "@northwind",
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
  category: "E-commerce Software",
};

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>
      {/* Structured Data for Software Application */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Northwind Systems",
            applicationCategory: "E-commerce Software",
            operatingSystem: "Web",
            description:
              "Complete e-commerce platform with 5 gamified engagement modules for customer retention and community building.",
            offers: {
              "@type": "Offer",
              price: "250000",
              priceCurrency: "KES",
              description: "Per module pricing with complete bundle available",
            },
            featureList: [
              "Spin Wheel with live broadcast",
              "Live Challenges & Trivia",
              "Lucky Draws with winner management",
              "Mystery Bundles",
              "Flash Deals with urgency mechanics",
              "Unified Points Economy",
              "Real-time WebSocket infrastructure",
              "OBS-ready broadcast displays",
              "Admin live controls",
              "Fraud prevention suite",
            ],
            url: "https://ns.yunobase.com",
            sameAs: [
              "https://www.tiktok.com/@northwind",
              "https://www.instagram.com/northwind",
            ],
          }),
        }}
      />

      {/* Structured Data for WebSite */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Northwind Systems",
            url: "https://ns.yunobase.com",
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: "https://ns.yunobase.com/?q={search_term_string}",
              },
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
      {children}
    </main>
  );
}
