"use client";
import { useEffect, useRef } from "react";
import { activateModal, trapTabKey } from "@/lib/focusManagement";

export function FocusDialog({
  children,
  label,
  onClose,
  returnFocus,
}: {
  children: React.ReactNode;
  label: string;
  onClose: () => void;
  returnFocus?: () => HTMLElement | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const focusDestination = useRef(returnFocus);
  focusDestination.current = returnFocus;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const root = ref.current;
    if (!root) return;
    const modal = activateModal(root);
    root.focus();
    function keydown(event: KeyboardEvent) {
      if (!modal.isCurrent()) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close.current();
      }
      trapTabKey(event, root);
    }
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      modal.release();
      // Restored dialogs can open on page load, where the prior focus is the
      // body. Let their caller supply the newly rendered resume control.
      const destination = focusDestination.current?.() || previous;
      if (destination?.isConnected && !destination.closest("[inert]")) destination.focus();
    };
  }, []);
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
      className="outline-none"
    >
      {children}
    </div>
  );
}
