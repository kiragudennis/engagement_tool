"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Menu, User, Sun, Moon, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navigation = [
  { name: "Account", href: "/account" },
  { name: "About", href: "/about" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "Pricing", href: "/pricing" },
  { name: "Contact", href: "/contact" },
];

const adminNavigation = [
  { name: "Dashboard", href: "/admin" },
  { name: "Products", href: "/admin/products" },
  { name: "Orders", href: "/admin/orders" },
  { name: "Coupons", href: "/admin/coupons" },
  { name: "Tracking", href: "/admin/tracking" },
  { name: "Customers", href: "/admin/customers" },
  { name: "Marketing", href: "/admin/marketing" },
  { name: "Analytics", href: "/admin/analytics" },
];

export default function Header() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin = pathname.startsWith("/admin");
  const navItems = isAdmin ? adminNavigation : navigation;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <span className="text-gray-900 dark:text-white font-bold text-lg">
            Engage
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/how-it-works"
            className="text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white text-sm transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="/pricing"
            className="text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white text-sm transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/about"
            className="text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white text-sm transition-colors"
          >
            About
          </Link>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center sm:gap-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle Theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* User Account Link */}
          <Link href={isAdmin ? "/" : "/admin"}>
            <Button variant="ghost" size="icon" aria-label="User Account">
              <User className="h-5 w-5" />
            </Button>
          </Link>

          {/* Enter Code Link */}
          <Link
            href="/code-entry"
            className="hidden sm:inline-block text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white text-sm transition-colors"
          >
            Enter Code
          </Link>

          {/* CTA Button */}
          <Button
            asChild
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            <Link href="/business/signup">Start Free Trial</Link>
          </Button>

          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Menu"
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="px-2">
              <SheetHeader>
                <SheetTitle>{isAdmin ? "Admin Menu" : "Menu"}</SheetTitle>
                <SheetDescription>
                  Navigate through the site using the links below.
                </SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      pathname === item.href
                        ? "text-foreground"
                        : "text-foreground/60"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
