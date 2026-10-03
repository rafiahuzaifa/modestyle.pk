"use client";

import { useState } from "react";

export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="bg-gray-50 rounded-xl px-5">
      {items.map((item, i) => (
        <div key={i} className="border-b border-gray-100 last:border-0">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex justify-between items-center py-4 text-left gap-4"
            aria-expanded={open === i}
          >
            <span className="text-sm font-medium text-secondary">{item.q}</span>
            <span className={`text-gold-500 text-lg transition-transform shrink-0 ${open === i ? "rotate-45" : ""}`}>+</span>
          </button>
          {open === i && <p className="text-sm text-gray-500 leading-relaxed pb-4 whitespace-pre-line">{item.a}</p>}
        </div>
      ))}
    </div>
  );
}
