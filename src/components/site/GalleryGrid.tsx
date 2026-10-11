"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CaretLeft, CaretRight, Play, X } from "@phosphor-icons/react";
import type { MediaItem } from "@/lib/types";
import { motionTokens, springs } from "@/lib/motion";

export function GalleryGrid({ items }: { items: MediaItem[] }) {
  const [active, setActive] = useState<number | null>(null);
  const reduce = useReducedMotion();

  const close = useCallback(() => setActive(null), []);
  const step = useCallback(
    (dir: 1 | -1) => setActive((i) => (i === null ? i : (i + dir + items.length) % items.length)),
    [items.length],
  );

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      // RTL: the left arrow moves forward.
      if (e.key === "ArrowLeft") step(1);
      if (e.key === "ArrowRight") step(-1);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [active, close, step]);

  const current = active === null ? null : items[active];

  return (
    <>
      <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>li]:mb-4">
        {items.map((item, i) => (
          <motion.li
            key={item.id}
            className="break-inside-avoid"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: (i % 3) * 0.06, ease: motionTokens.easing.smooth }}
          >
            <button
              type="button"
              onClick={() => setActive(i)}
              className="group relative block w-full overflow-hidden rounded-[1.5rem] bg-surface-2 text-start"
              aria-label={item.caption || (item.type === "video" ? "تشغيل المقطع" : "عرض الصورة")}
            >
              <motion.div layoutId={reduce ? undefined : `media-${item.id}`} className="relative">
                {item.type === "image" ? (
                  <Image
                    src={item.url}
                    alt={item.caption || "من حلقات التحفيظ"}
                    width={item.width}
                    height={item.height}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="media-outline h-auto w-full transition-transform duration-700 ease-spring group-hover:scale-[1.03]"
                  />
                ) : (
                  <>
                    <video
                      src={`${item.url}#t=0.1`}
                      muted
                      playsInline
                      preload="metadata"
                      className="media-outline h-auto w-full"
                      style={{ aspectRatio: `${item.width} / ${item.height}` }}
                    />
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid size-14 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-transform duration-300 ease-spring group-hover:scale-110">
                        <Play size={22} weight="fill" />
                      </span>
                    </span>
                  </>
                )}
              </motion.div>
            </button>
            {item.caption && <p className="mt-2 px-1 text-sm text-ink-muted">{item.caption}</p>}
          </motion.li>
        ))}
      </ul>

      <AnimatePresence>
        {current && active !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={current.caption || "عرض الوسائط"}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md md:p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: motionTokens.duration.fast } }}
            onClick={close}
          >
            <motion.div
              layoutId={reduce ? undefined : `media-${current.id}`}
              transition={springs.gentle}
              className="relative max-h-full w-full max-w-5xl overflow-hidden rounded-[1.25rem]"
              style={{ aspectRatio: `${current.width} / ${current.height}`, maxHeight: "82dvh" }}
              onClick={(e) => e.stopPropagation()}
            >
              {current.type === "image" ? (
                <Image
                  src={current.url}
                  alt={current.caption || "من حلقات التحفيظ"}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              ) : (
                <video src={current.url} controls autoPlay playsInline className="h-full w-full bg-black" />
              )}
            </motion.div>

            {current.caption && (
              <p className="absolute inset-x-4 bottom-6 text-center text-sm text-white/80">{current.caption}</p>
            )}

            <button
              type="button"
              onClick={close}
              aria-label="إغلاق"
              className="absolute top-5 left-5 grid size-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X size={20} />
            </button>
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(-1);
                  }}
                  aria-label="السابق"
                  className="absolute top-1/2 right-4 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <CaretRight size={20} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(1);
                  }}
                  aria-label="التالي"
                  className="absolute top-1/2 left-4 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <CaretLeft size={20} />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
