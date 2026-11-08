// Synthetic, frozen software probes. Never add learner text or personal data.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import { careerCatalogue, matchCareers } from "../lib/careerCatalog";

type Split = "diagnostic" | "sentinel";
type Fixture = { version: string; scope: string; roles: [Split,string,string][]; unsupported: [Split,string][]; ambiguous: [Split,string][]; custom: [Split,string,string[]][] };
const args=process.argv.slice(2);
let all=false;
let requestedOutput:string|undefined;
for(let index=0;index<args.length;index++) {
  if(args[index]==="--all"&&!all) all=true;
  else if(args[index]==="--output"&&requestedOutput===undefined&&args[index+1]) requestedOutput=args[++index];
  else throw new Error("Use --all and/or --output ml/<public-report>.json");
}
const output=requestedOutput || `ml/evaluation-career-adversarial-${all?"all":"diagnostic"}.json`;
if(!/^ml\/[a-z0-9-]+\.json$/.test(output)) throw new Error("Use a public report path ml/<name>.json");
const bytes=fs.readFileSync("tests/fixtures/career-matching-adversarial-v1.json","utf8").replaceAll("\r\n","\n");
const fixture=JSON.parse(bytes) as Fixture;
const freeze=JSON.parse(fs.readFileSync("ml/evaluation-career-adversarial-freeze.json","utf8"));
const fingerprint=createHash("sha256").update(bytes).digest("hex");
assert.equal(fingerprint,freeze.sha256_utf8_lf,"Frozen queries or labels changed; version a new fixture rather than silently editing evaluation evidence");
assert.equal(fixture.roles.length,60);
assert.deepEqual([...new Set(fixture.roles.map(row=>row[2]))].sort(),careerCatalogue.roles.map(row=>row.name).sort());
const selected=<T extends [Split,...unknown[]]>(rows:T[])=>rows.filter(row=>all || row[0]==="diagnostic");
const roles=selected(fixture.roles).map(([split,query,expected])=>{
  const names=matchCareers(query).map(row=>row.role.name);
  return {split,query,expected,top_3:names.slice(0,3),rank:names.indexOf(expected)+1};
});
const rejected=([...[...selected(fixture.unsupported)].map(row=>[...row,"unsupported"]),...[...selected(fixture.ambiguous)].map(row=>[...row,"ambiguous"])] as [Split,string,string][]).map(([split,query,kind])=>({split,query,kind,abstained:matchCareers(query).length===0,top_3:matchCareers(query).slice(0,3).map(row=>row.role.name)}));
const custom=selected(fixture.custom).map(([split,query,expected])=>{
  const names=matchCareers(query).slice(0,3).map(row=>row.role.name);
  return {split,query,expected,top_3:names,hit:expected.some(name=>names.includes(name))};
});
const metrics=(split:Split)=>{
  const rs=roles.filter(row=>row.split===split), bs=rejected.filter(row=>row.split===split), cs=custom.filter(row=>row.split===split);
  return {role_count:rs.length,role_recall_at_1:rs.length?rs.filter(row=>row.rank===1).length/rs.length:null,role_recall_at_3:rs.length?rs.filter(row=>row.rank>0&&row.rank<=3).length/rs.length:null,abstentions:bs.filter(row=>row.abstained).length,abstention_count:bs.length,custom_goal_top_3:cs.filter(row=>row.hit).length,custom_goal_count:cs.length};
};
const matcherFingerprint=createHash("sha256").update(fs.readFileSync("lib/careerCatalog.ts","utf8").replaceAll("\r\n","\n")).digest("hex");
const report={version:fixture.version,fixture_sha256:fingerprint,matcher_source_sha256:matcherFingerprint,evaluated_at:new Date().toISOString(),scope:fixture.scope,evaluation_kind:"Observed software regression; untouched sentinel status applies only to its first documented execution",split:all?"all":"diagnostic",metrics:{diagnostic:metrics("diagnostic"),...(all?{sentinel:metrics("sentinel")}: {})},roles,rejected,custom};
fs.writeFileSync(output,JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({report:output,fixture_sha256:fingerprint,metrics:report.metrics},null,2));
console.log("Role misses",roles.filter(row=>row.rank!==1));
console.log("Abstention misses",rejected.filter(row=>!row.abstained));
console.log("Custom misses",custom.filter(row=>!row.hit));
