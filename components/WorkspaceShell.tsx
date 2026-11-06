"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  Brain,
  ChevronRight,
  ClipboardCheck,
  Dumbbell,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Radar,
  Route,
  ShieldCheck,
  User,
  UserCheck,
  Users,
  X,
  FileUp,
  Compass,
} from "lucide-react";
import { Brand } from "./Brand";

const learnerGroups = [
  {
    label: "Your workspace",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
      { href: "/resume", icon: FileUp, label: "Resume studio" },
      { href: "/careers", icon: Compass, label: "Career explorer" },
    ],
  },
  {
    label: "Learn & grow",
    items: [
      { href: "/daily-test", icon: ClipboardCheck, label: "Daily assessment" },
      { href: "/practice-test", icon: Dumbbell, label: "Practice lab" },
      { href: "/roadmap", icon: Route, label: "Learning roadmap" },
    ],
  },
  {
    label: "Reflect & connect",
    items: [
      { href: "/skill-graph", icon: Radar, label: "Skill analytics" },
      { href: "/ai-insights", icon: Brain, label: "Learning insights" },
      { href: "/mentor-chat", icon: MessageCircle, label: "Mentor space" },
    ],
  },
];
function staffGroups(role: string) {
  return [
    {
      label: role === "mentor" ? "Mentoring workspace" : "Platform workspace",
      items:
        role === "mentor"
          ? [
              { href: "/admin/mentor", icon: Users, label: "My learners" },
              {
                href: "/admin/mentor/chat",
                icon: MessageCircle,
                label: "Conversations",
              },
            ]
          : [
              {
                href: "/admin/dashboard",
                icon: LayoutDashboard,
                label: "Overview",
              },
              { href: "/admin/users", icon: Users, label: "Learner directory" },
              {
                href: "/admin/mentors",
                icon: UserCheck,
                label: "Staff & assignments",
              },
              { href: "/admin/flagged", icon: Flag, label: "Moderation" },
            ],
    },
  ];
}

export function WorkspaceShell({
  displayName,
  role,
  children,
}: {
  displayName: string;
  role?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const sidebar = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const groups = role ? staffGroups(role) : learnerGroups;
  const profileHref = role ? "/admin/profile" : "/profile";
  const home = role
    ? role === "mentor"
      ? "/admin/mentor"
      : "/admin/dashboard"
    : "/dashboard";
  const links = [
    ...groups.flatMap((g) => g.items),
    { href: profileHref, icon: User, label: "My profile" },
  ];
  const current = links
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0];
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    const menuTrigger = trigger.current;
    document.body.style.overflow = "hidden";
    sidebar.current
      ?.querySelector<HTMLButtonElement>(".sidebar-close")
      ?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
      if (event.key === "Tab") {
        const elements = Array.from(
          sidebar.current?.querySelectorAll<HTMLElement>(
            "a[href], button:not([disabled])",
          ) || [],
        );
        const first = elements[0],
          last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", handler);
      menuTrigger?.focus();
    };
  }, [menuOpen]);
  return (
    <div className="workspace">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {menuOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
          tabIndex={-1}
        />
      )}
      <aside
        ref={sidebar}
        id="workspace-navigation"
        className="workspace-sidebar"
        data-open={menuOpen}
      >
        <Brand href={home} />
        <button
          className="sidebar-close"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
        <div className="mt-2 pl-12 text-[9px] uppercase tracking-[.18em] text-muted">
          {role
            ? role === "mentor"
              ? "The mentor desk"
              : "The staff desk"
            : "Make room for growth"}
        </div>
        <nav aria-label="Main navigation" className="pb-6">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="nav-group-label">{group.label}</div>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="workspace-nav-link"
                  data-active={current?.href === item.href}
                  aria-current={
                    current?.href === item.href ? "page" : undefined
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  <item.icon size={17} strokeWidth={1.65} />
                  <span>{item.label}</span>
                  {current?.href === item.href && (
                    <span className="nav-active-dot" />
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="workspace-prompt">
          {role ? (
            <ShieldCheck size={18} className="text-forest mb-3" />
          ) : (
            <BookOpen size={18} className="text-forest mb-3" />
          )}
          <p className="text-xs font-semibold leading-5">
            {role
              ? "Small guidance. Lasting impact."
              : "Your next chapter starts with one small step."}
          </p>
          <Link
            href={
              role
                ? role === "mentor"
                  ? "/admin/mentor/chat"
                  : "/admin/flagged"
                : "/daily-test"
            }
            className="mt-3 flex items-center gap-2 text-[10px] font-bold text-forest"
          >
            {role
              ? role === "mentor"
                ? "Open conversations"
                : "Review moderation"
              : "Take today’s assessment"}
            <ArrowUpRight size={13} />
          </Link>
        </div>
        <div className="workspace-user">
          <Link
            href={profileHref}
            className="flex min-w-0 flex-1 items-center gap-2.5"
            aria-label="Open my profile"
          >
            <span className="avatar">{initials}</span>
            <span className="min-w-0">
              <span className="block truncate text-[11px] font-bold">
                {displayName}
              </span>
              <span className="text-[9px] text-muted">
                {role ? role.replace("_", " ") : "Personal workspace"}
              </span>
            </span>
          </Link>
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="p-2 text-muted hover:text-rust"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </form>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="workspace-header">
          <div className="flex min-w-0 items-center gap-3">
            <button
              ref={trigger}
              className="mobile-menu-button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
              aria-expanded={menuOpen}
              aria-controls="workspace-navigation"
            >
              <Menu size={20} />
            </button>
            <span className="hidden sm:inline text-[11px] text-muted">
              {role ? "Staff desk" : "My workspace"}
            </span>
            <ChevronRight
              size={13}
              className="hidden sm:inline text-muted/60"
            />
            <span className="truncate text-[11px] font-semibold">
              {current?.label ||
                (pathname === "/onboarding" ? "Getting started" : "Workspace")}
            </span>
          </div>
          <div className="flex items-center gap-5">
            <span className="hidden lg:flex items-center gap-2 text-[10px] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-forest" />A little
              progress, every day.
            </span>
            <Link href={profileHref} className="avatar" aria-label="My profile">
              {initials}
            </Link>
          </div>
        </header>
        <main id="main-content" className="workspace-main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
