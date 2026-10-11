"use client";

import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "./firebase/client";

export const LIMITS = { imageMb: 20, videoMb: 500 };

export function kindOf(file: File): "image" | "video" | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

export function validateFile(file: File): string | null {
  const kind = kindOf(file);
  if (!kind) return "نوع الملف غير مدعوم. ارفع صورة أو مقطع فيديو.";
  const maxMb = kind === "image" ? LIMITS.imageMb : LIMITS.videoMb;
  if (file.size > maxMb * 1024 * 1024) return `حجم الملف أكبر من ${maxMb} ميجابايت.`;
  return null;
}

// Reads natural dimensions so the public gallery can lay items out without layout shift.
export function readDimensions(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);
  const done = (width: number, height: number) => {
    URL.revokeObjectURL(url);
    return { width: width || 1600, height: height || 1200 };
  };

  return new Promise((resolve) => {
    if (kindOf(file) === "video") {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => resolve(done(video.videoWidth, video.videoHeight));
      video.onerror = () => resolve(done(1600, 900));
      video.src = url;
    } else {
      const img = new Image();
      img.onload = () => resolve(done(img.naturalWidth, img.naturalHeight));
      img.onerror = () => resolve(done(1600, 1200));
      img.src = url;
    }
  });
}

export function uploadFile(
  folder: "media" | "posts",
  file: File,
  onProgress: (fraction: number) => void,
): Promise<{ url: string; path: string }> {
  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "bin";
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const task = uploadBytesResumable(ref(storage, path), file, { contentType: file.type });

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => onProgress(snap.totalBytes ? snap.bytesTransferred / snap.totalBytes : 0),
      reject,
      async () => resolve({ url: await getDownloadURL(task.snapshot.ref), path }),
    );
  });
}
