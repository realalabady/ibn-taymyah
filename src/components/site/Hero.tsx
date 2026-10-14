import Image from "next/image";
import { ArrowDown } from "@phosphor-icons/react/ssr";
import { getFeaturedImage } from "@/lib/data";
import { MaskReveal, Stagger, StaggerItem } from "@/components/motion/Stagger";

// Shown until the manager stars a photo of the complex in the admin panel.
const DEFAULT_PHOTO = { src: "/hero-default.jpg", alt: "مصحف على حامل خشبي بجوار نافذة مسجد" };

export async function Hero() {
  const featured = await getFeaturedImage();
  const photo = featured
    ? { src: featured.url, alt: featured.caption || "من حلقات التحفيظ" }
    : DEFAULT_PHOTO;

  return (
    <section className="p-2 md:p-3">
      <MaskReveal className="relative isolate flex min-h-[88dvh] overflow-hidden rounded-[2rem] bg-ink">
        <Image src={photo.src} alt={photo.alt} fill priority sizes="100vw" className="-z-20 object-cover" />

        {/* Darken the side the text sits on (the right, in RTL) so the white copy stays legible. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgb(6_20_10/0.88),rgb(6_20_10/0.5)_55%,rgb(6_20_10/0.25))] md:bg-[linear-gradient(to_left,rgb(6_20_10/0.85),rgb(6_20_10/0.55)_40%,rgb(6_20_10/0.05)_75%)]"
        />

        <div className="mx-auto flex w-full max-w-6xl items-end px-5 pt-32 pb-12 md:items-center md:px-8 md:pb-20">
          <Stagger className="flex max-w-xl flex-col items-start gap-7 text-white">
            <StaggerItem>
              <h1 className="font-display text-[2.6rem] leading-[1.25] font-semibold tracking-tight md:text-6xl md:leading-[1.2]">
                نُنشئ جيلاً يحفظ القرآن <span className="text-sun">ويعمل به</span>
              </h1>
            </StaggerItem>
            <StaggerItem>
              <p className="max-w-[44ch] text-lg leading-relaxed text-white/80">
                حلقات تحفيظ للأبناء تجمع بين إتقان الحفظ وحسن التلاوة والتربية على أخلاق القرآن، بإشراف معلمين متقنين.
              </p>
            </StaggerItem>
            <StaggerItem>
              <a
                href="#program"
                className="group inline-flex items-center gap-3 rounded-full bg-white/10 px-5 py-3 font-medium text-white ring-1 ring-white/25 backdrop-blur-md transition-[background-color,transform] duration-300 ease-spring hover:bg-white/20 active:scale-[0.97]"
              >
                تعرّف على البرنامج
                <ArrowDown size={18} className="transition-transform duration-500 ease-spring group-hover:translate-y-0.5" />
              </a>
            </StaggerItem>
          </Stagger>
        </div>

        {featured?.caption && (
          <p className="absolute bottom-5 left-5 hidden max-w-[28ch] rounded-full bg-black/35 px-4 py-2 text-sm text-white/85 backdrop-blur-md md:block">
            {featured.caption}
          </p>
        )}
      </MaskReveal>
    </section>
  );
}
