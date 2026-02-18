"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard, ClipboardCheck, Dumbbell, Radar, Route, Brain, MessageCircle,
    User, LogOut, Menu, X
} from "lucide-react";

interface Props {
    displayName: string;
    children: React.ReactNode;
}

const NAV_ITEMS = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/daily-test", icon: ClipboardCheck, label: "Daily Test" },
    { href: "/practice-test", icon: Dumbbell, label: "Practice Test" },
    { href: "/skill-graph", icon: Radar, label: "Skill Graph" },
    { href: "/roadmap", icon: Route, label: "Roadmap" },
    { href: "/ai-insights", icon: Brain, label: "AI Insights" },
    { href: "/mentor-chat", icon: MessageCircle, label: "AI Mentor" },
];

export function AppShellClient({ displayName, children }: Props) {
    const [menuOpen, setMenuOpen] = useState(false);
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-transparent flex flex-col">
            {/* ═══ Top Header Bar ═══ */}
            <header className="sticky top-0 z-50 h-14 flex items-center justify-between px-4 md:px-8 border-b border-white/10 bg-black/80 backdrop-blur-xl">
                {/* Left: Hamburger + VoidFill */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition"
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center text-sm font-bold">V</span>
                        <span className="font-semibold tracking-tight text-lg hidden sm:inline">VoidFill</span>
                    </Link>
                </div>

                {/* Right: Profile icon */}
                <Link
                    href="/profile"
                    className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-300 hover:bg-emerald-500/20 transition"
                    title="Profile"
                >
                    <User className="w-4 h-4" />
                </Link>
            </header>

            {/* ═══ Slide-out Nav Drawer ═══ */}
            <AnimatePresence>
                {menuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                            onClick={() => setMenuOpen(false)}
                        />
                        {/* Drawer */}
                        <motion.aside
                            key="drawer"
                            initial={{ x: -280, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -280, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed top-0 left-0 z-50 w-72 h-full rounded-r-3xl border-r border-white/10 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl p-5 flex flex-col"
                        >
                            {/* Drawer header */}
                            <div className="flex items-center justify-between mb-6">
                                <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
                                    <span className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-bold">V</span>
                                    <span className="font-semibold text-lg tracking-tight">VoidFill</span>
                                </Link>
                                <button
                                    onClick={() => setMenuOpen(false)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition"
                                >
                                    <X className="w-4 h-4 text-zinc-400" />
                                </button>
                            </div>

                            {/* Nav links */}
                            <nav className="space-y-1 flex-1">
                                {NAV_ITEMS.map(item => {
                                    const Icon = item.icon;
                                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMenuOpen(false)}
                                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition
                        ${active
                                                    ? "bg-white/10 text-white font-medium"
                                                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                                                }`}
                                        >
                                            <Icon className="w-4 h-4 shrink-0" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                                <Link
                                    href="/profile"
                                    onClick={() => setMenuOpen(false)}
                                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition
                    ${pathname === "/profile"
                                            ? "bg-white/10 text-white font-medium"
                                            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                                        }`}
                                >
                                    <User className="w-4 h-4 shrink-0" />
                                    Profile
                                </Link>
                            </nav>

                            {/* Footer */}
                            <div className="pt-5 mt-auto border-t border-white/10 space-y-3">
                                <div>
                                    <div className="uppercase tracking-[0.2em] text-[10px] text-zinc-500">Signed in as</div>
                                    <div className="text-sm text-zinc-200 truncate mt-1">{displayName}</div>
                                </div>
                                <Link
                                    href="/auth/logout"
                                    className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition"
                                >
                                    <LogOut className="w-3 h-3" />
                                    Sign out
                                </Link>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ═══ Main Content ═══ */}
            <main className="flex-1 p-4 md:p-10">
                {children}
            </main>
        </div>
    );
}
