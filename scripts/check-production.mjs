#!/usr/bin/env node
import fs from "node:fs";
import {resolve,relative,dirname,sep} from "node:path";
import {fileURLToPath} from "node:url";
import {checkPublicAvailability} from "../lib/availabilityProbe.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),".."),args=process.argv.slice(2),options={};
try {
  for(let index=0;index<args.length;index++) {
    const name=args[index];
    if(Object.hasOwn(options,name)||!["--base","--live","--output","--help"].includes(name))throw new Error("Unknown or repeated public check option.");
    if(["--base","--output"].includes(name)){if(!args[index+1]||args[index+1].startsWith("--"))throw new Error("Missing option value.");options[name]=args[++index];}else options[name]=true;
  }
  if(options["--help"]||!options["--base"]) {
    console.log("No requests sent. node scripts/check-production.mjs --base https://void-fill.vercel.app --live [--output ml/runtime/availability.json]");
    console.log("Six public checks, no credentials, at most one retry per failure. This does not test private inference or authenticated-user capacity.");process.exit(0);
  }
  let output;
  if(options["--output"]) {
    output=resolve(root,options["--output"]);
    const within=relative(resolve(root,"ml/runtime"),output);
    if(!within||within.startsWith(".."+sep)||within===".."||within.includes(":")||!output.endsWith(".json"))throw new Error("Public report must stay in ml/runtime/*.json.");
    let current=root;
    for(const piece of relative(root,dirname(output)).split(sep)) {
      current=resolve(current,piece);
      if(!fs.existsSync(current))fs.mkdirSync(current,{mode:0o700});
      if(fs.lstatSync(current).isSymbolicLink()||!fs.statSync(current).isDirectory())throw new Error("Report parents must be local directories.");
    }
    if(fs.existsSync(output))throw new Error("Refusing to overwrite a report.");
  }
  const report=await checkPublicAvailability({origin:options["--base"],live:!!options["--live"]});
  if(output)fs.writeFileSync(output,JSON.stringify(report,null,2)+"\n",{flag:"wx",mode:0o600});
  console.log(JSON.stringify(report,null,2));
  for(const check of report.checks)if(!check.ok)console.error(`::error title=Public availability failure::${check.check} did not satisfy its public contract after retry.`);else if(check.slow)console.warn(`::warning title=Slow public endpoint::${check.check} took more than eight seconds; inspect platform cold starts and network conditions.`);
  if(!report.success)process.exitCode=1;
} catch {console.error("Public availability check could not complete. No credentials, response bodies or redirect values were printed.");process.exitCode=1;}
