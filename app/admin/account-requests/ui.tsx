"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DELETION_STATUSES } from "@/lib/account";
import type { AccountRequest } from "@/app/account/ui";

type InboxRequest = AccountRequest & { user_id: string; account_email: string };

export function AccountRequestInbox({ initial, actorId, openOnly }: { initial: InboxRequest[]; actorId: string; openOnly: boolean }) {
  const [rows, setRows] = useState(initial);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const working = useRef(false);
  async function update(row: InboxRequest, action: "start" | "close") {
    if (working.current) return;
    working.current = true; setBusy(row.id); setError(""); setNotice("");
    try {
      const response = await fetch("/api/account/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, requestId: row.id, ...(action === "close" ? { resolution: responses[row.id] || "" } : {}) }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "The request could not be updated.");
      setRows(current => current.map(item => item.id === row.id ? { ...item, ...body.request } : item));
      setNotice(action === "start" ? "The request is marked as being reviewed." : "The review response is saved and visible in the account’s privacy page. No account was deleted.");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Please check your connection and refresh."); }
    finally { working.current = false; setBusy(""); }
  }
  const visible = rows.filter(row => !openOnly || ["pending", "in_review"].includes(row.status));
  return <div className="mt-7 space-y-5"><p className="text-xs text-muted">Up to 100 requests per page. No request emails are sent automatically.</p>{!visible.length && <p className="panel p-7 text-sm text-muted">No requests match this view.</p>}{visible.map(row => <section className="panel p-6 sm:p-8" key={row.id} aria-labelledby={`request-${row.id}`}><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 id={`request-${row.id}`} className="break-all text-lg">{row.account_email}</h2><p className="mt-2 text-xs leading-6 text-muted">{DELETION_STATUSES[row.status]} · {new Date(row.requested_at).toLocaleString()}<br />Reference: {row.id}</p></div>{row.staff_account && <span className="rounded-full border border-rust/20 bg-rust/5 px-3 py-1 text-xs text-rust">Staff responsibility transfer required</span>}</div>{row.resolution && <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{row.resolution}</p>}{["pending", "in_review"].includes(row.status) && (row.user_id === actorId ? <p className="mt-5 text-sm leading-7 text-rust">Another administrator must review your own account request. No automatic deletion or role transfer is available.</p> : <div className="mt-5 space-y-4">{row.status === "pending" && <Button variant="soft" disabled={!!busy} loading={busy === row.id} onClick={() => update(row, "start")}>Start review</Button>}<div className="space-y-2"><Label htmlFor={`resolution-${row.id}`}>Response shared with this account</Label><textarea id={`resolution-${row.id}`} rows={4} minLength={20} maxLength={2000} className="w-full rounded-xl border border-line bg-paper p-4 text-sm leading-7" value={responses[row.id] || ""} onChange={event => setResponses(current => ({ ...current, [row.id]: event.target.value }))} aria-describedby={`resolution-help-${row.id}`} /><p id={`resolution-help-${row.id}`} className="text-xs leading-6 text-muted">Explain the outcome or required next step in at least 20 characters. Do not claim deletion occurred unless it was separately completed and verified.</p></div><Button variant="soft" disabled={!!busy || (responses[row.id] || "").trim().length < 20} onClick={() => update(row, "close")}>Save response & close review</Button></div>)}</section>)}{error && <p role="alert" className="rounded-xl border border-rust/20 p-4 text-sm text-rust">{error}</p>}{notice && <p role="status" className="rounded-xl border border-forest/20 p-4 text-sm leading-7 text-forest">{notice}</p>}</div>;
}
