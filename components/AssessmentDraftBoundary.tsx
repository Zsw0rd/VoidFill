"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createAuthClient, createClient } from "@/lib/supabase/browser";
import { bindAssessmentDraftOwner, browserDraftStorage, clearAssessmentDrafts, pruneExpiredAssessmentDrafts } from "@/lib/assessmentDrafts";

/** No draft crosses a normal sign-out/account switch in this tab. No auth cookies are read. */
export function AssessmentDraftBoundary() {
  const pathname = usePathname();
  useEffect(() => {
    let stopped = false;
    const clear = () => { const storage = browserDraftStorage(); if (storage) clearAssessmentDrafts(storage); };
    const verify = async () => {
      const storage = browserDraftStorage();
      if (!storage) return;
      pruneExpiredAssessmentDrafts(storage);
      if (pathname.startsWith("/auth/") || pathname.startsWith("/demo/") || pathname === "/") { clear(); return; }
      try {
        const { data: { user }, error } = await createClient().auth.getUser();
        if (stopped) return;
        if (error) {
          if (error.status === 401 || error.status === 403 || error.name === "AuthSessionMissingError") clear();
          return;
        }
        if (!user) clear(); else bindAssessmentDraftOwner(storage, user.id);
      } catch { /* A transient connection failure must not erase valid answers. */ }
    };
    const onSubmit = (event: Event) => {
      const form = event.target;
      if (form instanceof HTMLFormElement && new URL(form.action, window.location.origin).pathname === "/auth/logout") clear();
    };
    const onFocus = () => void verify();
    void verify();
    const prune = setInterval(() => { const storage = browserDraftStorage(); if (storage) pruneExpiredAssessmentDrafts(storage); }, 60000);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("focus", onFocus);
    // Supabase broadcasts ordinary sign-outs to its other tabs. The demo adapter
    // has no real auth session; public demo-end navigation clears its drafts.
    const { data: { subscription } } = createAuthClient().auth.onAuthStateChange(event => {
      if (event === "SIGNED_OUT" && !document.cookie.split("; ").includes("vf_demo_active=1")) clear();
      if (event === "SIGNED_IN") setTimeout(() => void verify(), 0);
    });
    return () => {
      stopped = true; subscription.unsubscribe();
      clearInterval(prune);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("focus", onFocus);
    };
  }, [pathname]);
  return null;
}
