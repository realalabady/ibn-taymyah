import type { Metadata } from "next";
import { getMedia } from "@/lib/data";
import { GalleryGrid } from "@/components/site/GalleryGrid";
import { EmptyGallery } from "@/components/site/GallerySection";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = { title: "المعرض" };

export default async function GalleryPage() {
  const media = await getMedia(200);

  return (
    <section className="px-4 pt-32 pb-24 md:pt-40">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mb-12 max-w-2xl">
          <h1 className="font-display text-4xl leading-snug font-semibold md:text-6xl md:leading-tight">المعرض</h1>
          <p className="mt-4 text-lg text-ink-muted">لحظات من الحلقات والمسابقات وحفلات الختم.</p>
        </Reveal>
        {media.length > 0 ? <GalleryGrid items={media} /> : <EmptyGallery />}
      </div>
    </section>
  );
}
