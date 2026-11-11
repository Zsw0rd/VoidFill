/** Fixed fictional-document acceptance. No original files or profile Apply path. */
import { performance } from "node:perf_hooks";
import { isDeepStrictEqual } from "node:util";
import { randomUUID } from "node:crypto";
import { syntheticResumePdf } from "./performanceFixtures.mjs";

export const DOCUMENT_CASES = Object.freeze([
  ["text-single", 200], ["text-page-limit", 200], ["text-upload-limit", 200], ["scan-single", 200],
  ["docx-structured", 200], ["docx-upload-limit", 200], ["docx-dense-within-limit", 200], ["text-dense-within-limit", 200],
  ["reject-page-limit", 422, "12 pages"], ["reject-upload-limit", 400, "PDF or DOCX up to 4 MB"],
  ["reject-text-limit", 422, "60,000"], ["reject-docx-text-limit", 422, "60,000"], ["reject-expanded-docx", 413, "30 MB"], ["reject-invalid-pdf", 415, "valid PDF and DOCX"],
].map(([id, status, error]) => Object.freeze({ id, status, error: error || null })));

export function documentProbePlan({ origin = "http://localhost:3000", live = false } = {}) {
  let url;
  try { url = new URL(origin); } catch { throw new Error("Use a valid document-probe origin."); }
  const local = url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const owned = url.protocol === "https:" && (url.hostname === "void-fill.vercel.app" || /^void-fill-[a-z0-9-]+-zsw0rds-projects\.vercel\.app$/.test(url.hostname));
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/" || (!local && !(live && owned))) throw new Error("Use loopback or the explicitly selected owned hosted application.");
  const cases = DOCUMENT_CASES.filter(row => local || row.status === 200).map(row => row.id);
  return Object.freeze({ origin: url.origin, local, clients: 2, cases: Object.freeze(cases), requests: cases.length + 2,
    timeout_ms: 90000, deadline_ms: 180000, max_upload_bytes: 4 * 1024 * 1024 + 1 });
}

async function jsonBody(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Invalid response.");
  let bytes = 0;
  const chunks = [];
  try {
    while (true) { const {done, value} = await reader.read(); if (done) break; bytes += value.length; if (bytes > 524288) { await reader.cancel(); throw new Error("Response too large."); } chunks.push(value); }
    return {data: JSON.parse(new TextDecoder("utf8", {fatal:true}).decode(Buffer.concat(chunks))), bytes};
  } finally { reader.releaseLock(); }
}

export async function runDocumentProbe({ origin, live, clients, fixtures, renew, snapshot,
  fetchImpl = fetch, now = () => performance.now(), budgetMs = 180000 }) {
  const plan = documentProbePlan({origin, live});
  if (!Number.isFinite(budgetMs) || budgetMs <= 0 || budgetMs > plan.deadline_ms) throw new Error("The document budget may only shorten the three-minute maximum.");
  if (!Array.isArray(clients) || clients.length !== 2 || clients.some(client => typeof client.cookie !== "string" ||
      !/(?:^|;)\s*vf_demo_session=/.test(client.cookie) || /(?:^|;)\s*sb-[a-z0-9-]+-auth-token/.test(client.cookie))) throw new Error("Use only two disposable demo sessions for this document matrix.");
  const byId = new Map(fixtures.map(row => [row.id, row]));
  for (const id of plan.cases) {
    const fixture = byId.get(id), spec = DOCUMENT_CASES.find(row => row.id === id);
    if (!fixture || !Buffer.isBuffer(fixture.data) || fixture.data.length !== fixture.bytes || fixture.data.length > plan.max_upload_bytes ||
        fixture.app_status !== spec.status || !/^[a-z0-9-]+\.(pdf|docx)$/.test(fixture.filename)) throw new Error("Use only the generated fixed document matrix.");
  }
  if (typeof snapshot !== "function" || typeof renew !== "function") throw new Error("Document acceptance requires lease and unchanged-workspace checks.");
  const started = now(), measurements = [];
  let stopped = null, inFlight = 0, peak = 0;
  const before = await Promise.all(clients.map(snapshot));
  async function parse(client, fixture, index, marker = null, forbiddenMarkers = []) {
    if (stopped) return;
    const remaining = budgetMs - (now() - started);
    if (remaining <= 0) { stopped = "probe_deadline"; return; }
    const spec = DOCUMENT_CASES.find(row => row.id === fixture.id) || {status:200};
    const row = {case: marker ? "paired-text-single" : fixture.id, client:index + 1, expected_status:spec.status,
      status:0, ok:false, duration_ms:0, upload_bytes:fixture.data.length, response_bytes:0, pages:null, page_count_known:null, methods:[], text_characters:null, failure:null};
    const begin = now(); inFlight++; peak = Math.max(peak, inFlight);
    try {
      const body = new FormData();
      body.append("file", new Blob([fixture.data], {type:fixture.filename.endsWith(".pdf") ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}), fixture.filename);
      const response = await fetchImpl(plan.origin + "/api/resume", {method:"POST", headers:{Cookie:client.cookie, Origin:plan.origin}, body,
        redirect:"manual", signal:AbortSignal.timeout(Math.max(1, Math.ceil(Math.min(plan.timeout_ms, remaining))))});
      row.status = response.status;
      const cookies = response.headers.getSetCookie?.() || [];
      if (cookies.length && typeof client.updateCookies === "function") client.updateCookies(cookies);
      if (response.status === spec.status) {
        const parsed = await jsonBody(response); row.response_bytes = parsed.bytes;
        if (spec.status === 200) {
          const data = parsed.data;
          row.ok = data?.pages === fixture.pages && data?.page_count_known === (fixture.pages !== null) && Array.isArray(data.methods) && isDeepStrictEqual([...data.methods].sort(), [...fixture.methods].sort()) &&
            typeof data.text === "string" && fixture.required_text.every(text => data.text.toLowerCase().includes(text.toLowerCase())) &&
            Array.isArray(data.skills) && ["Python", "SQL"].every(name => data.skills.some(skill => skill.name === name)) &&
            Array.isArray(data.matched_app_skills) && data.matched_app_skills.every(skill => skill.assessed === false) &&
            (!marker || data.text.includes(marker)) && !forbiddenMarkers.some(other => data.text.includes(other));
          if (row.ok) { row.pages = data.pages; row.page_count_known = data.page_count_known; row.methods = fixture.methods; row.text_characters = data.text.length; }
        } else row.ok = typeof parsed.data?.error === "string" && parsed.data.error.includes(spec.error);
        if (!row.ok) row.failure = "unexpected_payload";
      } else {
        await response.body?.cancel();
        row.failure = response.status === 429 ? "rate_limit" : [401,403].includes(response.status) ? "authentication" : response.status >= 500 ? "server_error" : "unexpected_status";
      }
    } catch { row.failure = "transport_or_response_error"; }
    finally { inFlight--; row.duration_ms = Math.round((now() - begin) * 10) / 10; measurements.push(row); }
    if (now() - started >= budgetMs) stopped = "probe_deadline";
    else if (!row.ok) stopped = row.failure;
  }
  for (const id of plan.cases) {
    if (stopped) break;
    try { await Promise.all(clients.map(renew)); } catch { stopped = "session_renewal_failed"; break; }
    await parse(clients[0], byId.get(id), 0);
  }
  if (!stopped) {
    try { await Promise.all(clients.map(renew)); } catch { stopped = "session_renewal_failed"; }
    const markers = clients.map((_,index) => `matrix-${randomUUID()}-${index}`);
    if (!stopped) await Promise.all(clients.map((client,index) => {
      const marker = markers[index];
      return parse(client, {id:"text-single", filename:"paired-fictional.pdf", data:syntheticResumePdf(marker), pages:1,
        methods:["pdf-text"], required_text:["Python", "SQL"]}, index, marker, markers.filter(other => other !== marker));
    }));
  }
  let unchanged = false;
  try { unchanged = isDeepStrictEqual(before, await Promise.all(clients.map(snapshot))); }
  catch { stopped ||= "snapshot_failed"; }
  if (!unchanged) stopped ||= "workspace_changed";
  if (now() - started >= budgetMs) stopped ||= "probe_deadline";
  return {version:1, measured_at:new Date().toISOString(), origin:plan.origin, mode:"demo", workload:"document-matrix",
    scope:"Fixed fictional documents through real app parsing and private encoder inference; no Apply/profile/grade operation. Inert padding tests upload size only. One clear synthetic raster does not establish arbitrary scan quality or OCR capacity.",
    configured_requests:plan.requests, completed_requests:measurements.length, peak_in_flight:peak, deadline_ms:budgetMs, duration_ms:Math.round((now() - started) * 10) / 10,
    success:!stopped && measurements.length === plan.requests, stopped_reason:stopped, profiles_scores_xp_unchanged:unchanged, measurements};
}
