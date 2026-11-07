import { defineConfig } from "@playwright/test";
import { configure } from "./scripts/runtime.mjs";

configure({createToken:true});
const baseURL=process.env.TEST_BASE_URL || "http://localhost:3000";
const origin=new URL(baseURL);
if (!["localhost","127.0.0.1","[::1]"].includes(origin.hostname) || origin.username || origin.password) throw new Error("UX tests run only against an isolated loopback app, never a real account or hosted database.");

export default defineConfig({
  testDir:"./tests/ux", timeout:60000, expect:{timeout:15000}, workers:1,
  retries:process.env.CI ? 1 : 0, reporter:"list",
  use:{baseURL,browserName:"chromium",headless:true,viewport:{width:1440,height:1000},trace:"retain-on-failure",screenshot:"only-on-failure"},
  webServer:{command:"npm run dev",url:baseURL,reuseExistingServer:true,timeout:150000,env:{ML_BACKEND:"onnx"}},
});
