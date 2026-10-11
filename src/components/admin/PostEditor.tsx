"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { ArrowRight, ImageSquare } from "@phosphor-icons/react";
import { db, storage } from "@/lib/firebase/client";
import { uploadFile, validateFile, kindOf } from "@/lib/upload";
import { publishChanges, useAdminUser } from "./AuthProvider";
import { Btn, Field, Input, Notice, Textarea } from "./ui";

type Draft = {
  title: string;
  excerpt: string;
  body: string;
  published: boolean;
  coverUrl: string | null;
  coverPath: string | null;
};

const empty: Draft = { title: "", excerpt: "", body: "", published: true, coverUrl: null, coverPath: null };

export function PostEditor() {
  const user = useAdminUser();
  const router = useRouter();
  const id = useSearchParams().get("id");
  const [draft, setDraft] = useState<Draft>(empty);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [coverProgress, setCoverProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const replacedCovers = useRef<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "posts", id))
      .then((snap) => {
        if (!snap.exists()) {
          setError("المقال غير موجود.");
          return;
        }
        const d = snap.data();
        setDraft({
          title: d.title ?? "",
          excerpt: d.excerpt ?? "",
          body: d.body ?? "",
          published: Boolean(d.published),
          coverUrl: d.coverUrl ?? null,
          coverPath: d.coverPath ?? null,
        });
      })
      .catch(() => setError("تعذّر تحميل المقال."))
      .finally(() => setLoading(false));
  }, [id]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  async function onCover(file: File) {
    const invalid = validateFile(file) ?? (kindOf(file) !== "image" ? "صورة الغلاف يجب أن تكون صورة." : null);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError("");
    setCoverProgress(0);
    try {
      const uploaded = await uploadFile("posts", file, setCoverProgress);
      if (draft.coverPath) replacedCovers.current.push(draft.coverPath);
      setDraft((d) => ({ ...d, coverUrl: uploaded.url, coverPath: uploaded.path }));
    } catch {
      setError("فشل رفع صورة الغلاف.");
    } finally {
      setCoverProgress(null);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) {
      setError("اكتب عنواناً للمقال.");
      return;
    }
    setSaving(true);
    setError("");
    const data = {
      title: draft.title.trim(),
      excerpt: draft.excerpt.trim(),
      body: draft.body.trim(),
      published: draft.published,
      coverUrl: draft.coverUrl,
      coverPath: draft.coverPath,
      updatedAt: serverTimestamp(),
    };
    try {
      if (id) await updateDoc(doc(db, "posts", id), data);
      else await addDoc(collection(db, "posts"), { ...data, createdAt: serverTimestamp() });

      // Old covers are only removed after the post points at the new one.
      await Promise.allSettled(replacedCovers.current.map((p) => deleteObject(ref(storage, p))));
      replacedCovers.current = [];

      await publishChanges(user);
      router.push("/admin/posts");
    } catch {
      setError("تعذّر حفظ المقال. حاول مرة أخرى.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4" aria-hidden>
        <div className="h-10 w-1/2 animate-pulse rounded-2xl bg-surface-2" />
        <div className="h-64 animate-pulse rounded-[2rem] bg-surface-2" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <Link href="/admin/posts" className="inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink">
          <ArrowRight size={16} />
          المقالات
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold">{id ? "تعديل المقال" : "مقال جديد"}</h1>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium">صورة الغلاف</span>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative aspect-[16/9] overflow-hidden rounded-[2rem] bg-surface ring-1 ring-line transition-shadow hover:ring-accent"
        >
          {draft.coverUrl ? (
            <>
              <Image src={draft.coverUrl} alt="" fill sizes="768px" className="object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100">
                اضغط لتغيير الصورة
              </span>
            </>
          ) : (
            <span className="flex h-full flex-col items-center justify-center gap-3 text-ink-muted">
              <ImageSquare size={36} weight="light" />
              اضغط لإضافة صورة غلاف (اختياري)
            </span>
          )}
          {coverProgress !== null && (
            <span className="absolute inset-0 grid place-items-center bg-surface/80 font-medium tabular-nums">
              {Math.round(coverProgress * 100)}%
            </span>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onCover(file);
            e.target.value = "";
          }}
        />
      </div>

      <Field label="العنوان">
        <Input value={draft.title} onChange={(e) => set("title", e.target.value)} maxLength={200} required className="text-lg" />
      </Field>

      <Field label="ملخص قصير" hint="يظهر تحت العنوان في المدونة والصفحة الرئيسية.">
        <Textarea value={draft.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={2} maxLength={300} />
      </Field>

      <Field label="نص المقال" hint="اترك سطراً فارغاً بين الفقرات. ابدأ السطر بـ ## ليصبح عنواناً فرعياً.">
        <Textarea value={draft.body} onChange={(e) => set("body", e.target.value)} rows={16} />
      </Field>

      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-surface px-5 py-4 ring-1 ring-line">
        <span>
          <span className="block font-medium">نشر المقال</span>
          <span className="text-sm text-ink-muted">عند الإيقاف يُحفظ كمسودة ولا يظهر للزوار.</span>
        </span>
        <input
          type="checkbox"
          checked={draft.published}
          onChange={(e) => set("published", e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="relative h-7 w-12 shrink-0 rounded-full bg-surface-2 ring-1 ring-line transition-colors duration-300 peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent after:absolute after:top-1 after:right-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.32,0.72,0,1)] peer-checked:after:-translate-x-5"
        />
      </label>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex items-center gap-3">
        <Btn type="submit" loading={saving} disabled={coverProgress !== null}>
          {draft.published ? "حفظ ونشر" : "حفظ كمسودة"}
        </Btn>
        <Link href="/admin/posts" className="rounded-full px-5 py-3 text-sm text-ink-muted transition-colors hover:bg-surface-2">
          إلغاء
        </Link>
      </div>
    </form>
  );
}
