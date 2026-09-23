import { Brand } from "@/components/brand";

export function AuthCard({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center p-5"><div className="w-full max-w-md rounded-3xl border bg-card p-7 shadow-sm sm:p-9"><Brand /><div className="mt-10"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b6042]">{eyebrow}</p><h1 className="mt-3 font-display text-4xl">{title}</h1><p className="mt-3 leading-6 text-muted-foreground">{description}</p></div><div className="mt-7">{children}</div></div></main>;
}
