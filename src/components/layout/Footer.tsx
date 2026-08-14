// components/layout/footer.tsx
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/50 backdrop-blur transition-colors duration-300">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col gap-8">
          {/* Brand - Full width, prominent */}
          <div className="w-full">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <span className="text-gray-900 dark:text-white font-bold text-xl">
                Engage
              </span>
            </Link>
            <p className="text-gray-500 dark:text-white/40 text-sm italic">
              "Customers who play always come back."
            </p>
          </div>

          {/* Links - Two columns on mobile, four on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {/* Product */}
            <div className={cn("col-span-1", "md:col-span-1")}>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-3 text-sm sm:text-base">
                Product
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/how-it-works"
                    className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/70 text-sm transition-colors"
                  >
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/70 text-sm transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs"
                    className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/70 text-sm transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="/code-entry"
                    className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/70 text-sm transition-colors"
                  >
                    Enter a Code
                  </Link>
                </li>
              </ul>
            </div>

            {/* For Businesses */}
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-3 text-sm sm:text-base">
                For Businesses
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/business/signup"
                    className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/70 text-sm transition-colors"
                  >
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/70 text-sm transition-colors"
                  >
                    Plans
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about/consultation"
                    className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/70 text-sm transition-colors"
                  >
                    Consultation
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/70 text-sm transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal - Hidden on mobile, visible on desktop */}
            <div className="hidden md:block">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-3 text-sm sm:text-base">
                Legal
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/70 text-sm transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/70 text-sm transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cookies"
                    className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/70 text-sm transition-colors"
                  >
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="mailto:privacy@engagespin.com"
                    className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/70 text-sm transition-colors"
                  >
                    Privacy Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Legal - Visible on mobile only */}
          <div className="md:hidden">
            <h3 className="text-gray-900 dark:text-white font-semibold mb-3 text-sm">
              Legal
            </h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
              <li>
                <Link
                  href="/terms"
                  className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/70 text-sm transition-colors"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/70 text-sm transition-colors"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/70 text-sm transition-colors"
                >
                  Cookies
                </Link>
              </li>
              <li>
                <Link
                  href="mailto:privacy@engagespin.com"
                  className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/70 text-sm transition-colors"
                >
                  Privacy Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-white/5 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 dark:text-white/30 text-sm">
            &copy; {new Date().getFullYear()} Engage. All rights reserved.
          </p>
          <p className="text-gray-400/60 dark:text-white/20 text-xs">
            Customer data belongs to businesses. We never market to your
            customers.
          </p>
        </div>
      </div>
    </footer>
  );
}
