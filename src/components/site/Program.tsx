import Image from "next/image";
import { BookOpenText, ArrowsClockwise, Microphone, Heart, UsersThree } from "@phosphor-icons/react/ssr";
import { getMedia } from "@/lib/data";
import { Reveal } from "@/components/motion/Reveal";

export async function Program() {
  const media = await getMedia(12);
  const photo = media.find((m) => m.type === "image" && !m.featured) ?? media.find((m) => m.type === "image");

  return (
    <section id="program" className="px-4 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mb-14 max-w-2xl">
          <h2 className="font-display text-3xl leading-snug font-semibold md:text-5xl md:leading-tight">
            برنامج متكامل يرافق ابنك من أول آية
          </h2>
          <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-ink-muted">
            نهتم بالحفظ والفهم والسلوك معاً، حتى يكون القرآن حاضراً في يوم الطالب لا في الحلقة وحدها.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-5">
          <Reveal className="md:col-span-4">
            <article className="flex h-full min-h-72 flex-col justify-between gap-10 rounded-[2rem] bg-accent p-8 text-accent-ink md:p-10">
              <BookOpenText size={36} weight="light" />
              <div>
                <h3 className="font-display text-2xl font-semibold md:text-3xl">الحفظ المتقن</h3>
                <p className="mt-3 max-w-[40ch] leading-relaxed opacity-85">
                  خطة حفظ تناسب عمر الطالب وقدرته، مع تسميع يومي يضمن ثبات المحفوظ.
                </p>
              </div>
            </article>
          </Reveal>

          <Reveal className="md:col-span-2" delay={0.08}>
            <Cell icon={<ArrowsClockwise size={30} weight="light" />} title="المراجعة الدورية">
              جدول مراجعة منتظم يحفظ ما سبق ولا يتركه للنسيان.
            </Cell>
          </Reveal>

          <Reveal className="md:col-span-2" delay={0.04}>
            <div className="relative h-full min-h-72 overflow-hidden rounded-[2rem] bg-accent-soft">
              {photo ? (
                <Image
                  src={photo.url}
                  alt={photo.caption || "من حلقات التحفيظ"}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="media-outline object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-8 text-center">
                  <p className="font-quran text-3xl leading-[1.9] text-accent">
                    وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا
                  </p>
                </div>
              )}
            </div>
          </Reveal>

          <Reveal className="md:col-span-2" delay={0.1}>
            <Cell icon={<Microphone size={30} weight="light" />} title="التجويد وحسن التلاوة">
              تعلّم أحكام التجويد عملياً أثناء القراءة على المعلم.
            </Cell>
          </Reveal>

          <Reveal className="md:col-span-2" delay={0.16}>
            <Cell icon={<Heart size={30} weight="light" />} title="التربية والأخلاق" tinted>
              نربي الطالب على آداب حامل القرآن في المسجد والبيت.
            </Cell>
          </Reveal>

          <Reveal className="md:col-span-6" delay={0.06}>
            <article className="flex flex-col gap-6 rounded-[2rem] bg-surface p-8 ring-1 ring-line md:flex-row md:items-center md:justify-between md:p-10">
              <div className="flex items-center gap-5">
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                  <UsersThree size={28} weight="light" />
                </span>
                <h3 className="font-display text-2xl font-semibold">متابعة ولي الأمر</h3>
              </div>
              <p className="max-w-[48ch] leading-relaxed text-ink-muted">
                تواصل مستمر مع ولي الأمر حول مستوى ابنه وتقدمه، لأن البيت شريك أساسي في رحلة الحفظ.
              </p>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Cell({
  icon,
  title,
  children,
  tinted = false,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  tinted?: boolean;
}) {
  return (
    <article
      className={`flex h-full min-h-72 flex-col justify-between gap-10 rounded-[2rem] p-8 ${
        tinted ? "bg-sun-soft" : "bg-surface ring-1 ring-line"
      }`}
    >
      <span className="text-accent">{icon}</span>
      <div>
        <h3 className="font-display text-xl font-semibold">{title}</h3>
        <p className="mt-3 leading-relaxed text-ink-muted">{children}</p>
      </div>
    </article>
  );
}
