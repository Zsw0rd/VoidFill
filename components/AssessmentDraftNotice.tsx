"use client";

export function AssessmentDraftNotice({ message, storageAvailable = true, retry = false, expired = false, onRetry, onDiscard }: {
  message?: string; storageAvailable?: boolean; retry?: boolean; expired?: boolean; onRetry?: () => void; onDiscard?: () => void;
}) {
  return <div className="my-4 rounded-xl border border-forest/15 bg-paper-soft px-4 py-3 text-xs leading-6 text-muted">
    <p>Your answers stay in this tab until you finish, discard, sign out or this check expires. Refresh to resume within two hours of starting. Sign out on shared devices.</p>
    {!storageAvailable && <p role="status" className="mt-2 font-semibold text-rust">This browser can’t save a recovery draft. Keep this page open until you finish.</p>}
    {message && <p role="status" className="mt-2 font-semibold text-ink">{message}</p>}
    {retry && <div className="mt-2 flex flex-wrap gap-4"><button className="font-semibold underline text-forest" onClick={onRetry}>Retry restoring</button><button className="font-semibold underline text-rust" onClick={onDiscard}>Discard saved draft</button></div>}
    {expired && <button className="mt-2 font-semibold underline text-rust" onClick={onDiscard}>Discard expired assessment</button>}
  </div>;
}
