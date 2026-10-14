import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  where,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore/lite";
import { firebaseConfig } from "./firebase/config";
import type { MediaItem, Post } from "./types";

export const CONTENT_TAG = "content";

function db() {
  const app = getApps().some((a) => a.name === "server")
    ? getApp("server")
    : initializeApp(firebaseConfig, "server");
  return getFirestore(app);
}

function millis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

function toMedia(id: string, d: DocumentData): MediaItem {
  return {
    id,
    type: d.type === "video" ? "video" : "image",
    url: d.url ?? "",
    path: d.path ?? "",
    caption: d.caption ?? "",
    width: d.width || 1600,
    height: d.height || 1200,
    featured: Boolean(d.featured),
    createdAt: millis(d.createdAt),
  };
}

function toPost(id: string, d: DocumentData): Post {
  return {
    id,
    title: d.title ?? "",
    excerpt: d.excerpt ?? "",
    body: d.body ?? "",
    coverUrl: d.coverUrl ?? null,
    coverPath: d.coverPath ?? null,
    published: Boolean(d.published),
    createdAt: millis(d.createdAt),
    updatedAt: millis(d.updatedAt),
  };
}

async function safe<T>(label: string, fallback: T, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    console.error(`[data] ${label} failed`, error);
    return fallback;
  }
}

export async function getMedia(count = 60): Promise<MediaItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  return safe("getMedia", [], async () => {
    const snap = await getDocs(
      query(collection(db(), "media"), orderBy("createdAt", "desc"), limit(count)),
    );
    return snap.docs.map((d) => toMedia(d.id, d.data()));
  });
}

// The manager stars one photo (the hero) and one video (the video section).
// Both share the `featured` flag, so read the starred items once and split by type.
async function getFeatured(): Promise<MediaItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  return safe("getFeatured", [], async () => {
    const snap = await getDocs(
      query(
        collection(db(), "media"),
        where("featured", "==", true),
        orderBy("createdAt", "desc"),
        limit(10),
      ),
    );
    return snap.docs.map((d) => toMedia(d.id, d.data()));
  });
}

export async function getFeaturedImage(): Promise<MediaItem | null> {
  const featured = await getFeatured();
  return featured.find((m) => m.type === "image") ?? null;
}

export async function getFeaturedVideo(): Promise<MediaItem | null> {
  const featured = await getFeatured();
  return featured.find((m) => m.type === "video") ?? null;
}

export async function getPosts(count?: number): Promise<Post[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  return safe("getPosts", [], async () => {
    const constraints: QueryConstraint[] = [
      where("published", "==", true),
      orderBy("createdAt", "desc"),
    ];
    if (count) constraints.push(limit(count));
    const snap = await getDocs(query(collection(db(), "posts"), ...constraints));
    return snap.docs.map((d) => toPost(d.id, d.data()));
  });
}

export async function getPost(id: string): Promise<Post | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  return safe("getPost", null, async () => {
    const snap = await getDoc(doc(db(), "posts", id));
    if (!snap.exists()) return null;
    const post = toPost(snap.id, snap.data());
    return post.published ? post : null;
  });
}
