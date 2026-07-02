"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api";
import {
  fetchMessageThread,
  fetchMessageThreads,
  sendAdminMessage,
  type ChatMessage,
  type MessageThread,
} from "@/lib/admin-api";
import { ChatThread } from "@/components/chat/chat-thread";

export default function AdminMessagesPage() {
  const t = useTranslations("admin");
  const [threads, setThreads] = useState<MessageThread[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const list = await fetchMessageThreads();
        if (cancelled) return;
        setThreads(list);
        setSelected((prev) => prev ?? list[0]?.customer_id ?? null);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selected === null) return;
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled || selected === null) return;
      setMessages(null);
      try {
        const data = await fetchMessageThread(selected);
        if (!cancelled) {
          setMessages(data.messages);
          // clear unread badge locally
          setThreads((prev) => (prev ? prev.map((x) => (x.customer_id === selected ? { ...x, unread: 0 } : x)) : prev));
        }
      } catch {
        /* ignore */
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  async function handleSend(body: string) {
    if (selected === null) return;
    const created = await sendAdminMessage(selected, body);
    setMessages((prev) => (prev ? [...prev, created] : [created]));
  }

  if (error) return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-dark">{t("messages.title")}</h1>
      <p className="mb-6 text-sm text-gray-500">{t("messages.subtitle")}</p>

      {!threads ? (
        <p className="py-10 text-center text-gray-400">{t("loading")}</p>
      ) : threads.length === 0 ? (
        <p className="py-10 text-center text-gray-400">{t("messages.empty")}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <ul className="max-h-[65vh] space-y-1 overflow-y-auto rounded-xl border border-gray-100 p-2">
            {threads.map((thread) => (
              <li key={thread.customer_id}>
                <button
                  onClick={() => setSelected(thread.customer_id)}
                  className={`w-full rounded-md px-3 py-2 text-start text-sm ${
                    selected === thread.customer_id ? "bg-brand-green text-white" : "hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{thread.name}</span>
                    {thread.unread > 0 && (
                      <span className="shrink-0 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                        {thread.unread}
                      </span>
                    )}
                  </span>
                  <span className={`block truncate text-xs ${selected === thread.customer_id ? "text-white/80" : "text-gray-400"}`}>
                    {thread.last_body ?? ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div>
            {selected !== null && messages ? (
              <ChatThread
                messages={messages}
                viewerIsStaff
                onSend={handleSend}
                placeholder={t("messages.placeholder")}
                sendLabel={t("messages.send")}
                emptyLabel={t("messages.empty")}
              />
            ) : (
              <p className="py-10 text-center text-gray-400">{t("loading")}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
