import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ApiError, fetchWorker } from "@/lib/api";
import { adaptWorker } from "@/lib/worker-adapter";
import { WorkerProfileView } from "@/components/workers/worker-profile-view";

export default async function WorkerProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  let worker;
  try {
    worker = adaptWorker(await fetchWorker(id));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const t = await getTranslations("workerProfile");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <WorkerProfileView worker={worker} backLabel={t("backToWorkers")} />
    </div>
  );
}
