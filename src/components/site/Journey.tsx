"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { ChatCircleText, Handshake, BookOpen, ChartLineUp } from "@phosphor-icons/react";
import { Reveal } from "@/components/motion/Reveal";

const steps = [
  { icon: ChatCircleText, title: "تواصل معنا", text: "راسلنا عبر واتساب وسنرد عليك بتفاصيل الحلقات والمواعيد." },
  { icon: Handshake, title: "جلسة تعارف", text: "نلتقي بالطالب ونحدد مستواه في القراءة والحفظ." },
  { icon: BookOpen, title: "بداية الحفظ", text: "ينضم إلى الحلقة المناسبة لعمره ومستواه ويبدأ خطته." },
  { icon: ChartLineUp, title: "متابعة مستمرة", text: "نطلعك على تقدم ابنك ونحتفي معك بكل جزء يتمه." },
];

export function Journey() {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <section id="journey" className="bg-surface px-4 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mb-16 max-w-2xl">
          <h2 className="font-display text-3xl leading-snug font-semibold md:text-5xl md:leading-tight">
            التسجيل أسهل مما تتوقع
          </h2>
        </Reveal>

        <ol ref={ref} className="relative grid gap-10 md:grid-cols-4 md:gap-6">
          {/* Track line that fills as the reader scrolls through the steps */}
          <div aria-hidden className="absolute inset-x-0 top-7 hidden h-px bg-line md:block">
            <motion.div
              className="h-full origin-right bg-accent"
              style={{ scaleX: reduce ? 1 : progress }}
            />
          </div>

          {steps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 0.08} className="relative flex gap-5 md:flex-col md:gap-6">
              <span className="relative z-10 grid size-14 shrink-0 place-items-center rounded-full bg-bg text-accent ring-1 ring-line">
                <step.icon size={26} weight="light" />
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 max-w-[30ch] leading-relaxed text-ink-muted">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
