"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowSquareOut, Images, Notebook, SignOut } from "@phosphor-icons/react";
import { site } from "@/site.config";
import { logout, useAuth } from "./AuthProvider";
import { LoginForm } from "./LoginForm";
import { Btn } from "./ui";

const tabs = [
  { href: "/admin", label: "الصور والمقاطع", icon: Images },
  { href: "/admin/posts", label: "المقالات", icon: Notebook },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const state = useAuth();
  const pathname = usePathname();

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

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <span className="hidden font-display font-semibold sm:inline">{site.shortName}</span>
            <nav className="flex items-center gap-1" aria-label="أقسام الإدارة">
              {tabs.map((tab) => {
                const active = tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors duration-200 ${
                      active ? "bg-accent-soft font-medium text-accent" : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                    }`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/"
              target="_blank"
              aria-label="عرض الموقع"
              className="grid size-10 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <ArrowSquareOut size={20} />
            </Link>
            <button
              type="button"
              onClick={logout}
              aria-label="تسجيل الخروج"
              className="grid size-10 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <SignOut size={20} />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
    </div>
  );
}
