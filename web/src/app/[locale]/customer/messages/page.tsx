"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api";
import { fetchCustomerMessages, sendCustomerMessage, type ChatMessage } from "@/lib/customer-api";
import { ChatThread } from "@/components/chat/chat-thread";

export default function CustomerMessagesPage() {
  const t = useTranslations("customer");
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const result = await fetchCustomerMessages();
        if (!cancelled) setMessages(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSend(body: string) {
    const created = await sendCustomerMessage(body);
    setMessages((prev) => (prev ? [...prev, created] : [created]));
  }

  if (error) return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-dark">{t("messages.title")}</h1>
      <p className="mb-6 text-sm text-gray-500">{t("messages.subtitle")}</p>

      {!messages ? (
        <p className="py-10 text-center text-gray-400">{t("loading")}</p>
      ) : (
        <ChatThread
          messages={messages}
          viewerIsStaff={false}
          onSend={handleSend}
          placeholder={t("messages.placeholder")}
          sendLabel={t("messages.send")}
          emptyLabel={t("messages.empty")}
        />
      )}
    </div>
  );
}
