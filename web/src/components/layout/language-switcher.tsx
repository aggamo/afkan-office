"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import { Globe } from "lucide-react";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-brand-dark hover:bg-brand-light"
      >
        <Globe size={16} />
        {localeNames[locale]}
      </button>
      {open && (
        <div className="absolute end-0 z-50 mt-1 w-36 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          {locales.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => {
                setOpen(false);
                router.replace(pathname, { locale: loc });
              }}
              className={`block w-full px-3 py-2 text-start text-sm hover:bg-brand-light ${
                loc === locale ? "font-semibold text-brand-green" : "text-brand-dark"
              }`}
            >
              {localeNames[loc]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
