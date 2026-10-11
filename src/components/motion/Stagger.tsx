"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { motionTokens } from "@/lib/motion";

// Plays on mount: children enter one after another. Used for above-the-fold content.
export function Stagger({ children, className, delay = 0.1 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: delay } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const variants: Variants = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.2 } } }
    : {
        hidden: { opacity: 0, y: motionTokens.distance.lg, filter: "blur(8px)" },
        show: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.9, ease: motionTokens.easing.smooth },
        },
      };
  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
}

// Image frame that settles from a slight zoom while its mask opens.
export function MaskReveal({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, clipPath: "inset(12% 8% 12% 8% round 2rem)", scale: 1.04 }}
      animate={{ opacity: 1, clipPath: "inset(0% 0% 0% 0% round 2rem)", scale: 1 }}
      transition={{ duration: reduce ? 0.2 : 1.2, delay: reduce ? 0 : 0.2, ease: motionTokens.easing.smooth }}
    >
      {children}
    </motion.div>
  );
}
