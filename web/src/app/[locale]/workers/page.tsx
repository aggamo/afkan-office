import { setRequestLocale } from "next-intl/server";
import { fetchWorkers } from "@/lib/api";
import { adaptWorker } from "@/lib/worker-adapter";
import { WorkersBrowser } from "@/components/workers/workers-browser";

export default async function WorkersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const result = await fetchWorkers({ per_page: 50 });
  const workers = result.items.map(adaptWorker);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <WorkersBrowser workers={workers} />
    </div>
  );
}
