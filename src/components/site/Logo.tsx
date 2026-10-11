import Image from "next/image";
import Link from "next/link";
import { site } from "@/site.config";
import mark from "../../../public/logo-mark.png";
import full from "../../../public/logo.png";

// Compact lockup for the nav: emblem + name. The wordmark inside the logo file is too small to read at this size.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-3 ${className}`} aria-label={site.name}>
      <Image
        src={mark}
        alt=""
        width={44}
        height={44}
        priority
        className="size-11 transition-transform duration-500 ease-spring group-hover:-rotate-6"
      />
      <span className="flex flex-col leading-tight">
        <span className="font-display text-base font-semibold">{site.name}</span>
        <span className="text-xs text-ink-muted">حلقات تحفيظ القرآن الكريم</span>
      </span>
    </Link>
  );
}

// Full logo with its own wordmark, for the footer and the login screen.
export function LogoFull({ className = "" }: { className?: string }) {
  return <Image src={full} alt={site.name} sizes="160px" className={`h-auto w-32 ${className}`} />;
}
