"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Phone, Send, Mail, Clock } from "lucide-react";

export function ContactForm() {
  const t = useTranslations("contact");
  const [sent, setSent] = useState(false);

  return (
    <div>
      <h1 className="mb-10 text-center text-2xl font-bold text-brand-dark lg:text-3xl">{t("title")}</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <InfoRow icon={<MapPin size={18} />} label={t("address")} value="Addis Ababa, Ethiopia" />
          <InfoRow icon={<Phone size={18} />} label={t("phone")} value="+251 11 234 5678" />
          <InfoRow icon={<Send size={18} />} label={t("whatsapp")} value="+251 91 234 5678" />
          <InfoRow icon={<Send size={18} />} label={t("telegram")} value="@afkanagent" />
          <InfoRow icon={<Mail size={18} />} label={t("email")} value="info@afkanagent.com" />
          <InfoRow icon={<Clock size={18} />} label={t("hours")} value="Sun–Fri, 8:30–17:30" />
          <div className="h-48 w-full rounded-xl bg-brand-light" />
        </div>

        <form
          className="space-y-4 rounded-xl border border-gray-100 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <Input label={t("form.name")} required />
          <Input label={t("form.email")} type="email" required />
          <Input label={t("form.phone")} type="tel" />
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">{t("form.message")}</label>
            <textarea
              required
              rows={4}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-green"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-green-dark"
          >
            {t("form.send")}
          </button>
          {sent && <p className="text-sm text-brand-green">{t("form.success")}</p>}
        </form>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-4">
      <span className="text-brand-green">{icon}</span>
      <div>
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-sm font-medium text-brand-dark">{value}</div>
      </div>
    </div>
  );
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
      <input
        {...props}
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-green"
      />
    </div>
  );
}
