import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PixelPanel({
  title,
  icon,
  right,
  children,
  className,
  id,
}: {
  title: string;
  icon?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("min-w-0 bg-paper pixel-card", className)}>
      <header className="flex items-center justify-between gap-2 border-b-[3px] border-ink bg-sky px-3 py-1.5">
        <h2 className="flex items-center gap-1.5 font-display text-sm text-ink">
          {icon}
          {title}
        </h2>
        {right}
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}
