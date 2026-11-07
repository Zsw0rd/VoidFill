import { join } from "node:path";
import { configure, root, python, requirePython, launch, serviceArgs } from "./runtime.mjs";

configure({ createToken: true });
const children = [];
let closing = false;
function close(code = 0) {
  if (closing) return;
  closing = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}
process.on("SIGINT", () => close());
process.on("SIGTERM", () => close());

try {
  requirePython();
  const healthUrl = new URL("/health", process.env.ML_SERVICE_URL || "http://127.0.0.1:8010");
  async function ready() {
    try {
      const response = await fetch(healthUrl, { signal: AbortSignal.timeout(1000) });
      const state = await response.json();
      return response.ok && state.status === "ready" && state.features?.includes("guest-v1");
    } catch { return false; }
  }
  if (!await ready()) {
    const service = launch(python, serviceArgs());
    children.push(service);
    service.once("error", (error) => { console.error(error.message); close(1); });
    service.once("exit", (code) => { if (!closing) close(code || 1); });
    const deadline = Date.now() + 120000;
    while (!closing && !await ready()) {
      if (Date.now() > deadline) throw new Error("Local model did not become ready. Check the service output and run npm run ml:train if needed.");
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  if (!closing) {
    const production = process.argv.includes("--production");
    const web = launch(process.execPath, [join(root, "node_modules/next/dist/bin/next"), production ? "start" : "dev", ...process.argv.slice(2).filter((x) => x !== "--production")]);
    children.push(web);
    web.once("error", (error) => { console.error(error.message); close(1); });
    web.once("exit", (code) => close(code || 0));
  }
} catch (error) {
  console.error(error.message);
  close(1);
}
