"use client";

import Link from "next/link";
import { ArrowLeft, Buildings, CheckCircle, Circle as CircleIcon, House, MapPin, Stack, UsersThree, UserCircle } from "@phosphor-icons/react";
import { Notice } from "@/components/admin/ui";
import { DEFAULT_SETTINGS } from "@/lib/etqan/settings";
import { useCollection } from "@/lib/etqan/store";
import { describeAction } from "./AuditLog";
import { Card, formatDate, PageHeader, Skeleton } from "./kit";

const active = <T extends { archivedAt: number | null }>(rows: T[] | null) => (rows ?? []).filter((r) => !r.archivedAt);

export function Overview() {
  const orgs = useCollection("organization");
  const centers = useCollection("center");
  const mosques = useCollection("mosque");
  const circles = useCollection("circle");
  const periods = useCollection("period");
  const programs = useCollection("program");
  const accounts = useCollection("account");
  const settings = useCollection("setting");
  const audit = useCollection("audit");

  const all = [orgs, centers, mosques, circles, periods, programs, accounts, settings];
  const loading = all.some((c) => !c.data);
  const error = all.find((c) => c.error)?.error;

  const staff = active(accounts.data).filter((a) => a.accountType === "staff");
  const students = active(accounts.data).filter((a) => a.accountType === "student");
  const teachers = staff.filter((a) => a.roles.some((r) => r.role === "TC"));

  const stats = [
    { label: "الجهات", value: active(orgs.data).length, icon: Buildings, href: "/login/org" },
    { label: "المراكز", value: active(centers.data).length, icon: MapPin, href: "/login/org" },
    { label: "المساجد والمدارس", value: active(mosques.data).length, icon: House, href: "/login/org" },
    { label: "الحلقات", value: active(circles.data).length, icon: UsersThree, href: "/login/org" },
    { label: "المعلمون", value: teachers.length, icon: UserCircle, href: "/login/users" },
    { label: "الموظفون", value: staff.length, icon: UserCircle, href: "/login/users" },
    { label: "الطلاب", value: students.length, icon: UserCircle, href: "/login/users" },
    { label: "البرامج", value: active(programs.data).length, icon: Stack, href: "/login/programs" },
  ];

  const steps = [
    { done: active(orgs.data).length > 0, label: "أضف الجهة", href: "/login/org" },
    { done: active(periods.data).length > 0, label: "أضف الفترات", href: "/login/periods" },
    { done: active(mosques.data).length > 0, label: "أضف المراكز والمساجد", href: "/login/org" },
    { done: active(circles.data).length > 0, label: "أضف الحلقات", href: "/login/org" },
    { done: staff.some((a) => a.roles.length > 0), label: "أضف المعلمين والمشرفين بأدوارهم", href: "/login/users" },
    { done: DEFAULT_SETTINGS.every((d) => (settings.data ?? []).some((s) => s.key === d.key)), label: "هيّئ الإعدادات المعتمدة", href: "/login/settings" },
  ];
  const remaining = steps.filter((s) => !s.done).length;
  const recent = [...(audit.data ?? [])].sort((a, b) => b.chainNo - a.chainNo).slice(0, 6);

  return (
    <>
      <PageHeader
        title="لوحة التحكم"
        description="أهلًا بك. هذه لوحة «اتقان» لإدارة حلقات المجمع، ومعها إدارة محتوى الموقع."
      />
      {error && <Notice tone="error">{error}</Notice>}

      {loading ? (
        <Skeleton rows={3} />
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map((s) => (
              <Link key={s.label} href={s.href} className="group flex flex-col gap-3 rounded-[1.5rem] bg-surface p-5 ring-1 ring-line transition hover:shadow-soft">
                <s.icon size={22} className="text-accent" />
                <span className="font-display text-3xl font-semibold tabular-nums">{s.value}</span>
                <span className="text-[15px] text-ink-muted">{s.label}</span>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            {remaining > 0 && (
              <Card>
                <h2 className="font-display text-lg font-semibold">خطوات التهيئة</h2>
                <p className="mb-4 text-[15px] text-ink-muted">بقي {remaining} من {steps.length}.</p>
                <ol className="flex flex-col gap-1">
                  {steps.map((s) => (
                    <li key={s.label}>
                      <Link href={s.href} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2/60">
                        {s.done ? <CheckCircle size={22} weight="fill" className="text-accent" /> : <CircleIcon size={22} className="text-ink-muted" />}
                        <span className={s.done ? "text-ink-muted line-through" : ""}>{s.label}</span>
                        {!s.done && <ArrowLeft size={16} className="ms-auto text-ink-muted" />}
                      </Link>
                    </li>
                  ))}
                </ol>
              </Card>
            )}
            <Card className={remaining > 0 ? "" : "lg:col-span-2"}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">آخر العمليات</h2>
                <Link href="/login/audit" className="text-[15px] text-accent hover:underline">
                  سجل التدقيق
                </Link>
              </div>
              {recent.length === 0 ? (
                <p className="text-[15px] text-ink-muted">لا توجد عمليات بعد.</p>
              ) : (
                <ol className="flex flex-col divide-y divide-line">
                  {recent.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[15px]">
                      <span className="font-medium">{describeAction(r)}</span>
                      <span className="text-ink-muted">{formatDate(r.atMs)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
