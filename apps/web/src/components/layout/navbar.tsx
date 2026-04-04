"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/70 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 bg-surface/60 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-lg font-black tracking-tight text-on-surface"
          >
            Wallet<span className="text-[#00d4aa]">Lens</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors tracking-tight",
                    active
                      ? "text-primary border-b-2 border-primary pb-1"
                      : "text-on-surface-variant hover:text-on-surface",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ConnectButton showBalance={false} />
        </div>
      </nav>
    </header>
  );
}
