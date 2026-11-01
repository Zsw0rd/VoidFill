// Vercel bindings can include a path. Preserve it when resolving service routes.
export function mlServiceUrl(path: string) {
  const base = process.env.ML_SERVICE_URL || "http://127.0.0.1:8010";
  if (process.env.VERCEL && !process.env.ML_SERVICE_URL)
    throw new Error("The private learning service binding is missing.");
  return new URL(path.replace(/^\/+/, ""), base.replace(/\/+$/, "") + "/");
}
