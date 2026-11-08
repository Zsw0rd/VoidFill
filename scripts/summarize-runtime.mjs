#!/usr/bin/env node
// Pipe NDJSON private runtime logs; raw messages are never echoed or saved.
import readline from "node:readline";
import {privateRuntimeEvent,summarizeRuntimeEvents} from "../lib/runtimeSummary.mjs";
const args=process.argv.slice(2);
let memoryMiB=null,failOnAlert=false;
try {
  for(let index=0;index<args.length;index++) {
    if(args[index]==="--memory-mib"&&memoryMiB===null){memoryMiB=Number(args[++index]);if(!Number.isInteger(memoryMiB))throw new Error();}
    else if(args[index]==="--fail-on-alert"&&!failOnAlert)failOnAlert=true;
    else if(args[index]==="--help"){console.log("No platform requests. Pipe NDJSON private runtime events or Vercel JSON records with a JSON message field: ... | node scripts/summarize-runtime.mjs [--memory-mib <verified limit>] [--fail-on-alert]. Raw logs/identities/bodies are not emitted. This is an on-demand diagnostic, not a realtime alert subscription.");process.exit(0);}
    else throw new Error();
  }
  const events=[];let total=0,lines=0;
  for await(const line of readline.createInterface({input:process.stdin,crlfDelay:Infinity})) {
    total+=Buffer.byteLength(line);lines++;
    if(total>33554432||lines>100000)throw new Error();
    const event=privateRuntimeEvent(line);if(event)events.push(event);
  }
  const report=summarizeRuntimeEvents(events,{memoryMiB});
  console.log(JSON.stringify(report,null,2));
  if(!events.length||failOnAlert&&report.alert_count)process.exitCode=1;
} catch {console.error("Runtime summary rejected the input/options or exceeded its diagnostic budget. No raw log content was printed.");process.exitCode=1;}
