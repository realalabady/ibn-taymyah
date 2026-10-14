import { ArrowUpLeft, MapPin, WhatsappLogo } from "@phosphor-icons/react/ssr";
import { site, whatsappLink } from "@/site.config";
import { Reveal } from "@/components/motion/Reveal";

export function Contact() {
  return (
    <section id="contact" className="px-4 py-24 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1fr_1.2fr] md:items-center md:gap-16">
        <Reveal>
          <h2 className="font-display text-3xl leading-snug font-semibold md:text-5xl md:leading-tight">تواصل معنا</h2>
          <p className="mt-5 max-w-[44ch] text-lg leading-relaxed text-ink-muted">
            يسعدنا الرد على أسئلتك عن الحلقات والمواعيد والمستويات.
          </p>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="rounded-[2rem] bg-surface-2/70 p-2 ring-1 ring-line">
            <ul className="divide-y divide-line rounded-[1.5rem] bg-surface">
              <li>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-5 p-6 md:p-7"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                    <WhatsappLogo size={24} weight="light" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-semibold">راسلنا على واتساب</span>
                    <span className="mt-1 block text-ink-muted tabular-nums">
                      <bdi dir="ltr">+{site.whatsapp}</bdi>
                    </span>
                  </span>
                  <ArrowUpLeft
                    size={20}
                    className="shrink-0 text-ink-muted transition-transform duration-500 ease-spring group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
                  />
                </a>
              </li>
              <li className="flex items-center gap-5 p-6 md:p-7">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                  <MapPin size={24} weight="light" />
                </span>
                <span>
                  <span className="block font-display text-lg font-semibold">المقر</span>
                  <span className="mt-1 block text-ink-muted">{site.location}</span>
                </span>
              </li>
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
