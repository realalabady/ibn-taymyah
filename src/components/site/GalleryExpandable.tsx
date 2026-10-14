"use client";

import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import type { MediaItem } from "@/lib/types";
import { GalleryGrid } from "./GalleryGrid";

const INITIAL = 9;

// Keeps the home page short: the first photos show, the rest open in place.
export function GalleryExpandable({ items }: { items: MediaItem[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, INITIAL);

  return (
    <>
      <GalleryGrid items={visible} />
      {items.length > INITIAL && !showAll && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-3 rounded-full px-5 py-3 font-medium ring-1 ring-line transition-[transform,background-color] duration-300 ease-spring hover:bg-surface-2 active:scale-[0.97]"
          >
            عرض المزيد ({items.length - INITIAL})
            <CaretDown size={18} />
          </button>
        </div>
      )}
    </>
  );
}
