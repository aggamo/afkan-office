import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getWorkerById } from "@/lib/mock-data";
import { WorkerProfileView } from "@/components/workers/worker-profile-view";

export default async function WorkerProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const worker = getWorkerById(id);
  if (!worker) notFound();

  const t = await getTranslations("workerProfile");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <WorkerProfileView worker={worker} backLabel={t("backToWorkers")} />
    </div>
  );
}
