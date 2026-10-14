"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { BookBookmark, ListBullets, PencilSimple, Plus, Stack } from "@phosphor-icons/react";
import { useAdminUser } from "@/components/admin/AuthProvider";
import { Btn, Field, Input, Notice, Textarea } from "@/components/admin/ui";
import { archiveRecord, createRecord, errorText, restoreRecord, updateRecord, useCollection } from "@/lib/etqan/store";
import type { Course, Curriculum, Organization, Program } from "@/lib/etqan/types";
import { ArchiveControl, Badge, Card, Empty, PageHeader, Select, Sheet, ShowArchivedToggle, Skeleton } from "./kit";

type Editing =
  | { kind: "program"; record?: Program }
  | { kind: "curriculum"; record?: Curriculum; parent: Program }
  | { kind: "course"; record?: Course; parent: Curriculum };

const TITLES = { program: "برنامج", curriculum: "منهج", course: "مقرر" };

export function ProgramsManager() {
  const orgs = useCollection("organization");
  const programs = useCollection("program");
  const curricula = useCollection("curriculum");
  const courses = useCollection("course");
  const circles = useCollection("circle");
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null);

  const activeOrgs = (orgs.data ?? []).filter((o) => !o.archivedAt);
  const visible = <T extends { archivedAt: number | null; name: string }>(rows: T[]) =>
    rows.filter((r) => showArchived || !r.archivedAt).sort((a, b) => a.name.localeCompare(b.name, "ar"));
  const archivedCount = [programs, curricula, courses].reduce((n, c) => n + (c.data ?? []).filter((r) => r.archivedAt).length, 0);
  const error = orgs.error || programs.error || curricula.error || courses.error;

  return (
    <>
      <PageHeader
        title="البرامج والمناهج"
        description="البرنامج يحوي مناهج، والمنهج يحوي مقررات بمستويات. تُربط الحلقة ببرنامج ومنهج من شاشة الهيكل التنظيمي."
        action={
          <Btn onClick={() => setEditing({ kind: "program" })} disabled={activeOrgs.length === 0}>
            <Plus size={18} />
            إضافة برنامج
          </Btn>
        }
      />
      {error && <Notice tone="error">{error}</Notice>}
      {orgs.data && activeOrgs.length === 0 && <Notice>أضف جهة من «الهيكل التنظيمي» أولًا، ثم أضف برامجها.</Notice>}

      <div className="my-4 flex justify-end">
        <ShowArchivedToggle value={showArchived} onChange={setShowArchived} count={archivedCount} />
      </div>

      {!programs.data || !curricula.data || !courses.data ? (
        <Skeleton rows={3} />
      ) : visible(programs.data).length === 0 ? (
        activeOrgs.length > 0 && (
          <Empty title="لا توجد برامج بعد" body="مثال: «برنامج الحفظ» ومنهجه «المستوى الأول» ومقرراته." action={<Btn onClick={() => setEditing({ kind: "program" })}>إضافة برنامج</Btn>} />
        )
      ) : (
        <div className="flex flex-col gap-5">
          {visible(programs.data).map((program) => (
            <Card key={program.id} className={program.archivedAt ? "opacity-60" : ""}>
              <Row
                icon={<Stack size={22} />}
                title={program.name}
                sub={program.targets}
                archived={!!program.archivedAt}
                big
                onEdit={() => setEditing({ kind: "program", record: program })}
                onAdd={program.archivedAt ? undefined : () => setEditing({ kind: "curriculum", parent: program })}
                addLabel="منهج"
              />
              <div className="mt-6 flex flex-col gap-6 border-s-2 border-accent-soft ps-5 md:ps-8">
                {visible((curricula.data ?? []).filter((c) => c.programId === program.id)).map((cur) => (
                  <div key={cur.id} className={cur.archivedAt ? "opacity-60" : ""}>
                    <Row
                      icon={<BookBookmark size={20} />}
                      title={cur.name}
                      sub={cur.level != null ? `المستوى ${cur.level}` : ""}
                      archived={!!cur.archivedAt}
                      onEdit={() => setEditing({ kind: "curriculum", record: cur, parent: program })}
                      onAdd={cur.archivedAt ? undefined : () => setEditing({ kind: "course", parent: cur })}
                      addLabel="مقرر"
                    />
                    <ul className="mt-4 flex flex-wrap gap-2.5">
                      {visible((courses.data ?? []).filter((c) => c.curriculumId === cur.id)).map((course) => (
                        <li key={course.id}>
                          <button
                            type="button"
                            onClick={() => setEditing({ kind: "course", record: course, parent: cur })}
                            className={`inline-flex items-center gap-2 rounded-full bg-surface-2/70 px-4 py-2 text-[15px] ring-1 ring-transparent transition hover:ring-line ${course.archivedAt ? "opacity-60" : ""}`}
                          >
                            <ListBullets size={16} className="text-accent" />
                            {course.name}
                            {course.level != null && <span className="text-ink-muted">· {course.level}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing ? `${editing.record ? "تعديل" : "إضافة"} ${TITLES[editing.kind]}` : ""}>
        {editing && (
          <ItemForm
            key={editing.kind + (editing.record?.id ?? "new")}
            editing={editing}
            orgs={activeOrgs}
            siblings={
              editing.kind === "program"
                ? programs.data ?? []
                : editing.kind === "curriculum"
                  ? (curricula.data ?? []).filter((c) => c.programId === editing.parent.id)
                  : (courses.data ?? []).filter((c) => c.curriculumId === editing.parent.id)
            }
            blockedReason={blockedReason(editing, curricula.data ?? [], courses.data ?? [], circles.data ?? [])}
            onDone={() => setEditing(null)}
          />
        )}
      </Sheet>
    </>
  );
}

function blockedReason(
  editing: Editing,
  curricula: Curriculum[],
  courses: Course[],
  circles: { programId: string | null; curriculumId: string | null; archivedAt: number | null }[],
): string | undefined {
  const r = editing.record;
  if (!r) return undefined;
  if (editing.kind === "program") {
    if (curricula.some((c) => c.programId === r.id && !c.archivedAt)) return "لا يمكن أرشفة برنامج تحته مناهج نشطة. أرشف المناهج أولًا.";
    if (circles.some((c) => c.programId === r.id && !c.archivedAt)) return "هذا البرنامج مرتبط بحلقات نشطة. غيّر برنامجها أولًا.";
  }
  if (editing.kind === "curriculum") {
    if (courses.some((c) => c.curriculumId === r.id && !c.archivedAt)) return "لا يمكن أرشفة منهج تحته مقررات نشطة. أرشف المقررات أولًا.";
    if (circles.some((c) => c.curriculumId === r.id && !c.archivedAt)) return "هذا المنهج مرتبط بحلقات نشطة. غيّر منهجها أولًا.";
  }
  return undefined;
}

function Row({ icon, title, sub, archived, big, onEdit, onAdd, addLabel }: {
  icon: ReactNode;
  title: string;
  sub: string;
  archived: boolean;
  big?: boolean;
  onEdit: () => void;
  onAdd?: () => void;
  addLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">{icon}</span>
        <div className="min-w-0">
          <p className={`flex flex-wrap items-center gap-2 font-display leading-snug font-semibold ${big ? "text-[1.35rem]" : "text-[17px]"}`}>
            {title}
            {archived && <Badge tone="muted">مؤرشف</Badge>}
          </p>
          {sub && <p className="mt-0.5 line-clamp-2 text-[15px] leading-7 text-ink-muted">{sub}</p>}
        </div>
      </div>
      <div className="flex gap-2">
        <Btn variant="ghost" onClick={onEdit} className="min-h-9 px-3">
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

function ItemForm({ editing, orgs, siblings, blockedReason, onDone }: {
  editing: Editing;
  orgs: Organization[];
  siblings: { id: string; name: string; archivedAt: number | null }[];
  blockedReason?: string;
  onDone: () => void;
}) {
  const user = useAdminUser();
  const r = editing.record;
  const [organizationId, setOrganizationId] = useState(editing.kind === "program" ? editing.record?.organizationId ?? orgs[0]?.id ?? "" : "");
  const [name, setName] = useState(r?.name ?? "");
  const [targets, setTargets] = useState(editing.kind === "program" ? editing.record?.targets ?? "" : "");
  const [level, setLevel] = useState(editing.kind !== "program" && editing.record?.level != null ? String(editing.record.level) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (siblings.some((s) => s.id !== r?.id && !s.archivedAt && s.name.trim() === name.trim())) return setError("يوجد سجل نشط بالاسم نفسه.");
    const lvl = level.trim() === "" ? null : Number(level);
    if (lvl !== null && !Number.isInteger(lvl)) return setError("المستوى رقم صحيح.");
    setBusy(true);
    setError("");
    try {
      if (editing.kind === "program") {
        const fields = { name: name.trim(), targets: targets.trim() };
        if (editing.record) await updateRecord("program", editing.record.id, editing.record.version, fields, user);
        else await createRecord("program", { ...fields, organizationId }, user);
      } else if (editing.kind === "curriculum") {
        const fields = { name: name.trim(), level: lvl };
        if (editing.record) await updateRecord("curriculum", editing.record.id, editing.record.version, fields, user);
        else await createRecord("curriculum", { ...fields, programId: editing.parent.id }, user);
      } else {
        const fields = { name: name.trim(), level: lvl };
        if (editing.record) await updateRecord("course", editing.record.id, editing.record.version, fields, user);
        else await createRecord("course", { ...fields, curriculumId: editing.parent.id }, user);
      }
      onDone();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {editing.kind !== "program" && <p className="text-[15px] text-ink-muted">ضمن: {editing.parent.name}</p>}
      {editing.kind === "program" && !r && orgs.length > 1 && (
        <Field label="الجهة">
          <Select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)}>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="الاسم">
        <Input required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      {editing.kind === "program" ? (
        <Field label="الأهداف" hint="اختياري: ما يحققه الطالب في هذا البرنامج.">
          <Textarea rows={4} value={targets} onChange={(e) => setTargets(e.target.value)} />
        </Field>
      ) : (
        <Field label="المستوى" hint="اختياري.">
          <Input type="number" inputMode="numeric" dir="ltr" value={level} onChange={(e) => setLevel(e.target.value)} />
        </Field>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      <Btn type="submit" loading={busy} disabled={!!r?.archivedAt}>
        حفظ
      </Btn>
      {r && (
        <div className="mt-4 border-t border-line pt-5">
          <ArchiveControl
            archived={!!r.archivedAt}
            blockedReason={blockedReason}
            onArchive={async (reason) => { await archiveRecord(editing.kind, r.id, r.version, reason, user); onDone(); }}
            onRestore={async () => { await restoreRecord(editing.kind, r.id, r.version, user); onDone(); }}
          />
        </div>
      )}
    </form>
  );
}
