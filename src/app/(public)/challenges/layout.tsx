// app/(store)/challenges/layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Challenges | Northwind Systems",
  description:
    "Participate in live trivia, referral competitions, and team challenges. Compete on leaderboards and win prizes. Host-led real-time questions.",
  keywords: [
    "live trivia",
    "shopping challenges",
    "referral competition",
    "team challenges",
    "leaderboard rewards",
    "customer competitions",
  ],
  openGraph: {
    title: "Live Challenges | Northwind Systems",
    description:
      "Compete in real-time challenges. Live trivia, referrals, and team competitions with prize leaderboards.",
    images: ["/og-challenges.jpg"],
  },
};

export default function ChallengesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
