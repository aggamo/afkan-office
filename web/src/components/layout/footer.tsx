import { useTranslations } from "next-intl";
import { Share2, Send, Phone, Mail } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const tMeta = useTranslations("meta");

  return (
    <footer className="bg-brand-dark text-gray-200">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-green">A</span>
            {tMeta("siteName")}
          </div>
          <p className="text-sm text-gray-400">{t("companyInfo")}</p>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-white">{t("navigation")}</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white">{tNav("home")}</Link></li>
            <li><Link href="/workers" className="hover:text-white">{tNav("workers")}</Link></li>
            <li><Link href="/agencies" className="hover:text-white">{tNav("agencies")}</Link></li>
            <li><Link href="/about" className="hover:text-white">{tNav("about")}</Link></li>
            <li><Link href="/track" className="hover:text-white">{tNav("track")}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-white">{t("contact")}</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-center gap-2"><Phone size={16} /> +251 11 234 5678</li>
            <li className="flex items-center gap-2"><Mail size={16} /> info@afkanagent.com</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-white">{t("social")}</h3>
          <div className="flex gap-3">
            <a href="#" aria-label="facebook" className="rounded-full bg-white/10 p-2 hover:bg-white/20">
              <Share2 size={18} />
            </a>
            <a href="#" aria-label="telegram" className="rounded-full bg-white/10 p-2 hover:bg-white/20">
              <Send size={18} />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} {tMeta("siteName")} — {t("rights")}
      </div>
    </footer>
  );
}
