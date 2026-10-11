import Link from "next/link";
import { site } from "@/site.config";

// Placeholder mark until the real logo file is provided.
// To use the real logo: put it in /public (e.g. /public/logo.svg) and swap the <span> mark for <Image>.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-3 ${className}`} aria-label={site.name}>
      <span className="grid size-10 place-items-center rounded-full bg-accent font-display text-lg font-semibold text-accent-ink transition-transform duration-500 ease-spring group-hover:-rotate-6">
        ت
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-display text-base font-semibold">{site.shortName}</span>
        <span className="text-xs text-ink-muted">لتحفيظ القرآن الكريم</span>
      </span>
    </Link>
  );
}
