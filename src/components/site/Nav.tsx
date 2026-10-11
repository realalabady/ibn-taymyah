"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { navLinks, site, whatsappLink } from "@/site.config";
import { motionTokens } from "@/lib/motion";
import { Logo } from "./Logo";

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const next = y > 24;
    if (next !== scrolled) setScrolled(next);
  });

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 px-4 pt-4 md:pt-5">
        <nav
          aria-label="القائمة الرئيسية"
          className={`mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 rounded-full ps-3 pe-2 transition-[background-color,box-shadow,backdrop-filter] duration-500 ease-spring ${
            scrolled || open
              ? "bg-surface/80 shadow-soft ring-1 ring-line backdrop-blur-xl"
              : "bg-transparent"
          }`}
        >
          <Logo />

          <ul className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-full px-4 py-2 text-sm text-ink-muted transition-colors duration-200 hover:bg-surface-2 hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink transition-transform duration-300 ease-spring active:scale-[0.97] sm:inline-flex"
            >
              سجّل ابنك
            </a>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
              className="relative grid size-11 place-items-center rounded-full ring-1 ring-line lg:hidden"
            >
              <span
                className={`absolute h-[1.5px] w-5 rounded-full bg-ink transition-transform duration-500 ease-spring ${
                  open ? "rotate-45" : "-translate-y-[4px]"
                }`}
              />
              <span
                className={`absolute h-[1.5px] w-5 rounded-full bg-ink transition-transform duration-500 ease-spring ${
                  open ? "-rotate-45" : "translate-y-[4px]"
                }`}
              />
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-30 bg-bg/90 backdrop-blur-2xl lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: motionTokens.duration.fast } }}
            transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth }}
          >
            <ul className="flex h-full flex-col justify-center gap-2 px-8">
              {[...navLinks, { href: whatsappLink, label: "سجّل ابنك" }].map((link, i) => (
                <li key={link.href} className="overflow-hidden">
                  <motion.div
                    initial={reduce ? { opacity: 0 } : { y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      delay: reduce ? 0 : 0.08 + i * 0.05,
                      duration: motionTokens.duration.slow,
                      ease: motionTokens.easing.smooth,
                    }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block py-3 font-display text-4xl font-medium"
                      {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
            <p className="absolute inset-x-8 bottom-10 text-sm text-ink-muted">{site.name}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
