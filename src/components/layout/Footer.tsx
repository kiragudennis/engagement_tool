// components/layout/footer.tsx
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black/50 backdrop-blur">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <span className="text-white font-bold text-lg">Engage</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed">
              Turn your business into a live game show. Spin wheels, trivia
              nights, and live events—customers play from their phones.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-3">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/pricing"
                  className="text-white/40 hover:text-white/70 text-sm transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-white/40 hover:text-white/70 text-sm transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-white/40 hover:text-white/70 text-sm transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/spin"
                  className="text-white/40 hover:text-white/70 text-sm transition-colors"
                >
                  Enter a Code
                </Link>
              </li>
            </ul>
          </div>

          {/* For Businesses */}
          <div>
            <h3 className="text-white font-semibold mb-3">For Businesses</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/business/signup"
                  className="text-white/40 hover:text-white/70 text-sm transition-colors"
                >
                  Create Account
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-white/40 hover:text-white/70 text-sm transition-colors"
                >
                  Plans
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-white/40 hover:text-white/70 text-sm transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="mailto:support@engagespin.com"
                  className="text-white/40 hover:text-white/70 text-sm transition-colors"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-3">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="text-white/40 hover:text-white/70 text-sm transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-white/40 hover:text-white/70 text-sm transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="mailto:privacy@engagespin.com"
                  className="text-white/40 hover:text-white/70 text-sm transition-colors"
                >
                  Privacy Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-sm">
            &copy; {new Date().getFullYear()} Engage. All rights reserved.
          </p>
          <p className="text-white/20 text-xs">
            Customer data belongs to businesses. We never market to your
            customers.
          </p>
        </div>
      </div>
    </footer>
  );
}
