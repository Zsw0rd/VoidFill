import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import fs from "node:fs";
import test from "node:test";
import {careerCatalogue,matchCareers} from "../lib/careerCatalog";

type Split="diagnostic"|"sentinel";
type Fixture={roles:[Split,string,string][];unsupported:[Split,string][];ambiguous:[Split,string][];custom:[Split,string,string[]][]};
const bytes=fs.readFileSync("tests/fixtures/career-matching-adversarial-v1.json","utf8").replaceAll("\r\n","\n");
const fixture=JSON.parse(bytes) as Fixture;

test("the adversarial narrative labels remain frozen and cover every career",()=>{
  assert.equal(createHash("sha256").update(bytes).digest("hex"),"cfa28c1978419a57ded74358e6fbaead7ddb387686b2aa617e32e53f153fa6f5","Version new probes instead of editing observed evaluation queries or labels");
  assert.equal(fixture.roles.length+fixture.unsupported.length+fixture.ambiguous.length+fixture.custom.length,88);
  assert.deepEqual([...new Set(fixture.roles.map(row=>row[2]))].sort(),careerCatalogue.roles.map(role=>role.name).sort());
  assert.equal(fixture.roles.filter(row=>row[0]==="sentinel").length,30);
});

test("all88 observed adversarial cases retain their recorded regression baseline",()=>{
  // After its first execution this set is regression evidence, not an untouched
  // holdout. Floors record actual observed results and keep the known misses
  // visible; they do not assert that the authored labels are expert validated.
  const roles=fixture.roles.map(([split,query,expected])=>{
    const names=matchCareers(query).map(row=>row.role.name);
    return {split,query,expected,rank:names.indexOf(expected)+1};
  });
  assert.ok(roles.filter(row=>row.rank===1).length>=54,JSON.stringify(roles.filter(row=>row.rank!==1)));
  assert.ok(roles.filter(row=>row.rank>0&&row.rank<=3).length>=59,JSON.stringify(roles.filter(row=>row.rank===0||row.rank>3)));
  const sentinel=roles.filter(row=>row.split==="sentinel");
  assert.ok(sentinel.filter(row=>row.rank===1).length>=28);
  assert.equal(sentinel.filter(row=>row.rank>0&&row.rank<=3).length,30);
  for (const [,query] of [...fixture.unsupported,...fixture.ambiguous]) assert.equal(matchCareers(query).length,0,query);
  const custom=fixture.custom.map(([split,query,expected])=>({split,hit:matchCareers(query).slice(0,3).some(row=>expected.includes(row.role.name))}));
  assert.ok(custom.filter(row=>row.hit).length>=7);
  assert.equal(custom.filter(row=>row.split==="sentinel"&&row.hit).length,4);
});
