import { ArrowUpRight } from "lucide-react";
import type { PropsWithChildren } from "react";

type ExternalLinkProps = PropsWithChildren<{
  href: string;
  className?: string;
  label?: string;
}>;

export function ExternalLink({ href, className, label, children }: ExternalLinkProps) {
  return (
    <a
      href={href}
      aria-label={label}
      className={className}
      rel="noreferrer"
      target="_blank"
    >
      <span>{children}</span>
      <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" />
    </a>
  );
}
