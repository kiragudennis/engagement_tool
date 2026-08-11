// app/(public)/[businessSlug]/components/Footer.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface FooterProps {
  businessSlug: string;
}

export function Footer({ businessSlug }: FooterProps) {
  return (
    <footer className="border-t border-white/10 py-8 sm:py-12 mt-10">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-white/40">
        <Link
          href={`/${businessSlug}/code-entry`}
          className="hover:text-white transition-colors"
        >
          Enter Code
        </Link>
        <span className="hidden sm:inline text-white/20">•</span>
        <Link href="/terms" className="hover:text-white transition-colors">
          Terms of Service
        </Link>
        <span className="hidden sm:inline text-white/20">•</span>
        <Link href="/privacy" className="hover:text-white transition-colors">
          Privacy Policy
        </Link>
        <span className="hidden sm:inline text-white/20">•</span>
        <Link href="/cookies" className="hover:text-white transition-colors">
          Cookies
        </Link>
        <span className="hidden sm:inline text-white/20">•</span>
        <Link href="/docs" className="hover:text-white transition-colors">
          Documentation
        </Link>
      </div>
      <p className="text-white/20 text-xs text-center mt-4">
        Powered by Engage
      </p>
    </footer>
  );
}
