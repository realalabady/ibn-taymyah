import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import type { IconProps } from "@phosphor-icons/react";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  icon?: ComponentType<IconProps>;
  external?: boolean;
  className?: string;
};

const base =
  "group relative inline-flex items-center gap-3 whitespace-nowrap rounded-full font-medium transition-[transform,background-color,box-shadow,color] duration-300 ease-spring active:scale-[0.97]";

const variants = {
  primary: "bg-accent text-accent-ink ps-6 pe-2 py-2 shadow-soft hover:shadow-[0_18px_40px_-16px_var(--accent)]",
  ghost: "px-5 py-3 text-ink ring-1 ring-line hover:bg-surface-2",
};

export function Button({ href, children, variant = "primary", icon: Icon, external, className = "" }: ButtonProps) {
  const content = (
    <>
      <span>{children}</span>
      {Icon && variant === "primary" && (
        <span className="grid size-9 place-items-center rounded-full bg-accent-ink/15 transition-transform duration-500 ease-spring group-hover:-translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105">
          <Icon size={18} weight="bold" />
        </span>
      )}
      {Icon && variant === "ghost" && <Icon size={18} />}
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${base} ${variants[variant]} ${className}`}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {content}
    </Link>
  );
}
