import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ShieldCheck,
  BadgeCheck,
  Eye,
  Zap,
  Headphones,
  Lock,
  ChefHat,
  Building2,
  Users,
  FileText,
  Plane,
  Stamp,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { WorkerCard } from "@/components/worker-card";
import { StatsCounter } from "@/components/home/stats-counter";
import { FaqAccordion } from "@/components/home/faq-accordion";
import { workers, agencies } from "@/lib/mock-data";
import { getFaq } from "@/lib/faq-data";
import { getTestimonials } from "@/lib/testimonials-data";
import type { Locale } from "@/i18n/config";

const WHY_ICONS = [ShieldCheck, BadgeCheck, Eye, Zap, Headphones, Lock];
const WHY_KEYS = ["licensed", "verified", "transparent", "fast", "support", "secure"] as const;
const SERVICE_ICONS = [Users, Building2, Users, FileText, Stamp, Plane];
const SERVICE_KEYS = ["domestic", "agencyRecruitment", "customerRecruitment", "documents", "visa", "travel"] as const;
const PROCESS_KEYS = ["step1", "step2", "step3", "step4", "step5", "step6", "step7"] as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const faq = getFaq(locale as Locale);
  const testimonials = getTestimonials(locale as Locale);
  const featuredWorkers = workers.filter((w) => w.reservationStatus === "available").slice(0, 4);
  const topAgencies = agencies.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-green to-brand-green-dark px-4 py-20 text-white lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-bold leading-tight lg:text-5xl">{t("hero.headline")}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/80 lg:text-lg">{t("hero.subheadline")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/workers" className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-brand-green hover:bg-gray-100">
              {t("hero.browseWorkers")}
            </Link>
            <Link href="/contact" className="rounded-md border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
              {t("hero.requestRecruitment")}
            </Link>
            <Link href="/track" className="rounded-md border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
              {t("hero.trackApplication")}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-100 px-4 py-12 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 lg:grid-cols-6">
          <StatsCounter target={1280} label={t("stats.available")} />
          <StatsCounter target={5400} label={t("stats.recruited")} />
          <StatsCounter target={64} label={t("stats.agencies")} />
          <StatsCounter target={12} label={t("stats.experience")} />
          <StatsCounter target={3} label={t("stats.countries")} />
          <StatsCounter target={97} label={t("stats.satisfaction")} />
        </div>
      </section>

      {/* Why choose */}
      <section className="px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-brand-dark lg:text-3xl">{t("why.title")}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_KEYS.map((key, i) => {
              const Icon = WHY_ICONS[i];
              return (
                <div key={key} className="rounded-xl border border-gray-100 p-6 shadow-sm">
                  <Icon className="mb-3 text-brand-green" size={28} />
                  <h3 className="mb-1 font-semibold text-brand-dark">{t(`why.${key}.title`)}</h3>
                  <p className="text-sm text-gray-500">{t(`why.${key}.desc`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-brand-light px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-brand-dark lg:text-3xl">{t("services.title")}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_KEYS.map((key, i) => {
              const Icon = SERVICE_ICONS[i];
              return (
                <div key={key} className="rounded-xl bg-white p-6 shadow-sm">
                  <Icon className="mb-3 text-brand-gold" size={26} />
                  <h3 className="font-semibold text-brand-dark">{t(`services.${key}`)}</h3>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured workers */}
      <section className="px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-brand-dark lg:text-3xl">{t("featured.title")}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredWorkers.map((worker) => (
              <WorkerCard key={worker.id} worker={worker} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/workers" className="rounded-md bg-brand-green px-6 py-3 text-sm font-semibold text-white hover:bg-brand-green-dark">
              {t("hero.browseWorkers")}
            </Link>
          </div>
        </div>
      </section>

      {/* Recruitment process */}
      <section className="bg-brand-light px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-brand-dark lg:text-3xl">{t("process.title")}</h2>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-7">
            {PROCESS_KEYS.map((key, i) => (
              <div key={key} className="flex flex-col items-center text-center">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand-green font-bold text-white">
                  {i + 1}
                </div>
                <span className="text-xs text-brand-dark">{t(`process.${key}`)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner agencies */}
      <section className="px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-brand-dark lg:text-3xl">{t("agencies.title")}</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {topAgencies.map((agency) => (
              <div key={agency.id} className="rounded-xl border border-gray-100 p-6 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-green font-bold text-white">
                  {agency.logo}
                </div>
                <h3 className="font-semibold text-brand-dark">{agency.name}</h3>
                <p className="text-sm text-gray-500">{agency.city}</p>
                <p className="mt-1 text-xs text-gray-400">{agency.licenseNumber}</p>
                <div className="mt-3 text-sm text-brand-gold">★ {agency.rating}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-brand-light px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-brand-dark lg:text-3xl">{t("testimonials.title")}</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {testimonials.map((item) => (
              <div key={item.name} className="rounded-xl bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">&ldquo;{item.text}&rdquo;</p>
                <div className="mt-4 font-semibold text-brand-dark">{item.name}</div>
                <div className="text-xs text-gray-400">{item.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-brand-dark lg:text-3xl">{t("faq.title")}</h2>
          <FaqAccordion items={faq} />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-green px-4 py-16 text-center text-white lg:px-8">
        <h2 className="text-2xl font-bold lg:text-3xl">{t("cta.title")}</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/workers" className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-brand-green hover:bg-gray-100">
            {t("cta.browse")}
          </Link>
          <Link href="/contact" className="rounded-md border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
            {t("cta.contact")}
          </Link>
        </div>
      </section>
    </div>
  );
}
