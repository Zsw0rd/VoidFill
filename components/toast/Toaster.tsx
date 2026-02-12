"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toastBus, type ToastItem } from "./bus";

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsub = toastBus.subscribe((t) => {
      setItems((prev) => [...prev, t]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), t.ttlMs);
    });
    return () => { unsub(); };
  }, []);

  if (!items.length) return null;

  return (
    <div className="fixed right-4 top-4 z-50 space-y-2 w-[320px]">
      {items.map((t) => (
        <div key={t.id} className="rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur-xl shadow-soft p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold">{t.title}</div>
              {t.message ? <div className="mt-1 text-sm text-zinc-300">{t.message}</div> : null}
            </div>
            <button
              className="p-1 rounded-lg hover:bg-white/10"
              onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
