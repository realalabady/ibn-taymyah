"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2.5">
      <span className="text-[15px] font-medium">{label}</span>
      {children}
      {hint && !error && <span className="text-[15px] text-ink-muted">{hint}</span>}
      {error && <span className="text-[15px] text-red-600">{error}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-2xl bg-surface px-4 py-3 text-ink ring-1 ring-line transition-shadow duration-200 placeholder:text-ink-muted/70 focus:ring-2 focus:ring-accent focus:outline-none";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputBase} leading-loose ${props.className ?? ""}`} />;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger"; loading?: boolean };

export function Btn({ variant = "primary", loading, children, className = "", disabled, ...rest }: BtnProps) {
  const styles = {
    primary: "bg-accent text-accent-ink hover:brightness-110",
    ghost: "ring-1 ring-line hover:bg-surface-2",
    danger: "text-red-700 ring-1 ring-red-600/25 hover:bg-red-600/10",
  }[variant];
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-medium whitespace-nowrap transition-[transform,background-color,filter] duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${styles} ${className}`}
    >
      {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}

// Delete button that asks for a second click instead of opening a dialog.
export function ConfirmDelete({ onConfirm, label = "حذف" }: { onConfirm: () => Promise<void> | void; label?: string }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <Btn
      type="button"
      variant="danger"
      loading={busy}
      onClick={async () => {
        if (!armed) {
          setArmed(true);
          timer.current = setTimeout(() => setArmed(false), 3500);
          return;
        }
        if (timer.current) clearTimeout(timer.current);
        setBusy(true);
        try {
          await onConfirm();
        } finally {
          setBusy(false);
          setArmed(false);
        }
      }}
    >
      {armed ? "اضغط للتأكيد" : label}
    </Btn>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: ReactNode }) {
  const styles = {
    info: "bg-surface-2 text-ink",
    error: "bg-red-600/10 text-red-700",
    success: "bg-accent-soft text-accent",
  }[tone];
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-2xl px-4 py-3 text-[15px] ${styles}`}>
      {children}
    </p>
  );
}
