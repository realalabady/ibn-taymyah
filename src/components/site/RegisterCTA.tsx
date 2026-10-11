import { WhatsappLogo } from "@phosphor-icons/react/ssr";
import { site, whatsappLink } from "@/site.config";
import { Reveal } from "@/components/motion/Reveal";

export function RegisterCTA() {
  return (
    <section id="register" className="px-4 py-24 md:py-32">
      <Reveal className="mx-auto max-w-6xl">
        <div className="rounded-[2.5rem] bg-surface-2/70 p-2 ring-1 ring-line">
          <div className="flex flex-col items-start gap-8 rounded-[2rem] bg-accent px-8 py-14 text-accent-ink md:flex-row md:items-center md:justify-between md:px-14 md:py-16">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl leading-snug font-semibold md:text-4xl">
                مقعد ابنك في الحلقة بانتظاره
              </h2>
              <p className="mt-4 leading-relaxed opacity-85">
                راسلنا على واتساب لمعرفة المواعيد والحلقة المناسبة لعمره. المقر: {site.location}
              </p>
            </div>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex shrink-0 items-center gap-3 rounded-full bg-accent-ink py-2 ps-6 pe-2 font-medium text-accent transition-transform duration-300 ease-spring active:scale-[0.97]"
            >
              سجّل ابنك
              <span className="grid size-10 place-items-center rounded-full bg-accent text-accent-ink transition-transform duration-500 ease-spring group-hover:scale-105 group-hover:-rotate-12">
                <WhatsappLogo size={20} weight="fill" />
              </span>
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
