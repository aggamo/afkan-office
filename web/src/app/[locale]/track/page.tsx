import { setRequestLocale } from "next-intl/server";
import { TrackForm } from "@/components/track/track-form";

export default async function TrackPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 lg:px-8">
      <TrackForm />
    </div>
  );
}
