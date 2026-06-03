// app/(store)/spin/layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spin to Win | Northwind Systems",
  description:
    "Spin the wheel daily to win loyalty points, discounts, and prizes. Free spins every day. VIP wheels for loyal customers. Live broadcast ready.",
  keywords: [
    "spin to win",
    "prize wheel",
    "loyalty points",
    "daily spins",
    "VIP rewards",
    "gamified shopping",
    "customer engagement",
  ],
  openGraph: {
    title: "Spin to Win | Northwind Systems",
    description:
      "Spin daily for points, discounts, and prizes. Live broadcast displays for social media streams.",
    images: ["/og-spin.jpg"],
  },
};

export default function SpinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
