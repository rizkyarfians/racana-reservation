import Link from "next/link";

import { cn } from "@/lib/utils";

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/reservation" className={cn("inline-flex items-center gap-3", className)}>
      <span className="grid size-10 place-items-center rounded-full bg-primary text-sm font-semibold tracking-widest text-primary-foreground">R</span>
      {!compact ? (
        <span>
          <span className="block font-display text-xl leading-none">Racana</span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Gather beautifully</span>
        </span>
      ) : null}
    </Link>
  );
}
