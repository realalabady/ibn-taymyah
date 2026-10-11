import Image from "next/image";
import { ArrowUpLeft } from "@phosphor-icons/react/ssr";
import { getFeaturedImage } from "@/lib/data";
import { whatsappLink } from "@/site.config";
import { MaskReveal, Stagger, StaggerItem } from "@/components/motion/Stagger";
import { Button } from "./Button";

export async function Hero() {
  const featured = await getFeaturedImage();

  return (
    <section className="relative px-4 pt-28 pb-16 md:pt-32 md:pb-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-[1.05fr_1fr] md:gap-16">
        <Stagger className="flex flex-col items-start gap-7">
          <StaggerItem>
            <h1 className="font-display text-[2.6rem] leading-[1.25] font-semibold tracking-tight md:text-6xl md:leading-[1.2]">
              نُنشئ جيلاً يحفظ القرآن <span className="text-accent">ويعمل به</span>
            </h1>
          </StaggerItem>
          <StaggerItem>
            <p className="max-w-[44ch] text-lg leading-relaxed text-ink-muted">
              حلقات تحفيظ للأبناء تجمع بين إتقان الحفظ وحسن التلاوة والتربية على أخلاق القرآن، بإشراف معلمين متقنين.
            </p>
          </StaggerItem>
          <StaggerItem className="flex flex-wrap items-center gap-3">
            <Button href={whatsappLink} external icon={ArrowUpLeft}>
              سجّل ابنك
            </Button>
            <Button href="#program" variant="ghost">
              تعرّف على البرنامج
            </Button>
          </StaggerItem>
        </Stagger>

        <MaskReveal className="relative">
          <div className="rounded-[2rem] bg-surface-2/70 p-2 ring-1 ring-line">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-accent-soft md:aspect-[5/6]">
              {featured ? (
                <Image
                  src={featured.url}
                  alt={featured.caption || "من حلقات التحفيظ"}
                  fill
                  priority
                  sizes="(min-width: 768px) 45vw, 100vw"
                  className="media-outline object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
                  <span className="font-quran text-[7rem] leading-none text-accent md:text-[9rem]">اقْرَأْ</span>
                  <span className="text-sm text-ink-muted">بِاسْمِ رَبِّكَ الَّذِي خَلَقَ</span>
                </div>
              )}
            </div>
          </div>
        </MaskReveal>
      </div>
    </section>
  );
}
