"use client";

import { useState, type FormEvent } from "react";
import { ClockCounterClockwise, Plus } from "@phosphor-icons/react";
import { useAdminUser } from "@/components/admin/AuthProvider";
import { Btn, Field, Input, Notice, Textarea } from "@/components/admin/ui";
import { DEFAULT_SETTINGS, DEFAULTS_EFFECTIVE_FROM } from "@/lib/etqan/settings";
import { addSettingVersion, errorText, resolveEffective, today, useCollection } from "@/lib/etqan/store";
import type { SettingVersion } from "@/lib/etqan/types";
import { Badge, Card, Empty, formatDate, PageHeader, Sheet, Skeleton } from "./kit";

export function SettingsManager() {
  const user = useAdminUser();
  const settings = useCollection("setting");
  const [editing, setEditing] = useState<{ key: string; versions: SettingVersion[] } | null>(null);
  const [history, setHistory] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");

  const byKey = new Map<string, SettingVersion[]>();
  for (const s of settings.data ?? []) byKey.set(s.key, [...(byKey.get(s.key) ?? []), s].sort((a, b) => b.version - a.version));
  const missing = DEFAULT_SETTINGS.filter((d) => !byKey.has(d.key));
  const keys = [...DEFAULT_SETTINGS.map((d) => d.key), ...[...byKey.keys()].filter((k) => !DEFAULT_SETTINGS.some((d) => d.key === k))];

  async function seedDefaults() {
    setSeeding(true);
    setError("");
    try {
      for (const d of missing) await addSettingVersion(d.key, 1, DEFAULTS_EFFECTIVE_FROM, d.value, d.reason, user);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSeeding(false);
    }
  }

  return (
    <>
      <PageHeader
        title="الإعدادات"
        description="كل تغيير يُنشئ إصدارًا جديدًا بتاريخ سريان ولا يمحو ما قبله، ويُسجَّل في سجل التدقيق. القيمة السارية هي أحدث إصدار بدأ سريانه."
      />
      {(settings.error || error) && <Notice tone="error">{settings.error || error}</Notice>}

      {!settings.data ? (
        <Skeleton rows={4} />
      ) : (
        <>
          {missing.length > 0 && (
            <div className="mb-6">
              <Empty
                title={missing.length === DEFAULT_SETTINGS.length ? "لم تُهيَّأ الإعدادات بعد" : `${missing.length} إعدادات لم تُهيَّأ`}
                body="أنشئ الإصدار الأول بالقيم المعتمدة في وثيقة اتقان: التجميد 4 أيام، وتنبيه 5 أوجه، ودرجات الاختبار، ومعامل السور القصيرة."
                action={
                  <Btn onClick={seedDefaults} loading={seeding}>
                    تهيئة القيم المعتمدة
                  </Btn>
                }
              />
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {keys
              .filter((k) => byKey.has(k))
              .map((key) => {
                const versions = byKey.get(key)!;
                const def = DEFAULT_SETTINGS.find((d) => d.key === key);
                const current = resolveEffective(versions, today());
                const pending = versions.filter((v) => v.effectiveFrom > today());
                return (
                  <Card key={key} className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-display text-lg font-semibold">{def?.label ?? key}</h2>
                        <p className="text-[13px] text-ink-muted" dir="ltr">{key}</p>
                      </div>
                      <Badge tone="accent">الإصدار {current?.version ?? "—"}</Badge>
                    </div>
                    {def && <p className="text-[15px] leading-relaxed text-ink-muted">{def.description}</p>}
                    <pre dir="ltr" className="max-h-48 overflow-auto rounded-xl bg-surface-2/70 p-3 text-[13px] leading-relaxed">
                      {current ? JSON.stringify(current.value, null, 2) : "لا قيمة سارية اليوم"}
                    </pre>
                    {pending.length > 0 && (
                      <p className="text-[15px] text-ink-muted">
                        <Badge tone="warn">مجدول</Badge> الإصدار {pending[0].version} يسري من {pending[0].effectiveFrom}
                      </p>
                    )}
                    <div className="mt-auto flex flex-wrap gap-2 pt-2">
                      <Btn variant="ghost" className="min-h-9 px-3" onClick={() => setEditing({ key, versions })}>
                        <Plus size={16} />
                        إصدار جديد
                      </Btn>
                      <Btn variant="ghost" className="min-h-9 px-3" onClick={() => setHistory(key)}>
                        <ClockCounterClockwise size={16} />
                        السجل ({versions.length})
                      </Btn>
                    </div>
                  </Card>
                );
              })}
          </div>
        </>
      )}

      <Sheet open={!!editing} onClose={() => setEditing(null)} title="إصدار جديد">
        {editing && <VersionForm settingKey={editing.key} versions={editing.versions} onDone={() => setEditing(null)} />}
      </Sheet>
      <Sheet open={!!history} onClose={() => setHistory(null)} title="سجل الإصدارات">
        {history && (
          <ol className="flex flex-col gap-4">
            {byKey.get(history)!.map((v) => (
              <li key={v.id} className="rounded-2xl bg-surface p-4 ring-1 ring-line">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">الإصدار {v.version}</span>
                  <span className="text-[15px] text-ink-muted">يسري من {v.effectiveFrom}</span>
                </div>
                {v.reason && <p className="mb-2 text-[15px]">{v.reason}</p>}
                <pre dir="ltr" className="overflow-auto rounded-xl bg-surface-2/70 p-3 text-[13px]">{JSON.stringify(v.value, null, 2)}</pre>
                <p className="mt-2 text-[13px] text-ink-muted">{formatDate(v.createdAt)}</p>
              </li>
            ))}
          </ol>
        )}
      </Sheet>
    </>
  );
}

function VersionForm({ settingKey, versions, onDone }: { settingKey: string; versions: SettingVersion[]; onDone: () => void }) {
  const user = useAdminUser();
  const latest = versions[0];
  const [text, setText] = useState(JSON.stringify(resolveEffective(versions, today())?.value ?? latest.value, null, 2));
  const [effectiveFrom, setEffectiveFrom] = useState(today());
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch {
      return setError("القيمة ليست JSON صحيحًا. راجع الأقواس والفواصل وعلامات التنصيص.");
    }
    setBusy(true);
    setError("");
    try {
      await addSettingVersion(settingKey, latest.version + 1, effectiveFrom, value, reason.trim(), user);
      onDone();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <p className="text-[15px] text-ink-muted" dir="ltr">{settingKey} · v{latest.version + 1}</p>
      <Field label="القيمة (JSON)">
        <Textarea dir="ltr" rows={10} value={text} onChange={(e) => setText(e.target.value)} className="font-mono text-[15px]" spellCheck={false} />
      </Field>
      <Field label="تاريخ السريان" hint="يمكن جدولة التغيير لتاريخ لاحق.">
        <Input type="date" dir="ltr" required value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
      </Field>
      <Field label="سبب التغيير">
        <Input required minLength={3} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      {error && <Notice tone="error">{error}</Notice>}
      <Btn type="submit" loading={busy}>
        حفظ الإصدار
      </Btn>
    </form>
  );
}
