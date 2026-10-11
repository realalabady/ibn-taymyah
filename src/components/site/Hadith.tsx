import { Reveal } from "@/components/motion/Reveal";

export function Hadith() {
  return (
    <section className="px-4 py-24 md:py-36">
      <Reveal className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <blockquote className="font-quran text-4xl leading-[1.8] md:text-6xl md:leading-[1.7]">
          «خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»
        </blockquote>
        <p className="mt-6 text-ink-muted">رواه البخاري</p>
      </Reveal>
    </section>
  );
}
