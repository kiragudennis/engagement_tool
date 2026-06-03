// app/(store)/bundles/layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mystery Bundles | Northwind Systems",
  description:
    "Discover curated product bundles with surprise reveals. Build-your-own, tiered savings, and subscription options.",
  keywords: [
    "mystery bundles",
    "product bundles",
    "build your own bundle",
    "tiered savings",
    "subscription boxes",
    "bundle deals",
  ],
  openGraph: {
    title: "Mystery Bundles | Northwind Systems",
    description:
      "Save more with curated product bundles. Mystery mode for viral unboxing content.",
    images: ["/og-bundles.jpg"],
  },
};

export default function BundlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
