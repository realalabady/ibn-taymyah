import { getFeaturedVideo } from "@/lib/data";
import { Reveal } from "@/components/motion/Reveal";

// The video the manager stars in the admin panel. Hidden until one is chosen.
export async function VideoShowcase() {
  const video = await getFeaturedVideo();
  if (!video) return null;

  return (
    <section id="video" className="px-4 pt-20 md:pt-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mb-10 max-w-2xl">
          <h2 className="font-display text-3xl leading-snug font-semibold md:text-5xl md:leading-tight">
            جولة في حلقاتنا
          </h2>
        </Reveal>
        <Reveal>
          <figure className="rounded-[2rem] bg-surface-2/70 p-2 ring-1 ring-line">
            <div className="overflow-hidden rounded-[1.5rem] bg-ink">
              <video
                src={`${video.url}#t=0.1`}
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full object-contain"
              />
            </div>
            {video.caption && (
              <figcaption className="px-4 pt-4 pb-2 text-ink-muted">{video.caption}</figcaption>
            )}
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
