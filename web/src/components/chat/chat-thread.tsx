"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Send } from "lucide-react";
import type { Locale } from "@/i18n/config";

export type ChatMessageItem = {
  id: number;
  body: string;
  is_from_staff: boolean;
  sender: string | null;
  created_at: string | null;
};

export function ChatThread({
  messages,
  viewerIsStaff,
  onSend,
  placeholder,
  sendLabel,
  emptyLabel,
}: {
  messages: ChatMessageItem[];
  viewerIsStaff: boolean;
  onSend: (body: string) => Promise<void>;
  placeholder: string;
  sendLabel: string;
  emptyLabel: string;
}) {
  const locale = useLocale() as Locale;
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try {
      await onSend(body);
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[60vh] flex-col rounded-xl border border-gray-100 bg-white">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">{emptyLabel}</p>
        ) : (
          messages.map((m) => {
            const mine = m.is_from_staff === viewerIsStaff;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    mine ? "bg-brand-green text-white" : "bg-gray-100 text-brand-dark"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-gray-400"}`}>
                    {m.sender ?? ""}
                    {m.created_at ? ` · ${new Date(m.created_at).toLocaleString(locale)}` : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-gray-100 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="flex items-center gap-1.5 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Send size={15} /> {sendLabel}
        </button>
      </form>
    </div>
  );
}
