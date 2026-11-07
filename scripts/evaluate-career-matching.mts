import fs from "node:fs";
import { matchCareers } from "../lib/careerCatalog";
const fixture = JSON.parse(fs.readFileSync("tests/fixtures/career-matching-golden.json", "utf8"));
const roles = fixture.roles.map(([query, expected]: [string,string]) => {
  const names = matchCareers(query).map(row => row.role.name);
  return {query,expected,top_3:names.slice(0,3),rank:names.indexOf(expected)+1};
});
const rejected = [...fixture.unsupported, ...fixture.ambiguous].map((query:string) => ({query,abstained:matchCareers(query).length===0}));
const custom = fixture.custom.map(([query,expected]: [string,string[]]) => {
  const names=matchCareers(query).slice(0,3).map(row=>row.role.name);
  return {query,expected,top_3:names,hit:expected.some(name=>names.includes(name))};
});
const report = {scope:fixture.scope,role_count:roles.length,role_recall_at_1:roles.filter((r:any)=>r.rank===1).length/roles.length,role_recall_at_3:roles.filter((r:any)=>r.rank>0&&r.rank<=3).length/roles.length,unsupported_and_ambiguous_abstentions:rejected.filter((r:any)=>r.abstained).length,abstention_count:rejected.length,custom_goal_top_3:custom.filter((r:any)=>r.hit).length,custom_goal_count:custom.length,roles,rejected,custom};
fs.writeFileSync("ml/evaluation-career-matching.json",JSON.stringify(report,null,2)+"\n");
console.log({...report,roles:undefined,rejected:undefined,custom:undefined});
console.log("Misses", roles.filter((r:any)=>r.rank!==1));
