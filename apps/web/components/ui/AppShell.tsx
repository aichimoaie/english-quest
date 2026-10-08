"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./IconSprite";

const NAV_ITEMS: { href: string; label: string; icon: IconName; match: (path: string) => boolean }[] = [
  { href: "/", label: "Home", icon: "home", match: (path) => path === "/" },
  { href: "/course", label: "Course", icon: "book", match: (path) => path.startsWith("/course") || path.startsWith("/days") },
  { href: "/review", label: "Review", icon: "refresh", match: (path) => path.startsWith("/review") },
  { href: "/progress", label: "Progress", icon: "chart", match: (path) => path.startsWith("/progress") },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to content</a>

      <nav className="nav-side" aria-label="Main">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className={cx(item.match(pathname) && "on")} aria-current={item.match(pathname) ? "page" : undefined}>
            <Icon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="app-main">
        <header className="topbar">
          <Link href="/" className="brand">
            <Icon name="star" />
            English Quest
          </Link>
        </header>

        <main id="main" className="page" tabIndex={-1}>
          {children}
        </main>

        <nav className="nav-bottom" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={cx(item.match(pathname) && "on")} aria-current={item.match(pathname) ? "page" : undefined}>
              <Icon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
