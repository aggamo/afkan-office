import { setRequestLocale } from "next-intl/server";
import { CustomerGuard } from "@/components/customer/customer-guard";
import { CustomerShell } from "@/components/customer/customer-shell";

export default async function CustomerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <CustomerGuard>
      <CustomerShell>{children}</CustomerShell>
    </CustomerGuard>
  );
}
