import { ArrowLeft, ImagesSquare } from "@phosphor-icons/react/ssr";
import { getMedia } from "@/lib/data";
import { Reveal } from "@/components/motion/Reveal";
import { GalleryGrid } from "./GalleryGrid";
import { Button } from "./Button";

export async function GallerySection() {
  const media = await getMedia(9);

  return (
    <section id="gallery" className="px-4 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="font-display text-3xl leading-snug font-semibold md:text-5xl md:leading-tight">
            من داخل الحلقات
          </h2>
          {media.length > 0 && (
            <Button href="/gallery" variant="ghost" icon={ArrowLeft}>
              المعرض كاملاً
            </Button>
          )}
        </Reveal>

        {media.length > 0 ? <GalleryGrid items={media} /> : <EmptyGallery />}
      </div>
    </section>
  );
}

export function EmptyGallery() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[2rem] bg-surface px-6 py-20 text-center ring-1 ring-line">
      <span className="grid size-16 place-items-center rounded-full bg-accent-soft text-accent">
        <ImagesSquare size={30} weight="light" />
      </span>
      <p className="font-display text-xl font-semibold">صور الحلقات قادمة قريباً</p>
      <p className="max-w-[40ch] text-ink-muted">سنشارك هنا لحظات من الحلقات والمسابقات وحفلات الختم.</p>
    </div>
  );
}
