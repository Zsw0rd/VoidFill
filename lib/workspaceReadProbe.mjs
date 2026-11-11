/** Fixed, paced real-account reads. Never generates a quiz or serializes a body/session. */
import { performance } from "node:perf_hooks";
import { latencySummary } from "./loadProbe.mjs";

export function workspaceReadPlan({ origin = "https://void-fill.vercel.app", ...unknown } = {}) {
  if (Object.keys(unknown).length) throw new Error("The read-only workload has fixed safety limits.");
  let url;
  try { url = new URL(origin); } catch { throw new Error("Use a valid read-probe origin."); }
  const local = url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/" || (!local && url.origin !== "https://void-fill.vercel.app")) throw new Error("Use the configured application or an owned loopback origin.");
  return Object.freeze({ origin: url.origin, local, mode: "real", workload: "workspace-read", clients: 2,
    stages: Object.freeze([1, 2]), reads_per_client_per_stage: 12, requests: 36,
    pause_ms: 1000, timeout_ms: 15000, deadline_ms: 60000 });
}

async function readWorkspace(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Invalid workspace response.");
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > 524288) { await reader.cancel(); throw new Error("Workspace response exceeded the read budget."); }
      chunks.push(value);
    }
    const data = JSON.parse(new TextDecoder("utf8", { fatal: true }).decode(Buffer.concat(chunks)));
    return { bytes, valid: data?.available === true && data?.demo === false && ["projects", "submissions", "reviews"].every(key => Array.isArray(data[key])) };
  } finally { reader.releaseLock(); }
}

export async function runWorkspaceReadProbe({ origin, clients, verifyIdentity, fetchImpl = fetch,
  now = () => performance.now(), pause = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
  const plan = workspaceReadPlan({ origin });
  if (!Array.isArray(clients) || clients.length !== 2 || clients.some(client => typeof client.cookie !== "string" ||
      client.cookie.length < 16 || /[\r\n\0]/.test(client.cookie) || /(?:^|;)\s*vf_demo_(?:session|active)\s*=/i.test(client.cookie) ||
      !/(?:^|;)\s*sb-[a-z0-9-]+-auth-token(?:\.\d+)?=/.test(client.cookie))) throw new Error("Two controlled Supabase sessions are required.");
  if (clients[0].cookie === clients[1].cookie || typeof verifyIdentity !== "function") throw new Error("Two independently verified accounts are required.");
  const identities = [];
  for (const client of clients) {
    let identity;
    try { identity = await verifyIdentity(client); } catch { throw new Error("Read-probe identity verification failed before the workload."); }
    if (typeof identity !== "string" || !identity || identities.includes(identity)) throw new Error("Two independently verified accounts are required.");
    identities.push(identity);
  }
  // Authentication verification is setup, outside the observed workload interval.
  const started = now(), measurements = [], stages = [];
  let inFlight = 0, peak = 0, stopped = null;
  for (const count of plan.stages) {
    if (stopped) break;
    const stageStart = now(), first = measurements.length;
    await Promise.all(clients.slice(0, count).map(async (client, index) => {
      for (let round = 0; round < plan.reads_per_client_per_stage; round++) {
        if (stopped) return;
        if (round) await pause(plan.pause_ms);
        if (stopped) return;
        const remaining = plan.deadline_ms - (now() - started);
        if (remaining <= 0) { stopped = "probe_deadline"; return; }
        const begin = now();
        inFlight++; peak = Math.max(peak, inFlight);
        const row = { stage_clients: count, client: index + 1, round: round + 1,
          operation: "practical_read", status: 0, ok: false, duration_ms: 0, bytes: 0, app_ms: null, failure: null };
        try {
          const response = await fetchImpl(plan.origin + "/api/practical", { method: "GET", headers: { Cookie: client.cookie, Origin: plan.origin },
            redirect: "manual", signal: AbortSignal.timeout(Math.max(1, Math.ceil(Math.min(plan.timeout_ms, remaining)))) });
          row.status = response.status;
          const cookies = response.headers.getSetCookie?.() || [];
          if (cookies.length && typeof client.updateCookies === "function") client.updateCookies(cookies);
          const timing = response.headers.get("Server-Timing")?.match(/(?:^|,)\s*app;dur=(\d+(?:\.\d+)?)(?:\s|,|$)/);
          if (timing) row.app_ms = Number(timing[1]);
          if (response.status === 200) {
            const parsed = await readWorkspace(response);
            row.bytes = parsed.bytes; row.ok = parsed.valid;
            if (!row.ok) row.failure = "unexpected_payload";
          } else {
            await response.body?.cancel();
            row.failure = response.status === 429 ? "rate_limit" : [401, 403].includes(response.status) ? "authentication" : response.status >= 500 ? "server_error" : "unexpected_status";
          }
        } catch { row.failure = "transport_or_response_error"; }
        finally { inFlight--; row.duration_ms = Math.round((now() - begin) * 10) / 10; measurements.push(row); }
        if (now() - started >= plan.deadline_ms) { stopped = "probe_deadline"; return; }
        if (!row.ok) { stopped = row.failure; return; }
      }
    }));
    const rows = measurements.slice(first), duration = Math.round((now() - stageStart) * 10) / 10;
    stages.push({ clients: count, duration_ms: duration, ...latencySummary(rows) });
  }
  return { version: 1, measured_at: new Date().toISOString(), origin: plan.origin, mode: "real", workload: plan.workload,
    scope: "Two separately verified authorized accounts; thirty-six paced private practical-workspace GETs only. No generation, grading, profile changes, account export or chat reads. This is workspace-read evidence, not learning-generation, inference or maximum-user capacity.",
    setup: "SDK identity verification occurs before the workload interval. Caller must close its helper-created sessions in finally and record cleanup.",
    percentile_method: "Nearest-rank observed samples; small ordered live samples do not establish an SLA or maximum capacity.",
    configured_requests: plan.requests, completed_requests: measurements.length, peak_in_flight: peak,
    pause_ms: plan.pause_ms, deadline_ms: plan.deadline_ms, duration_ms: Math.round((now() - started) * 10) / 10,
    success: !stopped && measurements.length === plan.requests, stopped_reason: stopped, stages, measurements };
}
