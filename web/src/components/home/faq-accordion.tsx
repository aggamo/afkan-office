"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function FaqAccordion({ items }: { items: { question: string; answer: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white">
      {items.map((item, i) => (
        <div key={item.question}>
          <button
            type="button"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-center justify-between px-5 py-4 text-start font-medium text-brand-dark"
          >
            {item.question}
            <ChevronDown
              size={18}
              className={`shrink-0 transition-transform ${openIndex === i ? "rotate-180" : ""}`}
            />
          </button>
          {openIndex === i && <div className="px-5 pb-4 text-sm text-gray-500">{item.answer}</div>}
        </div>
      ))}
    </div>
  );
}
