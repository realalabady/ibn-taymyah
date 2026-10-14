"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { Plus } from "@phosphor-icons/react";
import { db, storage } from "@/lib/firebase/client";
import { formatDate } from "@/lib/format";
import { publishChanges, useAdminUser } from "./AuthProvider";
import { ConfirmDelete, Notice } from "./ui";

type Row = { id: string; title: string; published: boolean; createdAt: number; coverUrl: string | null; coverPath: string | null };

export function PostsList() {
  const user = useAdminUser();
  const [posts, setPosts] = useState<Row[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "posts"), orderBy("createdAt", "desc")),
      (snap) =>
        setPosts(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              title: data.title ?? "",
              published: Boolean(data.published),
              createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
              coverUrl: data.coverUrl ?? null,
              coverPath: data.coverPath ?? null,
            };
          }),
        ),
      () => setError("تعذّر تحميل المقالات."),
    );
  }, []);

  async function remove(post: Row) {
    if (post.coverPath) {
      try {
        await deleteObject(ref(storage, post.coverPath));
      } catch {
        // Cover may already be gone.
      }
    }
    await deleteDoc(doc(db, "posts", post.id));
    await publishChanges(user);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">المقالات</h1>
          <p className="mt-2 text-ink-muted">المقالات المنشورة تظهر في المدونة وفي الصفحة الرئيسية.</p>
        </div>
        <Link
          href="/login/posts/edit"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-ink transition-transform duration-200 active:scale-[0.97]"
        >
          <Plus size={18} weight="bold" />
          مقال جديد
        </Link>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {posts === null ? (
        <div className="flex flex-col gap-3" aria-hidden>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-[1.5rem] bg-surface-2" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Notice>لم تكتب أي مقال بعد. ابدأ بخبر عن آخر حفل ختم أو مسابقة.</Notice>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((post) => (
            <li key={post.id} className="flex items-center gap-4 rounded-[1.5rem] bg-surface p-3 ring-1 ring-line">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-accent-soft">
                {post.coverUrl && <Image src={post.coverUrl} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <Link href={`/login/posts/edit?id=${post.id}`} className="min-w-0 flex-1">
                <p className="truncate font-medium transition-colors hover:text-accent">{post.title || "بدون عنوان"}</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-ink-muted">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs ${post.published ? "bg-accent-soft text-accent" : "bg-surface-2"}`}
                  >
                    {post.published ? "منشور" : "مسودة"}
                  </span>
                  {formatDate(post.createdAt)}
                </p>
              </Link>
              <ConfirmDelete onConfirm={() => remove(post)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
