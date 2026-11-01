"use client";
import { useEffect, useState } from "react";
export function DemoSession() {
  const [active, setActive] = useState(false);
  const [ending, setEnding] = useState(false);
  useEffect(() => {
    if (!document.cookie.split("; ").includes("vf_demo_active=1")) return;
    setActive(true);
    const tab = crypto.randomUUID();
    let stopped = false;
    let sequence = 0;
    async function heartbeat() {
      try {
        const response = await fetch("/api/demo/lease", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tab, sequence: ++sequence }),
          cache: "no-store",
        });
        if (response.status === 401 && !stopped) {
          stopped = true;
          window.location.replace("/?demo=ended");
        }
      } catch {
        /* Service expiry handles crashes and lost connections. */
      }
    }
    const release = () => {
      navigator.sendBeacon(
        "/api/demo/lease",
        new Blob(
          [JSON.stringify({ tab, release: true, sequence: ++sequence })],
          { type: "application/json" },
        ),
      );
    };
    const resume = () => void heartbeat();
    void heartbeat();
    const timer = setInterval(heartbeat, 15000);
    window.addEventListener("pagehide", release);
    window.addEventListener("pageshow", resume);
    return () => {
      stopped = true;
      clearInterval(timer);
      release();
      window.removeEventListener("pagehide", release);
      window.removeEventListener("pageshow", resume);
    };
  }, []);
  if (!active) return null;
  return (
    <div className="demo-banner">
      <span>
        Temporary workspace · your demo data is cleared when this session ends.
      </span>
      <button
        disabled={ending}
        className="shrink-0 font-semibold underline underline-offset-2 disabled:opacity-50"
        onClick={async () => {
          setEnding(true);
          try {
            const r = await fetch("/api/demo/end", { method: "POST" });
            if (!r.ok) throw new Error();
            window.location.replace("/?demo=ended");
          } catch {
            setEnding(false);
            alert(
              "Could not reach the demo service. Retry, or close all demo tabs to let the session expire.",
            );
          }
        }}
      >
        {ending ? "Deleting…" : "End demo & delete data"}
      </button>
    </div>
  );
}
