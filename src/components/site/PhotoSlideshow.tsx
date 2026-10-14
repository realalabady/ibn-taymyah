"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import type { MediaItem } from "@/lib/types";

const SLIDE_SECONDS = 6;
const FADE = 1.4;

// One photo at a time. The progress bar under the active dot is the clock:
// when its CSS animation ends the next photo fades in, and pausing the bar pauses the show.
export function PhotoSlideshow({ items }: { items: MediaItem[] }) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [pageHidden, setPageHidden] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const count = items.length;
  const go = (step: number) => setIndex((i) => (i + step + count) % count);
  const paused = hovered || focused || !visible || pageHidden;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    const onVis = () => setPageHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  if (count === 0) return null;
  const photo = items[index];
  const next = items[(index + 1) % count];

  return (
    <div
      ref={rootRef}
      className="mx-auto mt-14 max-w-6xl px-4"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocused(false)}
      onKeyDown={(e) => {
        // RTL: the left arrow moves forward.
        if (e.key === "ArrowLeft") go(1);
        if (e.key === "ArrowRight") go(-1);
      }}
    >
      <figure
        className="rounded-[2rem] bg-surface-2/70 p-2 ring-1 ring-line"
        role="region"
        aria-roledescription="عرض صور"
        aria-label="صور من الحلقات"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-ink sm:aspect-[16/10] md:aspect-[21/9]">
          <AnimatePresence initial={false}>
            <motion.div
              key={photo.id}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: FADE, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="absolute inset-0"
                initial={reduce ? false : { scale: 1.1 }}
                animate={reduce ? undefined : { scale: 1 }}
                transition={{ duration: SLIDE_SECONDS + FADE * 2, ease: "linear" }}
              >
                <Image
                  src={photo.url}
                  alt={photo.caption || "من حلقات التحفيظ"}
                  fill
                  sizes="(min-width: 1152px) 1152px, 100vw"
                  className="object-cover"
                  priority={index === 0}
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Load the next photo ahead of time so the crossfade never shows a blank frame. */}
          {count > 1 && (
            <Image src={next.url} alt="" aria-hidden fill sizes="(min-width: 1152px) 1152px, 100vw" className="pointer-events-none object-cover opacity-0" />
          )}

          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent" />

          <AnimatePresence mode="wait">
            {photo.caption && (
              <motion.figcaption
                key={photo.id}
                initial={{ opacity: 0, y: reduce ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="absolute right-5 bottom-14 left-5 max-w-[48ch] text-lg font-medium text-white md:right-8 md:bottom-16"
              >
                {photo.caption}
              </motion.figcaption>
            )}
          </AnimatePresence>

          {count > 1 && (
            <>
              <div className="absolute inset-x-0 bottom-5 flex items-center justify-between gap-4 px-5 md:px-8">
                <div className="flex items-center gap-1.5" role="tablist" aria-label="اختر صورة">
                  {items.map((item, i) => (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={i === index}
                      aria-label={`الصورة ${i + 1} من ${count}`}
                      onClick={() => setIndex(i)}
                      className="group grid h-6 place-items-center"
                    >
                      <span
                        className={`relative block h-1.5 overflow-hidden rounded-full bg-white/35 transition-[width] duration-500 ease-out ${
                          i === index ? "w-10" : "w-1.5 group-hover:bg-white/60"
                        }`}
                      >
                        {i === index && (
                          <span
                            key={index}
                            onAnimationEnd={() => go(1)}
                            className="absolute inset-0 slide-progress origin-right rounded-full bg-white"
                            style={{ animationDuration: `${SLIDE_SECONDS}s`, animationPlayState: paused ? "paused" : "running" }}
                          />
                        )}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    aria-label="الصورة السابقة"
                    className="grid size-10 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md transition-[background-color,transform] duration-300 hover:bg-white/25 active:scale-95"
                  >
                    <CaretRight size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    aria-label="الصورة التالية"
                    className="grid size-10 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md transition-[background-color,transform] duration-300 hover:bg-white/25 active:scale-95"
                  >
                    <CaretLeft size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </figure>
    </div>
  );
}
