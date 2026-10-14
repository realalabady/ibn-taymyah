"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { Buildings, House, MapPin, PencilSimple, Plus, UsersThree } from "@phosphor-icons/react";
import { useAdminUser } from "@/components/admin/AuthProvider";
import { Btn, Field, Input, Notice } from "@/components/admin/ui";
import { archiveRecord, createRecord, errorText, restoreRecord, updateRecord, useCollection } from "@/lib/etqan/store";
import { WEEKDAYS, type Center, type Circle, type Mosque, type Organization } from "@/lib/etqan/types";
import { ArchiveControl, Badge, Card, Empty, PageHeader, Select, Sheet, ShowArchivedToggle, Skeleton } from "./kit";

type Editing =
  | { kind: "organization"; record?: Organization }
  | { kind: "center"; record?: Center; parent: Organization }
  | { kind: "mosque"; record?: Mosque; parent: Center }
  | { kind: "circle"; record?: Circle; parent: Mosque };

const TITLES = { organization: "جهة", center: "مركز", mosque: "مسجد/مدرسة", circle: "حلقة" };

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function OrgManager() {
  const orgs = useCollection("organization");
  const centers = useCollection("center");
  const mosques = useCollection("mosque");
  const circles = useCollection("circle");
  const periods = useCollection("period");
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null);

  const error = orgs.error || centers.error || mosques.error || circles.error;
  const loading = !orgs.data || !centers.data || !mosques.data || !circles.data;

  const visible = <T extends { archivedAt: number | null; name: string }>(rows: T[] | null) =>
    (rows ?? []).filter((r) => showArchived || !r.archivedAt).sort((a, b) => a.name.localeCompare(b.name, "ar"));
  const archivedCount = [orgs, centers, mosques, circles].reduce((n, c) => n + (c.data ?? []).filter((r) => r.archivedAt).length, 0);
  const periodName = (id: string) => periods.data?.find((p) => p.id === id)?.name ?? "—";

  return (
    <>
      <PageHeader
        title="الهيكل التنظيمي"
        description="جهة ← مركز ← مسجد أو مدرسة ← حلقة. لا يُحذف شيء نهائيًا؛ الأرشفة بسبب وتُستعاد متى شئت."
        action={
          <Btn onClick={() => setEditing({ kind: "organization" })}>
            <Plus size={18} />
            إضافة جهة
          </Btn>
        }
      />

      {error && <Notice tone="error">{error}</Notice>}

      <div className="mb-4 flex justify-end">
        <ShowArchivedToggle value={showArchived} onChange={setShowArchived} count={archivedCount} />
      </div>

      {loading ? (
        <Skeleton />
      ) : visible(orgs.data).length === 0 ? (
        <Empty
          title="ابدأ بإضافة الجهة"
          body="الجهة هي أعلى الهيكل (الجمعية). أضفها ثم أضف تحتها المراكز والمساجد والحلقات."
          action={<Btn onClick={() => setEditing({ kind: "organization" })}>إضافة جهة</Btn>}
        />
      ) : (
        <div className="flex flex-col gap-5">
          {visible(orgs.data).map((org) => (
            <Card key={org.id} className={org.archivedAt ? "opacity-60" : ""}>
              <NodeRow
                icon={<Buildings size={22} />}
                title={org.name}
                meta={[org.region, org.status === "suspended" ? "موقوفة" : null]}
                archived={!!org.archivedAt}
                onEdit={() => setEditing({ kind: "organization", record: org })}
                onAdd={org.archivedAt ? undefined : () => setEditing({ kind: "center", parent: org })}
                addLabel="مركز"
                level="جهة"
                big
              />
              <div className="mt-6 flex flex-col gap-7 border-s-2 border-accent-soft ps-5 md:ps-8">
                {visible(centers.data?.filter((c) => c.organizationId === org.id) ?? []).map((center) => (
                  <div key={center.id} className={center.archivedAt ? "opacity-60" : ""}>
                    <NodeRow
                      icon={<MapPin size={20} />}
                      title={center.name}
                      meta={[center.region]}
                      archived={!!center.archivedAt}
                      onEdit={() => setEditing({ kind: "center", record: center, parent: org })}
                      onAdd={center.archivedAt ? undefined : () => setEditing({ kind: "mosque", parent: center })}
                      addLabel="مسجد"
                      level="مركز"
                    />
                    <div className="mt-5 flex flex-col gap-6 border-s-2 border-accent-soft ps-5 md:ps-8">
                      {visible(mosques.data?.filter((m) => m.centerId === center.id) ?? []).map((mosque) => (
                        <div key={mosque.id} className={mosque.archivedAt ? "opacity-60" : ""}>
                          <NodeRow
                            icon={<House size={20} />}
                            title={mosque.name}
                            meta={[mosque.address, mosque.region]}
                            archived={!!mosque.archivedAt}
                            onEdit={() => setEditing({ kind: "mosque", record: mosque, parent: center })}
                            onAdd={mosque.archivedAt ? undefined : () => setEditing({ kind: "circle", parent: mosque })}
                            addLabel="حلقة"
                            level={mosque.type === "school" ? "مدرسة" : "مسجد"}
                          />
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {visible(circles.data?.filter((c) => c.mosqueId === mosque.id) ?? []).map((circle) => (
                              <button
                                key={circle.id}
                                type="button"
                                onClick={() => setEditing({ kind: "circle", record: circle, parent: mosque })}
                                className={`flex flex-col gap-2 rounded-2xl bg-surface-2/60 px-4 py-3.5 text-start ring-1 ring-transparent transition-[box-shadow,background-color] duration-200 hover:bg-surface-2 hover:ring-line ${
                                  circle.archivedAt ? "opacity-60" : ""
                                }`}
                              >
                                <span className="flex flex-wrap items-center gap-2 text-[16px] font-semibold">
                                  <UsersThree size={18} className="text-accent" />
                                  {circle.name}
                                  {circle.status === "suspended" && <Badge tone="warn">موقوفة</Badge>}
                                  {circle.archivedAt && <Badge tone="muted">مؤرشفة</Badge>}
                                </span>
                                <span className="text-[14px] leading-6 text-pretty text-ink-muted">
                                  {periodName(circle.periodId)} · {circle.weekdays.map((d) => WEEKDAYS[d]).join("، ")} · السعة {circle.capacity}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `${editing.record ? "تعديل" : "إضافة"} ${TITLES[editing.kind]}` : ""}
      >
        {editing?.kind === "organization" && <OrgForm editing={editing} all={orgs.data ?? []} centers={centers.data ?? []} onDone={() => setEditing(null)} />}
        {editing?.kind === "center" && <CenterForm editing={editing} all={centers.data ?? []} mosques={mosques.data ?? []} onDone={() => setEditing(null)} />}
        {editing?.kind === "mosque" && <MosqueForm editing={editing} all={mosques.data ?? []} circles={circles.data ?? []} onDone={() => setEditing(null)} />}
        {editing?.kind === "circle" && <CircleForm editing={editing} all={circles.data ?? []} centers={centers.data ?? []} onDone={() => setEditing(null)} />}
      </Sheet>
    </>
  );
}

function NodeRow({
  icon,
  title,
  meta,
  archived,
  onEdit,
  onAdd,
  addLabel,
  big,
  level,
}: {
  icon: ReactNode;
  title: string;
  meta: (string | null | undefined)[];
  archived: boolean;
  onEdit: () => void;
  onAdd?: () => void;
  addLabel: string;
  big?: boolean;
  level: string;
}) {
  const details = meta.filter(Boolean).join(" · ");
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`grid shrink-0 place-items-center rounded-xl bg-accent-soft text-accent ${big ? "size-12" : "size-10"}`}>{icon}</span>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-accent">{level}</p>
          <p className={`flex flex-wrap items-center gap-2 font-display leading-snug font-semibold ${big ? "text-[1.35rem]" : "text-[17px]"}`}>
            {title}
            {archived && <Badge tone="muted">مؤرشف</Badge>}
          </p>
          {details && <p className="mt-0.5 truncate text-[15px] text-ink-muted">{details}</p>}
        </div>
      </div>
      <div className="flex gap-2">
        <Btn variant="ghost" onClick={onEdit} className="min-h-9 px-3" aria-label={`تعديل ${title}`}>
          <PencilSimple size={16} />
          تعديل
        </Btn>
        {onAdd && (
          <Btn variant="ghost" onClick={onAdd} className="min-h-9 px-3">
            <Plus size={16} />
            {addLabel}
          </Btn>
        )}
      </div>
    </div>
  );
}

function useSave(onDone: () => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      onDone();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }
  return { busy, error, setError, run };
}

function FormActions({ busy, error, record, onArchive, onRestore, blockedReason }: {
  busy: boolean;
  error: string;
  record?: { archivedAt: number | null };
  onArchive: (reason: string) => Promise<void>;
  onRestore: () => Promise<void>;
  blockedReason?: string;
}) {
  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}
      <Btn type="submit" loading={busy} disabled={!!record?.archivedAt}>
        حفظ
      </Btn>
      {record && (
        <div className="mt-4 border-t border-line pt-5">
          <ArchiveControl archived={!!record.archivedAt} onArchive={onArchive} onRestore={onRestore} blockedReason={blockedReason} />
        </div>
      )}
    </>
  );
}

function hasActive<T extends { archivedAt: number | null }>(rows: T[], match: (r: T) => boolean) {
  return rows.some((r) => !r.archivedAt && match(r));
}

function OrgForm({ editing, all, centers, onDone }: { editing: Extract<Editing, { kind: "organization" }>; all: Organization[]; centers: Center[]; onDone: () => void }) {
  const user = useAdminUser();
  const r = editing.record;
  const [name, setName] = useState(r?.name ?? "");
  const [region, setRegion] = useState(r?.region ?? "");
  const [status, setStatus] = useState(r?.status ?? "active");
  const { busy, error, setError, run } = useSave(onDone);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (all.some((o) => o.id !== r?.id && !o.archivedAt && sameName(o.name, name))) return setError("توجد جهة نشطة بالاسم نفسه.");
    const fields = { name: name.trim(), region: region.trim(), status };
    run(() => (r ? updateRecord("organization", r.id, r.version, fields, user) : createRecord("organization", (id) => ({ ...fields, path: id }), user)));
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <Field label="اسم الجهة">
        <Input required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <Field label="المنطقة">
        <Input value={region} onChange={(e) => setRegion(e.target.value)} />
      </Field>
      <Field label="الحالة">
        <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="active">نشطة</option>
          <option value="suspended">موقوفة</option>
        </Select>
      </Field>
      <FormActions
        busy={busy}
        error={error}
        record={r}
        blockedReason={r && hasActive(centers, (c) => c.organizationId === r.id) ? "لا يمكن أرشفة جهة تحتها مراكز نشطة. أرشف المراكز أولًا." : undefined}
        onArchive={async (reason) => { await archiveRecord("organization", r!.id, r!.version, reason, user); onDone(); }}
        onRestore={async () => { await restoreRecord("organization", r!.id, r!.version, user); onDone(); }}
      />
    </form>
  );
}

function CenterForm({ editing, all, mosques, onDone }: { editing: Extract<Editing, { kind: "center" }>; all: Center[]; mosques: Mosque[]; onDone: () => void }) {
  const user = useAdminUser();
  const { record: r, parent } = editing;
  const [name, setName] = useState(r?.name ?? "");
  const [region, setRegion] = useState(r?.region ?? "");
  const { busy, error, setError, run } = useSave(onDone);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (all.some((c) => c.id !== r?.id && c.organizationId === parent.id && !c.archivedAt && sameName(c.name, name)))
      return setError("يوجد مركز نشط بالاسم نفسه في هذه الجهة.");
    const fields = { name: name.trim(), region: region.trim() };
    run(() =>
      r
        ? updateRecord("center", r.id, r.version, fields, user)
        : createRecord("center", (id) => ({ ...fields, organizationId: parent.id, path: `${parent.path}.${id}` }), user),
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <p className="text-[15px] text-ink-muted">ضمن: {parent.name}</p>
      <Field label="اسم المركز">
        <Input required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <Field label="المنطقة">
        <Input value={region} onChange={(e) => setRegion(e.target.value)} />
      </Field>
      <FormActions
        busy={busy}
        error={error}
        record={r}
        blockedReason={r && hasActive(mosques, (m) => m.centerId === r.id) ? "لا يمكن أرشفة مركز تحته مساجد نشطة. أرشف المساجد أولًا." : undefined}
        onArchive={async (reason) => { await archiveRecord("center", r!.id, r!.version, reason, user); onDone(); }}
        onRestore={async () => { await restoreRecord("center", r!.id, r!.version, user); onDone(); }}
      />
    </form>
  );
}

function MosqueForm({ editing, all, circles, onDone }: { editing: Extract<Editing, { kind: "mosque" }>; all: Mosque[]; circles: Circle[]; onDone: () => void }) {
  const user = useAdminUser();
  const { record: r, parent } = editing;
  const [name, setName] = useState(r?.name ?? "");
  const [type, setType] = useState<Mosque["type"]>(r?.type ?? "mosque");
  const [address, setAddress] = useState(r?.address ?? "");
  const [region, setRegion] = useState(r?.region ?? "");
  const { busy, error, setError, run } = useSave(onDone);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (all.some((m) => m.id !== r?.id && m.centerId === parent.id && !m.archivedAt && sameName(m.name, name)))
      return setError("يوجد مسجد نشط بالاسم نفسه في هذا المركز.");
    const fields = { name: name.trim(), type, address: address.trim(), region: region.trim() };
    run(() =>
      r
        ? updateRecord("mosque", r.id, r.version, fields, user)
        : createRecord("mosque", (id) => ({ ...fields, centerId: parent.id, path: `${parent.path}.${id}` }), user),
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <p className="text-[15px] text-ink-muted">ضمن: {parent.name}</p>
      <Field label="الاسم">
        <Input required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <Field label="النوع">
        <Select value={type} onChange={(e) => setType(e.target.value as Mosque["type"])}>
          <option value="mosque">مسجد</option>
          <option value="school">مدرسة</option>
        </Select>
      </Field>
      <Field label="العنوان">
        <Input value={address} onChange={(e) => setAddress(e.target.value)} />
      </Field>
      <Field label="المنطقة">
        <Input value={region} onChange={(e) => setRegion(e.target.value)} />
      </Field>
      <FormActions
        busy={busy}
        error={error}
        record={r}
        blockedReason={r && hasActive(circles, (c) => c.mosqueId === r.id) ? "لا يمكن أرشفة مسجد فيه حلقات نشطة. أرشف الحلقات أولًا." : undefined}
        onArchive={async (reason) => { await archiveRecord("mosque", r!.id, r!.version, reason, user); onDone(); }}
        onRestore={async () => { await restoreRecord("mosque", r!.id, r!.version, user); onDone(); }}
      />
    </form>
  );
}

function CircleForm({ editing, all, centers, onDone }: { editing: Extract<Editing, { kind: "circle" }>; all: Circle[]; centers: Center[]; onDone: () => void }) {
  const user = useAdminUser();
  const { record: r, parent } = editing;
  const periods = useCollection("period");
  const programs = useCollection("program");
  const curricula = useCollection("curriculum");
  const organizationId = centers.find((c) => c.id === parent.centerId)?.organizationId;

  const [name, setName] = useState(r?.name ?? "");
  const [type, setType] = useState(r?.type ?? "عامة");
  const [periodId, setPeriodId] = useState(r?.periodId ?? "");
  const [programId, setProgramId] = useState(r?.programId ?? "");
  const [curriculumId, setCurriculumId] = useState(r?.curriculumId ?? "");
  const [weekdays, setWeekdays] = useState<number[]>(r?.weekdays ?? [0, 1, 2, 3, 4]);
  const [capacity, setCapacity] = useState(String(r?.capacity ?? 20));
  const [status, setStatus] = useState(r?.status ?? "active");
  const { busy, error, setError, run } = useSave(onDone);

  const orgPeriods = (periods.data ?? []).filter((p) => p.organizationId === organizationId && (!p.archivedAt || p.id === r?.periodId));
  const orgPrograms = (programs.data ?? []).filter((p) => p.organizationId === organizationId && (!p.archivedAt || p.id === r?.programId));
  const programCurricula = (curricula.data ?? []).filter((c) => c.programId === programId && (!c.archivedAt || c.id === r?.curriculumId));

  function toggleDay(d: number) {
    setWeekdays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const cap = Number(capacity);
    if (!periodId) return setError("اختر الفترة.");
    if (weekdays.length === 0) return setError("اختر يومًا واحدًا على الأقل.");
    if (!Number.isInteger(cap) || cap <= 0) return setError("السعة عدد صحيح أكبر من صفر.");
    if (all.some((c) => c.id !== r?.id && c.mosqueId === parent.id && !c.archivedAt && sameName(c.name, name)))
      return setError("توجد حلقة نشطة بالاسم نفسه في هذا المسجد.");
    const fields = {
      name: name.trim(),
      type: type.trim() || "عامة",
      periodId,
      programId: programId || null,
      curriculumId: programId && curriculumId ? curriculumId : null,
      weekdays,
      capacity: cap,
      status,
    };
    run(() =>
      r
        ? updateRecord("circle", r.id, r.version, fields, user)
        : createRecord("circle", (id) => ({ ...fields, mosqueId: parent.id, path: `${parent.path}.${id}` }), user),
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <p className="text-[15px] text-ink-muted">ضمن: {parent.name}</p>
      <Field label="اسم الحلقة">
        <Input required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <Field label="النوع">
        <Input value={type} onChange={(e) => setType(e.target.value)} />
      </Field>
      {periods.data && orgPeriods.length === 0 ? (
        <Notice tone="error">
          لا توجد فترات لهذه الجهة. <Link href="/login/periods" className="font-medium underline">أضف فترة أولًا</Link>.
        </Notice>
      ) : (
        <Field label="الفترة">
          <Select required value={periodId} onChange={(e) => setPeriodId(e.target.value)}>
            <option value="">اختر الفترة</option>
            {orgPeriods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.startTime}–{p.endTime})
              </option>
            ))}
          </Select>
        </Field>
      )}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[15px] font-medium">أيام الدراسة</legend>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((label, d) => {
            const on = weekdays.includes(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                onClick={() => toggleDay(d)}
                className={`min-h-10 rounded-full px-4 text-[15px] transition-colors ${on ? "bg-accent text-accent-ink" : "ring-1 ring-line hover:bg-surface-2"}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <Field label="السعة">
        <Input type="number" min={1} inputMode="numeric" dir="ltr" required value={capacity} onChange={(e) => setCapacity(e.target.value)} />
      </Field>
      <Field label="البرنامج (اختياري)">
        <Select value={programId} onChange={(e) => { setProgramId(e.target.value); setCurriculumId(""); }}>
          <option value="">بدون</option>
          {orgPrograms.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </Field>
      {programId && (
        <Field label="المنهج (اختياري)">
          <Select value={curriculumId} onChange={(e) => setCurriculumId(e.target.value)}>
            <option value="">بدون</option>
            {programCurricula.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="الحالة">
        <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="active">نشطة</option>
          <option value="suspended">موقوفة</option>
        </Select>
      </Field>
      <FormActions
        busy={busy}
        error={error}
        record={r}
        onArchive={async (reason) => { await archiveRecord("circle", r!.id, r!.version, reason, user); onDone(); }}
        onRestore={async () => { await restoreRecord("circle", r!.id, r!.version, user); onDone(); }}
      />
    </form>
  );
}
