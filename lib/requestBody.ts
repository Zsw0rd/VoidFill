export class RequestBodyError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

/** Enforce a byte limit while streaming, including requests without Content-Length. */
export async function readBoundedText(request: Request, limit: number): Promise<string> {
  if (!Number.isInteger(limit) || limit < 1) throw new Error("Invalid request limit");
  if (Number(request.headers.get("content-length") || 0) > limit) throw new RequestBodyError("Keep your evidence within the workspace limits.",413);
  const reader=request.body?.getReader();
  if (!reader) return "";
  const chunks:Uint8Array[]=[];
  let size=0;
  while(true) {
    const {done,value}=await reader.read();
    if(done) break;
    size+=value.byteLength;
    if(size>limit) {await reader.cancel().catch(()=>{}); throw new RequestBodyError("Keep your evidence within the workspace limits.",413);}
    chunks.push(value);
  }
  const bytes=new Uint8Array(size);
  let offset=0;
  for(const chunk of chunks) {bytes.set(chunk,offset); offset+=chunk.byteLength;}
  try {return new TextDecoder("utf-8",{fatal:true}).decode(bytes);}
  catch {throw new RequestBodyError("Use valid UTF-8 text in your request.",400);}
}
