"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X, Heart } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";

const NAV_ITEMS = [
  { href: "/", key: "home" },
  { href: "/about", key: "about" },
  { href: "/services", key: "services" },
  { href: "/workers", key: "workers" },
  { href: "/agencies", key: "agencies" },
  { href: "/process", key: "process" },
  { href: "/contact", key: "contact" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-brand-green">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-green text-white">A</span>
          <span>Afkan</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-brand-dark hover:text-brand-green"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/favorites" aria-label="favorites" className="text-brand-dark hover:text-brand-green">
            <Heart size={20} />
          </Link>
          <LanguageSwitcher />
          <Link href="/login" className="text-sm font-medium text-brand-dark hover:text-brand-green">
            {t("login")}
          </Link>
          <Link
            href="/track"
            className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-dark"
          >
            {t("requestWorker")}
          </Link>
        </div>

        <button
          type="button"
          className="lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="menu"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-gray-100 px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-brand-dark"
              >
                {t(item.key)}
              </Link>
            ))}
            <Link href="/favorites" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-brand-dark">
              {t("favorites")}
            </Link>
            <Link href="/login" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-brand-dark">
              {t("login")}
            </Link>
            <Link
              href="/track"
              onClick={() => setMenuOpen(false)}
              className="rounded-md bg-brand-green px-4 py-2 text-center text-sm font-semibold text-white"
            >
              {t("requestWorker")}
            </Link>
            <div className="pt-2">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
