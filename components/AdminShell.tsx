import Link from "next/link";
import { LayoutDashboard, Users, UserCheck, Flag, LogOut, MessageCircle, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export async function AdminShell({ children, role }: { children: React.ReactNode; role?: string }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let displayName = user?.email || "Admin";
    const { data: adminRow } = await supabase.from("admin_users").select("display_name").eq("id", user?.id ?? "").maybeSingle();
    if (adminRow?.display_name) displayName = adminRow.display_name;

    const dashHref = role === "mentor" ? "/admin/mentor" : "/admin/dashboard";
    const roleLabel = role === "mentor" ? "mentor" : "admin";

    return (
        <div className="min-h-screen flex flex-col">
            {/* ═══ Top Header Bar ═══ */}
            <header className="sticky top-0 z-50 h-14 flex items-center justify-between px-4 md:px-8 border-b border-white/10 bg-black/80 backdrop-blur-xl">
                <Link href={dashHref} className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-300">V</span>
                    <span className="font-semibold tracking-tight text-lg">VoidFill</span>
                    <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">{roleLabel}</span>
                </Link>
                <div className="flex items-center gap-3">
                    <Link href="/admin/profile" className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 hover:bg-indigo-500/20 transition" title="Profile">
                        <User className="w-4 h-4" />
                    </Link>
                </div>
            </header>

            <div className="flex flex-1">
                {/* ═══ Sidebar ═══ */}
                <aside className="hidden md:flex w-64 p-5">
                    <div className="w-full rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl shadow-soft p-5 flex flex-col">
                        <nav className="space-y-2">
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
                            <AdminNavItem href="/admin/profile" icon={<User className="w-4 h-4" />}>Edit Profile</AdminNavItem>
                            <div className="mt-3">
                                <div className="text-xs text-zinc-400 truncate">Signed in as</div>
                                <div className="text-xs text-zinc-200 truncate">{displayName}</div>
                            </div>
                            <Link href="/auth/logout" className="mt-3 flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition">
                                <LogOut className="w-3 h-3" />
                                Sign out
                            </Link>
                        </div>
                    </div>
                </aside>

                {/* ═══ Mobile nav ═══ */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/90 backdrop-blur-xl flex items-center justify-around py-2 px-1">
                    {role === "mentor" ? (
                        <>
                            <MobileNavItem href="/admin/mentor" icon={<Users className="w-4 h-4" />} label="Students" />
                            <MobileNavItem href="/admin/mentor/chat" icon={<MessageCircle className="w-4 h-4" />} label="Chats" />
                        </>
                    ) : (
                        <>
                            <MobileNavItem href="/admin/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Dash" />
                            <MobileNavItem href="/admin/users" icon={<Users className="w-4 h-4" />} label="Users" />
                            <MobileNavItem href="/admin/mentors" icon={<UserCheck className="w-4 h-4" />} label="Mentors" />
                        </>
                    )}
                    <MobileNavItem href="/admin/profile" icon={<User className="w-4 h-4" />} label="Profile" />
                    <Link href="/auth/logout" className="flex flex-col items-center gap-0.5 text-[10px] text-zinc-500 hover:text-zinc-300 transition px-2 py-1">
                        <LogOut className="w-4 h-4" />
                        Logout
                    </Link>
                </div>

                <div className="flex-1">
                    <main className="p-4 md:p-10 pb-20 md:pb-10">
                        {children}
                    </main>
                </div>
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

function MobileNavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link href={href} className="flex flex-col items-center gap-0.5 text-[10px] text-zinc-400 hover:text-zinc-200 transition px-2 py-1">
            {icon}
            {label}
        </Link>
    );
}
