// app/(public)/docs/layout.tsx
import { Metadata } from "next";
import { PropsWithChildren } from "react";

// Generate metadata for all docs pages
export function generateMetadata(): Metadata {
  return {
    title: {
      template: "%s | Engage Docs",
      default: "Engage Documentation - Customer Engagement & Loyalty Platform",
    },
    description:
      "Complete documentation for Engage - the gamified customer retention platform. Learn how to set up sticker codes, POS integration, spin wheels, trivia, and prize draws to grow your business.",
    keywords: [
      "customer engagement",
      "loyalty program",
      "POS integration",
      "gamification",
      "spin wheel",
      "customer retention",
      "business documentation",
      "Engage platform",
      "receipt codes",
      "sticker codes",
    ],
    openGraph: {
      title: "Engage Documentation - Build Loyalty Through Play",
      description:
        "Everything you need to turn your business into a gamified experience. From sticker codes to live trivia, Engage helps you build lasting customer relationships.",
      url: "https://engagespin.com/docs",
      siteName: "Engage",
      images: [
        {
          url: "https://engagespin.com/og/docs.png",
          width: 1200,
          height: 630,
          alt: "Engage Documentation - Customer Engagement Platform",
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Engage Documentation - Build Loyalty Through Play",
      description:
        "Complete documentation for Engage - the gamified customer retention platform.",
      images: ["https://engagespin.com/og/docs.png"],
      creator: "@engagespin",
      site: "@engagespin",
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
    alternates: {
      canonical: "https://engagespin.com/docs",
    },
    authors: [{ name: "Engage Team", url: "https://engagespin.com/about" }],
    category: "Documentation",
    creator: "Engage",
    publisher: "Engage",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL("https://engagespin.com"),
  };
}

export default function DocsLayout({ children }: PropsWithChildren) {
  // Add structured data for documentation
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Engage Documentation",
    description:
      "Complete documentation for the Engage customer engagement platform",
    url: "https://engagespin.com/docs",
    isPartOf: {
      "@type": "WebSite",
      name: "Engage",
      url: "https://engagespin.com",
    },
    about: {
      "@type": "SoftwareApplication",
      name: "Engage",
      description:
        "Customer retention platform that turns purchases into gamified experiences",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        category: "Business Software",
      },
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://engagespin.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Documentation",
          item: "https://engagespin.com/docs",
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {children}
    </>
  );
}
