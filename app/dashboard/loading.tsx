export default function DashboardLoading() {
    return (
        <div className="min-h-screen flex">
            <aside className="hidden md:flex w-72 p-5">
                <div className="w-full rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl shadow-soft p-5">
                    <div className="h-10 w-32 rounded-2xl bg-white/5 animate-pulse" />
                    <div className="mt-7 space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-10 rounded-2xl bg-white/5 animate-pulse" />
                        ))}
                    </div>
                </div>
            </aside>
            <div className="flex-1 p-4 md:p-10">
                <div className="max-w-6xl mx-auto">
                    <div className="h-8 w-48 rounded-xl bg-white/5 animate-pulse" />
                    <div className="mt-2 h-4 w-64 rounded-lg bg-white/5 animate-pulse" />
                    <div className="mt-8 grid md:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="rounded-3xl border border-white/10 bg-zinc-900/50 p-5 h-32 animate-pulse" />
                        ))}
                    </div>
                    <div className="mt-8 grid lg:grid-cols-2 gap-4">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="rounded-3xl border border-white/10 bg-zinc-900/50 p-6 h-64 animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
