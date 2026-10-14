import Link from "next/link";
import { navLinks, site, whatsappLink } from "@/site.config";
import { LogoFull } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-line px-4 pt-16 pb-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 md:flex-row md:justify-between">
        <div className="max-w-sm">
          <LogoFull />
          <p className="mt-5 leading-relaxed text-ink-muted">{site.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:gap-20">
          <ul className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-ink-muted transition-colors hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="flex flex-col gap-3">
            <li>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-ink-muted transition-colors hover:text-ink">
                واتساب
              </a>
            </li>
            <li className="text-ink-muted">{site.location}</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-14 flex max-w-6xl flex-col gap-2 text-sm text-ink-muted sm:flex-row sm:justify-between">
        <p>جميع الحقوق محفوظة لـ{site.name}</p>
        <Link href="/login" className="transition-colors hover:text-ink">
          دخول الإدارة
        </Link>
      </div>
    </footer>
  );
}
