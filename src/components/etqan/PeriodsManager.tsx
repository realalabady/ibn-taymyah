"use client";

import { useState, type FormEvent } from "react";
import { Clock, Plus } from "@phosphor-icons/react";
import { useAdminUser } from "@/components/admin/AuthProvider";
import { Btn, Field, Input, Notice } from "@/components/admin/ui";
import { archiveRecord, createRecord, errorText, restoreRecord, updateRecord, useCollection } from "@/lib/etqan/store";
import type { Organization, Period } from "@/lib/etqan/types";
import { ArchiveControl, Badge, Empty, PageHeader, Select, Sheet, ShowArchivedToggle, Skeleton } from "./kit";

export function PeriodsManager() {
  const periods = useCollection("period");
  const orgs = useCollection("organization");
  const circles = useCollection("circle");
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<{ record?: Period } | null>(null);

  const activeOrgs = (orgs.data ?? []).filter((o) => !o.archivedAt);
  const rows = (periods.data ?? [])
    .filter((p) => showArchived || !p.archivedAt)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const orgName = (id: string) => orgs.data?.find((o) => o.id === id)?.name ?? "—";
  const usage = (id: string) => (circles.data ?? []).filter((c) => c.periodId === id && !c.archivedAt).length;

  return (
    <>
      <PageHeader
        title="الفترات"
        description="أوقات الحلقات اليومية لكل جهة، مثل «بعد العصر» أو «بعد المغرب». كل حلقة ترتبط بفترة."
        action={
          <Btn onClick={() => setEditing({})} disabled={activeOrgs.length === 0}>
            <Plus size={18} />
            إضافة فترة
          </Btn>
        }
      />
      {(periods.error || orgs.error) && <Notice tone="error">{periods.error || orgs.error}</Notice>}
      {orgs.data && activeOrgs.length === 0 && <Notice>أضف جهة من «الهيكل التنظيمي» أولًا، ثم أضف فتراتها.</Notice>}

      <div className="my-4 flex justify-end">
        <ShowArchivedToggle value={showArchived} onChange={setShowArchived} count={(periods.data ?? []).filter((p) => p.archivedAt).length} />
      </div>

      {!periods.data ? (
        <Skeleton rows={3} />
      ) : rows.length === 0 ? (
        activeOrgs.length > 0 && <Empty title="لا توجد فترات بعد" body="أضف الفترات التي تُعقد فيها الحلقات." action={<Btn onClick={() => setEditing({})}>إضافة فترة</Btn>} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setEditing({ record: p })}
                className={`flex w-full items-start gap-4 rounded-[1.5rem] bg-surface p-5 text-start ring-1 ring-line transition hover:shadow-soft ${p.archivedAt ? "opacity-60" : ""}`}
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Clock size={22} />
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="flex items-center gap-2 font-display text-lg font-semibold">
                    {p.name}
                    {p.archivedAt && <Badge tone="muted">مؤرشفة</Badge>}
                  </span>
                  <span className="font-medium tabular-nums" dir="ltr">
                    {p.startTime} – {p.endTime}
                  </span>
                  <span className="text-[15px] text-ink-muted">
                    {orgName(p.organizationId)} · {usage(p.id)} حلقة
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing?.record ? "تعديل فترة" : "إضافة فترة"}>
        {editing && <PeriodForm record={editing.record} orgs={activeOrgs} all={periods.data ?? []} inUse={editing.record ? usage(editing.record.id) : 0} onDone={() => setEditing(null)} />}
      </Sheet>
    </>
  );
}

function PeriodForm({ record: r, orgs, all, inUse, onDone }: { record?: Period; orgs: Organization[]; all: Period[]; inUse: number; onDone: () => void }) {
  const user = useAdminUser();
  const [organizationId, setOrganizationId] = useState(r?.organizationId ?? orgs[0]?.id ?? "");
  const [name, setName] = useState(r?.name ?? "");
  const [startTime, setStartTime] = useState(r?.startTime ?? "16:00");
  const [endTime, setEndTime] = useState(r?.endTime ?? "18:00");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (endTime <= startTime) return setError("وقت النهاية يجب أن يكون بعد وقت البداية.");
    if (all.some((p) => p.id !== r?.id && !p.archivedAt && p.organizationId === organizationId && p.name.trim() === name.trim()))
      return setError("توجد فترة نشطة بالاسم نفسه.");
    setBusy(true);
    setError("");
    try {
      const fields = { name: name.trim(), startTime, endTime };
      if (r) await updateRecord("period", r.id, r.version, fields, user);
      else await createRecord("period", { ...fields, organizationId }, user);
      onDone();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {!r && orgs.length > 1 && (
        <Field label="الجهة">
          <Select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)}>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="اسم الفترة">
        <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="بعد العصر" autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="من">
          <Input type="time" dir="ltr" required value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </Field>
        <Field label="إلى">
          <Input type="time" dir="ltr" required value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </Field>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <Btn type="submit" loading={busy} disabled={!!r?.archivedAt}>
        حفظ
      </Btn>
      {r && (
        <div className="mt-4 border-t border-line pt-5">
          <ArchiveControl
            archived={!!r.archivedAt}
            blockedReason={inUse > 0 ? `هذه الفترة مستخدمة في ${inUse} حلقة نشطة. انقل الحلقات إلى فترة أخرى أولًا.` : undefined}
            onArchive={async (reason) => { await archiveRecord("period", r.id, r.version, reason, user); onDone(); }}
            onRestore={async () => { await restoreRecord("period", r.id, r.version, user); onDone(); }}
          />
        </div>
      )}
    </form>
  );
}
