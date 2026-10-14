"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { CheckCircle, CloudArrowUp, Play, Star, WarningCircle } from "@phosphor-icons/react";
import { db, storage } from "@/lib/firebase/client";
import { kindOf, LIMITS, readDimensions, uploadFile, validateFile } from "@/lib/upload";
import { motionTokens } from "@/lib/motion";
import type { MediaItem } from "@/lib/types";
import { publishChanges, useAdminUser } from "./AuthProvider";
import { ConfirmDelete, Notice } from "./ui";

type QueueItem = { key: string; name: string; progress: number; status: "uploading" | "done" | "error"; error?: string };

export function MediaManager() {
  const user = useAdminUser();
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, "media"), orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) =>
        setItems(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              type: data.type,
              url: data.url,
              path: data.path,
              caption: data.caption ?? "",
              width: data.width ?? 1600,
              height: data.height ?? 1200,
              featured: Boolean(data.featured),
              createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
            } satisfies MediaItem;
          }),
        ),
      () => setError("تعذّر تحميل الوسائط. تحقق من الصلاحيات أو الاتصال."),
    );
  }, []);

  const patch = (key: string, next: Partial<QueueItem>) =>
    setQueue((q) => q.map((item) => (item.key === key ? { ...item, ...next } : item)));

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;

    const jobs = list.map(async (file) => {
      const key = crypto.randomUUID();
      const invalid = validateFile(file);
      setQueue((q) => [{ key, name: file.name, progress: 0, status: invalid ? "error" : "uploading", error: invalid ?? undefined }, ...q]);
      if (invalid) return false;

      try {
        const [{ width, height }, uploaded] = await Promise.all([
          readDimensions(file),
          uploadFile("media", file, (p) => patch(key, { progress: p })),
        ]);
        await addDoc(collection(db, "media"), {
          type: kindOf(file),
          url: uploaded.url,
          path: uploaded.path,
          caption: "",
          width,
          height,
          featured: false,
          createdAt: serverTimestamp(),
        });
        patch(key, { status: "done", progress: 1 });
        return true;
      } catch {
        patch(key, { status: "error", error: "فشل الرفع. حاول مرة أخرى." });
        return false;
      }
    });

    const results = await Promise.all(jobs);
    if (results.some(Boolean)) await publishChanges(user);
    // Clear finished rows after a moment, keep failures visible.
    setTimeout(() => setQueue((q) => q.filter((item) => item.status !== "done")), 2500);
  }

  async function setFeatured(item: MediaItem) {
    const batch = writeBatch(db);
    for (const other of items ?? []) {
      // One starred photo (hero) and one starred video (video section) at a time.
      if (other.featured && other.type === item.type && other.id !== item.id) batch.update(doc(db, "media", other.id), { featured: false });
    }
    batch.update(doc(db, "media", item.id), { featured: !item.featured });
    await batch.commit();
    await publishChanges(user);
  }

  async function saveCaption(item: MediaItem, caption: string) {
    if (caption === item.caption) return;
    await updateDoc(doc(db, "media", item.id), { caption: caption.trim().slice(0, 200) });
    await publishChanges(user);
  }

  async function remove(item: MediaItem) {
    try {
      await deleteObject(ref(storage, item.path));
    } catch {
      // The file may already be gone; still remove the record.
    }
    await deleteDoc(doc(db, "media", item.id));
    await publishChanges(user);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display text-3xl font-semibold">الصور والمقاطع</h1>
        <p className="mt-2 text-ink-muted">
          ما ترفعه هنا يظهر في معرض الموقع مباشرة. ضع نجمة على صورة لتصبح صورة الواجهة، وعلى مقطع فيديو ليُعرض في الصفحة الرئيسية.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-[2rem] p-2 ring-1 transition-colors duration-300 ${dragging ? "bg-accent-soft ring-accent" : "bg-surface-2/70 ring-line"}`}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-4 rounded-[1.5rem] border border-dashed border-ink-muted/30 bg-surface px-6 py-14 text-center transition-colors duration-300 hover:border-accent"
        >
          <span className="grid size-16 place-items-center rounded-full bg-accent-soft text-accent">
            <CloudArrowUp size={30} weight="light" />
          </span>
          <span className="font-display text-lg font-semibold">اسحب الملفات هنا أو اضغط للاختيار</span>
          <span className="text-sm text-ink-muted">
            صور حتى {LIMITS.imageMb} ميجابايت، ومقاطع فيديو حتى {LIMITS.videoMb} ميجابايت. يمكنك اختيار عدة ملفات.
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <AnimatePresence initial={false}>
        {queue.length > 0 && (
          <motion.ul
            className="flex flex-col gap-2"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth }}
          >
            {queue.map((item) => (
              <li key={item.key} className="flex items-center gap-4 rounded-2xl bg-surface px-4 py-3 ring-1 ring-line">
                <span className="shrink-0">
                  {item.status === "done" && <CheckCircle size={22} weight="fill" className="text-accent" />}
                  {item.status === "error" && <WarningCircle size={22} weight="fill" className="text-red-600" />}
                  {item.status === "uploading" && (
                    <span className="block size-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" dir="auto">
                    {item.name}
                  </p>
                  {item.status === "error" ? (
                    <p className="text-sm text-red-700">{item.error}</p>
                  ) : (
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full origin-right rounded-full bg-accent transition-transform duration-300 ease-out"
                        style={{ transform: `scaleX(${item.progress})` }}
                      />
                    </div>
                  )}
                </div>
                <span className="w-12 shrink-0 text-end text-sm text-ink-muted tabular-nums">
                  {item.status !== "error" && `${Math.round(item.progress * 100)}%`}
                </span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {error && <Notice tone="error">{error}</Notice>}

      {items === null ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-[1.5rem] bg-surface-2" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Notice>لا توجد وسائط بعد. ابدأ برفع أول صورة من الحلقات.</Notice>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97, transition: { duration: motionTokens.duration.fast } }}
                transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth }}
                className="flex flex-col gap-3 rounded-[1.75rem] bg-surface p-2 ring-1 ring-line"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-surface-2">
                  {item.type === "image" ? (
                    <Image src={item.url} alt={item.caption} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover" />
                  ) : (
                    <>
                      <video src={`${item.url}#t=0.1`} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                      <span className="absolute top-3 left-3 grid size-9 place-items-center rounded-full bg-black/50 text-white">
                        <Play size={16} weight="fill" />
                      </span>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setFeatured(item)}
                    aria-pressed={item.featured}
                    aria-label={featureLabel(item)}
                    title={featureLabel(item)}
                    className={`absolute top-3 right-3 grid size-10 place-items-center rounded-full backdrop-blur-sm transition-[transform,background-color] duration-300 ease-spring active:scale-90 ${
                      item.featured ? "bg-accent text-accent-ink" : "bg-black/40 text-white hover:bg-black/60"
                    }`}
                  >
                    <Star size={18} weight={item.featured ? "fill" : "regular"} />
                  </button>
                </div>
                <div className="flex items-center gap-2 px-1 pb-1">
                  <input
                    defaultValue={item.caption}
                    placeholder="أضف وصفاً (اختياري)"
                    aria-label="وصف الوسائط"
                    onBlur={(e) => saveCaption(item, e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                    className="min-w-0 flex-1 rounded-xl bg-transparent px-2 py-2 text-sm ring-1 ring-transparent transition-shadow hover:ring-line focus:ring-accent focus:outline-none"
                  />
                  <ConfirmDelete onConfirm={() => remove(item)} />
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

function featureLabel(item: MediaItem) {
  if (item.type === "video") {
    return item.featured ? "إلغاء عرض المقطع في الصفحة الرئيسية" : "اعرض هذا المقطع في الصفحة الرئيسية";
  }
  return item.featured ? "إلغاء صورة الواجهة" : "اجعلها صورة الواجهة";
}
