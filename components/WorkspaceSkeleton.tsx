import { Brand } from "./Brand";
export function WorkspaceSkeleton() {
  return (
    <div
      className="workspace"
      role="status"
      aria-label="Loading your workspace"
    >
      <span className="sr-only">Loading your workspace…</span>
      <aside className="workspace-sidebar" aria-hidden="true">
        <Brand />
        <div className="mt-12 space-y-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-9 bg-line/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </aside>
      <div className="workspace-body">
        <div className="workspace-header" aria-hidden="true">
          <div className="h-3 w-40 bg-line rounded animate-pulse" />
        </div>
        <div className="workspace-main space-y-7" aria-hidden="true">
          <div className="space-y-4">
            <div className="h-2 w-40 bg-line rounded animate-pulse" />
            <div className="h-10 w-3/4 max-w-lg bg-line/60 rounded-lg animate-pulse" />
            <div className="h-3 w-2/3 bg-line/40 rounded animate-pulse" />
          </div>
          <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">
            <div className="h-64 panel !bg-[#e8eddc] animate-pulse" />
            <div className="h-64 panel animate-pulse" />
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="h-72 panel animate-pulse" />
            <div className="h-72 panel animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
