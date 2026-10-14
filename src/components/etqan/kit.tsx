"use client";

import { useEffect, useState, type ReactNode, type SelectHTMLAttributes } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Archive, ArrowCounterClockwise, X } from "@phosphor-icons/react";
import { motionTokens } from "@/lib/motion";
import { Btn, Field, Input, Notice } from "@/components/admin/ui";

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-2xl">
        <h1 className="font-display text-[1.9rem] leading-tight font-semibold text-balance md:text-4xl">{title}</h1>
        {description && <p className="mt-3 text-[17px] leading-8 text-pretty text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full appearance-none rounded-2xl bg-surface bg-[length:12px] bg-[left_1rem_center] bg-no-repeat px-4 py-3 text-ink ring-1 ring-line transition-shadow duration-200 focus:ring-2 focus:ring-accent focus:outline-none ${props.className ?? ""}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5 6 6.5l5-5' fill='none' stroke='%23536255' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
      }}
    >
      {children}
    </select>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[1.75rem] bg-surface p-6 ring-1 ring-line md:p-7 ${className}`}>{children}</div>;
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[1.75rem] border border-dashed border-line px-6 py-14 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="max-w-sm text-[15px] leading-7 text-pretty text-ink-muted">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-label="جارٍ التحميل" aria-busy>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-2" />
      ))}
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "accent" | "warn" | "muted"; children: ReactNode }) {
  const styles = {
    neutral: "bg-surface-2 text-ink",
    accent: "bg-accent-soft text-accent",
    warn: "bg-sun-soft text-[#6b5a00]",
    muted: "bg-surface-2 text-ink-muted",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[13px] leading-5 font-medium whitespace-nowrap ${styles}`}>{children}</span>;
}

/** نافذة جانبية للنماذج. تُغلق بـ Esc أو بالنقر خارجها. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal aria-label={title}>
          <motion.div
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionTokens.duration.fast }}
            onClick={onClose}
          />
          <motion.div
            className="absolute inset-y-0 left-0 flex w-full max-w-lg flex-col bg-bg shadow-soft"
            initial={reduce ? { opacity: 0 } : { x: "-100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "-100%" }}
            transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth }}
          >
            <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
              <h2 className="font-display text-xl font-semibold">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق"
                className="grid size-10 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** أرشفة بسبب إلزامي (لا حذف نهائي)، أو استعادة للسجل المؤرشف. */
export function ArchiveControl({
  archived,
  onArchive,
  onRestore,
  blockedReason,
}: {
  archived: boolean;
  onArchive: (reason: string) => Promise<void>;
  onRestore: () => Promise<void>;
  blockedReason?: string;
}) {
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      setAsking(false);
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر التنفيذ.");
    } finally {
      setBusy(false);
    }
  }

  if (archived) {
    return (
      <div className="flex flex-col gap-3">
        <Btn type="button" variant="ghost" loading={busy} onClick={() => run(onRestore)}>
          <ArrowCounterClockwise size={18} />
          استعادة
        </Btn>
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    );
  }

  if (!asking) {
    return (
      <Btn type="button" variant="danger" onClick={() => setAsking(true)}>
        <Archive size={18} />
        أرشفة
      </Btn>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface-2/60 p-4">
      {blockedReason ? (
        <Notice tone="error">{blockedReason}</Notice>
      ) : (
        <Field label="سبب الأرشفة" hint="السبب إلزامي ويُحفظ في سجل التدقيق.">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
        </Field>
      )}
      <div className="flex gap-2">
        {!blockedReason && (
          <Btn type="button" variant="danger" loading={busy} disabled={reason.trim().length < 3} onClick={() => run(() => onArchive(reason.trim()))}>
            تأكيد الأرشفة
          </Btn>
        )}
        <Btn type="button" variant="ghost" onClick={() => setAsking(false)}>
          تراجع
        </Btn>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}

export function ShowArchivedToggle({ value, onChange, count }: { value: boolean; onChange: (v: boolean) => void; count: number }) {
  if (count === 0 && !value) return null;
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-[15px] text-ink-muted">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[var(--accent)]" />
      إظهار المؤرشف ({count})
    </label>
  );
}

export function formatDate(ms: number) {
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { dateStyle: "medium", timeStyle: "short" }).format(ms);
}
