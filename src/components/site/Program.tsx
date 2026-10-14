import type { ComponentType } from "react";
import type { IconProps } from "@phosphor-icons/react";
import { ArrowsClockwise, BookOpenText, Heart, Microphone, UsersThree } from "@phosphor-icons/react/ssr";
import { Reveal } from "@/components/motion/Reveal";
import { getMedia } from "@/lib/data";
import { PhotoSlideshow } from "./PhotoSlideshow";

const points: { icon: ComponentType<IconProps>; title: string; text: string }[] = [
  { icon: BookOpenText, title: "الحفظ المتقن", text: "خطة حفظ تناسب عمر الطالب وقدرته، مع تسميع يومي يضمن ثبات المحفوظ." },
  { icon: ArrowsClockwise, title: "المراجعة الدورية", text: "جدول مراجعة منتظم يحفظ ما سبق ولا يتركه للنسيان." },
  { icon: Microphone, title: "التجويد وحسن التلاوة", text: "تعلّم أحكام التجويد عملياً أثناء القراءة على المعلم." },
  { icon: Heart, title: "التربية والأخلاق", text: "نربي الطالب على آداب حامل القرآن في المسجد والبيت." },
  { icon: UsersThree, title: "متابعة ولي الأمر", text: "تواصل مستمر مع ولي الأمر حول مستوى ابنه وتقدمه." },
];

export async function Program() {
  const photos = (await getMedia(60)).filter((m) => m.type === "image").slice(0, 12);

  return (
    <section id="program" className="py-24 md:py-32">
      <Reveal className="mx-auto mb-14 max-w-6xl px-4">
        <h2 className="max-w-2xl font-display text-3xl leading-snug font-semibold md:text-5xl md:leading-tight">
          برنامج متكامل يرافق ابنك من أول آية
        </h2>
        <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-ink-muted">
          نهتم بالحفظ والفهم والسلوك معاً، حتى يكون القرآن حاضراً في يوم الطالب لا في الحلقة وحدها.
        </p>
      </Reveal>

      <ProgramBar />

      {photos.length > 0 && <PhotoSlideshow items={photos} />}

      <div className="mx-auto mt-16 grid max-w-6xl gap-x-14 px-4 md:grid-cols-2">
        {points.map((point, i) => (
          <Reveal key={point.title} delay={(i % 2) * 0.06} className="flex gap-5 border-t border-line py-7">
            <point.icon size={26} weight="light" className="mt-1 shrink-0 text-accent" />
            <div>
              <h3 className="font-display text-xl font-semibold">{point.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-muted">{point.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// An endless band of the program's pillars. The track holds two identical copies
// and slides by exactly one copy, so the loop has no visible seam.
function ProgramBar() {
  return (
    <div className="marquee overflow-hidden bg-accent py-5 text-accent-ink [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
      <div className="flex w-max animate-marquee motion-reduce:w-full motion-reduce:justify-center">
        <BarItems />
        <BarItems hidden />
      </div>
    </div>
  );
}

function BarItems({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className={`flex shrink-0 items-center motion-reduce:flex-wrap motion-reduce:justify-center ${hidden ? "motion-reduce:hidden" : ""}`}
    >
      {points.map((point) => (
        <li key={point.title} className="flex items-center">
          <span className="flex items-center gap-3 px-7 font-display text-lg font-medium whitespace-nowrap md:text-xl">
            <point.icon size={24} weight="light" />
            {point.title}
          </span>
          <Dot />
        </li>
      ))}
      <li className="flex items-center">
        <span className="px-7 font-quran text-2xl whitespace-nowrap md:text-3xl">وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا</span>
        <Dot />
      </li>
    </ul>
  );
}

function Dot() {
  return <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-sun" />;
}
