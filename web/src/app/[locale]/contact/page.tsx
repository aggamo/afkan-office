import { setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/components/contact/contact-form";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 lg:px-8">
      <ContactForm />
    </div>
  );
}
