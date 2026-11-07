"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toastBus, type ToastItem } from "./bus";

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsub = toastBus.subscribe((t) => {
      setItems((prev) => [...prev, t]);
      setTimeout(
        () => setItems((prev) => prev.filter((x) => x.id !== t.id)),
        t.ttlMs,
      );
    });
    return () => {
      unsub();
    };
  }, []);

  if (!items.length) return null;

  return (
    <div
      className="toast-stack space-y-2"
      role="status"
      aria-live="polite"
      aria-atomic="false"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className="rounded-2xl border border-line bg-paper-soft backdrop-blur-xl shadow-soft p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold">{t.title}</div>
              {t.message ? (
                <div className="mt-1 text-sm text-muted">{t.message}</div>
              ) : null}
            </div>
            <button
              className="p-1 rounded-lg hover:bg-paper-soft"
              onClick={() =>
                setItems((prev) => prev.filter((x) => x.id !== t.id))
              }
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
