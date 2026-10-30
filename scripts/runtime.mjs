import { spawn } from "node:child_process";
import { existsSync, appendFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

export const root = dirname(dirname(fileURLToPath(import.meta.url)));
export const python = join(root, ".venv-ml", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");

export function configure({ createToken = false } = {}) {
  nextEnv.loadEnvConfig(root, !process.argv.includes("--production"));
  if (!process.env.ML_SERVICE_TOKEN && createToken) {
    const token = randomBytes(32).toString("hex");
    appendFileSync(join(root, ".env.local"), `\n# Local learning service (server only)\nML_SERVICE_TOKEN=${token}\n`, { mode: 0o600 });
    process.env.ML_SERVICE_TOKEN = token;
    console.log("Created the local learning-service secret in .env.local.");
  }
  if (createToken && process.env.ML_SERVICE_TOKEN.length < 32) throw new Error("ML_SERVICE_TOKEN must have at least 32 characters.");
  if (!process.env.DEMO_ENTRY_KEY && createToken) {
    const demoKey = randomBytes(24).toString("hex");
    appendFileSync(join(root, ".env.local"), `\n# Private demo URL (server only)\nDEMO_ENTRY_KEY=${demoKey}\n`, { mode: 0o600 });
    process.env.DEMO_ENTRY_KEY = demoKey;
    console.log("Created the private demo entry key in .env.local.");
  }
  process.env.PYTHONUTF8 = "1";
  process.env.PYTHONIOENCODING = "utf-8";
  process.env.TOKENIZERS_PARALLELISM = "false";
}

export function requirePython() {
  if (!existsSync(python)) throw new Error("The ML environment is missing. Run npm run ml:setup first.");
}

export function launch(command, args, options = {}) {
  return spawn(command, args, { cwd: root, stdio: "inherit", windowsHide: true, env: process.env, ...options });
}

export function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = launch(command, args);
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)));
  });
}

export function serviceArgs() {
  const url = new URL(process.env.ML_SERVICE_URL || "http://127.0.0.1:8010");
  if (url.protocol !== "http:") throw new Error("The local launcher expects an http ML_SERVICE_URL.");
  if (!["127.0.0.1", "localhost"].includes(url.hostname)) throw new Error("The local launcher expects a loopback ML_SERVICE_URL.");
  return ["-m", "uvicorn", "ml.service:app", "--host", "127.0.0.1", "--port", url.port || "80"];
}
