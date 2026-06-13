// app/(store)/draws/layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lucky Draws | Northwind Systems",
  description:
    "Enter time-limited giveaways for a chance to win big prizes. Multiple entry methods: purchases, referrals, and social shares.",
  keywords: [
    "lucky draws",
    "giveaway entries",
    "prize draws",
    "winner selection",
    "live draw shows",
    "giveaway entry methods",
  ],
  openGraph: {
    title: "Lucky Draws | Northwind Systems",
    description:
      "Enter draws for a chance to win amazing prizes. Live winner selection with broadcast displays.",
    images: ["/og-draws.jpg"],
  },
};

export default function DrawsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
