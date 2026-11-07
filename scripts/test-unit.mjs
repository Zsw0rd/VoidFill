import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const directory=fileURLToPath(new URL("../tests/",import.meta.url));
const files=readdirSync(directory).filter(name=>name.endsWith(".test.ts") && name!=="local-integration.test.ts").sort().map(name=>fileURLToPath(new URL(`../tests/${name}`,import.meta.url)));
if(!files.length) throw new Error("No unit tests discovered");
const result=spawnSync(process.execPath,["--import","tsx","--test",...files],{stdio:"inherit",windowsHide:true});
if(result.error) throw result.error;
process.exitCode=result.status ?? 1;
