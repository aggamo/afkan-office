"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getAuthRole, getAuthToken } from "@/lib/auth-client";

type GuardState = "checking" | "unauthenticated" | "forbidden" | "authorized";

export function CustomerGuard({ children }: { children: React.ReactNode }) {
  const t = useTranslations("customer");
  const [state, setState] = useState<GuardState>("checking");

  useEffect(() => {
    let cancelled = false;
    async function check() {
      await Promise.resolve();
      if (cancelled) return;
      const token = getAuthToken();
      const role = getAuthRole();
      if (!token) {
        setState("unauthenticated");
      } else if (role !== "customer") {
        setState("forbidden");
      } else {
        setState("authorized");
      }
    }
    check();
    window.addEventListener("afkan-auth-changed", check);
    return () => {
      cancelled = true;
      window.removeEventListener("afkan-auth-changed", check);
    };
  }, []);

  if (state === "checking") {
    return <div className="p-16 text-center text-gray-400">{t("loading")}</div>;
  }

  if (state === "unauthenticated") {
    return <GuardMessage title={t("loginRequired")} ctaHref="/login" ctaLabel={t("loginCta")} />;
  }

  if (state === "forbidden") {
    return <GuardMessage title={t("accessDenied")} ctaHref="/" ctaLabel={t("backHome")} />;
  }

  return <>{children}</>;
}

function GuardMessage({ title, ctaHref, ctaLabel }: { title: string; ctaHref: string; ctaLabel: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="mb-6 text-lg font-semibold text-brand-dark">{title}</p>
      <Link href={ctaHref} className="rounded-md bg-brand-green px-5 py-2.5 text-sm font-semibold text-white">
        {ctaLabel}
      </Link>
    </div>
  );
}
