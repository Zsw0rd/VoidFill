import test from "node:test";
import assert from "node:assert/strict";
import { readBoundedText, RequestBodyError } from "../lib/requestBody";

test("streamed requests without a length header are stopped at the byte limit",async()=>{
  let cancelled=false;
  const body=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(6));controller.enqueue(new Uint8Array(6));},cancel(){cancelled=true;}});
  const request=new Request("http://localhost/api/practical",{method:"POST",body,duplex:"half"} as RequestInit);
  await assert.rejects(readBoundedText(request,10),error=>error instanceof RequestBodyError && error.status===413);
  assert.equal(cancelled,true);
});

test("UTF-8 boundaries preserve legitimate evidence and reject malformed text",async()=>{
  assert.equal(await readBoundedText(new Request("http://localhost",{method:"POST",body:"café"}),5),"café");
  await assert.rejects(readBoundedText(new Request("http://localhost",{method:"POST",body:"café"}),4),error=>error instanceof RequestBodyError && error.status===413);
  await assert.rejects(readBoundedText(new Request("http://localhost",{method:"POST",body:new Uint8Array([0xc3])}),10),error=>error instanceof RequestBodyError && error.status===400);
});
