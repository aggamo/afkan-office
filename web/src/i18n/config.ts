export const locales = ["ar", "en", "am"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";

export const localeNames: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
  am: "አማርኛ",
};

export const rtlLocales: Locale[] = ["ar"];

export function isRtl(locale: Locale) {
  return rtlLocales.includes(locale);
}
