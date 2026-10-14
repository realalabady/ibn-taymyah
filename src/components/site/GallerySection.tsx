import { FilmStrip } from "@phosphor-icons/react/ssr";
import { getMedia } from "@/lib/data";
import { Reveal } from "@/components/motion/Reveal";
import { GalleryExpandable } from "./GalleryExpandable";

export async function GallerySection() {
  // Photos play in the slideshow inside the program section; this section shows the videos.
  const media = (await getMedia(60)).filter((m) => m.type === "video");

  return (
    <section id="gallery" className="px-4 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mb-12 max-w-2xl">
          <h2 className="font-display text-3xl leading-snug font-semibold md:text-5xl md:leading-tight">
            من داخل الحلقات
          </h2>
          <p className="mt-4 text-lg text-ink-muted">لحظات من الحلقات والمسابقات وحفلات الختم.</p>
        </Reveal>

        {media.length > 0 ? <GalleryExpandable items={media} /> : <EmptyGallery />}
      </div>
    </section>
  );
}

function EmptyGallery() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[2rem] bg-surface px-6 py-20 text-center ring-1 ring-line">
      <span className="grid size-16 place-items-center rounded-full bg-accent-soft text-accent">
        <FilmStrip size={30} weight="light" />
      </span>
      <p className="font-display text-xl font-semibold">مقاطع الحلقات قادمة قريباً</p>
      <p className="max-w-[40ch] text-ink-muted">سنشارك هنا لحظات من الحلقات والمسابقات وحفلات الختم.</p>
    </div>
  );
}
