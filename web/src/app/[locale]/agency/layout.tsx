import { setRequestLocale } from "next-intl/server";
import { AgencyGuard } from "@/components/agency/agency-guard";
import { AgencyShell } from "@/components/agency/agency-shell";

export default async function AgencyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AgencyGuard>
      <AgencyShell>{children}</AgencyShell>
    </AgencyGuard>
  );
}
