"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  ArrowSquareOut,
  BookOpenText,
  Buildings,
  ClockCounterClockwise,
  Clock,
  GearSix,
  Images,
  List,
  Notebook,
  SignOut,
  SquaresFour,
  Stack,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import { site } from "@/site.config";
import { Logo } from "@/components/site/Logo";
import { logout, useAuth } from "./AuthProvider";
import { LoginForm } from "./LoginForm";
import { Btn } from "./ui";

const groups = [
  {
    label: "اتقان — إدارة الحلقات",
    items: [
      { href: "/login", label: "لوحة التحكم", icon: SquaresFour },
      { href: "/login/org", label: "الهيكل التنظيمي", icon: Buildings },
      { href: "/login/periods", label: "الفترات", icon: Clock },
      { href: "/login/programs", label: "البرامج والمناهج", icon: Stack },
      { href: "/login/users", label: "المستخدمون والصلاحيات", icon: UsersThree },
      { href: "/login/quran", label: "فهرس المصحف", icon: BookOpenText },
      { href: "/login/settings", label: "الإعدادات", icon: GearSix },
      { href: "/login/audit", label: "سجل التدقيق", icon: ClockCounterClockwise },
    ],
  },
  {
    label: "محتوى الموقع",
    items: [
      { href: "/login/media", label: "الصور والمقاطع", icon: Images },
      { href: "/login/posts", label: "المقالات", icon: Notebook },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return href === "/login" ? pathname === "/login" : pathname === href || pathname.startsWith(href + "/");
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-7" aria-label="أقسام لوحة التحكم">
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-3.5 pb-1.5 text-[13px] font-semibold text-ink-muted">{group.label}</p>
          {group.items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[15px] transition-colors duration-200 ${
                  active ? "bg-accent-soft font-medium text-accent" : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <item.icon size={20} weight={active ? "fill" : "regular"} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const state = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (state.status === "loading") {
    return (
      <div className="grid min-h-dvh place-items-center">
        <span className="size-8 animate-spin rounded-full border-2 border-accent border-t-transparent" aria-label="جارٍ التحميل" />
      </div>
    );
  }

  if (state.status === "signed-out") return <LoginForm />;

  if (state.status === "not-admin") {
    return (
      <div className="grid min-h-dvh place-items-center px-4">
        <div className="flex max-w-sm flex-col items-center gap-5 text-center">
          <h1 className="font-display text-2xl font-semibold">هذا الحساب لا يملك صلاحية الإدارة</h1>
          <p className="text-ink-muted">سجّلت الدخول باسم {state.user.email}. تواصل مع مسؤول الموقع لإضافة الصلاحية.</p>
          <Btn variant="ghost" onClick={logout}>
            تسجيل الخروج
          </Btn>
        </div>
      </div>
    );
  }

  const footer = (
    <div className="flex flex-col gap-1 border-t border-line pt-4">
      <p className="truncate px-3 pb-2 text-[13px] text-ink-muted" dir="ltr">
        {state.user.email}
      </p>
      <Link
        href="/"
        target="_blank"
        className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <ArrowSquareOut size={20} />
        عرض الموقع
      </Link>
      <button
        type="button"
        onClick={logout}
        className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-start text-[15px] text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <SignOut size={20} />
        تسجيل الخروج
      </button>
    </div>
  );

  return (
    <div className="min-h-dvh font-display text-base leading-[1.75] lg:grid lg:grid-cols-[18rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-8 overflow-y-auto border-e border-line bg-surface/60 px-4 py-6 lg:flex">
        <Logo href="/login" className="px-3" />
        <div className="flex-1">
          <NavLinks pathname={pathname} />
        </div>
        {footer}
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-bg/85 px-4 backdrop-blur-xl lg:hidden">
        <span className="font-display font-semibold">{site.shortName}</span>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="فتح القائمة"
          aria-expanded={menuOpen}
          className="grid size-11 place-items-center rounded-full ring-1 ring-line"
        >
          <List size={22} />
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal aria-label="القائمة">
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col gap-6 overflow-y-auto bg-bg px-4 py-5 shadow-soft">
            <div className="flex items-center justify-between px-3">
              <Logo href="/login" />
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة" className="grid size-10 place-items-center rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1">
              <NavLinks pathname={pathname} onNavigate={() => setMenuOpen(false)} />
            </div>
            {footer}
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-10 md:py-12">{children}</main>
    </div>
  );
}
