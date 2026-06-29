import { setRequestLocale } from "next-intl/server";
import { WorkersBrowser } from "@/components/workers/workers-browser";

export default async function WorkersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <WorkersBrowser />
    </div>
  );
}
