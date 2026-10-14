"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Eye, EyeSlash, MagnifyingGlass, Plus, Trash, UserCircle } from "@phosphor-icons/react";
import { useAdminUser } from "@/components/admin/AuthProvider";
import { Btn, Field, Input, Notice } from "@/components/admin/ui";
import { canAssignRole, GRANTABLE, isActive, PERM_LABELS, ROLE_DEFAULTS, ROLE_INFO, ROLES, type Role } from "@/lib/etqan/iam";
import { useScopeOptions } from "@/lib/etqan/scopes";
import { archiveRecord, createRecord, errorText, restoreRecord, today, updateRecord, useCollection } from "@/lib/etqan/store";
import { isValidNationalId, isValidSaudiMobile, mask, matchesSearch, normalizeArabic, normalizeNationalId, normalizePhone } from "@/lib/etqan/text";
import type { Account, Grant, RoleAssignment } from "@/lib/etqan/types";
import { ArchiveControl, Badge, Empty, PageHeader, Select, Sheet, ShowArchivedToggle, Skeleton } from "./kit";

// مدير الموقع يعمل بدور مدير الجمعية (OA)، فيمنح الأدوار الأدنى فقط.
const ACTOR_ROLES: Role[] = ["OA"];
// PA بلا حساب مستقل (يدخل بحساب الطالب) · GU زائر بلا حساب · SA على مستوى المنصة.
const NO_ACCOUNT: Role[] = ["SA", "PA", "GU"];

function assignableRoles(accountType: Account["accountType"]): Role[] {
  if (accountType === "student") return ["SD"];
  return ROLES.filter((r) => r !== "SD" && !NO_ACCOUNT.includes(r) && canAssignRole(ACTOR_ROLES, r));
}

export function UsersManager() {
  const accounts = useCollection("account");
  const scopes = useScopeOptions();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | Account["accountType"]>("");
  const [roleFilter, setRoleFilter] = useState<"" | Role>("");
  const [showArchived, setShowArchived] = useState(false);
  const [unmask, setUnmask] = useState(false);
  const [editing, setEditing] = useState<{ record?: Account } | null>(null);

  const rows = useMemo(() => {
    const q = query.trim();
    const digits = normalizeNationalId(q);
    return (accounts.data ?? [])
      .filter((a) => showArchived || !a.archivedAt)
      .filter((a) => !typeFilter || a.accountType === typeFilter)
      .filter((a) => !roleFilter || a.roles.some((r) => r.role === roleFilter))
      .filter((a) => !q || matchesSearch(q, a.fullName) || (/^\d{3,}$/.test(digits) && (a.nationalId.includes(digits) || a.phone.includes(digits))))
      .sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
  }, [accounts.data, query, typeFilter, roleFilter, showArchived]);

  return (
    <>
      <PageHeader
        title="المستخدمون والصلاحيات"
        description="الحسابات بالهوية، والأدوار بنطاق من الهيكل التنظيمي، والتفويضات الإضافية. الهوية والجوال مخفيان افتراضيًا."
        action={
          <Btn onClick={() => setEditing({})}>
            <Plus size={18} />
            إضافة مستخدم
          </Btn>
        }
      />
      {accounts.error && <Notice tone="error">{accounts.error}</Notice>}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <MagnifyingGlass size={18} className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink-muted" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث بالاسم أو الهوية أو الجوال" className="ps-11" aria-label="بحث" />
        </div>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} className="w-auto min-w-36" aria-label="نوع الحساب">
          <option value="">كل الحسابات</option>
          <option value="staff">الموظفون</option>
          <option value="student">الطلاب</option>
        </Select>
        <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)} className="w-auto min-w-40" aria-label="الدور">
          <option value="">كل الأدوار</option>
          {ROLES.filter((r) => !NO_ACCOUNT.includes(r)).map((r) => (
            <option key={r} value={r}>{ROLE_INFO[r].nameAr}</option>
          ))}
        </Select>
        <Btn variant="ghost" onClick={() => setUnmask((v) => !v)} aria-pressed={unmask}>
          {unmask ? <EyeSlash size={18} /> : <Eye size={18} />}
          {unmask ? "إخفاء البيانات" : "إظهار الهوية والجوال"}
        </Btn>
      </div>
      <div className="mb-4 flex justify-end">
        <ShowArchivedToggle value={showArchived} onChange={setShowArchived} count={(accounts.data ?? []).filter((a) => a.archivedAt).length} />
      </div>

      {!accounts.data ? (
        <Skeleton />
      ) : accounts.data.length === 0 ? (
        <Empty title="لا يوجد مستخدمون بعد" body="أضف المعلمين والمشرفين والإداريين، وامنح كلًا منهم دوره ونطاقه." action={<Btn onClick={() => setEditing({})}>إضافة مستخدم</Btn>} />
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-ink-muted">لا نتائج مطابقة.</p>
      ) : (
        <div className="overflow-hidden rounded-[1.5rem] ring-1 ring-line">
          <div aria-hidden className="hidden gap-2 bg-surface-2/70 px-5 py-3 text-[14px] font-medium text-ink-muted md:grid md:grid-cols-[1.4fr_1fr_1fr_1.6fr]">
            <span>الاسم</span>
            <span>الهوية</span>
            <span>الجوال</span>
            <span>الأدوار والنطاقات</span>
          </div>
          <ul className="divide-y divide-line bg-surface">
            {rows.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setEditing({ record: a })}
                  className={`grid w-full gap-2 px-5 py-4.5 text-start transition-colors hover:bg-surface-2/50 md:grid-cols-[1.4fr_1fr_1fr_1.6fr] md:items-center ${a.archivedAt ? "opacity-60" : ""}`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <UserCircle size={28} className="shrink-0 text-accent" />
                    <span className="min-w-0">
                      <span className="block truncate text-[16px] font-semibold">{a.fullName}</span>
                      <span className="flex gap-1.5 text-[13px] text-ink-muted">
                        {a.accountType === "student" ? "طالب" : "موظف"}
                        {a.status === "suspended" && <Badge tone="warn">موقوف</Badge>}
                        {a.archivedAt && <Badge tone="muted">مؤرشف</Badge>}
                      </span>
                    </span>
                  </span>
                  <span className="text-[15px] tabular-nums text-ink-muted" dir="ltr">
                    <span className="me-1 text-[13px] md:hidden">الهوية</span>
                    {unmask ? a.nationalId : mask(a.nationalId)}
                  </span>
                  <span className="text-[15px] tabular-nums text-ink-muted" dir="ltr">
                    {a.phone ? (unmask ? a.phone : mask(a.phone)) : "—"}
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    {a.roles.length === 0 ? (
                      <span className="text-[15px] text-ink-muted">بلا دور</span>
                    ) : (
                      a.roles.map((r, i) => (
                        <Badge key={i} tone={isActive(r, today()) ? "accent" : "muted"}>
                          {ROLE_INFO[r.role].nameAr} · {scopes.labelOf(r.scopePath)}
                        </Badge>
                      ))
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing?.record ? "تعديل مستخدم" : "إضافة مستخدم"}>
        {editing && <AccountForm key={editing.record?.id ?? "new"} record={editing.record} all={accounts.data ?? []} onDone={() => setEditing(null)} />}
      </Sheet>
    </>
  );
}

function AccountForm({ record: r, all, onDone }: { record?: Account; all: Account[]; onDone: () => void }) {
  const user = useAdminUser();
  const scopes = useScopeOptions();
  const [fullName, setFullName] = useState(r?.fullName ?? "");
  const [nationalId, setNationalId] = useState(r?.nationalId ?? "");
  const [phone, setPhone] = useState(r?.phone ?? "");
  const [email, setEmail] = useState(r?.email ?? "");
  const [accountType, setAccountType] = useState<Account["accountType"]>(r?.accountType ?? "staff");
  const [status, setStatus] = useState<Account["status"]>(r?.status ?? "active");
  const [roles, setRoles] = useState<RoleAssignment[]>(r?.roles ?? []);
  const [grants, setGrants] = useState<Grant[]>(r?.grants ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const roleChoices = assignableRoles(accountType);
  const grantable = Array.from(new Set(roles.flatMap((x) => GRANTABLE[x.role]))).filter(
    (p) => !roles.some((x) => ROLE_DEFAULTS[x.role].includes(p)),
  );

  function addRole() {
    setRoles((cur) => [...cur, { role: roleChoices[0], scopePath: scopes.options[0]?.path ?? "", validFrom: today(), validTo: null }]);
  }
  function patchRole(i: number, patch: Partial<RoleAssignment>) {
    setRoles((cur) => cur.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  }
  function toggleGrant(perm: string) {
    setGrants((cur) =>
      cur.some((g) => g.perm === perm) ? cur.filter((g) => g.perm !== perm) : [...cur, { perm, validFrom: today(), validTo: null, reason: "" }],
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const nid = normalizeNationalId(nationalId);
    const ph = phone.trim() ? normalizePhone(phone) : "";
    if (!isValidNationalId(nid)) return setError("رقم الهوية/الإقامة من 6 إلى 20 رقمًا.");
    if (all.some((a) => a.id !== r?.id && !a.archivedAt && a.nationalId === nid)) return setError("الهوية مسجلة لمستخدم نشط آخر.");
    if (accountType === "staff" && !ph) return setError("الجوال مطلوب للموظفين لأنه كلمة المرور الافتراضية.");
    if (ph && !isValidSaudiMobile(ph)) return setError("رقم الجوال غير صحيح. مثال: 0501234567");
    if (roles.some((x) => !x.scopePath)) return setError("اختر نطاقًا لكل دور.");
    if (roles.some((x) => x.validTo && x.validTo <= x.validFrom)) return setError("تاريخ انتهاء الدور يجب أن يكون بعد بدايته.");
    const keys = roles.map((x) => `${x.role}|${x.scopePath}`);
    if (new Set(keys).size !== keys.length) return setError("الدور نفسه مكرر على النطاق نفسه.");

    const validGrants = grants.filter((g) => grantable.includes(g.perm));
    const fields = {
      fullName: fullName.trim(),
      nameSearch: normalizeArabic(fullName),
      nationalId: nid,
      phone: ph,
      email: email.trim(),
      accountType,
      status,
      roles,
      grants: validGrants,
    };
    setBusy(true);
    setError("");
    try {
      if (r) await updateRecord("account", r.id, r.version, fields, user);
      else await createRecord("account", fields, user);
      onDone();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <Field label="الاسم الرباعي">
        <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="الهوية/الإقامة">
          <Input required inputMode="numeric" dir="ltr" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
        </Field>
        <Field label="الجوال">
          <Input inputMode="tel" dir="ltr" placeholder="05XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </div>
      <Field label="البريد الإلكتروني (اختياري)">
        <Input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="نوع الحساب">
          <Select
            value={accountType}
            disabled={!!r}
            onChange={(e) => {
              setAccountType(e.target.value as Account["accountType"]);
              setRoles([]);
              setGrants([]);
            }}
          >
            <option value="staff">موظف</option>
            <option value="student">طالب</option>
          </Select>
        </Field>
        <Field label="الحالة">
          <Select value={status} onChange={(e) => setStatus(e.target.value as Account["status"])}>
            <option value="active">نشط</option>
            <option value="suspended">موقوف</option>
          </Select>
        </Field>
      </div>
      <Notice>
        كلمة المرور الافتراضية: {accountType === "staff" ? "الجوال المسجل" : "123"}، دون إلزام بتغييرها. يُفعَّل دخول هذه الحسابات مع بوابة
        المعلمين لاحقًا.
      </Notice>

      <fieldset className="flex flex-col gap-3 border-t border-line pt-5">
        <legend className="sr-only">الأدوار والنطاقات</legend>
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-semibold">الأدوار والنطاقات</p>
          <Btn type="button" variant="ghost" className="min-h-9 px-3" onClick={addRole} disabled={scopes.options.length === 0}>
            <Plus size={16} />
            دور
          </Btn>
        </div>
        {scopes.options.length === 0 && !scopes.loading && <p className="text-[15px] text-ink-muted">أضف الهيكل التنظيمي أولًا لتختار النطاقات.</p>}
        {roles.map((x, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-2xl bg-surface-2/60 p-4">
            <div className="flex gap-2">
              <Select value={x.role} onChange={(e) => patchRole(i, { role: e.target.value as Role })} aria-label="الدور">
                {Array.from(new Set([...roleChoices, x.role])).map((role) => (
                  <option key={role} value={role}>{ROLE_INFO[role].nameAr}</option>
                ))}
              </Select>
              <button
                type="button"
                onClick={() => setRoles((cur) => cur.filter((_, k) => k !== i))}
                aria-label="إزالة الدور"
                className="grid size-12 shrink-0 place-items-center rounded-2xl text-red-700 ring-1 ring-red-600/25 hover:bg-red-600/10"
              >
                <Trash size={18} />
              </button>
            </div>
            <Select value={x.scopePath} onChange={(e) => patchRole(i, { scopePath: e.target.value })} aria-label="النطاق">
              {!scopes.options.some((o) => o.path === x.scopePath) && <option value={x.scopePath}>{scopes.labelOf(x.scopePath)}</option>}
              {scopes.options.map((o) => (
                <option key={o.path} value={o.path}>
                  {"   ".repeat(o.depth)}
                  {scopes.kindLabel[o.kind]}: {o.label}
                </option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Field label="من">
                <Input type="date" dir="ltr" value={x.validFrom} onChange={(e) => patchRole(i, { validFrom: e.target.value })} />
              </Field>
              <Field label="إلى (للمؤقت)">
                <Input type="date" dir="ltr" value={x.validTo ?? ""} onChange={(e) => patchRole(i, { validTo: e.target.value || null })} />
              </Field>
            </div>
          </div>
        ))}
      </fieldset>

      {grantable.length > 0 && (
        <fieldset className="flex flex-col gap-3 border-t border-line pt-5">
          <legend className="font-display text-lg font-semibold">تفويضات إضافية</legend>
          <p className="text-[15px] text-ink-muted">صلاحيات لا تأتي مع الدور وتُمنح صراحة (مثل التصدير ورؤية الهوية).</p>
          <div className="flex flex-col gap-2">
            {grantable.map((perm) => (
              <label key={perm} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-surface-2/60">
                <input type="checkbox" checked={grants.some((g) => g.perm === perm)} onChange={() => toggleGrant(perm)} className="size-4 accent-[var(--accent)]" />
                <span className="text-[15px]">{PERM_LABELS[perm] ?? perm}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {error && <Notice tone="error">{error}</Notice>}
      <Btn type="submit" loading={busy} disabled={!!r?.archivedAt}>
        حفظ
      </Btn>
      {r && (
        <div className="mt-4 border-t border-line pt-5">
          <ArchiveControl
            archived={!!r.archivedAt}
            onArchive={async (reason) => { await archiveRecord("account", r.id, r.version, reason, user); onDone(); }}
            onRestore={async () => {
              if (all.some((a) => a.id !== r.id && !a.archivedAt && a.nationalId === r.nationalId)) throw new Error("الهوية مسجلة الآن لمستخدم نشط آخر.");
              await restoreRecord("account", r.id, r.version, user);
              onDone();
            }}
          />
        </div>
      )}
    </form>
  );
}
