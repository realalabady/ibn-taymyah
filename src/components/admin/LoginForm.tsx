"use client";

import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { motion, useReducedMotion } from "motion/react";
import { auth } from "@/lib/firebase/client";
import { motionTokens } from "@/lib/motion";
import { LogoFull } from "@/components/site/Logo";
import { Btn, Field, Input, Notice } from "./ui";

function messageFor(error: unknown) {
  if (error instanceof FirebaseError) {
    if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found", "auth/invalid-email"].includes(error.code)) {
      return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    }
    if (error.code === "auth/too-many-requests") return "محاولات كثيرة. انتظر قليلاً ثم حاول مرة أخرى.";
    if (error.code === "auth/network-request-failed") return "تعذّر الاتصال. تحقق من الإنترنت.";
  }
  return "حدث خطأ غير متوقع. حاول مرة أخرى.";
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const reduce = useReducedMotion();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(messageFor(err));
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-16">
      <motion.div
        className="w-full max-w-md"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: motionTokens.easing.smooth }}
      >
        <div className="mb-8 flex justify-center">
          <LogoFull className="w-36" />
        </div>
        <div className="rounded-[2rem] bg-surface-2/70 p-2 ring-1 ring-line">
          <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-[1.5rem] bg-surface p-7 shadow-soft md:p-9">
            <div>
              <h1 className="font-display text-2xl font-semibold">دخول لوحة التحكم</h1>
              <p className="mt-1 text-ink-muted">خاص بإدارة المجمع: الحلقات والمستخدمون ومحتوى الموقع.</p>
            </div>
            <Field label="البريد الإلكتروني">
              <Input type="email" dir="ltr" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="كلمة المرور">
              <Input
                type="password"
                dir="ltr"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {error && <Notice tone="error">{error}</Notice>}
            <Btn type="submit" loading={loading} className="mt-1 w-full">
              دخول
            </Btn>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
