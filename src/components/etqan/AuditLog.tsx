"use client";

import { useMemo, useState } from "react";
import { CaretDown, ShieldCheck } from "@phosphor-icons/react";
import { Btn, Notice } from "@/components/admin/ui";
import { useCollection, verifyChain } from "@/lib/etqan/store";
import { ENTITY_LABELS, type AuditRow, type Entity } from "@/lib/etqan/types";
import { Badge, Empty, formatDate, PageHeader, Select, Skeleton } from "./kit";

const VERBS: Record<string, string> = {
  create: "إنشاء",
  update: "تعديل",
  archive: "أرشفة",
  restore: "استعادة",
  create_version: "إصدار جديد",
};

export function describeAction(row: Pick<AuditRow, "action" | "entityType">) {
  const verb = VERBS[row.action.split(".").pop() ?? ""] ?? row.action;
  const noun = row.entityType === "setting" ? "إعداد" : ENTITY_LABELS[row.entityType as Entity] ?? row.entityType;
  return `${verb} ${noun}`;
}

const PAGE = 50;

export function AuditLog() {
  const audit = useCollection("audit");
  const [entity, setEntity] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [check, setCheck] = useState<{ state: "idle" | "running" } | { state: "done"; broken: number | null; count: number }>({ state: "idle" });

  const rows = useMemo(
    () => (audit.data ?? []).filter((r) => !entity || r.entityType === entity).sort((a, b) => b.chainNo - a.chainNo),
    [audit.data, entity],
  );

  async function runCheck() {
    if (!audit.data) return;
    setCheck({ state: "running" });
    const broken = await verifyChain(audit.data);
    setCheck({ state: "done", broken, count: audit.data.length });
  }

  return (
    <>
      <PageHeader
        title="سجل التدقيق"
        description="كل إنشاء وتعديل وأرشفة يُلحق هنا ولا يُعدَّل ولا يُحذف. الأسطر سلسلة تجزئة، فأي عبث بسطر يكسر السلسلة ويظهر في الفحص."
        action={
          <Btn variant="ghost" onClick={runCheck} loading={check.state === "running"} disabled={!audit.data?.length}>
            <ShieldCheck size={18} />
            فحص سلامة السجل
          </Btn>
        }
      />
      {audit.error && <Notice tone="error">{audit.error}</Notice>}
      {check.state === "done" && (
        <div className="mb-5">
          {check.broken === null ? (
            <Notice tone="success">السلسلة سليمة: {check.count} سطرًا بلا أي عبث.</Notice>
          ) : (
            <Notice tone="error">انكسرت السلسلة عند السطر رقم {check.broken}. قد يكون السجل عُدِّل خارج اللوحة.</Notice>
          )}
        </div>
      )}

      <div className="mb-5 flex justify-end">
        <Select value={entity} onChange={(e) => setEntity(e.target.value)} className="w-auto min-w-44" aria-label="نوع السجل">
          <option value="">كل الأنواع</option>
          {Object.entries(ENTITY_LABELS).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
          <option value="setting">الإعدادات</option>
        </Select>
      </div>

      {!audit.data ? (
        <Skeleton />
      ) : rows.length === 0 ? (
        <Empty title="لا توجد عمليات بعد" body="ستظهر هنا كل عملية تجريها في لوحة اتقان، بمن نفّذها ومتى ولماذا." />
      ) : (
        <>
          <ol className="flex flex-col gap-2">
            {rows.slice(0, limit).map((row) => (
              <AuditItem key={row.id} row={row} />
            ))}
          </ol>
          {rows.length > limit && (
            <div className="mt-6 flex justify-center">
              <Btn variant="ghost" onClick={() => setLimit((n) => n + PAGE)}>
                عرض المزيد ({rows.length - limit})
              </Btn>
            </div>
          )}
        </>
      )}
    </>
  );
}

function pretty(text: string | null) {
  if (!text) return "—";
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function AuditItem({ row }: { row: AuditRow }) {
  const [open, setOpen] = useState(false);
  const verb = row.action.split(".").pop();
  return (
    <li className="rounded-2xl bg-surface ring-1 ring-line">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-start">
        <span className="w-12 text-[13px] tabular-nums text-ink-muted">#{row.chainNo}</span>
        <Badge tone={verb === "archive" ? "warn" : verb === "create" || verb === "create_version" ? "accent" : "neutral"}>{describeAction(row)}</Badge>
        <span className="min-w-0 flex-1 truncate text-[15px] text-ink-muted">{row.reason}</span>
        <span className="text-[13px] text-ink-muted" dir="ltr">{row.actorEmail}</span>
        <span className="text-[13px] text-ink-muted">{formatDate(row.atMs)}</span>
        <CaretDown size={16} className={`text-ink-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="grid gap-3 border-t border-line px-4 py-4 md:grid-cols-2">
          <div>
            <p className="mb-1 text-[13px] font-medium text-ink-muted">قبل</p>
            <pre dir="ltr" className="max-h-64 overflow-auto rounded-xl bg-surface-2/70 p-3 text-[13px]">{pretty(row.beforeText)}</pre>
          </div>
          <div>
            <p className="mb-1 text-[13px] font-medium text-ink-muted">بعد</p>
            <pre dir="ltr" className="max-h-64 overflow-auto rounded-xl bg-surface-2/70 p-3 text-[13px]">{pretty(row.afterText)}</pre>
          </div>
          <p className="truncate text-[13px] text-ink-muted md:col-span-2" dir="ltr">
            hash {row.hash.slice(0, 16)}… · prev {row.prevHash ? `${row.prevHash.slice(0, 16)}…` : "∅"}
          </p>
        </div>
      )}
    </li>
  );
}
