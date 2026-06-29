import { getTranslations, setRequestLocale } from "next-intl/server";
import { fetchAgencies } from "@/lib/api";
import { adaptAgency } from "@/lib/worker-adapter";

export default async function AgenciesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home.agencies");
  const apiAgencies = await fetchAgencies();
  const agencies = apiAgencies.map(adaptAgency);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
      <h1 className="mb-10 text-center text-2xl font-bold text-brand-dark lg:text-3xl">{t("title")}</h1>
      {agencies.length === 0 ? (
        <p className="text-center text-gray-500">—</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {agencies.map((agency) => (
            <div key={agency.id} className="rounded-xl border border-gray-100 p-6 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-green font-bold text-white">
                {agency.logo}
              </div>
              <h2 className="font-semibold text-brand-dark">{agency.name}</h2>
              <p className="text-sm text-gray-500">
                {agency.city}, {agency.country}
              </p>
              <p className="mt-1 text-xs text-gray-400">{agency.licenseNumber}</p>
              <div className="mt-3 flex items-center justify-center gap-3 text-sm text-gray-500">
                <span className="text-brand-gold">★ {agency.rating}</span>
                <span>{agency.completedCases} cases</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
