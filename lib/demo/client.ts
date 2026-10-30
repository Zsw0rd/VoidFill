// Small query adapter for the existing learner screens. Its transport never
// talks to Supabase; the service enforces a separate in-memory database.
export type DemoTransport = (operation: string, body?: unknown) => Promise<any>;

export function createDemoClient(transport: DemoTransport, token?: string) {
  class Query implements PromiseLike<any> {
    state: any;
    constructor(table: string) { this.state = { table, operation: "select", filters: [], orders: [] }; }
    select(selection = "*", options: any = {}) { Object.assign(this.state, { selection, ...options }); return this; }
    eq(column: string, value: unknown) { this.state.filters.push({ column, op: "eq", value }); return this; }
    in(column: string, value: unknown[]) { this.state.filters.push({ column, op: "in", value }); return this; }
    is(column: string, value: unknown) { this.state.filters.push({ column, op: "is", value }); return this; }
    not(column: string, op: string, value: unknown) { this.state.filters.push({ column, op: `not.${op}`, value }); return this; }
    order(column: string, options: any = {}) { this.state.orders.push({ column, ascending: true, ...options }); return this; }
    limit(limit: number) { this.state.limit = limit; return this; }
    single() { this.state.single = "required"; return this; }
    maybeSingle() { this.state.single = "optional"; return this; }
    insert(values: unknown) { Object.assign(this.state, { operation: "insert", values }); return this; }
    upsert(values: unknown, options: any = {}) { Object.assign(this.state, { operation: "upsert", values, ...options }); return this; }
    update(values: unknown) { Object.assign(this.state, { operation: "update", values }); return this; }
    delete() { this.state.operation = "delete"; return this; }
    then<TResult1 = any, TResult2 = never>(onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): PromiseLike<TResult1 | TResult2> {
      return transport("query", this.state).catch((e) => ({ data: null, error: { message: e.message } })).then(onfulfilled, onrejected);
    }
  }
  return {
    __demoToken: token,
    from: (table: string) => new Query(table),
    auth: {
      getUser: () => transport("user").catch((e) => ({ data: { user: null }, error: { message: e.message } })),
      signOut: () => transport("end").then(() => ({ error: null })),
    },
    // Guest sessions never have a live human mentor subscription.
    channel: () => { const channel: any = { on: () => channel, subscribe: () => channel }; return channel; },
    removeChannel: async () => "ok",
  };
}

export function demoBrowserClient() {
  return createDemoClient(async (operation, body = {}) => {
    const response = await fetch(`/api/demo/${operation === "query" ? "db" : operation}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Demo session unavailable");
    return data;
  });
}
