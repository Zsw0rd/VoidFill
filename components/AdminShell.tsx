import Link from "next/link";
import { Sparkles, LayoutDashboard, Users, UserCheck, Flag, Settings, LogOut, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export async function AdminShell({ children, role }: { children: React.ReactNode; role?: string }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const isSuperAdmin = role === "super_admin";

    return (
        <div className="min-h-screen flex">
            <aside className="hidden md:flex w-72 p-5">
                <div className="w-full rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl shadow-soft p-5 flex flex-col">
                    <Link href="/admin/dashboard" className="flex items-center gap-2">
                        <span className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-indigo-300" />
                        </span>
                        <div>
                            <div className="font-semibold leading-none">SkillGap AI</div>
                            <div className="text-xs text-indigo-400">{role === "mentor" ? "mentor" : "admin"}</div>
                        </div>
                    </Link>

                    <nav className="mt-7 space-y-2">
                        {role === "mentor" ? (
                            <>
                                <AdminNavItem href="/admin/mentor" icon={<Users className="w-4 h-4" />}>My Students</AdminNavItem>
                                <AdminNavItem href="/admin/mentor/chat" icon={<MessageCircle className="w-4 h-4" />}>Student Chats</AdminNavItem>
                            </>
                        ) : (
                            <>
                                <AdminNavItem href="/admin/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>Dashboard</AdminNavItem>
                                <AdminNavItem href="/admin/users" icon={<Users className="w-4 h-4" />}>Users</AdminNavItem>
                                <AdminNavItem href="/admin/mentors" icon={<UserCheck className="w-4 h-4" />}>Mentors</AdminNavItem>
                                <AdminNavItem href="/admin/flagged" icon={<Flag className="w-4 h-4" />}>Flagged Chats</AdminNavItem>
                            </>
                        )}
                    </nav>

                    <div className="mt-auto pt-5 border-t border-white/10">
                        <div className="text-xs text-zinc-400 truncate">Signed in as</div>
                        <div className="text-xs text-zinc-200 truncate">{user?.email}</div>
                        <Link href="/auth/logout" className="mt-3 flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition">
                            <LogOut className="w-3 h-3" />
                            Sign out
                        </Link>
                    </div>
                </div>
            </aside>

            <div className="flex-1">
                <header className="md:hidden p-4 flex items-center justify-between">
                    <Link href="/admin/dashboard" className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-300" />
                        <span className="font-semibold">Admin</span>
                    </Link>
                    <Link href="/auth/logout" className="text-sm text-zinc-300">Logout</Link>
                </header>

                <main className="p-4 md:p-10">
                    {children}
                </main>
            </div>
        </div>
    );
}

function AdminNavItem({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition"
        >
            {icon}
            {children}
        </Link>
    );
}
